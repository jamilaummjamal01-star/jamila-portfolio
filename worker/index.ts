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

function parseCalculationMetadata(value: string | null): CalculationMetadata {
  if (!value) return { title: "Ğ Ğ°ÑÑ‡Ñ‘Ñ‚ Ğ¿Ñ€Ğ¾ĞµĞºÑ‚Ğ°", currency: "RUB", comment: "" };
  try {
    const parsed = JSON.parse(value) as unknown;
    const record = asRecord(parsed);
    if (!record) return { title: "Ğ Ğ°ÑÑ‡Ñ‘Ñ‚ Ğ¿Ñ€Ğ¾ĞµĞºÑ‚Ğ°", currency: "RUB", comment: value };
    return {
      title: readText(record, "title", 240) || "Ğ Ğ°ÑÑ‡Ñ‘Ñ‚ Ğ¿Ñ€Ğ¾ĞµĞºÑ‚Ğ°",
      currency: readText(record, "currency", 8) || "RUB",
      comment: readText(record, "comment", 3000),
    };
  } catch {
    return { title: "Ğ Ğ°ÑÑ‡Ñ‘Ñ‚ Ğ¿Ñ€Ğ¾ĞµĞºÑ‚Ğ°", currency: "RUB", comment: value };
  }
}

function parseCalculationItemMetadata(value: string | null): CalculationItemMetadata {
  if (!value) return { unit: "ÑƒÑĞ»ÑƒĞ³Ğ°", comment: "" };
  try {
    const parsed = JSON.parse(value) as unknown;ÛNúÚÚ$z{-®éÜj×ò¶F"ç&W&R‚%4TÄT5B–Be$ôÒ6Æ–VçG2t„U$R–BÒòÄ”Ô•B"’æ&–æB†–çWBæ6Æ–VçD–B•Ò¢µÒ’À¢âââ†–çWBæF–væ÷7F–56W76–öä–Bò¶F"ç&W&R‚%4TÄT5B–Be$ôÒF–væ÷7F–5÷6W76–öç2t„U$R–BÒòÄ”Ô•B"’æ&–æB†–çWBæF–væ÷7F–56W76–öä–B•Ò¢µÒ’À¢âââ†–çWBæ6Æ7VÆF–öä–Bò¶F"ç&W&R‚%4TÄT5B–Be$ôÒ&ö¦V7Eö6Æ7VÆF–öç2t„U$R–BÒòÄ”Ô•B"’æ&–æB†–çWBæ6Æ7VÆF–öä–B•Ò¢µÒ’À¢Ó°¢–b†6†V6·2æÆVæwF‚ÓÓÒ’&WGW&âçVÆÃ° ¢6öç7B&W7VÇG2Òv—BF"æ&F6‚†6†V6·2“°¢ÆWB–æFW‚Ò°¢–b†–çWBæ6Æ–VçD–Bbb&W7VÇG5¶–æFW‚²µÓòç&W7VÇG3òå³Ò’°¢&WGW&â6öç7G'V7F÷$W'&÷"ƒC#"Â$4Ä”TåEôäõEôdõTäB"Â-	-½İİ½’­½]İ"İRİM]Òâ"“°¢Ğ¢–b†–çWBæF–væ÷7F–56W76–öä–Bbb&W7VÇG5¶–æFW‚²µÓòç&W7VÇG3òå³Ò’°¢&WGW&â6öç7G'V7F÷$W'&÷"ƒC#"Â$D”täõ5D”5ôäõEôdõTäB"Â-	-½İİòM=İí-­İRİM]İâ"“°¢Ğ¢–b†–çWBæ6Æ7VÆF–öä–Bbb&W7VÇG5¶–æFW‚²µÓòç&W7VÇG3òå³Ò’°¢&WGW&â6öç7G'V7F÷$W'&÷"ƒC#"Â$4Ä5TÄD”ôåôäõEôdõTäB"Â-	-½İİ½’}"İRİM]Òâ"“°¢Ğ¢&WGW&âçVÆÃ°§Ğ ¦7–æ2gVæ7F–öâ†æFÆU&÷÷6Ä&ö÷G7G&†Vçc¢Vçb“¢&öÖ—6SÅ&W7öç6Sâ°¢6öç7BF"Ò&WV—&TFF&6R†Vçb“°¢–b†F"–ç7Fæ6Vöb&W7öç6R’&WGW&âF#° ¢6öç7B¶6Æ–VçG5&W7VÇBÂ6Æ7VÆF–öç5&W7VÇBÂF–væ÷7F–75&W7VÇBÂ&÷÷6Ç5&W7VÇEÒÒv—BF"æ&F6‚…°¢F"ç&W&R† ¢4TÄT5B–BÂæÖRÂ7&Õ÷7FGW2Â&–÷&—G¢e$ôÒ6Æ–VçG0¢t„U$R7&Õ÷7FGW2Òv&6†—fVBp¢õ$DU"%’44R&–÷&—G’t„TâtrD„Tât„Tât"rD„TâTÅ4R"TäBÂWFFVEöBDU40¢Ä”Ô•B# ¢’À¢F"ç&W&R† ¢4TÄT5@¢2æ–BÀ¢2æ6Æ–VçEö–BÀ¢2ææÖR26Æ–VçEöæÖRÀ¢2ç7FGW2À¢2æ6öÖÖVçBÀ¢2çfÆ–E÷VçF–ÂÀ¢Ô‚€¢2æÖ–æ–×VÕ÷&–6RÀ¢4ôÄU44R…5TÒ€¢€¢6’çVçF—G’¢44Rt„Tâ6’æÖçVÅ÷&FRâD„Tâ6’æÖçVÅ÷&FRTÅ4R6’çF&–fe÷&FRTäB ¢6’æ6ö×ÆW†—G•ö6öVff–6–VçB¢6’ç6÷W&6Uö6öVff–6–VçB¢6’çW&vVæ7•ö6öVff–6–VçB¢6’ç&–v‡G5ö6öVff–6–VçB°¢6’æf—†VEö6÷7B²6’æ†÷W'2¢6’æ–çFW&æÅö†÷W%÷&FR²6’æW‡FW&æÅö6÷7@¢’¢ƒÒ6’æ—FVÕöF—66÷VçE÷W&6VçBò¢’Â’¢ƒÒ2æF—66÷VçE÷W&6VçBò’²2æÖçVÅöF§W7FÖVçB²2æW‡FW&æÅ÷&ö¦V7Eö6÷7@¢’2F÷FÂÀ¢4õTåB†6’æ–B’2—FVÕö6÷VçBÀ¢2çWFFVEö@¢e$ôÒ&ö¦V7Eö6Æ7VÆF–öç20¢ÄTeB¤ô”â6Æ–VçG22ôâ2æ–BÒ2æ6Æ–VçEö–@¢ÄTeB¤ô”â6Æ7VÆF–öåö—FV×26’ôâ6’æ6Æ7VÆF–öåö–BÒ2æ–@¢t„U$R2ç7FGW2Òv&6†—fVBp¢u$õU%’2æ–@¢õ$DU"%’2çWFFVEöBDU40¢Ä”Ô•B# ¢’À¢F"ç&W&R† ¢4TÄT5BG2æ–BÂG2æ6Æ–VçEö–BÂ2ææÖR26Æ–VçEöæÖRÂG2ævöÂÂG2æÖ–åöF–væ÷6—2ÂG2æ7&VFVEö@¢e$ôÒF–væ÷7F–5÷6W76–öç2G0¢¤ô”â6Æ–VçG22ôâ2æ–BÒG2æ6Æ–VçEö–@¢t„U$RG2ç7FGW2Òv&6†—fVBp¢õ$DU"%’G2çWFFVEöBDU40¢Ä”Ô•B# ¢’À¢F"ç&W&R†G·&÷÷6Å6VÆV7E7ÇĞ¢t„U$Rç7FGW2Òv&6†—fVBp¢õ$DU"%¢44Rç7FGW0¢t„TâvF—67W76–öârD„Tât„Tâw6VçBrD„Tât„Tâw&VG•÷Fõ÷6VæBrD„Tâ ¢t„Tâv–çFW&æÅ÷&Wf–WrrD„Tâ2t„TâvæVVG5öFFrD„TâBt„TâvG&gBrD„TâP¢t„Tâv&÷fVBrD„Tâbt„Tâw&V¦V7FVBrD„TârTÅ4R€¢TäBÀ¢çWFFVEöBDU40¢Ä”Ô•B3 ¢’À¢Ò“° ¢6öç7B6Æ7VÆF–öç2Ò†6Æ7VÆF–öç5&W7VÇBç&W7VÇG2óòµÒ’2Væ¶æ÷vâ2&÷÷6Ä6Æ7VÆF–öå&÷uµÓ°¢&WGW&â§6öâ‡°¢6Æ–VçG3¢‚†6Æ–VçG5&W7VÇBç&W7VÇG2óòµÒ’2Væ¶æ÷vâ2&–6–æt6Æ–VçE&÷uµÒ’æÖ‚†6Æ–VçB’Óâ‡°¢–C¢6Æ–VçBæ–BÀ¢æÖS¢6Æ–VçBææÖRÀ¢7&Õ7FGW3¢6Æ–VçBæ7&Õ÷7FGW2À¢&–÷&—G“¢6Æ–VçBç&–÷&—G’À¢Ò’’À¢6Æ7VÆF–öç3¢6Æ7VÆF–öç2æÖ‚†6Æ7VÆF–öâ’Óâ°¢6öç7BÖWFFFÒ'6T6Æ7VÆF–öäÖWFFF†6Æ7VÆF–öâæ6öÖÖVçB“°¢&WGW&â°¢–C¢6Æ7VÆF–öâæ–BÀ¢6Æ–VçD–C¢6Æ7VÆF–öâæ6Æ–VçEö–BÀ¢6Æ–VçDæÖS¢6Æ7VÆF–öâæ6Æ–VçEöæÖRÀ¢F—FÆS¢ÖWFFFçF—FÆRÀ¢7W'&Væ7“¢ÖWFFFæ7W'&Væ7’À¢F÷FÃ¢&÷VæDÖöæW’„çVÖ&W"†6Æ7VÆF–öâçF÷FÂóò’’À¢fÆ–EVçF–Ã¢6Æ7VÆF–öâçfÆ–E÷VçF–ÂÀ¢WFFVDC¢6Æ7VÆF–öâçWFFVEöBÀ¢Ó°¢Ò’À¢F–væ÷7F–73¢‚†F–væ÷7F–75&W7VÇBç&W7VÇG2óòµÒ’2Væ¶æ÷vâ2&÷÷6ÄF–væ÷7F–5&÷uµÒ’æÖ‚†F–væ÷7F–2’Óâ‡°¢–C¢F–væ÷7F–2æ–BÀ¢6Æ–VçD–C¢F–væ÷7F–2æ6Æ–VçEö–BÀ¢6Æ–VçDæÖS¢F–væ÷7F–2æ6Æ–VçEöæÖRÀ¢vöÃ¢F–væ÷7F–2ævöÂÀ¢Ö–äF–væ÷6—3¢F–væ÷7F–2æÖ–åöF–væ÷6—2À¢7&VFVDC¢F–væ÷7F–2æ7&VFVEöBÀ¢Ò’’À¢&÷÷6Ç3¢‚‡&÷÷6Ç5&W7VÇBç&W7VÇG2óòµÒ’2Væ¶æ÷vâ2&÷÷6Å&÷uµÒ’æÖ‡&÷÷6Å&W7öç6R’À¢Ò“°§Ğ ¦7–æ2gVæ7F–öâ†æFÆU&÷÷6ÄFWF–Â‡&÷÷6Ä–C¢7G&–ærÂVçc¢Vçb“¢&öÖ—6SÅ&W7öç6Sâ°¢6öç7BF"Ò&WV—&TFF&6R†Vçb“°¢–b†F"–ç7Fæ6Vöb&W7öç6R’&WGW&âF#°¢6öç7B&÷rÒv—BF"ç&W&R†G·&÷÷6Å6VÆV7E7ÇÒt„U$Ræ–BÒòÄ”Ô•B’æ&–æB‡&÷÷6Ä–B’æf—'7CÅ&÷÷6Å&÷sâ‚“°¢–b‚&÷sòæ–B’&WGW&â6öç7G'V7F÷$W'&÷"ƒCBÂ%$õõ4ÅôäõEôdõTäB"Â-	­íÍÍ]}]­íRı]M½ím]İRİRİM]İââ"“°¢&WGW&â§6öâ‡²&÷÷6Ã¢&÷÷6Å&W7öç6R‡&÷r’Ò“°§Ğ ¦7–æ2gVæ7F–öâ†æFÆU&÷÷6Ä7&VFR‡&WVW7C¢&WVW7BÂVçc¢VçbÂ–FVçF—G“¢6öç7G'V7F÷$–FVçF—G’“¢&öÖ—6SÅ&W7öç6Sâ°¢6öç7BF"Ò&WV—&TFF&6R†Vçb“°¢–b†F"–ç7Fæ6Vöb&W7öç6R’&WGW&âF#° ¢ÆWB&öG“¢&V6÷&CÇ7G&–ærÂVæ¶æ÷vãã°¢G'’°¢&öG’Ò†v—B&WVW7Bæ§6öâ‚’’2&V6÷&CÇ7G&–ærÂVæ¶æ÷vãã°¢Ò6F6‚°¢&WGW&â6öç7G'V7F÷$W'&÷"ƒCÂ$”ådÄ”Eô¥4ôâ"Â-	İR=M½íÂıí}--ÂMİİ½R­íÍÍ]}]­í=âı]M½ím]İòâ"“°¢Ğ¢6öç7B–çWBÒ&VE&÷÷6Ä–çWB†&öG’“°¢–b†–çWB–ç7Fæ6Vöb&W7öç6R’&WGW&â–çWC°¢6öç7B&VfW&Væ6TW'&÷"Òv—BfÆ–FFU&÷÷6Å&VfW&Væ6W2†F"Â–çWB“°¢–b‡&VfW&Væ6TW'&÷"’&WGW&â&VfW&Væ6TW'&÷#° ¢6öç7B&÷÷6Ä–BÒ7'—Fòç&æFöÕUT”B‚“°¢6öç7Bæ÷rÒæWrFFR‚’çFô•4õ7G&–ær‚“°¢6öç7B6VçDBÒ–çWBç7FGW2ÓÓÒ'6VçB"òæ÷r¢çVÆÃ°¢v—BF"æ&F6‚…°¢F"ç&W&R† ¢”å4U%B”åDò&÷÷6Ç2€¢–BÂ6Æ–VçEö–BÂF–væ÷7F–5÷6W76–öåö–BÂ6Æ7VÆF–öåö–BÂfW'6–öâÂ7FGW2ÂF—FÆRÀ¢F–væ÷6—5÷FW‡BÂ7G&FVw•÷FW‡BÂ6öÇWF–öå÷FW‡BÂ66÷U÷FW‡BÂF–ÖVÆ–æU÷FW‡BÀ¢&–v‡G5÷FW‡BÂÆ–Ö—FF–öç5÷FW‡BÂæW‡E÷7FW÷FW‡BÂ6Æ–VçEöFö7VÖVçBÂ–çFW&æÅöæ÷FW2À¢6VçEöBÂföÆÆ÷u÷WöBÂfÆ–E÷VçF–ÂÂ7&VFVEöBÂWFFVEö@¢’dÅTU2ƒòÂòÂòÂòÂÂòÂòÂòÂòÂòÂòÂòÂòÂòÂòÂòÂòÂòÂòÂòÂòÂò¢’æ&–æB€¢&÷÷6Ä–BÀ¢–çWBæ6Æ–VçD–BÇÂçVÆÂÀ¢–çWBæF–væ÷7F–56W76–öä–BÇÂçVÆÂÀ¢–çWBæ6Æ7VÆF–öä–BÇÂçVÆÂÀ¢–çWBç7FGW2À¢–çWBçF—FÆRÀ¢–çWBæF–væ÷6—5FW‡BÇÂçVÆÂÀ¢–çWBç7G&FVw•FW‡BÇÂçVÆÂÀ¢–çWBç6öÇWF–öåFW‡BÇÂçVÆÂÀ¢–çWBç66÷UFW‡BÇÂçVÆÂÀ¢–çWBçF–ÖVÆ–æUFW‡BÇÂçVÆÂÀ¢–çWBç&–v‡G5FW‡BÇÂçVÆÂÀ¢–çWBæÆ–Ö—FF–öç5FW‡BÇÂçVÆÂÀ¢–çWBææW‡E7FWFW‡BÇÂçVÆÂÀ¢–çWBæ6Æ–VçDFö7VÖVçBÇÂçVÆÂÀ¢–çWBæ–çFW&æÄæ÷FW2ÇÂçVÆÂÀ¢6VçDBÀ¢–çWBæföÆÆ÷uWBÇÂçVÆÂÀ¢–çWBçfÆ–EVçF–ÂÇÂçVÆÂÀ¢æ÷rÀ¢æ÷rÀ¢’À¢F"ç&W&R† ¢”å4U%B”åDòVF—EöÆör†–BÂ7F÷%öVÖ–ÂÂ7F–öâÂVçF—G•÷G—RÂVçF—G•ö–BÂæWu÷fÇVUö§6öâÂ7&VFVEöB¢dÅTU2ƒòÂòÂv7&VFRrÂw&÷÷6ÂrÂòÂòÂò¢’æ&–æB€¢7'—Fòç&æFöÕUT”B‚’À¢–FVçF—G’æVÖ–ÂÀ¢&÷÷6Ä–BÀ¢¥4ôâç7G&–æv–g’‡²F—FÆS¢–çWBçF—FÆRÂ7FGW3¢–çWBç7FGW2Â6Æ–VçD–C¢–çWBæ6Æ–VçD–BÇÂçVÆÂÂ6Æ7VÆF–öä–C¢–çWBæ6Æ7VÆF–öä–BÇÂçVÆÂÒ’À¢æ÷rÀ¢’À¢Ò“° ¢6öç7B&W7öç6RÒv—B†æFÆU&÷÷6ÄFWF–Â‡&÷÷6Ä–BÂVçb“°¢&WGW&âæWr&W7öç6R‡&W7öç6Ræ&öG’Â²7FGW3¢#Â†VFW'3¢&W7öç6Ræ†VFW'2Ò“°§Ğ ¦7–æ2gVæ7F–öâ†æFÆU&÷÷6ÅWFFR‡&WVW7C¢&WVW7BÂ&÷÷6Ä–C¢7G&–ærÂVçc¢VçbÂ–FVçF—G“¢6öç7G'V7F÷$–FVçF—G’“¢&öÖ—6SÅ&W7öç6Sâ°¢6öç7BF"Ò&WV—&TFF&6R†Vçb“°¢–b†F"–ç7Fæ6Vöb&W7öç6R’&WGW&âF#° ¢6öç7BW†—7F–ærÒv—BF"ç&W&R‚%4TÄT5B–BÂfW'6–öâÂ6VçEöBe$ôÒ&÷÷6Ç2t„U$R–BÒòÄ”Ô•B"’æ&–æB‡&÷÷6Ä–B’æf—'7CÇ²–C¢7G&–æs²fW'6–öã¢çVÖ&W#²6VçEöC¢7G&–ærÂçVÆÂÓâ‚“°¢–b‚W†—7F–æsòæ–B’&WGW&â6öç7G'V7F÷$W'&÷"ƒCBÂ%$õõ4ÅôäõEôdõTäB"Â-	­íÍÍ]}]­íRı]M½ím]İRİRİM]İââ"“° ¢ÆWB&öG“¢&V6÷&CÇ7G&–ærÂVæ¶æ÷vãã°¢G'’°¢&öG’Ò†v—B&WVW7Bæ§6öâ‚’’2&V6÷&CÇ7G&–ærÂVæ¶æ÷vãã°¢Ò6F6‚°¢&WGW&â6öç7G'V7F÷$W'&÷"ƒCÂ$”ådÄ”Eô¥4ôâ"Â-	İR=M½íÂıí}--Â}Í]İ]İò­íÍÍ]}]­í=âı]M½ím]İòâ"“°¢Ğ¢6öç7B–çWBÒ&VE&÷÷6Ä–çWB†&öG’“°¢–b†–çWB–ç7Fæ6Vöb&W7öç6R’&WGW&â–çWC°¢6öç7B&VfW&Væ6TW'&÷"Òv—BfÆ–FFU&÷÷6Å&VfW&Væ6W2†F"Â–çWB“°¢–b‡&VfW&Væ6TW'&÷"’&WGW&â&VfW&Væ6TW'&÷#° ¢6öç7Bæ÷rÒæWrFFR‚’çFô•4õ7G&–ær‚“°¢6öç7B6VçDBÒW†—7F–ærç6VçEöBÇÂ†–çWBç7FGW2ÓÓÒ'6VçB"òæ÷r¢çVÆÂ“°¢v—BF"æ&F6‚…°¢F"ç&W&R† ¢UDDR&÷÷6Ç0¢4U@¢6Æ–VçEö–BÒòÂF–væ÷7F–5÷6W76–öåö–BÒòÂ6Æ7VÆF–öåö–BÒòÂfW'6–öâÒòÂ7FGW2ÒòÂF—FÆRÒòÀ¢F–væ÷6—5÷FW‡BÒòÂ7G&FVw•÷FW‡BÒòÂ6öÇWF–öå÷FW‡BÒòÂ66÷U÷FW‡BÒòÂF–ÖVÆ–æU÷FW‡BÒòÀ¢&–v‡G5÷FW‡BÒòÂÆ–Ö—FF–öç5÷FW‡BÒòÂæW‡E÷7FW÷FW‡BÒòÂ6Æ–VçEöFö7VÖVçBÒòÂ–çFW&æÅöæ÷FW2ÒòÀ¢6VçEöBÒòÂföÆÆ÷u÷WöBÒòÂfÆ–E÷VçF–ÂÒòÂWFFVEöBÒğ¢t„U$R–BÒğ¢’æ&–æB€¢–çWBæ6Æ–VçD–BÇÂçVÆÂÀ¢–çWBæF–væ÷7F–56W76–öä–BÇÂçVÆÂÀ¢–çWBæ6Æ7VÆF–öä–BÇÂçVÆÂÀ¢çVÖ&W"†W†—7F–ærçfW'6–öâ’²À¢–çWBç7FGW2À¢–çWBçF—FÆRÀ¢–çWBæF–væ÷6—5FW‡BÇÂçVÆÂÀ¢–çWBç7G&FVw•FW‡BÇÂçVÆÂÀ¢–çWBç6öÇWF–öåFW‡BÇÂçVÆÂÀ¢–çWBç66÷UFW‡BÇÂçVÆÂÀ¢–çWBçF–ÖVÆ–æUFW‡BÇÂçVÆÂÀ¢–çWBç&–v‡G5FW‡BÇÂçVÆÂÀ¢–çWBæÆ–Ö—FF–öç5FW‡BÇÂçVÆÂÀ¢–çWBææW‡E7FWFW‡BÇÂçVÆÂÀ¢–çWBæ6Æ–VçDFö7VÖVçBÇÂçVÆÂÀ¢–çWBæ–çFW&æÄæ÷FW2ÇÂçVÆÂÀ¢6VçDBÀ¢–çWBæföÆÆ÷uWBÇÂçVÆÂÀ¢–çWBçfÆ–EVçF–ÂÇÂçVÆÂÀ¢æ÷rÀ¢&÷÷6Ä–BÀ¢’À¢F"ç&W&R† ¢”å4U%B”åDòVF—EöÆör†–BÂ7F÷%öVÖ–ÂÂ7F–öâÂVçF—G•÷G—RÂVçF—G•ö–BÂæWu÷fÇVUö§6öâÂ7&VFVEöB¢dÅTU2ƒòÂòÂwWFFRrÂw&÷÷6ÂrÂòÂòÂò¢’æ&–æB€¢7'—Fòç&æFöÕUT”B‚’À¢–FVçF—G’æVÖ–ÂÀ¢&÷÷6Ä–BÀ¢¥4ôâç7G&–æv–g’‡²F—FÆS¢–çWBçF—FÆRÂ7FGW3¢–çWBç7FGW2ÂfW'6–öã¢çVÖ&W"†W†—7F–ærçfW'6–öâ’²Ò’À¢æ÷rÀ¢’À¢Ò“°¢&WGW&â†æFÆU&÷÷6ÄFWF–Â‡&÷÷6Ä–BÂVçb“°§Ğ ¦7–æ2gVæ7F–öâ†æFÆT6öç7G'V7F÷$’‡&WVW7C¢&WVW7BÂVçc¢VçbÂ–FVçF—G“¢6öç7G'V7F÷$–FVçF—G’“¢&öÖ—6SÅ&W7öç6Sâ°¢6öç7BW&ÂÒæWrU$Â‡&WVW7BçW&Â“°Ğ Ğ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö†VÇF‚"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°Ğ¢&WGW&â§6öâ‡°Ğ¢ö³¢G'VRÀĞ¢–FVçF—G’ÀĞ¢FF&6T6öæf–wW&VC¢&ööÆVâ†VçbäD"’ÀĞ¢66W746öæf–wW&VC¢Vçbä4ôå5E%T5Dõ%ôUD…ôTä$ÄTBÓÓÒ'G'VR"ÀĞ¢Ò“°Ğ¢ĞĞ Ğ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö&ö÷G7G&"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°Ğ¢&WGW&â†æFÆT&ö÷G7G&†VçbÂ–FVçF—G’“°Ğ¢ĞĞ Ğ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö¶æ÷vÆVFvR"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°Ğ¢&WGW&â†æFÆT¶æ÷vÆVFvTÆ—7B‡&WVW7BÂVçb“°Ğ¢ĞĞ Ğ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö¶æ÷vÆVFvR"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆT¶æ÷vÆVFvT7&VFR‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"öç7vW'2"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆTç7vW%6V&6‚‡&WVW7BÂVçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"÷&W&F–öç2"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆU&W&F–öä7&VFR‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"öF–væ÷7F–72"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆTF–væ÷7F–47&VFR‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö6Æ–VçG2"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆT6Æ–VçDÆ—7B‡&WVW7BÂVçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"÷&–6–ærö&ö÷G7G&"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆU&–6–æt&ö÷G7G&†Vçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"ö6Æ7VÆF–öç2"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆT6Æ7VÆF–öä7&VFR‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"÷&÷÷6Ç2ö&ö÷G7G&"bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆU&÷÷6Ä&ö÷G7G&†Vçb“°¢Ğ ¢–b‡W&ÂçF†æÖRÓÓÒ"ö’ö6öç7G'V7F÷"÷&÷÷6Ç2"bb&WVW7BæÖWF†öBÓÓÒ%õ5B"’°¢&WGW&â†æFÆU&÷÷6Ä7&VFR‡&WVW7BÂVçbÂ–FVçF—G’“°¢Ğ ¢6öç7B&÷÷6ÄÖF6‚ÒW&ÂçF†æÖRæÖF6‚‚õåÂö•Âö6öç7G'V7F÷%Â÷&÷÷6Ç5Âò…µâõÒ²’Bò“°¢–b‡&÷÷6ÄÖF6‚’°¢6öç7B&÷÷6Ä–BÒ&÷÷6ÄÖF6…³Òç6Æ–6RƒÂƒ“°¢–b‡&WVW7BæÖWF†öBÓÓÒ$tUB"’&WGW&â†æFÆU&÷÷6ÄFWF–Â‡&÷÷6Ä–BÂVçb“°¢–b‡&WVW7BæÖWF†öBÓÓÒ%D4‚"’&WGW&â†æFÆU&÷÷6ÅWFFR‡&WVW7BÂ&÷÷6Ä–BÂVçbÂ–FVçF—G’“°¢Ğ ¢6öç7B6Æ7VÆF–öäÖF6‚ÒW&ÂçF†æÖRæÖF6‚‚õåÂö•Âö6öç7G'V7F÷%Âö6Æ7VÆF–öç5Âò…µâõÒ²’Bò“°¢–b†6Æ7VÆF–öäÖF6‚bb&WVW7BæÖWF†öBÓÓÒ$tUB"’°¢&WGW&â†æFÆT6Æ7VÆF–öäFWF–Â†6Æ7VÆF–öäÖF6…³Òç6Æ–6RƒÂƒ’ÂVçb“°¢Ğ ¢6öç7B6Æ–VçDÖF6‚ÒW&ÂçF†æÖRæÖF6‚‚õåÂö•Âö6öç7G'V7F÷%Âö6Æ–VçG5Âò…µâõÒ²’Bò“°¢–b†6Æ–VçDÖF6‚’°¢6öç7B6Æ–VçD–BÒ6Æ–VçDÖF6…³Òç6Æ–6RƒÂƒ“°¢–b‡&WVW7BæÖWF†öBÓÓÒ$tUB"’&WGW&â†æFÆT6Æ–VçDFWF–Â†6Æ–VçD–BÂVçb“°¢–b‡&WVW7BæÖWF†öBÓÓÒ%D4‚"’&WGW&â†æFÆT6Æ–VçEWFFR‡&WVW7BÂ6Æ–VçD–BÂVçbÂ–FVçF—G’“°¢Ğ Ğ¢&WGW&â6öç7G'V7F÷$W'&÷"ƒCBÂ$äõEôdõTäB"Â-
}M]²­íİ-=­-íİRİM]Òâ"“°Ğ§ĞĞ Ğ¦gVæ7F–öâ6V7W&T6öç7G'V7F÷%&W7öç6R‡&W7öç6S¢&W7öç6R“¢&W7öç6R°Ğ¢6öç7B†VFW'2ÒæWr†VFW'2‡&W7öç6Ræ†VFW'2“°Ğ¢†VFW'2ç6WB‚$66†RÔ6öçG&öÂ"Â'&—fFRÂæò×7F÷&RÂÖ‚ÖvSÓ"“°Ğ¢†VFW'2ç6WB‚%&vÖ"Â&æòÖ66†R"“°Ğ¢†VFW'2ç6WB‚%‚Õ&ö&÷G2ÕFr"Â&æö–æFW‚ÂæöföÆÆ÷rÂæö&6†—fR"“°Ğ¢†VFW'2ç6WB‚%‚Ô6öçFVçBÕG—RÔ÷F–öç2"Â&æ÷6æ–fb"“°Ğ¢†VFW'2ç6WB‚%&VfW'&W"ÕöÆ–7’"Â'6ÖRÖ÷&–v–â"“°Ğ¢†VFW'2ç6WB‚%W&Ö—76–öç2ÕöÆ–7’"Â&6ÖW&Ò‚’ÂÖ–7&÷†öæSÒ‚’ÂvVöÆö6F–öãÒ‚’"“°Ğ¢&WGW&âæWr&W7öç6R‡&W7öç6Ræ&öG’Â°Ğ¢7FGW3¢&W7öç6Rç7FGW2ÀĞ¢7FGW5FW‡C¢&W7öç6Rç7FGW5FW‡BÀĞ¢†VFW'2ÀĞ¢Ò“°Ğ§ĞĞ Ğ¦6öç7Bv÷&¶W"Ò°Ğ¢7–æ2fWF6‚‡&WVW7C¢&WVW7BÂVçc¢VçbÂ7Gƒ¢W†V7WF–öä6öçFW‡B“¢&öÖ—6SÅ&W7öç6Sâ°Ğ¢6öç7BW&ÂÒæWrU$Â‡&WVW7BçW&Â“°Ğ Ğ¢–b‡W&ÂçF†æÖRÓÓÒ"õ÷f–æW‡Bö–ÖvR"’°Ğ¢6öç7BÆÆ÷vVEv–GF‡2Ò²ââäDTdTÅEôDUd”4Uõ4•¤U2ÂââäDTdTÅEô”ÔtUõ4•¤U5Ó°Ğ¢&WGW&â†æFÆT–ÖvT÷F–Ö—¦F–öâ‡&WVW7BÂ°Ğ¢fWF6„76WC¢‡F‚’ÓâVçbä54UE2æfWF6‚†æWr&WVW7B†æWrU$Â‡F‚Â&WVW7BçW&Â’’’ÀĞ¢G&ç6f÷&Ô–ÖvS¢7–æ2†&öG’Â²v–GF‚Âf÷&ÖBÂVÆ—G’Ò’Óâ°Ğ¢6öç7B&W7VÇBÒv—BVçbä”ÔtU2æ–çWB†&öG’’çG&ç6f÷&Ò‡v–GF‚âò²v–GF‚Ò¢·Ò’æ÷WGWB‡²f÷&ÖBÂVÆ—G’Ò“°Ğ¢&WGW&â&W7VÇBç&W7öç6R‚“°Ğ¢ÒÀĞ¢ÒÂÆÆ÷vVEv–GF‡2“°Ğ¢ĞĞ Ğ¢–b†—46öç7G'V7F÷%&WVW7B‡W&ÂçF†æÖR’’°Ğ¢6öç7B–FVçF—G’Òv—BWF†VçF–6FT6öç7G'V7F÷"‡&WVW7BÂVçb“°Ğ¢–b†–FVçF—G’–ç7Fæ6Vöb&W7öç6R’&WGW&â–FVçF—G“°Ğ Ğ¢–b‡W&ÂçF†æÖRç7F'G5v—F‚‚"ö’ö6öç7G'V7F÷"ò"’’°Ğ¢&WGW&â†æFÆT6öç7G'V7F÷$’‡&WVW7BÂVçbÂ–FVçF—G’“°Ğ¢ĞĞ Ğ¢6öç7B&W7öç6RÒv—B†æFÆW"æfWF6‚‡&WVW7BÂVçbÂ7G‚“°Ğ¢&WGW&â6V7W&T6öç7G'V7F÷%&W7öç6R‡&W7öç6R“°Ğ¢ĞĞ Ğ¢&WGW&â†æFÆW"æfWF6‚‡&WVW7BÂVçbÂ7G‚“°Ğ¢ÒÀĞ§Ó°Ğ Ğ¦W‡÷'BFVfVÇBv÷&¶W#°Ğ