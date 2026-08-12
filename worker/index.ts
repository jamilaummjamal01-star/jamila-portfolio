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

interface ImportKnowledgeItem {
  itemType: string;
  speaker: string;
  category: string;
  title: string;
  promptText: string;
  shortText: string;
  fullText: string;
  softText: string;
  firmText: string;
  clarificationText: string;
  nextActionText: string;
  avoidText: string;
  diagnosticValue: string;
  redFlagText: string;
  channel: string;
  tone: string;
  requiredLevel: string;
  riskLevel: string;
  status: "draft" | "review";
  sourceUrl: string;
  nicheSlugs: string[];
  stageSlugs: string[];
}

interface ImportPreviewRow {
  row: number;
  state: "ready" | "duplicate" | "error";
  errors: string[];
  warnings: string[];
  item: ImportKnowledgeItem | null;
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
  version: number;
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
  client_name: string | null;
  status: string;
  comment: string | null;
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

interface CalculationMetadata {
  title: string;
  currency: string;
  comment: string;
}

interface CalculationItemMetadata {
  unit: string;
  comment: string;
}

interface ProposalRow {
  id: string;
  client_id: string | null;
  client_name: string | null;
  diagnostic_session_id: string | null;
  diagnostic_goal: string | null;
  diagnostic_created_at: string | null;
  calculation_id: string | null;
  calculation_comment: string | null;
  calculation_total: number | null;
  version: number;
  status: string;
  title: string;
  diagnosis_text: string | null;
  strategy_text: string | null;
  solution_text: string | null;
  scope_text: string | null;
  timeline_text: string | null;
  rights_text: string | null;
  limitations_text: string | null;
  next_step_text: string | null;
  client_document: string | null;
  internal_notes: string | null;
  sent_at: string | null;
  follow_up_at: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

interface ProposalCalculationRow extends RecentCalculationRow {
  client_id: string | null;
  valid_until: string | null;
}

interface ProposalDiagnosticRow {
  id: string;
  client_id: string;
  client_name: string;
  goal: string | null;
  main_diagnosis: string | null;
  created_at: string;
}

interface ProposalInput {
  clientId: string;
  diagnosticSessionId: string;
  calculationId: string;
  status: string;
  title: string;
  diagnosisText: string;
  strategyText: string;
  solutionText: string;
  scopeText: string;
  timelineText: string;
  rightsText: string;
  limitationsText: string;
  nextStepText: string;
  clientDocument: string;
  internalNotes: string;
  followUpAt: string;
  validUntil: string;
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const listDelimiter = "|||";
const answerCategoryKeywords: Record<string, string[]> = {
  price: ["Ñ†ĞµĞ½Ğ°", "ÑÑ‚Ğ¾Ğ¸Ğ¼Ğ¾ÑÑ‚ÑŒ", "Ğ´Ğ¾Ñ€Ğ¾Ğ³Ğ¾", "Ğ´ĞµÑˆĞµĞ²Ğ»Ğµ", "Ğ±ÑĞ´Ğ¶ĞµÑ‚", "ÑĞºĞ¸Ğ´ĞºĞ°", "ÑÑ‚Ğ¾Ğ¸Ñ‚"],
  timeline: ["ÑÑ€Ğ¾Ğº", "ÑÑ€Ğ¾Ñ‡Ğ½Ğ¾", "Ğ±Ñ‹ÑÑ‚Ñ€Ğ¾", "Ğ´ĞµĞ´Ğ»Ğ°Ğ¹Ğ½", "Ğ²Ñ€ĞµĞ¼Ñ", "ĞºĞ¾Ğ³Ğ´Ğ°", "Ğ·Ğ°Ğ½Ğ¸Ğ¼Ğ°ĞµÑ‚"],
  revisions: ["Ğ¿Ñ€Ğ°Ğ²ĞºĞ°", "Ğ¿Ñ€Ğ°Ğ²ĞºĞ¸", "Ğ¸ÑĞ¿Ñ€Ğ°Ğ²Ğ¸Ñ‚ÑŒ", "Ğ¿ĞµÑ€ĞµĞ´ĞµĞ»Ğ°Ñ‚ÑŒ", "Ğ¸Ğ·Ğ¼ĞµĞ½ĞµĞ½Ğ¸Ñ"],
  ai: ["ai", "Ğ¸Ğ¸", "Ğ½ĞµĞ¹Ñ€Ğ¾ÑĞµÑ‚ÑŒ", "Ğ½ĞµĞ¹Ñ€Ğ¾ÑĞµÑ‚Ğ¸", "Ğ³ĞµĞ½ĞµÑ€Ğ°Ñ†Ğ¸Ñ", "Ğ¸ÑĞºÑƒÑÑÑ‚Ğ²ĞµĞ½Ğ½Ñ‹Ğ¹ Ğ¸Ğ½Ñ‚ĞµĞ»Ğ»ĞµĞºÑ‚"],
  guarantees: ["Ğ³Ğ°Ñ€Ğ°Ğ½Ñ‚Ğ¸Ñ", "Ğ³Ğ°Ñ€Ğ°Ğ½Ñ‚Ğ¸Ñ€Ğ¾Ğ²Ğ°Ñ‚ÑŒ", "Ğ¿Ñ€Ğ¾Ğ´Ğ°Ğ¶Ğ¸", "Ğ¾Ñ…Ğ²Ğ°Ñ‚", "Ğ·Ğ°ÑĞ²ĞºĞ¸", "Ğ²Ğ¸Ñ€ÑƒÑĞ½Ñ‹Ğ¹", "Ñ€ĞµĞ·ÑƒĞ»ÑŒÑ‚Ğ°Ñ‚"],
  rights: ["Ğ¿Ñ€Ğ°Ğ²Ğ°", "Ñ€ĞµĞºĞ»Ğ°Ğ¼Ğ°", "Ğ¸ÑĞ¿Ğ¾Ğ»ÑŒĞ·Ğ¾Ğ²Ğ°Ñ‚ÑŒ", "Ğ¿ÑƒĞ±Ğ»Ğ¸ĞºĞ¾Ğ²Ğ°Ñ‚ÑŒ", "Ğ¿ĞµÑ€ĞµĞ´Ğ°Ğ²Ğ°Ñ‚ÑŒ"],
  privacy: ["ĞºĞ¾Ğ½Ñ„Ğ¸Ğ´ĞµĞ½Ñ†Ğ¸Ğ°Ğ»ÑŒĞ½Ğ¾ÑÑ‚ÑŒ", "Ğ¿Ğ¾Ñ€Ñ‚Ñ„Ğ¾Ğ»Ğ¸Ğ¾", "ÑĞµĞºÑ€ĞµÑ‚", "Ğ¿ÑƒĞ±Ğ»Ğ¸ĞºĞ°Ñ†Ğ¸Ñ", "Ğ·Ğ°ĞºÑ€Ñ‹Ñ‚Ñ‹Ğ¹"],
  sources: ["Ğ¸ÑÑ…Ğ¾Ğ´Ğ½Ğ¸Ğº", "Ğ¸ÑÑ…Ğ¾Ğ´Ğ½Ğ¸ĞºĞ¸", "Ñ„Ğ¾Ñ‚Ğ¾Ğ³Ñ€Ğ°Ñ„Ğ¸Ñ", "Ñ„Ğ¾Ñ‚Ğ¾", "Ğ¼Ğ°Ñ‚ĞµÑ€Ğ¸Ğ°Ğ»Ñ‹", "Ñ‚ĞµĞ»ĞµÑ„Ğ¾Ğ½"],
  quality: ["Ğ¿Ğ¾Ğ½Ñ€Ğ°Ğ²Ğ¸Ñ‚ÑÑ", "ĞºĞ°Ñ‡ĞµÑÑ‚Ğ²Ğ¾", "Ğ½Ğµ Ğ¿Ğ¾Ğ½Ñ€Ğ°Ğ²Ğ¸Ñ‚ÑÑ", "Ğ¾Ğ¶Ğ¸Ğ´Ğ°Ğ½Ğ¸Ñ"],
  trust: ["Ğ¾Ğ¿Ñ‹Ñ‚", "Ğ¿Ğ¾Ñ€Ñ‚Ñ„Ğ¾Ğ»Ğ¸Ğ¾", "ĞºĞµĞ¹Ñ", "ĞºĞµĞ¹ÑÑ‹", "Ğ½Ğ¸ÑˆĞ°", "Ñ€Ğ°Ğ±Ğ¾Ñ‚Ğ°Ğ»Ğ¸"],
  accuracy: ["Ñ‚Ğ¾Ñ‡Ğ½Ğ¾ÑÑ‚ÑŒ", "ÑÑ‚Ğ¸ĞºĞµÑ‚ĞºĞ°", "Ğ»Ğ¾Ğ³Ğ¾Ñ‚Ğ¸Ğ¿", "Ğ½Ğ°Ğ´Ğ¿Ğ¸ÑÑŒ", "ÑƒĞ¿Ğ°ĞºĞ¾Ğ²ĞºĞ°", "Ğ¸ÑĞºĞ°Ğ¶ĞµĞ½Ğ¸Ğµ"],
};
const answerStopWords = new Set(["Ğ¸Ğ»Ğ¸", "ÑÑ‚Ğ¾", "ĞºĞ°Ğº", "Ñ‡Ñ‚Ğ¾", "ĞµÑĞ»Ğ¸", "Ğ´Ğ»Ñ", "Ğ¼Ğ½Ğµ", "Ğ²Ğ°Ğ¼", "Ğ²Ğ°Ñˆ", "Ğ½Ğ°ÑˆĞ°", "Ğ¼Ğ¾Ğ¶Ğ½Ğ¾", "Ğ±ÑƒĞ´ĞµÑ‚", "Ñ‚Ğ°Ğº", "Ğ²ÑÑ‘"]);

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
    return constructorError(503, "CONSTRUCTOR_NOT_CONFIGURED", "Ğ—Ğ°ĞºÑ€Ñ‹Ñ‚Ñ‹Ğ¹ ĞºĞ¾Ğ½ÑÑ‚Ñ€ÑƒĞºÑ‚Ğ¾Ñ€ ĞµÑ‰Ñ‘ Ğ½Ğµ Ğ¿Ğ¾Ğ´ĞºĞ»ÑÑ‡Ñ‘Ğ½ Ğº Cloudflare Access.");
  }

  if (!env.TEAM_DOMAIN || !env.POLICY_AUD || !env.CONSTRUCTOR_ALLOWED_EMAIL) {
    return constructorError(503, "ACCESS_CONFIG_MISSING", "ĞĞµ Ğ·Ğ°Ğ¿Ğ¾Ğ»Ğ½ĞµĞ½Ñ‹ Ğ¾Ğ±ÑĞ·Ğ°Ñ‚ĞµĞ»ÑŒĞ½Ñ‹Ğµ Ğ¿Ğ°Ñ€Ğ°Ğ¼ĞµÑ‚Ñ€Ñ‹ Ğ·Ğ°Ñ‰Ğ¸Ñ‰Ñ‘Ğ½Ğ½Ğ¾Ğ³Ğ¾ Ğ´Ğ¾ÑÑ‚ÑƒĞ¿Ğ°.");
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) {
    return constructorError(403, "ACCESS_TOKEN_MISSING", "Ğ”Ğ»Ñ Ğ²Ñ…Ğ¾Ğ´Ğ° Ñ‚Ñ€ĞµĞ±ÑƒĞµÑ‚ÑÑ Ğ°Ğ²Ñ‚Ğ¾Ñ€Ğ¸Ğ·Ğ°Ñ†Ğ¸Ñ Cloudflare Access.");
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
      return constructorError(403, "EMAIL_NOT_ALLOWED", "Ğ­Ñ‚Ğ¾Ñ‚ Ğ°ĞºĞºĞ°ÑƒĞ½Ñ‚ Ğ½Ğµ Ğ¸Ğ¼ĞµĞµÑ‚ Ğ´Ğ¾ÑÑ‚ÑƒĞ¿Ğ° Ğº ĞºĞ¾Ğ½ÑÑ‚Ñ€ÑƒĞºÑ‚Ğ¾Ñ€Ñƒ.");
    }

    return { email };
  } catch {
    return constructorError(403, "ACCESS_TOKEN_INVALID", "Ğ¡ĞµÑÑĞ¸Ñ Ğ´Ğ¾ÑÑ‚ÑƒĞ¿Ğ° Ğ½ĞµĞ´ĞµĞ¹ÑÑ‚Ğ²Ğ¸Ñ‚ĞµĞ»ÑŒĞ½Ğ° Ğ¸Ğ»Ğ¸ Ğ¸ÑÑ‚ĞµĞºĞ»Ğ°.");
  }
}

function requireDatabase(env: Env): D1Database | Response {
  if (!env.DB) {
    return constructorError(503, "DATABASE_NOT_CONFIGURED", "Ğ‘Ğ°Ğ·Ğ° Cloudflare D1 ĞµÑ‰Ñ‘ Ğ½Ğµ Ğ¿Ñ€Ğ¸Ğ²ÑĞ·Ğ°Ğ½Ğ° Ğº Worker.");
  }
  return env.DB;
}

function splitList(value: string | null): string[] {
  return value ? value.split(listDelimiter).filter(Boolean) : [];
}

function toKnowledgeItem(row: KnowledgeRow) {
  return {
    ...row,
    niches: splitList(row.niche_names),
    nicheSlugs: splitList(row.niche_slugs),
    stages: splitList(row.stage_names),
    stageSlugs: splitList(row.stage_slugs),
    niche_names: undefined,
    niche_slugs: undefined,
    stage_names: undefined,
    stage_slugs: undefined,
  };
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
  return value && typeof value === "object" &&ß®:ÒÚ$z{-®éÜj×WFVEö@¢’dÅTU2ƒòÂòÂòÂv6ö×ÆWFVBrÂòÂòÂòÂòÂòÂòÂò¢’æ&–æB€¢&F6„–BÂ6÷W&6T¶–æBÂ6÷W&6U&VfW&Væ6RÇÂçVÆÂÂ&Wf–Wu&÷w2æÆVæwF‚Â&VG•&÷w2æÆVæwF‚À¢&V¦V7FVE&÷w2Â&Wf–Wu&÷w2æf–ÇFW"‚‡&÷r’Óâ&÷rç7FFRÓÓÒ&W'&÷""’æÆVæwF‚À¢&V¦V7FVE&÷w2ò¥4ôâç7G&–æv–g’‡&Wf–Wu&÷w2æf–ÇFW"‚‡&÷r’Óâ&÷rç7FFRÓÒ'&VG’"’æÖ‚‡&÷r’Óâ‡²&÷s¢&÷rç&÷rÂ7FFS¢&÷rç7FFRÂW'&÷'3¢&÷ræW'&÷'2Ò’’’¢çVÆÂÀ¢æ÷rÂæ÷rÀ¢’“°¢7FFVÖVçG2çW6‚†F"ç&W&R† ¢”å4U%B”åDòVF—EöÆör†–BÂ7F÷%öVÖ–ÂÂ7F–öâÂVçF—G•÷G—RÂVçF—G•ö–BÂæWu÷fÇVUö§6öâÂ7&VFVEöB¢dÅTU2ƒòÂòÂv–×÷'BrÂv–×÷'Eö&F6‚rÂòÂòÂò¢’æ&–æB†7'—Fòç&æFöÕUT”B‚’Â–FVçF—G’æVÖ–ÂÂ&F6„–BÂ¥4ôâç7G&–æv–g’‡²6÷W&6T¶–æBÂ6÷W&6U&VfW&Væ6RÂ–×÷'FVC¢&VG•&÷w2æÆVæwF‚Â6¶—VC¢&V¦V7FVE&÷w2Ò’Âæ÷r’“° ¢v—BF"æ&F6‚‡7FFVÖVçG2“°¢&WGW&â§6öâ‡²&F6„–BÂ–×÷'FVC¢&VG•&÷w2æÆVæwF‚Â6¶—VC¢&V¦V7FVE&÷w2ÒÂ²7FGW3¢#Ò“°§Ğ ¦7–æ2gVæ7F–öâ†æFÆUVÆ—G”F6†&ö&B†Vçc¢Vçb“¢&öÖ—6SÅ&W7öç6Sâ°¢6öç7BF"Ò&WV—&TFF&6R†Vçb“°¢–b†F"–ç7Fæ6Vöb&W7öç6R’&WGW&âF#°¢6öç7B&W7VÇG2Òv—BF"æ&F6‚…°¢F"ç&W&R† ¢4TÄT5@¢4õTåB‚¢’2F÷FÂÀ¢5TÒ„44Rt„Tâ7FGW2Òv&÷fVBrD„TâTÅ4RTäB’2&÷fVBÀ¢5TÒ„44Rt„Tâ7FGW2ÒvG&gBräBFFWF–ÖR‡WFFVEöB’ÂFFWF–ÖR‚væ÷rrÂrÓ3F—2r’D„TâTÅ4RTäB’27FÆUöG&gG2À¢5TÒ„44Rt„Tâ—FVÕ÷G—RÒwVW7F–öåög&öÕö6Æ–VçBräB4ôÄU44R„åTÄÄ”b…E$”Ò‡6†÷'E÷FW‡B’Ârr’ÂåTÄÄ”b…E$”Ò†gVÆÅ÷FW‡B’Ârr’’•2åTÄÂD„TâTÅ4RTäB’2VW7F–öç5÷v—F†÷WEöç7vW"À¢5TÒ„44Rt„Tâ—FVÕ÷G—R”â‚vç7vW"rÂvö&¦V7F–öå÷&W7öç6Rr’äB4ôÄU44R…E$”Ò†æW‡Eö7F–öå÷FW‡B’Ârr’ÒrrD„TâTÅ4RTäB’2ç7vW'5÷v—F†÷WEöæW‡Eö7F–öâÀ¢5TÒ„44Rt„Tâ&—6µöÆWfVÂ”â‚v†–v‚rÂw&VgW6Âr’äB4ôÄU44R…E$”Ò‡&VEöfÆu÷FW‡B’Ârr’ÒrrD„TâTÅ4RTäB’2†–v…÷&—6µ÷v—F†÷WEöW‡ÆæF–öâÀ¢5TÒ„44Rt„TâäõBU„•5E2…4TÄT5Be$ôÒ¶æ÷vÆVFvUö—FVÕöæ–6†W2¶–ât„U$R¶–âæ¶æ÷vÆVFvUö—FVÕö–BÒ¶’æ–B’D„TâTÅ4RTäB’2Ö—76–æuöæ–6†RÀ¢5TÒ„44Rt„Tâ7FGW2Òv&÷fVBräB‡&Wf–WvVEöB•2åTÄÂõ"FFWF–ÖR‡&Wf–WvVEöB’ÂFFWF–ÖR‚væ÷rrÂrÓƒF—2r’’D„TâTÅ4RTäB’27FÆU÷6÷W&6W0¢e$ôÒ¶æ÷vÆVFvUö—FV×2¶¢t„U$R7FGW2Òv&6†—fVBp¢’À¢F"ç&W&R† ¢4TÄT5B4ôÄU44R…5TÒ†—FVÕö6÷VçBÒ’Â’2GWÆ–6FUö—FV×0¢e$ôÒ€¢4TÄT5B4õTåB‚¢’2—FVÕö6÷Vç@¢e$ôÒ¶æ÷vÆVFvUö—FV×0¢t„U$R7FGW2Òv&6†—fVBp¢u$õU%’ÄõtU"†—FVÕ÷G—RÇÂwÂrÇÂ6FVv÷'’ÇÂwÂrÇÂ4ôÄU44R„åTÄÄ”b…E$”Ò‡&ö×E÷FW‡B’Ârr’ÂF—FÆR’¢„d”är4õTåB‚¢’â¢’GWÆ–6FUöw&÷W0¢’À¢F"ç&W&R† ¢4TÄT5B4õTåB‚¢’2F&–fg5öGVP¢e$ôÒ&–6–æu÷F&–fg0¢t„U$R—5ö7F—fRÒäB‡&Wf–WuöB•2åTÄÂõ"FFWF–ÖR‡&Wf–WuöB’ÂFFWF–ÖR‚væ÷rr’¢’À¢F"ç&W&R† ¢t•D‚—77VU÷&÷w22€¢4TÄT5BvÖ—76–æuöæ–6†Rr2—77VRÂ–BÂF—FÆRÂWFFVEöBe$ôÒ¶æ÷vÆVFvUö—FV×2¶¢t„U$R7FGW2Òv&6†—fVBräBäõBU„•5E2…4TÄT5Be$ôÒ¶æ÷vÆVFvUö—FVÕöæ–6†W2¶–ât„U$R¶–âæ¶æ÷vÆVFvUö—FVÕö–BÒ¶’æ–B¢Tä”ôâÄÀ¢4TÄT5BwVW7F–öç5÷v—F†÷WEöç7vW"rÂ–BÂF—FÆRÂWFFVEöBe$ôÒ¶æ÷vÆVFvUö—FV×0¢t„U$R7FGW2Òv&6†—fVBräB—FVÕ÷G—RÒwVW7F–öåög&öÕö6Æ–VçBräB4ôÄU44R„åTÄÄ”b…E$”Ò‡6†÷'E÷FW‡B’Ârr’ÂåTÄÄ”b…E$”Ò†gVÆÅ÷FW‡B’Ârr’’•2åTÄÀ¢Tä”ôâÄÀ¢4TÄT5Bvç7vW'5÷v—F†÷WEöæW‡Eö7F–öârÂ–BÂF—FÆRÂWFFVEöBe$ôÒ¶æ÷vÆVFvUö—FV×0¢t„U$R7FGW2Òv&6†—fVBräB—FVÕ÷G—R”â‚vç7vW"rÂvö&¦V7F–öå÷&W7öç6Rr’äB4ôÄU44R…E$”Ò†æW‡Eö7F–öå÷FW‡B’Ârr’Òrp¢Tä”ôâÄÀ¢4TÄT5Bv†–v…÷&—6µ÷v—F†÷WEöW‡ÆæF–öârÂ–BÂF—FÆRÂWFFVEöBe$ôÒ¶æ÷vÆVFvUö—FV×0¢t„U$R7FGW2Òv&6†—fVBräB&—6µöÆWfVÂ”â‚v†–v‚rÂw&VgW6Âr’äB4ôÄU44R…E$”Ò‡&VEöfÆu÷FW‡B’Ârr’Òrp¢Tä”ôâÄÀ¢4TÄT5Bw7FÆUöG&gG2rÂ–BÂF—FÆRÂWFFVEöBe$ôÒ¶æ÷vÆVFvUö—FV×0¢t„U$R7FGW2ÒvG&gBräBFFWF–ÖR‡WFFVEöB’ÂFFWF–ÖR‚væ÷rrÂrÓ3F—2r¢’Â&æ¶VB2€¢4TÄT5B—77VRÂ–BÂF—FÆRÂ$õuôåTÔ$U"‚’õdU"…%D•D”ôâ%’—77VRõ$DU"%’FFWF–ÖR‡WFFVEöB’ÂF—FÆR’2&÷uöçVÖ&W ¢e$ôÒ—77VU÷&÷w0¢¢4TÄT5B—77VRÂ–BÂF—FÆRe$ôÒ&æ¶VBt„U$R&÷uöçVÖ&W"ÃÒBõ$DU"%’—77VRÂ&÷uöçVÖ&W ¢’À¢F"ç&W&R† ¢4TÄT5@¢âç6ÇVrÂâææÖRÀ¢4õTåB„D•5D”ä5B44Rt„Tâ¶’ç7FGW2Òv&÷fVBrD„Tâ¶’æ–BTäB’2&÷fVBÀ¢4õTåB„D•5D”ä5B44Rt„Tâ¶’ç7FGW2Òv&÷fVBräB¶’æ—FVÕ÷G—R”â‚wVW7F–öå÷Fõö6Æ–VçBrÂv6Æ&–g––æu÷VW7F–öâr’D„Tâ¶’æ–BTäB’2VW7F–öç2À¢4õTåB„D•5D”ä5B44Rt„Tâ¶’ç7FGW2Òv&÷fVBräB¶’æ—FVÕ÷G—R”â‚vç7vW"rÂwVW7F–öåög&öÕö6Æ–VçBrÂvö&¦V7F–öå÷&W7öç6Rr’D„Tâ¶’æ–BTäB’2ç7vW'2À¢4õTåB„D•5D”ä5B44Rt„Tâ¶’ç7FGW2Òv&÷fVBräB¶’æ—FVÕ÷G—R”â‚w&VEöfÆrrÂvWF†–6Å÷'VÆRrÂw&VgW6Å÷&V6öâr’D„Tâ¶’æ–BTäB’2&—6·0¢e$ôÒæ–6†W2à¢ÄTeB¤ô”â¶æ÷vÆVFvUö—FVÕöæ–6†W2¶–âôâ¶–âææ–6†Uö–BÒâæ–@¢ÄTeB¤ô”â¶æ÷vÆVFvUö—FV×2¶’ôâ¶’æ–BÒ¶–âæ¶æ÷vÆVFvUö—FVÕö–@¢t„U$Râæ—5ö7F—fRÒ¢u$õU%’âæ–BÂâç6ÇVrÂâææÖP¢õ$DU"%’âç&–÷&—G’ÂâææÖP¢’À¢F"ç&W&R† ¢4TÄT5B–BÂ6÷W&6Uö¶–æBÂ6÷W&6U÷&VfW&Væ6RÂ7FGW2ÂF÷FÅ÷&÷w2Â–×÷'FVE÷&÷w2Â6¶—VE÷&÷w2ÂW'&÷%÷&÷w2Â7&VFVEöBÂ6ö×ÆWFVEö@¢e$ôÒ–×÷'Eö&F6†W0¢õ$DU"%’FFWF–ÖR†7&VFVEöB’DU40¢Ä”Ô•B€¢’À¢Ò“° ¢6öç7B7VÖÖ'’Ò5&V6÷&B‡&W7VÇG5³Òç&W7VÇG3òå³Ò’óò·Ó°¢6öç7BGWÆ–6FW2Ò5&V6÷&B‡&W7VÇG5³Òç&W7VÇG3òå³Ò’óò·Ó°¢6öç7BF&–fg2Ò5&V6÷&B‡&W7VÇG5³%Òç&W7VÇG3òå³Ò’óò·Ó°¢6öç7B6×ÆW2Ò‡&W7VÇG5³5Òç&W7VÇG2óòµÒ’æÖ†5&V6÷&B’æf–ÇFW"‚‡fÇVR“¢fÇVR—2&V6÷&CÇ7G&–ærÂVæ¶æ÷vãâÓâ&ööÆVâ‡fÇVR’“°¢6öç7B6×ÆTÖÒæWrÖÇ7G&–ærÂ²–C¢7G&–æs²F—FÆS¢7G&–ærÕµÓâ‚“°¢f÷"†6öç7B6×ÆRöb6×ÆW2’°¢6öç7B—77VRÒ–×÷'E7G&–ær‡6×ÆRæ—77VRÂƒ“°¢6öç7B7W'&VçBÒ6×ÆTÖævWB†—77VR’óòµÓ°¢7W'&VçBçW6‚‡²–C¢–×÷'E7G&–ær‡6×ÆRæ–BÂƒ’ÂF—FÆS¢–×÷'E7G&–ær‡6×ÆRçF—FÆRÂ#C’Ò“°¢6×ÆTÖç6WB†—77VRÂ7W'&VçB“°¢Ğ¢6öç7B—77VTFVf–æ—F–öç2Ò°¢²&Ö—76–æuöæ–6†R"Â-	]rı-ı}­‚¢İR"Â-	}ı‚Íí=="½-Â=İ-]½Íİ½Í‚ÂİâR-í"ıí-]-Ââ%ÒÀ¢²'VW7F–öç5÷v—F†÷WEöç7vW""Â-	-íıí²­½]İ-]rí--]-"Â-	M½ò-íıíİ]"­íí-­í=â½‚ıíMíİí=âí--]-â%ÒÀ¢²&ç7vW'5÷v—F†÷WEöæW‡Eö7F–öâ"Â-	í--]-²]r½]M=í]=â="Â-	ıí½Rí--]-­½]İ-2İRı]M½ím]İâ­íİ­]-İíRM]--Râ%ÒÀ¢²&GWÆ–6FUö—FV×2"Â-	-í}Íímİ½RM=½‚"Â-	íMİ­í-½RMíÍ=½í-­‚-]=í"=}İí’ıí-]­‚â%ÒÀ¢²'7FÆUöG&gG2"Â-
-½R}]İí-­‚"Â-
}]İí-­‚İRíİí-½ı½Âí½ÍR3Mİ]’â%ÒÀ¢²'F&–fg5öGVR"Â-
-M²-]=í"ıí-]­‚"Â-	İ]"M-²½]M=í]’ıí-]­‚½‚íİ=mRİ-=ı½â%ÒÀ¢²&†–v…÷&—6µ÷v—F†÷WEöW‡ÆæF–öâ"Â-	-½í­’¢]rí­ıİ]İò"Â-
2-½í­í=â­İR}ıí½İ]İâí­ıİ]İR­İí=âM½=â%ÒÀ¢²'7FÆU÷6÷W&6W2"Â-
=-]-òıí-]­-í}İ­"Â-
=--]mMİİ½R}ı‚İRıí-]ı½Âí½ÍRƒMİ]’â%ÒÀ¢Ò26öç7C°¢6öç7B6÷VçG3¢&V6÷&CÇ7G&–ærÂçVÖ&W#âÒ°¢ââäö&¦V7Bæg&öÔVçG&–W2„ö&¦V7BæVçG&–W2‡7VÖÖ'’’æÖ‚…¶¶W’ÂfÇVUÒ’Óâ¶¶W’ÂçVÖ&W"‡fÇVRóò•Ò’’À¢GWÆ–6FUö—FV×3¢çVÖ&W"†GWÆ–6FW2æGWÆ–6FUö—FV×2óò’À¢F&–fg5öGVS¢çVÖ&W"‡F&–fg2çF&–fg5öGVRóò’À¢Ó°¢&WGW&â§6öâ‡°¢7VÖÖ'“¢6÷VçG2À¢—77VW3¢—77VTFVf–æ—F–öç2æÖ‚…¶¶W’ÂF—FÆRÂFW67&—F–öåÒ’Óâ‡²¶W’ÂF—FÆRÂFW67&—F–öâÂ6÷VçC¢6÷VçG5¶¶W•ÒóòÂ6×ÆW3¢6×ÆTÖævWB†¶W’’óòµÒÒ’’À¢ÖG&—ƒ¢&W7VÇG5³EÒç&W7VÇG2óòµÒÀ¢&V6VçD–×÷'G3¢&W7VÇG5³UÒç&W7VÇG2óòµÒÀ¢Ò“°§Ğ ¦6öç7B&6·WF&ÆW2Ò°¢'7FvW2"Â&æ–6†W2"Â'7V&æ–6†W2"Â'Fw2"Â&¶æ÷vÆVFvUö—FV×2"Â&¶æ÷vÆVFvUö—FVÕöæ–6†W2"À¢&¶æ÷vÆVFvUö—FVÕ÷7V&æ–6†W2"Â&¶æ÷vÆVFvUö—FVÕ÷7FvW2"Â&¶æ÷vÆVFvUö—FVÕ÷Fw2"Â&6Æ–VçG2"À¢&6Æ–VçEöæ–6†W2"Â&F–væ÷7F–5÷6W76–öç2"Â&F–væ÷7F–5÷6W76–öåö—FV×2"Â&ff÷&—FW2"Â'&–6–æu÷F&–fg2"À¢'&ö¦V7Eö6Æ7VÆF–öç2"Â&6Æ7VÆF–öåö—FV×2"Â'&÷÷6Ç2"Â&–×÷'Eö&F6†W2"Â&VF—EöÆör"À¥Ò26öç7C° ¦7–æ2gVæ7F–öâ†æFÆT6öç7G'V7F÷$W‡÷'B†Vçc¢Vçb“¢&öÖ—6SÅ&W7öç6Sâ°¢6öç7BF"Ò&WV—&TFF&6R†Vçb“°¢–b†F"–ç7Fæ6Vöb&W7öç6R’&WGW&âF#°¢6öç7BW‡÷'FVDBÒæWrFFR‚’çFô•4õ7G&–ær‚“°¢6öç7B&W7VÇG2Òv—BF"æ&F6‚†&6·WF&ÆW2æÖ‚‡F&ÆR’ÓâF"ç&W&R†4TÄT5B¢e$ôÒG·F&ÆWÖ’’“°¢6öç7BFFÒö&¦V7Bæg&öÔVçG&–W2†&6·WF&ÆW2æÖ‚‡F&ÆRÂ–æFW‚’Óâ·F&ÆRÂ&W7VÇG5¶–æFW…Òç&W7VÇG2óòµÕÒ’“°¢6öç7BFFRÒæWr–çFÂäFFUF–ÖTf÷&ÖB‚&VâÔ4"Â²F–ÖU¦öæS¢$WW&÷RôÖ÷66÷r"Ò’æf÷&ÖB†æWrFFR‚’“°¢&WGW&âæWr&W7öç6R„¥4ôâç7G&–æv–g’‡²f÷&ÖC¢&¦Ö–ÆÖ6öç7G'V7F÷"Ö&6·W"ÂfW'6–öã¢ÂW‡÷'FVDBÂFFÒÂçVÆÂÂ"’Â°¢†VFW'3¢°¢$6öçFVçBÕG—R#¢&Æ–6F–öâö§6öã²6†'6WC×WFbÓ‚"À¢$6öçFVçBÔF—7÷6—F–öâ#¢GF6†ÖVçC²f–ÆVæÖSÒ&¦Ö–ÆÖ6öç7G'V7F÷"Ö&6·WÒG¶FFWÒæ§6öâ&À¢$66†RÔ6öçG&öÂ#¢'&—fFRÂæò×7F÷&RÂÖ‚ÖvSÓ"À¢ÒÀ¢Ò“°§Ğ ¦7–æ2gVæ7F–öâ†æFÆT6öç7G'V7F÷$’‡&WVW7C¢&WVW7BÂVçc¢VçbÂ–FVçF—G“¢6öç7G'V7F÷$–FVçF—G’“¢&öÖ—6SÅ&W7öç6Sâ°¢6öç7BW&ÂÒæWrU$Â‡&WVW7BçW&Â“°Ğ Ğ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö†VÇF‚"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°Ğ¢&WGW&â§6öâ‡°Ğ¢ö³¢G'VRÀĞ¢–FVçF—G’ÀĞ¢FF&6T6öæf–wW&VC¢&ööÆVâ†VçbäD"’ÀĞ¢66W746öæf–wW&VC¢Vçbä4ôå5E%T5Dõ%ôUD…ôTä$ÄTBÓÓÒ'G'VR"ÀĞ¢Ò“°Ğ¢ĞĞ Ğ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö&ö÷G7G&"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆT&ö÷G7G&†VçbÂ–FVçF—G’“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"öF6†&ö&B"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆTF6†&ö&B†Vçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"÷VÆ—G’"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆUVÆ—G”F6†&ö&B†Vçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö–×÷'B÷&Wf–Wr"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆT–×÷'E&Wf–Wr‡&WVW7BÂVçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö–×÷'Bö6öæf—&Ò"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆT–×÷'D6öæf—&Ò‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"öW‡÷'B"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆT6öç7G'V7F÷$W‡÷'B†Vçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö¶æ÷vÆVFvR"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆT¶æ÷vÆVFvTÆ—7B‡&WVW7BÂVçb“°Ğ¢ĞĞ Ğ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö¶æ÷vÆVFvR"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆT¶æ÷vÆVFvT7&VFR‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢6öç7B¶æ÷vÆVFvTÖF6‚ÒW&ÂçF†æÖRæÖF6‚‚õåÂö•Âö6öç7G'V7F÷%Âö¶æ÷vÆVFvUÂò…µâõÒ²’Bò“°¢–b†¶æ÷vÆVFvTÖF6‚’°¢6öç7B—FVÔ–BÒ¶æ÷vÆVFvTÖF6…³Òç6Æ–6RƒÂƒ“°¢–b‡&WVW7BæÖWF†öBÓÓÒ$tUB"’&WGW&â†æFÆT¶æ÷vÆVFvTFWF–Â†—FVÔ–BÂVçb“°¢–b‡&WVW7BæÖWF†öBÓÓÒ%D4‚"’&WGW&â†æFÆT¶æ÷vÆVFvUWFFR‡&WVW7BÂ—FVÔ–BÂVçbÂ–FVçF—G’“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"öç7vW'2"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆTç7vW%6V&6‚‡&WVW7BÂVçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"÷&W&F–öç2"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆU&W&F–öä7&VFR‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"öF–væ÷7F–72"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆTF–væ÷7F–47&VFR‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö6Æ–VçG2"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆT6Æ–VçDÆ—7B‡&WVW7BÂVçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"÷&–6–ærö&ö÷G7G&"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆU&–6–æt&ö÷G7G&†Vçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö6Æ7VÆF–öç2"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆT6Æ7VÆF–öä7&VFR‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"÷&÷÷6Ç2ö&ö÷G7G&"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆU&÷÷6Ä&ö÷G7G&†Vçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"÷&÷÷6Ç2"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆU&÷÷6Ä7&VFR‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢6öç7B&÷÷6ÄÖF6‚ÒW&ÂçF†æÖRæÖF6‚‚õåÂö•Âö6öç7G'V7F÷%Â÷&÷÷6Ç5Âò…µâõÒ²’Bò“°¢–b‡&÷÷6ÄÖF6‚’°¢6öç7B&÷÷6Ä–BÒ&÷÷6ÄÖF6…³Òç6Æ–6RƒÂƒ“°¢–b‡&WVW7BæÖWF†öBÓÓÒ$tUB"’&WGW&â†æFÆU&÷÷6ÄFWF–Â‡&÷÷6Ä–BÂVçb“°¢–b‡&WVW7BæÖWF†öBÓÓÒ%D4‚"’&WGW&â†æFÆU&÷÷6ÅWFFR‡&WVW7BÂ&÷÷6Ä–BÂVçbÂ–FVçF—G’“°¢Ğ ¢6öç7B6Æ7VÆF–öäÖF6‚ÒW&ÂçF†æÖRæÖF6‚‚õåÂö•Âö6öç7G'V7F÷%Âö6Æ7VÆF–öç5Âò…µâõÒ²’Bò“°¢–b†6Æ7VÆF–öäÖF6‚bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆT6Æ7VÆF–öäFWF–Â†6Æ7VÆF–öäÖF6…³Òç6Æ–6RƒÂƒ’ÂVçb“°¢Ğ ¢6öç7B6Æ–VçDÖF6‚ÒW&ÂçF†æÖRæÖF6‚‚õåÂö•Âö6öç7G'V7F÷%Âö6Æ–VçG5Âò…µâõÒ²’Bò“°¢–b†6Æ–VçDÖF6‚’°¢6öç7B6Æ–VçD–BÒ6Æ–VçDÖF6…³Òç6Æ–6RƒÂƒ“°¢–b‡&WVW7BæÖWF†öBÓÓÒ$tUB"’&WGW&â†æFÆT6Æ–VçDFWF–Â†6Æ–VçD–BÂVçb“°¢–b‡&WVW7BæÖWF†öBÓÓÒ%D4‚"’&WGW&â†æFÆT6Æ–VçEWFFR‡&WVW7BÂ6Æ–VçD–BÂVçbÂ–FVçF—G’“°¢Ğ Ğ¢&WGW&â6öç7G'V7F÷$W'&÷"ƒCBÂ$äõEôdõTäB"Â-
}M]²­íİ-=­-íİRİM]Òâ"“°Ğ§ĞĞ Ğ¦gVæ7F–öâ6V7W&T6öç7G'V7F÷%&W7öç6R‡&W7öç6S¢&W7öç6R“¢&W7öç6R°Ğ¢6öç7B†VFW'2ÒæWr†VFW'2‡&W7öç6Ræ†VFW'2“°Ğ¢†VFW'2ç6WB‚$66†RÔ6öçG&öÂ"Â'&—fFRÂæò×7F÷&RÂÖ‚ÖvSÓ"“°Ğ¢†VFW'2ç6WB‚%&vÖ"Â&æòÖ66†R"“°Ğ¢†VFW'2ç6WB‚%‚Õ&ö&÷G2ÕFr"Â&æö–æFW‚ÂæöföÆÆ÷rÂæö&6†—fR"“°Ğ¢†VFW'2ç6WB‚%‚Ô6öçFVçBÕG—RÔ÷F–öç2"Â&æ÷6æ–fb"“°Ğ¢†VFW'2ç6WB‚%&VfW'&W"ÕöÆ–7’"Â'6ÖRÖ÷&–v–â"“°Ğ¢†VFW'2ç6WB‚%W&Ö—76–öç2ÕöÆ–7’"Â&6ÖW&Ò‚’ÂÖ–7&÷†öæSÒ‚’ÂvVöÆö6F–öãÒ‚’"“°Ğ¢&WGW&âæWr&W7öç6R‡&W7öç6Ræ&öG’Â°Ğ¢7FGW3¢&W7öç6Rç7FGW2ÀĞ¢7FGW5FW‡C¢&W7öç6Rç7FGW5FW‡BÀĞ¢†VFW'2ÀĞ¢Ò“°Ğ§ĞĞ Ğ¦6öç7Bv÷&¶W"Ò°Ğ¢7–æ2fWF6‚‡&WVW7C¢&WVW7BÂVçc¢VçbÂ7Gƒ¢W†V7WF–öä6öçFW‡B“¢&öÖ—6SÅ&W7öç6Sâ°Ğ¢6öç7BW&ÂÒæWrU$Â‡&WVW7BçW&Â“°Ğ Ğ¢–b‡W&ÂçF†æÖRÓÓÒ"õ÷f–æW‡Bö–ÖvR"’°Ğ¢6öç7BÆÆ÷vVEv–GF‡2Ò²ââäDTdTÅEôDUd”4Uõ4•¤U2ÂââäDTdTÅEô”ÔtUõ4•¤U5Ó°Ğ¢&WGW&â†æFÆT–ÖvT÷F–Ö—¦F–öâ‡&WVW7BÂ°Ğ¢fWF6„76WC¢‡F‚’ÓâVçbä54UE2æfWF6‚†æWr&WVW7B†æWrU$Â‡F‚Â&WVW7BçW&Â’’’ÀĞ¢G&ç6f÷&Ô–ÖvS¢7–æ2†&öG’Â²v–GF‚Âf÷&ÖBÂVÆ—G’Ò’Óâ°Ğ¢6öç7B&W7VÇBÒv—BVçbä”ÔtU2æ–çWB†&öG’’çG&ç6f÷&Ò‡v–GF‚âò²v–GF‚Ò¢·Ò’æ÷WGWB‡²f÷&ÖBÂVÆ—G’Ò“°Ğ¢&WGW&â&W7VÇBç&W7öç6R‚“°Ğ¢ÒÀĞ¢ÒÂÆÆ÷vVEv–GF‡2“°Ğ¢ĞĞ Ğ¢–b†—46öç7G'V7F÷%&WVW7B‡W&ÂçF†æÖR’’°Ğ¢6öç7B–FVçF—G’Òv—BWF†VçF–6FT6öç7G'V7F÷"‡&WVW7BÂVçb“°Ğ¢–b†–FVçF—G’–ç7Fæ6Vöb&W7öç6R’&WGW&â–FVçF—G“°Ğ Ğ¢–b‡W&ÂçF†æÖRç7F'G5v—F‚‚"ö’ö6öç7G'V7F÷"ò"’’°Ğ¢&WGW&â†æFÆT6öç7G'V7F÷$’‡&WVW7BÂVçbÂ–FVçF—G’“°Ğ¢ĞĞ Ğ¢6öç7B&W7öç6RÒv—B†æFÆW"æfWF6‚‡&WVW7BÂVçbÂ7G‚“°Ğ¢&WGW&â6V7W&T6öç7G'V7F÷%&W7öç6R‡&W7öç6R“°Ğ¢ĞĞ Ğ¢&WGW&â†æFÆW"æfWF6‚‡&WVW7BÂVçbÂ7G‚“°Ğ¢ÒÀĞ§Ó°Ğ Ğ¦W‡÷'BFVfVÇBv÷&¶W#°Ğ 