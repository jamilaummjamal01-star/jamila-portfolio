/** Cloudflare Worker entry point for the Vinext application. */
import { createRemoteJWKSet, jwtVerify } from "jose";
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  CONSTRUCTOR_AUTH_ENABLED?: string;
  CONSTRUCTOR_DEV_BYPASS?: string;
  CONSTRUCTOR_ALLOWED_EMAIL?: string;
  POLICY_AUD?: string;
  TEAM_DOMAIN?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ConstructorIdentity {
  email: string;
}

interface KnowledgeRow {
  id: string;
  item_type: string;
  speaker: string;
  category: string;
  title: string;
  prompt_text: string | null;
  short_text: string | null;
  full_text: string | null;
  soft_text: string | null;
  firm_text: string | null;
  clarification_text: string | null;
  next_action_text: string | null;
  avoid_text: string | null;
  diagnostic_value: string | null;
  red_flag_text: string | null;
  channel: string;
  tone: string;
  required_level: string;
  risk_level: string;
  status: string;
  source_kind: string;
  source_url: string | null;
  reviewed_at: string | null;
  updated_at: string;
  niche_slugs: string | null;
  niche_names: string | null;
  stage_slugs: string | null;
  stage_names: string | null;
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const listDelimiter = "|||";

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function constructorError(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, { status });
}

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function normalizeTeamDomain(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
}

function isConstructorRequest(pathname: string): boolean {
  return pathname === "/constructor" || pathname.startsWith("/constructor/") || pathname.startsWith("/api/constructor/");
}

async function authenticateConstructor(request: Request, env: Env): Promise<ConstructorIdentity | Response> {
  if (env.CONSTRUCTOR_DEV_BYPASS === "true" && isLocalRequest(request)) {
    return { email: "local-development@constructor" };
  }

  if (env.CONSTRUCTOR_AUTH_ENABLED !== "true") {
    return constructorError(503, "CONSTRUCTOR_NOT_CONFIGURED", "Закрытый конструктор ещё не подключён к Cloudflare Access.");
  }

  if (!env.TEAM_DOMAIN || !env.POLICY_AUD || !env.CONSTRUCTOR_ALLOWED_EMAIL) {
    return constructorError(503, "ACCESS_CONFIG_MISSING", "Не заполнены обязательные параметры защищённого доступа.");
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) {
    return constructorError(403, "ACCESS_TOKEN_MISSING", "Для входа требуется авторизация Cloudflare Access.");
  }

  const teamDomain = normalizeTeamDomain(env.TEAM_DOMAIN);
  let jwks = jwksCache.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    jwksCache.set(teamDomain, jwks);
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: teamDomain,
      audience: env.POLICY_AUD,
    });

    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const allowedEmail = env.CONSTRUCTOR_ALLOWED_EMAIL.trim().toLowerCase();

    if (!email || email !== allowedEmail) {
      return constructorError(403, "EMAIL_NOT_ALLOWED", "Этот аккаунт не имеет доступа к конструктору.");
    }

    return { email };
  } catch {
    return constructorError(403, "ACCESS_TOKEN_INVALID", "Сессия доступа недействительна или истекла.");
  }
}

function requireDatabase(env: Env): D1Database | Response {
  if (!env.DB) {
    return constructorError(503, "DATABASE_NOT_CONFIGURED", "База Cloudflare D1 ещё не привязана к Worker.");
  }
  return env.DB;
}

function splitList(value: string | null): string[] {
  return value ? value.split(listDelimiter).filter(Boolean) : [];
}

function parsePositiveInteger(value: string | null, fallback: number, maximum: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

async function handleBootstrap(env: Env, identity: ConstructorIdentity): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  const [nichesResult, stagesResult, countsResult] = await db.batch([
    db.prepare("SELECT slug, name, priority FROM niches WHERE is_active = 1 ORDER BY priority, name"),
    db.prepare("SELECT slug, name, sort_order FROM stages WHERE is_active = 1 ORDER BY sort_order"),
    db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) AS review,
        SUM(CASE WHEN risk_level IN ('high', 'refusal') THEN 1 ELSE 0 END) AS high_risk
      FROM knowledge_items
      WHERE status <> 'archived'
    `),
  ]);

  return json({
    identity,
    niches: nichesResult.results ?? [],
    stages: stagesResult.results ?? [],
    counts: countsResult.results?.[0] ?? { total: 0, approved: 0, review: 0, high_risk: 0 },
  });
}

async function handleKnowledgeList(request: Request, env: Env): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const niche = url.searchParams.get("niche")?.trim() ?? "";
  const stage = url.searchParams.get("stage")?.trim() ?? "";
  const itemType = url.searchParams.get("type")?.trim() ?? "";
  const risk = url.searchParams.get("risk")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "approved";
  const page = parsePositiveInteger(url.searchParams.get("page"), 1, 100000);
  const limit = parsePositiveInteger(url.searchParams.get("limit"), 30, 100);
  const offset = (page - 1) * limit;

  const filters: string[] = ["ki.status <> 'archived'"];
  const bindings: Array<string | number> = [];

  if (status !== "all") {
    filters.push("ki.status = ?");
    bindings.push(status);
  }

  if (q) {
    filters.push(`LOWER(
      COALESCE(ki.title, '') || ' ' ||
      COALESCE(ki.prompt_text, '') || ' ' ||
      COALESCE(ki.short_text, '') || ' ' ||
      COALESCE(ki.full_text, '') || ' ' ||
      COALESCE(ki.clarification_text, '')
    ) LIKE ?`);
    bindings.push(`%${q}%`);
  }

  if (niche) {
    filters.push(`EXISTS (
      SELECT 1
      FROM knowledge_item_niches kin
      JOIN niches n ON n.id = kin.niche_id
      WHERE kin.knowledge_item_id = ki.id AND n.slug = ?
    )`);
    bindings.push(niche);
  }

  if (stage) {
    filters.push(`EXISTS (
      SELECT 1
      FROM knowledge_item_stages kis
      JOIN stages s ON s.id = kis.stage_id
      WHERE kis.knowledge_item_id = ki.id AND s.slug = ?
    )`);
    bindings.push(stage);
  }

  if (itemType) {
    filters.push("ki.item_type = ?");
    bindings.push(itemType);
  }

  if (risk) {
    filters.push("ki.risk_level = ?");
    bindings.push(risk);
  }

  if (category) {
    filters.push("ki.category = ?");
    bindings.push(category);
  }

  const where = filters.join(" AND ");
  const selectSql = `
    SELECT
      ki.id,
      ki.item_type,
      ki.speaker,
      ki.category,
      ki.title,
      ki.prompt_text,
      ki.short_text,
      ki.full_text,
      ki.soft_text,
      ki.firm_text,
      ki.clarification_text,
      ki.next_action_text,
      ki.avoid_text,
      ki.diagnostic_value,
      ki.red_flag_text,
      ki.channel,
      ki.tone,
      ki.required_level,
      ki.risk_level,
      ki.status,
      ki.source_kind,
      ki.source_url,
      ki.reviewed_at,
      ki.updated_at,
      (
        SELECT GROUP_CONCAT(n.slug, '${listDelimiter}')
        FROM knowledge_item_niches kin
        JOIN niches n ON n.id = kin.niche_id
        WHERE kin.knowledge_item_id = ki.id
      ) AS niche_slugs,
      (
        SELECT GROUP_CONCAT(n.name, '${listDelimiter}')
        FROM knowledge_item_niches kin
        JOIN niches n ON n.id = kin.niche_id
        WHERE kin.knowledge_item_id = ki.id
      ) AS niche_names,
      (
        SELECT GROUP_CONCAT(s.slug, '${listDelimiter}')
        FROM knowledge_item_stages kis
        JOIN stages s ON s.id = kis.stage_id
        WHERE kis.knowledge_item_id = ki.id
      ) AS stage_slugs,
      (
        SELECT GROUP_CONCAT(s.name, '${listDelimiter}')
        FROM knowledge_item_stages kis
        JOIN stages s ON s.id = kis.stage_id
        WHERE kis.knowledge_item_id = ki.id
      ) AS stage_names
    FROM knowledge_items ki
    WHERE ${where}
    ORDER BY
      CASE ki.required_level WHEN 'required' THEN 0 WHEN 'recommended' THEN 1 ELSE 2 END,
      CASE ki.risk_level WHEN 'refusal' THEN 0 WHEN 'high' THEN 1 WHEN 'elevated' THEN 2 ELSE 3 END,
      ki.updated_at DESC,
      ki.title
    LIMIT ? OFFSET ?
  `;

  const countSql = `SELECT COUNT(*) AS total FROM knowledge_items ki WHERE ${where}`;
  const [itemsResult, countResult] = await db.batch([
    db.prepare(selectSql).bind(...bindings, limit, offset),
    db.prepare(countSql).bind(...bindings),
  ]);

  const items = ((itemsResult.results ?? []) as unknown as KnowledgeRow[]).map((row) => ({
    ...row,
    niches: splitList(row.niche_names),
    nicheSlugs: splitList(row.niche_slugs),
    stages: splitList(row.stage_names),
    stageSlugs: splitList(row.stage_slugs),
    niche_names: undefined,
    niche_slugs: undefined,
    stage_names: undefined,
    stage_slugs: undefined,
  }));

  const total = Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);

  return json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

async function handleKnowledgeCreate(request: Request, env: Env, identity: ConstructorIdentity): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return constructorError(400, "INVALID_JSON", "Не удалось прочитать данные новой записи.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const itemType = typeof body.itemType === "string" ? body.itemType.trim() : "";
  const promptText = typeof body.promptText === "string" ? body.promptText.trim() : null;
  const shortText = typeof body.shortText === "string" ? body.shortText.trim() : null;
  const nicheSlugs = Array.isArray(body.nicheSlugs) ? body.nicheSlugs.filter((value): value is string => typeof value === "string") : [];
  const stageSlugs = Array.isArray(body.stageSlugs) ? body.stageSlugs.filter((value): value is string => typeof value === "string") : [];

  const allowedTypes = new Set([
    "question_to_client",
    "question_from_client",
    "answer",
    "objection",
    "objection_response",
    "clarifying_question",
    "first_message",
    "follow_up",
    "diagnostic_hint",
    "audit_check",
    "red_flag",
    "ethical_rule",
    "proposal_block",
    "package",
    "next_action",
    "refusal_reason",
  ]);

  if (!title || !category || !allowedTypes.has(itemType)) {
    return constructorError(422, "VALIDATION_FAILED", "Укажите название, категорию и корректный тип записи.");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const statements = [
    db.prepare(`
      INSERT INTO knowledge_items (
        id, item_type, speaker, category, title, prompt_text, short_text,
        channel, tone, required_level, risk_level, source_kind, status,
        version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', 'draft', 1, ?, ?)
    `).bind(
      id,
      itemType,
      typeof body.speaker === "string" ? body.speaker : "system",
      category,
      title,
      promptText,
      shortText,
      typeof body.channel === "string" ? body.channel : "any",
      typeof body.tone === "string" ? body.tone : "neutral",
      typeof body.requiredLevel === "string" ? body.requiredLevel : "recommended",
      typeof body.riskLevel === "string" ? body.riskLevel : "normal",
      now,
      now,
    ),
  ];

  for (const slug of nicheSlugs) {
    statements.push(
      db.prepare(`
        INSERT OR IGNORE INTO knowledge_item_niches (knowledge_item_id, niche_id, relevance)
        SELECT ?, id, 'primary' FROM niches WHERE slug = ?
      `).bind(id, slug),
    );
  }

  for (const slug of stageSlugs) {
    statements.push(
      db.prepare(`
        INSERT OR IGNORE INTO knowledge_item_stages (knowledge_item_id, stage_id)
        SELECT ?, id FROM stages WHERE slug = ?
      `).bind(id, slug),
    );
  }

  statements.push(
    db.prepare(`
      INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, new_value_json, created_at)
      VALUES (?, ?, 'create', 'knowledge_item', ?, ?, ?)
    `).bind(crypto.randomUUID(), identity.email, id, JSON.stringify({ title, category, itemType }), now),
  );

  await db.batch(statements);
  return json({ id, status: "draft" }, { status: 201 });
}

async function handleConstructorApi(request: Request, env: Env, identity: ConstructorIdentity): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/constructor/health" && request.method === "GET") {
    return json({
      ok: true,
      identity,
      databaseConfigured: Boolean(env.DB),
      accessConfigured: env.CONSTRUCTOR_AUTH_ENABLED === "true",
    });
  }

  if (url.pathname === "/api/constructor/bootstrap" && request.method === "GET") {
    return handleBootstrap(env, identity);
  }

  if (url.pathname === "/api/constructor/knowledge" && request.method === "GET") {
    return handleKnowledgeList(request, env);
  }

  if (url.pathname === "/api/constructor/knowledge" && request.method === "POST") {
    return handleKnowledgeCreate(request, env, identity);
  }

  return constructorError(404, "NOT_FOUND", "Раздел конструктора не найден.");
}

function secureConstructorResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "same-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if (isConstructorRequest(url.pathname)) {
      const identity = await authenticateConstructor(request, env);
      if (identity instanceof Response) return identity;

      if (url.pathname.startsWith("/api/constructor/")) {
        return handleConstructorApi(request, env, identity);
      }

      const response = await handler.fetch(request, env, ctx);
      return secureConstructorResponse(response);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
