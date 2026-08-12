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

interface PreparationKnowledgeRow {
  id: string;
  item_type: string;
  category: string;
  title: string;
  prompt_text: string | null;
  short_text: string | null;
  full_text: string | null;
  next_action_text: string | null;
  red_flag_text: string | null;
  risk_level: string;
  required_level: string;
}

interface PreparationItem {
  id: string;
  itemType: string;
  category: string;
  title: string;
  text: string;
  answer: string | null;
  nextAction: string | null;
  riskLevel: string;
}

interface AnswerKnowledgeRow {
  id: string;
  item_type: string;
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
  red_flag_text: string | null;
  risk_level: string;
  channel: string;
  niche_names: string | null;
}

interface DiagnosticKnowledgeRow {
  id: string;
  item_type: string;
  category: string;
  title: string;
  prompt_text: string | null;
  short_text: string | null;
  full_text: string | null;
  next_action_text: string | null;
  red_flag_text: string | null;
  risk_level: string;
}

interface ClientListRow {
  id: string;
  name: string;
  account_url: string | null;
  contact_name: string | null;
  contact_channel: string | null;
  contact_value: string | null;
  crm_status: string;
  priority: string;
  ethical_status: string;
  next_action: string | null;
  next_contact_at: string | null;
  created_at: string;
  updated_at: string;
  niche_name: string | null;
  session_count: number;
  latest_session_status: string | null;
  latest_session_at: string | null;
  search_text?: string | null;
}

interface ClientDetailRow extends ClientListRow {
  city: string | null;
  geography: string | null;
  business_model: string | null;
  product_summary: string | null;
  audience_summary: string | null;
  commercial_goal: string | null;
  desired_action: string | null;
  sales_channel: string | null;
  budget_min: number | null;
  budget_max: number | null;
  main_objection: string | null;
  internal_notes: string | null;
}

interface ClientSessionRow {
  id: string;
  format: string;
  status: string;
  channel: string | null;
  stage_slug: string | null;
  stage_name: string | null;
  goal: string | null;
  strong_side: string | null;
  main_barrier: string | null;
  main_diagnosis: string | null;
  missing_data: string | null;
  next_action: string | null;
  ethical_decision: string;
  selected_items: number;
  created_at: string;
  updated_at: string;
}

interface PricingClientRow {
  id: string;
  name: string;
  crm_status: string;
  priority: string;
}

interface PricingTariffRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  working_rate: number;
  minimum_rate: number;
  rate_status: string;
  includes_text: string | null;
  excludes_text: string | null;
}

interface CalculationRow {
  id: string;
  client_id: string | null;
  client_name: string | null;
  diagnostic_session_id: string | null;
  title: string | null;
  currency: string;
  project_type: string;
  status: string;
  discount_percent: number;
  manual_adjustment: number;
  minimum_price: number;
  external_project_cost: number;
  prepayment_percent: number;
  ethical_status: string;
  valid_until: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

interface CalculationItemRow {
  id: string;
  tariff_id: string | null;
  name: string;
  unit: string;
  quantity: number;
  tariff_rate: number;
  manual_rate: number;
  complexity_coefficient: number;
  source_coefficient: number;
  urgency_coefficient: number;
  rights_coefficient: number;
  item_discount_percent: number;
  fixed_cost: number;
  hours: number;
  internal_hour_rate: number;
  external_cost: number;
  sort_order: number;
  comment: string | null;
}

interface RecentCalculationRow {
  id: string;
  title: string | null;
  client_name: string | null;
  status: string;
  currency: string;
  total: number;
  item_count: number;
  updated_at: string;
}

interface CalculationItemInput {
  tariffId: string;
  name: string;
  unit: string;
  quantity: number;
  tariffRate: number;
  manualRate: number;
  complexityCoefficient: number;
  sourceCoefficient: number;
  urgencyCoefficient: number;
  rightsCoefficient: number;
  itemDiscountPercent: number;
  fixedCost: number;
  hours: number;
  internalHourRate: number;
  externalCost: number;
  comment: string;
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const listDelimiter = "|||";
const answerCategoryKeywords: Record<string, string[]> = {
  price: ["цена", "стоимость", "дорого", "дешевле", "бюджет", "скидка", "стоит"],
  timeline: ["срок", "срочно", "быстро", "дедлайн", "время", "когда", "занимает"],
  revisions: ["правка", "правки", "исправить", "переделать", "изменения"],
  ai: ["ai", "ии", "нейросеть", "нейросети", "генерация", "искусственный интеллект"],
  guarantees: ["гарантия", "гарантировать", "продажи", "охват", "заявки", "вирусный", "результат"],
  rights: ["права", "реклама", "использовать", "публиковать", "передавать"],
  privacy: ["конфиденциальность", "портфолио", "секрет", "публикация", "закрытый"],
  sources: ["исходник", "исходники", "фотография", "фото", "материалы", "телефон"],
  quality: ["понравится", "качество", "не понравится", "ожидания"],
  trust: ["опыт", "портфолио", "кейс", "кейсы", "ниша", "работали"],
  accuracy: ["точность", "этикетка", "логотип", "надпись", "упаковка", "искажение"],
};
const answerStopWords = new Set(["или", "это", "как", "что", "если", "для", "мне", "вам", "ваш", "наша", "можно", "будет", "так", "всё"]);

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

function readText(body: Record<string, unknown>, key: string, maximum: number): string {
  const value = typeof body[key] === "string" ? body[key].trim() : "";
  return value.slice(0, maximum);
}

function readNumber(body: Record<string, unknown>, key: string, fallback: number, minimum: number, maximum: number): number {
  const raw = body[key];
  const value = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() ? Number(raw) : fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function preparationText(row: PreparationKnowledgeRow): string {
  return row.prompt_text || row.short_text || row.full_text || row.red_flag_text || row.title;
}

function toPreparationItem(row: PreparationKnowledgeRow): PreparationItem {
  return {
    id: row.id,
    itemType: row.item_type,
    category: row.category,
    title: row.title,
    text: preparationText(row),
    answer: row.short_text || row.full_text,
    nextAction: row.next_action_text,
    riskLevel: row.risk_level,
  };
}

function groupPreparationItems(rows: PreparationKnowledgeRow[]) {
  const groups = {
    auditChecks: [] as PreparationItem[],
    questionsToAsk: [] as PreparationItem[],
    likelyClientQuestions: [] as PreparationItem[],
    firstMessages: [] as PreparationItem[],
    risks: [] as PreparationItem[],
    packages: [] as PreparationItem[],
    nextActions: [] as PreparationItem[],
  };

  for (const row of rows) {
    const item = toPreparationItem(row);
    if (row.item_type === "audit_check") groups.auditChecks.push(item);
    if (["question_to_client", "clarifying_question", "diagnostic_hint"].includes(row.item_type)) groups.questionsToAsk.push(item);
    if (["question_from_client", "objection", "objection_response"].includes(row.item_type)) groups.likelyClientQuestions.push(item);
    if (["first_message", "follow_up"].includes(row.item_type)) groups.firstMessages.push(item);
    if (["red_flag", "ethical_rule", "refusal_reason"].includes(row.item_type) || ["high", "refusal"].includes(row.risk_level)) groups.risks.push(item);
    if (["package", "proposal_block"].includes(row.item_type)) groups.packages.push(item);
    if (row.item_type === "next_action") groups.nextActions.push(item);
  }

  return groups;
}

function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}

function searchTokens(value: string): string[] {
  return [...new Set(normalizeSearchText(value).split(" ").filter((token) => token.length >= 3 && !answerStopWords.has(token)))];
}

function detectAnswerCategory(value: string): string | null {
  const normalized = normalizeSearchText(value);
  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(answerCategoryKeywords)) {
    const score = keywords.reduce((total, keyword) => total + (normalized.includes(normalizeSearchText(keyword)) ? 1 : 0), 0);
    if (score > bestScore) {
      bestCategory = category;
      bestScore = score;
    }
  }

  return bestCategory;
}

function textMatchesToken(text: string, token: string): boolean {
  return text.split(" ").some((word) => (
    word === token
    || (word.length >= 5 && token.length >= 5 && (word.startsWith(token) || token.startsWith(word)))
  ));
}

function answerMatchScore(row: AnswerKnowledgeRow, query: string, tokens: string[], category: string | null): number {
  const prompt = normalizeSearchText(`${row.title} ${row.prompt_text || ""}`);
  const allText = normalizeSearchText([
    row.title,
    row.prompt_text,
    row.short_text,
    row.full_text,
    row.soft_text,
    row.firm_text,
    row.clarification_text,
  ].filter(Boolean).join(" "));
  const normalizedQuery = normalizeSearchText(query);
  let score = 0;

  if (category && row.category === category) score += 80;
  if (normalizedQuery && prompt.includes(normalizedQuery)) score += 120;
  for (const token of tokens) {
    if (textMatchesToken(prompt, token)) score += 16;
    else if (textMatchesToken(allText, token)) score += 6;
  }
  if (row.item_type === "question_from_client") score += 8;
  if (row.risk_level === "normal") score += 2;

  return score;
}

async function handleAnswerSearch(request: Request, env: Env): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim().slice(0, 1200);
  const selectedCategory = (url.searchParams.get("category") || "").trim().slice(0, 80);
  const niche = (url.searchParams.get("niche") || "").trim().slice(0, 120);
  const channel = (url.searchParams.get("channel") || "").trim().slice(0, 80);

  if (!query && !selectedCategory) {
    return constructorError(422, "ANSWER_QUERY_REQUIRED", "Вставьте вопрос клиента или выберите тему.");
  }

  const detectedCategory = selectedCategory || detectAnswerCategory(query);
  const filters = [
    "ki.status = 'approved'",
    "ki.item_type IN ('question_from_client', 'objection', 'objection_response', 'answer')",
  ];
  const bindings: string[] = [];

  if (selectedCategory) {
    filters.push("ki.category = ?");
    bindings.push(selectedCategory);
  }

  if (niche) {
    filters.push(`(
      NOT EXISTS (SELECT 1 FROM knowledge_item_niches all_kin WHERE all_kin.knowledge_item_id = ki.id)
      OR EXISTS (
        SELECT 1
        FROM knowledge_item_niches kin
        JOIN niches n ON n.id = kin.niche_id
        WHERE kin.knowledge_item_id = ki.id AND n.slug = ?
      )
    )`);
    bindings.push(niche);
  }

  if (channel) {
    filters.push("ki.channel IN ('any', ?)");
    bindings.push(channel);
  }

  const result = await db.prepare(`
    SELECT
      ki.id,
      ki.item_type,
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
      ki.red_flag_text,
      ki.risk_level,
      ki.channel,
      (
        SELECT GROUP_CONCAT(n.name, '${listDelimiter}')
        FROM knowledge_item_niches kin
        JOIN niches n ON n.id = kin.niche_id
        WHERE kin.knowledge_item_id = ki.id
      ) AS niche_names
    FROM knowledge_items ki
    WHERE ${filters.join(" AND ")}
    ORDER BY
      CASE ki.required_level WHEN 'required' THEN 0 WHEN 'recommended' THEN 1 ELSE 2 END,
      ki.title
    LIMIT 120
  `).bind(...bindings).all<AnswerKnowledgeRow>();

  const tokens = searchTokens(query);
  const rows = (result.results ?? [])
    .map((row) => ({ row, score: answerMatchScore(row, query, tokens, detectedCategory) }))
    .filter(({ score }) => Boolean(selectedCategory) || score > 15)
    .sort((left, right) => right.score - left.score || left.row.title.localeCompare(right.row.title, "ru"))
    .slice(0, 10)
    .map(({ row, score }) => ({
      id: row.id,
      itemType: row.item_type,
      category: row.category,
      title: row.title,
      question: row.prompt_text,
      shortText: row.short_text,
      fullText: row.full_text,
      softText: row.soft_text,
      firmText: row.firm_text,
      clarificationText: row.clarification_text,
      nextActionText: row.next_action_text,
      avoidText: row.avoid_text,
      redFlagText: row.red_flag_text,
      riskLevel: row.risk_level,
      niches: splitList(row.niche_names),
      score,
    }));

  return json({ query, recognizedCategory: detectedCategory, items: rows });
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

async function handlePreparationCreate(request: Request, env: Env, identity: ConstructorIdentity): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return constructorError(400, "INVALID_JSON", "Не удалось прочитать данные подготовки.");
  }

  const clientName = readText(body, "clientName", 160);
  const accountUrl = readText(body, "accountUrl", 500);
  const nicheSlug = readText(body, "nicheSlug", 120);
  const stageSlug = readText(body, "stageSlug", 120);
  const businessModel = readText(body, "businessModel", 160);
  const productSummary = readText(body, "productSummary", 1200);
  const audienceSummary = readText(body, "audienceSummary", 1200);
  const commercialGoal = readText(body, "commercialGoal", 1200);
  const salesChannel = readText(body, "salesChannel", 160);
  const messageChannel = readText(body, "messageChannel", 80) || "other";
  const notes = readText(body, "notes", 2000);

  if (!clientName || !nicheSlug || !stageSlug || !productSummary || !commercialGoal) {
    return constructorError(422, "VALIDATION_FAILED", "Заполните клиента, нишу, этап, продукт и коммерческую задачу.");
  }

  if (!isHttpUrl(accountUrl)) {
    return constructorError(422, "INVALID_ACCOUNT_URL", "Ссылка на клиента должна начинаться с http:// или https://.");
  }

  const [nicheResult, stageResult] = await db.batch([
    db.prepare("SELECT id, name FROM niches WHERE slug = ? AND is_active = 1 LIMIT 1").bind(nicheSlug),
    db.prepare("SELECT slug, name FROM stages WHERE slug = ? AND is_active = 1 LIMIT 1").bind(stageSlug),
  ]);

  const niche = nicheResult.results?.[0] as { id?: string; name?: string } | undefined;
  const stage = stageResult.results?.[0] as { slug?: string; name?: string } | undefined;
  if (!niche?.id || !niche.name || !stage?.slug || !stage.name) {
    return constructorError(422, "REFERENCE_NOT_FOUND", "Выбранная ниша или этап больше недоступны. Обновите страницу и попробуйте снова.");
  }

  const knowledgeResult = await db.prepare(`
    SELECT
      ki.id,
      ki.item_type,
      ki.category,
      ki.title,
      ki.prompt_text,
      ki.short_text,
      ki.full_text,
      ki.next_action_text,
      ki.red_flag_text,
      ki.risk_level,
      ki.required_level
    FROM knowledge_items ki
    WHERE ki.status = 'approved'
      AND (
        NOT EXISTS (
          SELECT 1 FROM knowledge_item_niches universal_niche
          WHERE universal_niche.knowledge_item_id = ki.id
        )
        OR EXISTS (
          SELECT 1
          FROM knowledge_item_niches kin
          JOIN niches n ON n.id = kin.niche_id
          WHERE kin.knowledge_item_id = ki.id AND n.slug = ?
        )
      )
      AND (
        NOT EXISTS (
          SELECT 1 FROM knowledge_item_stages universal_stage
          WHERE universal_stage.knowledge_item_id = ki.id
        )
        OR EXISTS (
          SELECT 1
          FROM knowledge_item_stages kis
          JOIN stages s ON s.id = kis.stage_id
          WHERE kis.knowledge_item_id = ki.id AND s.slug = ?
        )
      )
    ORDER BY
      CASE ki.required_level WHEN 'required' THEN 0 WHEN 'recommended' THEN 1 ELSE 2 END,
      CASE ki.risk_level WHEN 'refusal' THEN 0 WHEN 'high' THEN 1 WHEN 'elevated' THEN 2 ELSE 3 END,
      ki.title
    LIMIT 60
  `).bind(nicheSlug, stageSlug).all<PreparationKnowledgeRow>();

  const rows = knowledgeResult.results ?? [];
  const clientId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  const statements = [
    db.prepare(`
      INSERT INTO clients (
        id, name, account_url, business_model, product_summary, audience_summary,
        commercial_goal, desired_action, sales_channel, crm_status, internal_notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'found', ?, ?, ?)
    `).bind(
      clientId,
      clientName,
      accountUrl || null,
      businessModel || null,
      productSummary,
      audienceSummary || null,
      commercialGoal,
      commercialGoal,
      salesChannel || null,
      notes || null,
      now,
      now,
    ),
    db.prepare(`
      INSERT INTO client_niches (client_id, niche_id, relation_type)
      VALUES (?, ?, 'primary')
    `).bind(clientId, niche.id),
    db.prepare(`
      INSERT INTO diagnostic_sessions (
        id, client_id, format, status, channel, stage_slug, goal,
        ethical_decision, created_at, updated_at
      ) VALUES (?, ?, 'express', 'draft', ?, ?, ?, 'not_checked', ?, ?)
    `).bind(sessionId, clientId, messageChannel, stageSlug, commercialGoal, now, now),
  ];

  rows.forEach((row, index) => {
    statements.push(
      db.prepare(`
        INSERT INTO diagnostic_session_items (
          id, session_id, knowledge_item_id, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), sessionId, row.id, index + 1, now, now),
    );
  });

  statements.push(
    db.prepare(`
      INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, new_value_json, created_at)
      VALUES (?, ?, 'create', 'client_preparation', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      identity.email,
      sessionId,
      JSON.stringify({ clientId, clientName, nicheSlug, stageSlug, selectedItems: rows.length }),
      now,
    ),
  );

  await db.batch(statements);

  return json({
    preparation: {
      clientId,
      sessionId,
      clientName,
      nicheName: niche.name,
      stageName: stage.name,
      createdAt: now,
    },
    sections: groupPreparationItems(rows),
  }, { status: 201 });
}

async function handleDiagnosticCreate(request: Request, env: Env, identity: ConstructorIdentity): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return constructorError(400, "INVALID_JSON", "Не удалось прочитать данные диагностики.");
  }

  const clientName = readText(body, "clientName", 160);
  const accountUrl = readText(body, "accountUrl", 500);
  const nicheSlug = readText(body, "nicheSlug", 120);
  const format = readText(body, "format", 40) === "full" ? "full" : "express";
  const channel = readText(body, "channel", 80) || "other";
  const goal = readText(body, "goal", 1200);
  const product = readText(body, "product", 1200);
  const audience = readText(body, "audience", 1200);
  const materials = readText(body, "materials", 1200);
  const deadline = readText(body, "deadline", 400);
  const budget = readText(body, "budget", 400);
  const approver = readText(body, "approver", 500);
  const desiredAction = readText(body, "desiredAction", 800);
  const constraints = readText(body, "constraints", 1500);
  const rightsStatus = readText(body, "rightsStatus", 40);
  const notes = readText(body, "notes", 2000);

  if (!clientName || !nicheSlug || !goal) {
    return constructorError(422, "VALIDATION_FAILED", "Заполните клиента, нишу и главную задачу диагностики.");
  }

  if (!isHttpUrl(accountUrl)) {
    return constructorError(422, "INVALID_ACCOUNT_URL", "Ссылка на клиента должна начинаться с http:// или https://.");
  }

  if (!new Set(["confirmed", "unknown", "restricted"]).has(rightsStatus)) {
    return constructorError(422, "INVALID_RIGHTS_STATUS", "Укажите, подтверждены ли права на исходные материалы.");
  }

  const stageSlug = format === "full" ? "full-diagnostic" : "express-diagnostic";
  const [nicheResult, stageResult] = await db.batch([
    db.prepare("SELECT id, name FROM niches WHERE slug = ? AND is_active = 1 LIMIT 1").bind(nicheSlug),
    db.prepare("SELECT slug, name FROM stages WHERE slug = ? AND is_active = 1 LIMIT 1").bind(stageSlug),
  ]);

  const niche = nicheResult.results?.[0] as { id?: string; name?: string } | undefined;
  const stage = stageResult.results?.[0] as { slug?: string; name?: string } | undefined;
  if (!niche?.id || !niche.name || !stage?.slug || !stage.name) {
    return constructorError(422, "REFERENCE_NOT_FOUND", "Выбранная ниша или формат диагностики недоступны. Обновите страницу и попробуйте снова.");
  }

  const diagnosticFields = [
    { key: "goal", label: "коммерческая задача", value: goal },
    { key: "product", label: "приоритетный продукт", value: product },
    { key: "audience", label: "целевая аудитория", value: audience },
    { key: "materials", label: "исходные материалы", value: materials },
    { key: "deadline", label: "срок", value: deadline },
    { key: "budget", label: "бюджетный ориентир", value: budget },
    { key: "approver", label: "ответственный за согласование", value: approver },
    { key: "desiredAction", label: "целевое действие аудитории", value: desiredAction },
  ];
  const missing = diagnosticFields.filter((field) => !field.value).map((field) => field.label);
  if (rightsStatus !== "confirmed") missing.push("права на исходные материалы");

  const completedWeight = diagnosticFields.reduce((total, field) => total + (field.value ? 1 : 0), 0) + (rightsStatus === "confirmed" ? 1 : 0);
  const readiness = Math.round((completedWeight / 9) * 100);
  const readinessLevel = readiness >= 80 ? "ready" : readiness >= 50 ? "clarify" : "early";
  const status = readinessLevel === "ready" ? "ready_for_proposal" : "needs_clarification";
  const ethicalDecision = rightsStatus === "restricted" ? "review" : rightsStatus === "confirmed" ? "approved" : "not_checked";
  const strongSide = product && audience
    ? "Определены приоритетный продукт и аудитория."
    : goal
      ? "Зафиксирована главная коммерческая задача."
      : "Контекст требует уточнения.";
  const mainBarrier = missing.length > 0 ? `Не хватает данных: ${missing.join(", ")}.` : "Критичных пробелов не выявлено.";
  const mainDiagnosis = readinessLevel === "ready"
    ? "Контекста достаточно, чтобы переходить к объёму работ и коммерческому предложению."
    : readinessLevel === "clarify"
      ? "Основа сформирована, но перед расчётом нужно закрыть несколько уточнений."
      : "Пока рано предлагать решение: сначала нужно собрать базовый контекст задачи.";
  const nextAction = readinessLevel === "ready"
    ? "Согласовать объём, этапы и перейти к расчёту предложения."
    : `Уточнить: ${missing.slice(0, 3).join(", ") || "оставшиеся детали проекта"}.`;

  const knowledgeResult = await db.prepare(`
    SELECT
      ki.id,
      ki.item_type,
      ki.category,
      ki.title,
      ki.prompt_text,
      ki.short_text,
      ki.full_text,
      ki.next_action_text,
      ki.red_flag_text,
      ki.risk_level
    FROM knowledge_items ki
    WHERE ki.status = 'approved'
      AND ki.item_type IN (
        'question_to_client', 'clarifying_question', 'diagnostic_hint',
        'red_flag', 'ethical_rule', 'refusal_reason', 'next_action'
      )
      AND (
        NOT EXISTS (
          SELECT 1 FROM knowledge_item_niches universal_niche
          WHERE universal_niche.knowledge_item_id = ki.id
        )
        OR EXISTS (
          SELECT 1
          FROM knowledge_item_niches kin
          JOIN niches n ON n.id = kin.niche_id
          WHERE kin.knowledge_item_id = ki.id AND n.slug = ?
        )
      )
      AND (
        NOT EXISTS (
          SELECT 1 FROM knowledge_item_stages universal_stage
          WHERE universal_stage.knowledge_item_id = ki.id
        )
        OR EXISTS (
          SELECT 1
          FROM knowledge_item_stages kis
          JOIN stages s ON s.id = kis.stage_id
          WHERE kis.knowledge_item_id = ki.id AND s.slug = ?
        )
      )
    ORDER BY
      CASE ki.required_level WHEN 'required' THEN 0 WHEN 'recommended' THEN 1 ELSE 2 END,
      CASE ki.risk_level WHEN 'refusal' THEN 0 WHEN 'high' THEN 1 WHEN 'elevated' THEN 2 ELSE 3 END,
      ki.title
    LIMIT 30
  `).bind(nicheSlug, stageSlug).all<DiagnosticKnowledgeRow>();

  const rows = knowledgeResult.results ?? [];
  const clientId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  const internalNotes = [
    materials && `Исходники: ${materials}`,
    deadline && `Срок: ${deadline}`,
    budget && `Бюджет: ${budget}`,
    approver && `Согласование: ${approver}`,
    constraints && `Ограничения: ${constraints}`,
    notes && `Заметки: ${notes}`,
  ].filter(Boolean).join("\n");

  const statements = [
    db.prepare(`
      INSERT INTO clients (
        id, name, account_url, product_summary, audience_summary, commercial_goal,
        desired_action, crm_status, ethical_status, next_action, internal_notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'diagnostic', ?, ?, ?, ?, ?)
    `).bind(
      clientId,
      clientName,
      accountUrl || null,
      product || null,
      audience || null,
      goal,
      desiredAction || null,
      ethicalDecision,
      nextAction,
      internalNotes || null,
      now,
      now,
    ),
    db.prepare(`
      INSERT INTO client_niches (client_id, niche_id, relation_type)
      VALUES (?, ?, 'primary')
    `).bind(clientId, niche.id),
    db.prepare(`
      INSERT INTO diagnostic_sessions (
        id, client_id, format, status, channel, stage_slug, started_at, completed_at,
        goal, strong_side, main_barrier, main_diagnosis, missing_data, next_action,
        ethical_decision, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sessionId,
      clientId,
      format,
      status,
      channel,
      stageSlug,
      now,
      readinessLevel === "ready" ? now : null,
      goal,
      strongSide,
      mainBarrier,
      mainDiagnosis,
      missing.length > 0 ? JSON.stringify(missing) : null,
      nextAction,
      ethicalDecision,
      now,
      now,
    ),
  ];

  rows.forEach((row, index) => {
    const isRisk = ["red_flag", "ethical_rule", "refusal_reason"].includes(row.item_type) || ["high", "refusal"].includes(row.risk_level);
    statements.push(
      db.prepare(`
        INSERT INTO diagnostic_session_items (
          id, session_id, knowledge_item_id, sort_order, risk_detected,
          include_in_summary, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `).bind(crypto.randomUUID(), sessionId, row.id, index + 1, isRisk ? 1 : 0, now, now),
    );
  });

  statements.push(
    db.prepare(`
      INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, new_value_json, created_at)
      VALUES (?, ?, 'create', 'diagnostic_session', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      identity.email,
      sessionId,
      JSON.stringify({ clientId, clientName, nicheSlug, format, readiness, status, selectedItems: rows.length }),
      now,
    ),
  );

  await db.batch(statements);

  const toResultItem = (row: DiagnosticKnowledgeRow) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    text: row.prompt_text || row.short_text || row.full_text || row.red_flag_text || row.title,
    nextAction: row.next_action_text,
    riskLevel: row.risk_level,
  });

  return json({
    diagnostic: {
      clientId,
      sessionId,
      clientName,
      nicheName: niche.name,
      format,
      stageName: stage.name,
      readiness,
      readinessLevel,
      status,
      strongSide,
      mainBarrier,
      mainDiagnosis,
      nextAction,
      ethicalDecision,
      missing,
      confirmed: diagnosticFields.filter((field) => field.value).map((field) => ({ label: field.label, value: field.value })),
      createdAt: now,
    },
    sections: {
      questions: rows.filter((row) => ["question_to_client", "clarifying_question", "diagnostic_hint"].includes(row.item_type)).map(toResultItem),
      risks: rows.filter((row) => ["red_flag", "ethical_rule", "refusal_reason"].includes(row.item_type) || ["high", "refusal"].includes(row.risk_level)).map(toResultItem),
      nextActions: rows.filter((row) => row.item_type === "next_action").map(toResultItem),
    },
  }, { status: 201 });
}

function toClientListItem(row: ClientListRow) {
  return {
    id: row.id,
    name: row.name,
    accountUrl: row.account_url,
    contactName: row.contact_name,
    contactChannel: row.contact_channel,
    contactValue: row.contact_value,
    crmStatus: row.crm_status,
    priority: row.priority,
    ethicalStatus: row.ethical_status,
    nextAction: row.next_action,
    nextContactAt: row.next_contact_at,
    nicheName: row.niche_name,
    sessionCount: Number(row.session_count ?? 0),
    latestSessionStatus: row.latest_session_status,
    latestSessionAt: row.latest_session_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseMissingData(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [value];
  } catch {
    return [value];
  }
}

async function handleClientList(request: Request, env: Env): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim().toLocaleLowerCase("ru").slice(0, 160);
  const status = (url.searchParams.get("status") || "").trim().slice(0, 40);
  const priority = (url.searchParams.get("priority") || "").trim().slice(0, 4);
  const filters = ["1 = 1"];
  const bindings: string[] = [];

  if (status) {
    filters.push("c.crm_status = ?");
    bindings.push(status);
  }

  if (priority && ["A", "B", "C"].includes(priority)) {
    filters.push("c.priority = ?");
    bindings.push(priority);
  }

  const where = filters.join(" AND ");
  const [clientsResult, countResult, statusResult] = await db.batch([
    db.prepare(`
      SELECT
        c.id,
        c.name,
        c.account_url,
        c.contact_name,
        c.contact_channel,
        c.contact_value,
        c.crm_status,
        c.priority,
        c.ethical_status,
        c.next_action,
        c.next_contact_at,
        c.created_at,
        c.updated_at,
        COALESCE(c.name, '') || ' ' ||
          COALESCE(c.contact_name, '') || ' ' ||
          COALESCE(c.contact_value, '') || ' ' ||
          COALESCE(c.product_summary, '') || ' ' ||
          COALESCE(c.commercial_goal, '') AS search_text,
        (
          SELECT n.name
          FROM client_niches cn
          JOIN niches n ON n.id = cn.niche_id
          WHERE cn.client_id = c.id
          ORDER BY CASE cn.relation_type WHEN 'primary' THEN 0 ELSE 1 END, n.name
          LIMIT 1
        ) AS niche_name,
        (SELECT COUNT(*) FROM diagnostic_sessions ds WHERE ds.client_id = c.id) AS session_count,
        (
          SELECT ds.status FROM diagnostic_sessions ds
          WHERE ds.client_id = c.id
          ORDER BY ds.updated_at DESC LIMIT 1
        ) AS latest_session_status,
        (
          SELECT ds.updated_at FROM diagnostic_sessions ds
          WHERE ds.client_id = c.id
          ORDER BY ds.updated_at DESC LIMIT 1
        ) AS latest_session_at
      FROM clients c
      WHERE ${where}
      ORDER BY
        CASE c.priority WHEN 'A' THEN 0 WHEN 'B' THEN 1 ELSE 2 END,
        CASE WHEN c.next_contact_at IS NULL THEN 1 ELSE 0 END,
        c.next_contact_at,
        c.updated_at DESC
      LIMIT 500
    `).bind(...bindings),
    db.prepare(`SELECT COUNT(*) AS total FROM clients c WHERE ${where}`).bind(...bindings),
    db.prepare(`
      SELECT crm_status AS status, COUNT(*) AS total
      FROM clients
      GROUP BY crm_status
      ORDER BY total DESC, crm_status
    `),
  ]);

  const clientRows = (clientsResult.results ?? []) as unknown as ClientListRow[];
  const matchingRows = query
    ? clientRows.filter((row) => (row.search_text || "").toLocaleLowerCase("ru").includes(query))
    : clientRows;

  return json({
    items: matchingRows.slice(0, 100).map(toClientListItem),
    total: query ? matchingRows.length : Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0),
    statusCounts: statusResult.results ?? [],
  });
}

async function handleClientDetail(clientId: string, env: Env): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  const [clientResult, sessionsResult] = await db.batch([
    db.prepare(`
      SELECT
        c.*,
        (
          SELECT n.name
          FROM client_niches cn
          JOIN niches n ON n.id = cn.niche_id
          WHERE cn.client_id = c.id
          ORDER BY CASE cn.relation_type WHEN 'primary' THEN 0 ELSE 1 END, n.name
          LIMIT 1
        ) AS niche_name,
        (SELECT COUNT(*) FROM diagnostic_sessions ds WHERE ds.client_id = c.id) AS session_count,
        (
          SELECT ds.status FROM diagnostic_sessions ds
          WHERE ds.client_id = c.id
          ORDER BY ds.updated_at DESC LIMIT 1
        ) AS latest_session_status,
        (
          SELECT ds.updated_at FROM diagnostic_sessions ds
          WHERE ds.client_id = c.id
          ORDER BY ds.updated_at DESC LIMIT 1
        ) AS latest_session_at
      FROM clients c
      WHERE c.id = ?
      LIMIT 1
    `).bind(clientId),
    db.prepare(`
      SELECT
        ds.id,
        ds.format,
        ds.status,
        ds.channel,
        ds.stage_slug,
        s.name AS stage_name,
        ds.goal,
        ds.strong_side,
        ds.main_barrier,
        ds.main_diagnosis,
        ds.missing_data,
        ds.next_action,
        ds.ethical_decision,
        (SELECT COUNT(*) FROM diagnostic_session_items dsi WHERE dsi.session_id = ds.id) AS selected_items,
        ds.created_at,
        ds.updated_at
      FROM diagnostic_sessions ds
      LEFT JOIN stages s ON s.slug = ds.stage_slug
      WHERE ds.client_id = ?
      ORDER BY ds.updated_at DESC
      LIMIT 50
    `).bind(clientId),
  ]);

  const row = clientResult.results?.[0] as unknown as ClientDetailRow | undefined;
  if (!row?.id) return constructorError(404, "CLIENT_NOT_FOUND", "Карточка клиента не найдена.");

  return json({
    client: {
      ...toClientListItem(row),
      city: row.city,
      geography: row.geography,
      businessModel: row.business_model,
      productSummary: row.product_summary,
      audienceSummary: row.audience_summary,
      commercialGoal: row.commercial_goal,
      desiredAction: row.desired_action,
      salesChannel: row.sales_channel,
      budgetMin: row.budget_min,
      budgetMax: row.budget_max,
      mainObjection: row.main_objection,
      internalNotes: row.internal_notes,
    },
    sessions: ((sessionsResult.results ?? []) as unknown as ClientSessionRow[]).map((session) => ({
      id: session.id,
      format: session.format,
      status: session.status,
      channel: session.channel,
      stageSlug: session.stage_slug,
      stageName: session.stage_name,
      goal: session.goal,
      strongSide: session.strong_side,
      mainBarrier: session.main_barrier,
      mainDiagnosis: session.main_diagnosis,
      missing: parseMissingData(session.missing_data),
      nextAction: session.next_action,
      ethicalDecision: session.ethical_decision,
      selectedItems: Number(session.selected_items ?? 0),
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    })),
  });
}

async function handleClientUpdate(request: Request, clientId: string, env: Env, identity: ConstructorIdentity): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return constructorError(400, "INVALID_JSON", "Не удалось прочитать изменения карточки клиента.");
  }

  const existing = await db.prepare("SELECT id FROM clients WHERE id = ? LIMIT 1").bind(clientId).first<{ id: string }>();
  if (!existing?.id) return constructorError(404, "CLIENT_NOT_FOUND", "Карточка клиента не найдена.");

  const crmStatus = readText(body, "crmStatus", 40);
  const priority = readText(body, "priority", 4);
  const contactName = readText(body, "contactName", 160);
  const contactChannel = readText(body, "contactChannel", 80);
  const contactValue = readText(body, "contactValue", 320);
  const nextAction = readText(body, "nextAction", 1000);
  const nextContactAt = readText(body, "nextContactAt", 80);
  const internalNotes = readText(body, "internalNotes", 3000);
  const allowedStatuses = new Set(["found", "diagnostic", "qualified", "proposal", "negotiation", "won", "paused", "lost", "archived"]);

  if (!allowedStatuses.has(crmStatus) || !["A", "B", "C"].includes(priority)) {
    return constructorError(422, "VALIDATION_FAILED", "Выберите корректный статус и приоритет клиента.");
  }

  if (nextContactAt && Number.isNaN(Date.parse(nextContactAt))) {
    return constructorError(422, "INVALID_NEXT_CONTACT", "Укажите корректную дату следующего контакта.");
  }

  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`
      UPDATE clients
      SET
        crm_status = ?,
        priority = ?,
        contact_name = ?,
        contact_channel = ?,
        contact_value = ?,
        next_action = ?,
        next_contact_at = ?,
        internal_notes = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      crmStatus,
      priority,
      contactName || null,
      contactChannel || null,
      contactValue || null,
      nextAction || null,
      nextContactAt || null,
      internalNotes || null,
      now,
      clientId,
    ),
    db.prepare(`
      INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, new_value_json, created_at)
      VALUES (?, ?, 'update', 'client', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      identity.email,
      clientId,
      JSON.stringify({ crmStatus, priority, contactName, contactChannel, nextAction, nextContactAt }),
      now,
    ),
  ]);

  return handleClientDetail(clientId, env);
}

function calculateLine(item: CalculationItemInput) {
  const rate = item.manualRate > 0 ? item.manualRate : item.tariffRate;
  const production = item.quantity * rate * item.complexityCoefficient * item.sourceCoefficient * item.urgencyCoefficient * item.rightsCoefficient;
  const labor = item.hours * item.internalHourRate;
  const beforeDiscount = production + item.fixedCost + labor + item.externalCost;
  const total = beforeDiscount * (1 - item.itemDiscountPercent / 100);
  return {
    rate: roundMoney(rate),
    production: roundMoney(production),
    labor: roundMoney(labor),
    beforeDiscount: roundMoney(beforeDiscount),
    total: roundMoney(Math.max(0, total)),
  };
}

function parseCalculationItem(value: unknown, index: number): CalculationItemInput | null {
  const item = asRecord(value);
  if (!item) return null;
  const name = readText(item, "name", 240);
  if (!name) return null;

  return {
    tariffId: readText(item, "tariffId", 80),
    name,
    unit: readText(item, "unit", 80) || "услуга",
    quantity: readNumber(item, "quantity", 1, 0.01, 10000),
    tariffRate: readNumber(item, "tariffRate", 0, 0, 1_000_000_000),
    manualRate: readNumber(item, "manualRate", 0, 0, 1_000_000_000),
    complexityCoefficient: readNumber(item, "complexityCoefficient", 1, 0.1, 10),
    sourceCoefficient: readNumber(item, "sourceCoefficient", 1, 0.1, 10),
    urgencyCoefficient: readNumber(item, "urgencyCoefficient", 1, 0.1, 10),
    rightsCoefficient: readNumber(item, "rightsCoefficient", 1, 0.1, 10),
    itemDiscountPercent: readNumber(item, "itemDiscountPercent", 0, 0, 100),
    fixedCost: readNumber(item, "fixedCost", 0, 0, 1_000_000_000),
    hours: readNumber(item, "hours", 0, 0, 10000),
    internalHourRate: readNumber(item, "internalHourRate", 0, 0, 10_000_000),
    externalCost: readNumber(item, "externalCost", 0, 0, 1_000_000_000),
    comment: readText(item, "comment", 800) || `Позиция ${index + 1}`,
  };
}

function calculationResponse(row: CalculationRow, items: CalculationItemRow[]) {
  const normalizedItems = items.map((item) => {
    const normalized: CalculationItemInput = {
      tariffId: item.tariff_id || "",
      name: item.name,
      unit: item.unit,
      quantity: Number(item.quantity),
      tariffRate: Number(item.tariff_rate),
      manualRate: Number(item.manual_rate),
      complexityCoefficient: Number(item.complexity_coefficient),
      sourceCoefficient: Number(item.source_coefficient),
      urgencyCoefficient: Number(item.urgency_coefficient),
      rightsCoefficient: Number(item.rights_coefficient),
      itemDiscountPercent: Number(item.item_discount_percent),
      fixedCost: Number(item.fixed_cost),
      hours: Number(item.hours),
      internalHourRate: Number(item.internal_hour_rate),
      externalCost: Number(item.external_cost),
      comment: item.comment || "",
    };
    return { id: item.id, ...normalized, ...calculateLine(normalized) };
  });
  const subtotal = roundMoney(normalizedItems.reduce((sum, item) => sum + item.total, 0));
  const afterDiscount = roundMoney(subtotal * (1 - Number(row.discount_percent) / 100));
  const calculatedTotal = roundMoney(afterDiscount + Number(row.manual_adjustment) + Number(row.external_project_cost));
  const total = roundMoney(Math.max(0, Number(row.minimum_price), calculatedTotal));
  const prepayment = roundMoney(total * Number(row.prepayment_percent) / 100);

  return {
    calculation: {
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      diagnosticSessionId: row.diagnostic_session_id,
      title: row.title || "Расчёт проекта",
      currency: row.currency,
      projectType: row.project_type,
      status: row.status,
      discountPercent: Number(row.discount_percent),
      manualAdjustment: Number(row.manual_adjustment),
      minimumPrice: Number(row.minimum_price),
      externalProjectCost: Number(row.external_project_cost),
      prepaymentPercent: Number(row.prepayment_percent),
      ethicalStatus: row.ethical_status,
      validUntil: row.valid_until,
      comment: row.comment,
      subtotal,
      afterDiscount,
      total,
      prepayment,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    items: normalizedItems,
  };
}

async function handlePricingBootstrap(env: Env): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  const [clientsResult, tariffsResult, recentResult] = await Promise.all([
    db.prepare(`
      SELECT id, name, crm_status, priority
      FROM clients
      WHERE crm_status != 'archived'
      ORDER BY CASE priority WHEN 'A' THEN 0 WHEN 'B' THEN 1 ELSE 2 END, updated_at DESC
      LIMIT 200
    `).all<PricingClientRow>(),
    db.prepare(`
      SELECT id, name, category, unit, working_rate, minimum_rate, rate_status, includes_text, excludes_text
      FROM pricing_tariffs
      WHERE is_active = 1 AND rate_status != 'disabled'
      ORDER BY category, name
      LIMIT 200
    `).all<PricingTariffRow>(),
    db.prepare(`
      SELECT
        pc.id,
        pc.title,
        c.name AS client_name,
        pc.status,
        pc.currency,
        MAX(
          pc.minimum_price,
          COALESCE(SUM(
            (
              ci.quantity * CASE WHEN ci.manual_rate > 0 THEN ci.manual_rate ELSE ci.tariff_rate END *
              ci.complexity_coefficient * ci.source_coefficient * ci.urgency_coefficient * ci.rights_coefficient +
              ci.fixed_cost + ci.hours * ci.internal_hour_rate + ci.external_cost
            ) * (1 - ci.item_discount_percent / 100)
          ), 0) * (1 - pc.discount_percent / 100) + pc.manual_adjustment + pc.external_project_cost
        ) AS total,
        COUNT(ci.id) AS item_count,
        pc.updated_at
      FROM project_calculations pc
      LEFT JOIN clients c ON c.id = pc.client_id
      LEFT JOIN calculation_items ci ON ci.calculation_id = pc.id
      WHERE pc.status != 'archived'
      GROUP BY pc.id
      ORDER BY pc.updated_at DESC
      LIMIT 20
    `).all<RecentCalculationRow>(),
  ]);

  return json({
    clients: (clientsResult.results ?? []).map((client) => ({
      id: client.id,
      name: client.name,
      crmStatus: client.crm_status,
      priority: client.priority,
    })),
    tariffs: (tariffsResult.results ?? []).map((tariff) => ({
      id: tariff.id,
      name: tariff.name,
      category: tariff.category,
      unit: tariff.unit,
      workingRate: Number(tariff.working_rate),
      minimumRate: Number(tariff.minimum_rate),
      rateStatus: tariff.rate_status,
      includes: tariff.includes_text,
      excludes: tariff.excludes_text,
    })),
    recent: (recentResult.results ?? []).map((calculation) => ({
      id: calculation.id,
      title: calculation.title || "Расчёт проекта",
      clientName: calculation.client_name,
      status: calculation.status,
      currency: calculation.currency,
      total: roundMoney(Number(calculation.total ?? 0)),
      itemCount: Number(calculation.item_count ?? 0),
      updatedAt: calculation.updated_at,
    })),
  });
}

async function handleCalculationDetail(calculationId: string, env: Env): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  const [row, itemsResult] = await Promise.all([
    db.prepare(`
      SELECT pc.*, c.name AS client_name
      FROM project_calculations pc
      LEFT JOIN clients c ON c.id = pc.client_id
      WHERE pc.id = ?
      LIMIT 1
    `).bind(calculationId).first<CalculationRow>(),
    db.prepare(`
      SELECT id, tariff_id, name, unit, quantity, tariff_rate, manual_rate,
        complexity_coefficient, source_coefficient, urgency_coefficient, rights_coefficient,
        item_discount_percent, fixed_cost, hours, internal_hour_rate, external_cost,
        sort_order, comment
      FROM calculation_items
      WHERE calculation_id = ?
      ORDER BY sort_order, created_at
    `).bind(calculationId).all<CalculationItemRow>(),
  ]);

  if (!row?.id) return constructorError(404, "CALCULATION_NOT_FOUND", "Сохранённый расчёт не найден.");
  return json(calculationResponse(row, itemsResult.results ?? []));
}

async function handleCalculationCreate(request: Request, env: Env, identity: ConstructorIdentity): Promise<Response> {
  const db = requireDatabase(env);
  if (db instanceof Response) return db;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return constructorError(400, "INVALID_JSON", "Не удалось прочитать данные расчёта.");
  }

  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const items = rawItems.map(parseCalculationItem).filter((item): item is CalculationItemInput => Boolean(item));
  if (items.length === 0 || items.length !== rawItems.length) {
    return constructorError(422, "CALCULATION_ITEMS_REQUIRED", "Добавьте хотя бы одну позицию и заполните её название.");
  }

  const title = readText(body, "title", 240) || "Расчёт проекта";
  const clientId = readText(body, "clientId", 80);
  const projectType = readText(body, "projectType", 40) || "individual";
  const validProjectTypes = new Set(["test", "main", "system", "recurring", "individual"]);
  if (!validProjectTypes.has(projectType)) {
    return constructorError(422, "INVALID_PROJECT_TYPE", "Выберите корректный тип проекта.");
  }

  if (clientId) {
    const client = await db.prepare("SELECT id FROM clients WHERE id = ? LIMIT 1").bind(clientId).first<{ id: string }>();
    if (!client?.id) return constructorError(422, "CLIENT_NOT_FOUND", "Выбранный клиент не найден.");
  }

  const discountPercent = readNumber(body, "discountPercent", 0, 0, 100);
  const manualAdjustment = readNumber(body, "manualAdjustment", 0, -1_000_000_000, 1_000_000_000);
  const minimumPrice = readNumber(body, "minimumPrice", 0, 0, 1_000_000_000);
  const externalProjectCost = readNumber(body, "externalProjectCost", 0, 0, 1_000_000_000);
  const prepaymentPercent = readNumber(body, "prepaymentPercent", 50, 0, 100);
  const validUntil = readText(body, "validUntil", 80);
  const comment = readText(body, "comment", 3000);
  if (validUntil && Number.isNaN(Date.parse(validUntil))) {
    return constructorError(422, "INVALID_VALID_UNTIL", "Укажите корректный срок действия расчёта.");
  }

  const calculationId = crypto.randomUUID();
  const now = new Date().toISOString();
  const statements = [
    db.prepare(`
      INSERT INTO project_calculations (
        id, client_id, title, currency, project_type, status, discount_percent,
        manual_adjustment, minimum_price, external_project_cost, prepayment_percent,
        ethical_status, valid_until, comment, created_at, updated_at
      ) VALUES (?, ?, ?, 'RUB', ?, 'ready', ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?)
    `).bind(
      calculationId,
      clientId || null,
      title,
      projectType,
      discountPercent,
      manualAdjustment,
      minimumPrice,
      externalProjectCost,
      prepaymentPercent,
      validUntil || null,
      comment || null,
      now,
      now,
    ),
  ];

  items.forEach((item, index) => {
    statements.push(db.prepare(`
      INSERT INTO calculation_items (
        id, calculation_id, tariff_id, name, unit, quantity, tariff_rate, manual_rate,
        complexity_coefficient, source_coefficient, urgency_coefficient, rights_coefficient,
        item_discount_percent, fixed_cost, hours, internal_hour_rate, external_cost,
        sort_order, comment, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), calculationId, item.tariffId || null, item.name, item.unit,
      item.quantity, item.tariffRate, item.manualRate, item.complexityCoefficient,
      item.sourceCoefficient, item.urgencyCoefficient, item.rightsCoefficient,
      item.itemDiscountPercent, item.fixedCost, item.hours, item.internalHourRate,
      item.externalCost, index + 1, item.comment || null, now, now,
    ));
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + calculateLine(item).total, 0));
  const total = roundMoney(Math.max(0, minimumPrice, subtotal * (1 - discountPercent / 100) + manualAdjustment + externalProjectCost));
  statements.push(db.prepare(`
    INSERT INTO audit_log (id, actor_email, action, entity_type, entity_id, new_value_json, created_at)
    VALUES (?, ?, 'create', 'project_calculation', ?, ?, ?)
  `).bind(
    crypto.randomUUID(), identity.email, calculationId,
    JSON.stringify({ title, clientId: clientId || null, itemCount: items.length, total, currency: "RUB" }),
    now,
  ));

  await db.batch(statements);
  const response = await handleCalculationDetail(calculationId, env);
  return new Response(response.body, { status: 201, headers: response.headers });
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

  if (url.pathname === "/api/constructor/answers" && request.method === "GET") {
    return handleAnswerSearch(request, env);
  }

  if (url.pathname === "/api/constructor/preparations" && request.method === "POST") {
    return handlePreparationCreate(request, env, identity);
  }

  if (url.pathname === "/api/constructor/diagnostics" && request.method === "POST") {
    return handleDiagnosticCreate(request, env, identity);
  }

  if (url.pathname === "/api/constructor/clients" && request.method === "GET") {
    return handleClientList(request, env);
  }

  if (url.pathname === "/api/constructor/pricing/bootstrap" && request.method === "GET") {
    return handlePricingBootstrap(env);
  }

  if (url.pathname === "/api/constructor/calculations" && request.method === "POST") {
    return handleCalculationCreate(request, env, identity);
  }

  const calculationMatch = url.pathname.match(/^\/api\/constructor\/calculations\/([^/]+)$/);
  if (calculationMatch && request.method === "GET") {
    return handleCalculationDetail(calculationMatch[1].slice(0, 80), env);
  }

  const clientMatch = url.pathname.match(/^\/api\/constructor\/clients\/([^/]+)$/);
  if (clientMatch) {
    const clientId = clientMatch[1].slice(0, 80);
    if (request.method === "GET") return handleClientDetail(clientId, env);
    if (request.method === "PATCH") return handleClientUpdate(request, clientId, env, identity);
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
