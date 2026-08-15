"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import styles from "./constructor.module.css";

export type ConstructorSection = "home" | "followups" | "knowledge" | "library" | "prepare" | "answer" | "diagnostic" | "clients" | "pricing" | "proposals" | "quality";

type DashboardData = {
  generatedAt: string;
  summary: {
    follow_ups: number;
    active_diagnostics: number;
    active_proposals: number;
    knowledge_review: number;
    tariffs_review: number;
  };
  followUps: Array<{
    id: string;
    name: string;
    crm_status: string;
    priority: string;
    next_action: string | null;
    next_contact_at: string;
    niche_name: string | null;
  }>;
  diagnostics: Array<{
    id: string;
    client_id: string;
    client_name: string;
    status: string;
    format: string;
    next_action: string | null;
    scheduled_at: string | null;
    updated_at: string;
    total_items: number;
    answered_items: number;
  }>;
  proposals: Array<{
    id: string;
    title: string;
    status: string;
    version: number;
    follow_up_at: string | null;
    valid_until: string | null;
    updated_at: string;
    client_name: string | null;
  }>;
  knowledgeReview: Array<{
    id: string;
    title: string;
    item_type: string;
    category: string;
    status: string;
    risk_level: string;
    version: number;
    updated_at: string;
  }>;
  coverageGaps: Array<{
    slug: string;
    name: string;
    priority: string;
    approved_items: number;
  }>;
};

type ErrorPayload = { error?: { message?: string } };

const diagnosticLabels: Record<string, string> = {
  draft: "Черновик",
  scheduled: "Запланировано",
  in_progress: "В процессе",
  needs_clarification: "Нужны уточнения",
  ready_for_proposal: "Готово к КП",
};

const proposalLabels: Record<string, string> = {
  draft: "Черновик",
  needs_data: "Нужны данные",
  internal_review: "На проверке",
  ready_to_send: "Готово к отправке",
  sent: "Отправлено",
  discussion: "Обсуждение",
};

const knowledgeTypeLabels: Record<string, string> = {
  question_to_client: "Вопрос клиенту",
  question_from_client: "Вопрос клиента",
  answer: "Ответ",
  objection: "Возражение",
  objection_response: "Ответ на возражение",
  clarifying_question: "Уточнение",
  first_message: "Первое сообщение",
  follow_up: "Повторное сообщение",
  diagnostic_hint: "Подсказка",
  audit_check: "Проверка аудита",
  red_flag: "Красный флаг",
  ethical_rule: "Этическое правило",
  proposal_block: "Блок КП",
  package: "Пакет",
  next_action: "Следующий шаг",
  refusal_reason: "Основание для отказа",
};

function displayDate(value: string | null, withTime = false): string {
  if (!value) return "Дата не указана";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("ru-RU", withTime ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short" }).format(date);
}

function isOverdue(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.valueOf() < Date.now();
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

export default function DashboardWorkspace({
  onNavigate,
  onOpenKnowledge,
}: {
  onNavigate: (section: ConstructorSection) => void;
  onOpenKnowledge: (nicheSlug: string) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/constructor/dashboard", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(await parseError(response));
      setData((await response.json()) as DashboardData);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить главную панель.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  const today = useMemo(() => new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(new Date()), []);

  const summaryCards = [
    { label: "Следующие контакты", value: data?.summary.follow_ups ?? 0, section: "followups" as const, hint: "на ближайшие 14 дней" },
    { label: "Диагностики", value: data?.summary.active_diagnostics ?? 0, section: "diagnostic" as const, hint: "не завершены" },
    { label: "Активные КП", value: data?.summary.active_proposals ?? 0, section: "proposals" as const, hint: "в работе и обсуждении" },
    { label: "Проверка знаний", value: data?.summary.knowledge_review ?? 0, section: "knowledge" as const, hint: "черновики и проверка" },
  ];

  return (
    <section className={styles.dashboardWorkspace}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Главная</p>
          <h1>Рабочая ситуация</h1>
          <span className={styles.dashboardDate}>{today}</span>
        </div>
        <button className={styles.secondaryButton} type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Обновляю…" : "Обновить"}
        </button>
      </header>

      <section className={styles.dashboardQuickActions} aria-label="Быстрые действия">
        <button type="button" onClick={() => onNavigate("prepare")}><span>01</span><strong>Подготовиться к клиенту</strong><small>Контекст, вопросы и риски</small></button>
        <button type="button" onClick={() => onNavigate("answer")}><span>02</span><strong>Ответить клиенту</strong><small>Найти готовую формулировку</small></button>
        <button type="button" onClick={() => onNavigate("diagnostic")}><span>03</span><strong>Провести диагностику</strong><small>Сохранить ответы и диагноз</small></button>
        <button type="button" onClick={() => onNavigate("proposals")}><span>04</span><strong>Собрать КП</strong><small>Клиентская версия и проверка</small></button>
      </section>

      {error && <div className={styles.errorPanel}>{error}</div>}

      <section className={styles.dashboardStats} aria-label="Сводка">
        {summaryCards.map((card) => (
          <button key={card.label} type="button" onClick={() => onNavigate(card.section)}>
            <span>{card.label}</span>
            <strong>{loading && !data ? "—" : card.value}</strong>
            <small>{card.hint}</small>
          </button>
        ))}
      </section>

      <div className={styles.dashboardGrid} aria-busy={loading}>
        <DashboardPanel title="Следующие контакты" count={data?.followUps.length ?? 0} action="План контактов" onAction={() => onNavigate("followups")}>
          {!loading && data?.followUps.length === 0 ? <DashboardEmpty text="Ближайшие контакты не запланированы." /> : (
            <div className={styles.dashboardList}>
              {data?.followUps.map((client) => (
                <button key={client.id} type="button" onClick={() => onNavigate("followups")}>
                  <span className={`${styles.dashboardPriority} ${styles[`dashboardPriority${client.priority}`] || ""}`}>{client.priority}</span>
                  <div><strong>{client.name}</strong><small>{client.next_action || client.niche_name || "Уточнить следующий шаг"}</small></div>
                  <time className={isOverdue(client.next_contact_at) ? styles.dashboardOverdue : ""}>{isOverdue(client.next_contact_at) ? "Просрочено · " : ""}{displayDate(client.next_contact_at, true)}</time>
                </button>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel title="Диагностики в работе" count={data?.diagnostics.length ?? 0} action="Открыть диагностику" onAction={() => onNavigate("diagnostic")}>
          {!loading && data?.diagnostics.length === 0 ? <DashboardEmpty text="Незавершённых диагностик нет." /> : (
            <div className={styles.dashboardList}>
              {data?.diagnostics.map((session) => {
                const progress = session.total_items > 0 ? Math.round((session.answered_items / session.total_items) * 100) : 0;
                return (
                  <button key={session.id} type="button" onClick={() => onNavigate("diagnostic")}>
                    <span className={styles.dashboardProgress}>{progress}%</span>
                    <div><strong>{session.client_name}</strong><small>{session.next_action || diagnosticLabels[session.status] || session.status}</small></div>
                    <em>{diagnosticLabels[session.status] || session.status}</em>
                  </button>
                );
              })}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel title="Коммерческие предложения" count={data?.proposals.length ?? 0} action="Все КП" onAction={() => onNavigate("proposals")}>
          {!loading && data?.proposals.length === 0 ? <DashboardEmpty text="Активных коммерческих предложений нет." /> : (
            <div className={styles.dashboardList}>
              {data?.proposals.map((proposal) => (
                <button key={proposal.id} type="button" onClick={() => onNavigate("proposals")}>
                  <span className={styles.dashboardVersion}>v{proposal.version}</span>
                  <div><strong>{proposal.title}</strong><small>{proposal.client_name || "Клиент не выбран"}</small></div>
                  <em>{proposalLabels[proposal.status] || proposal.status}</em>
                </button>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel title="Ожидают проверки" count={data?.knowledgeReview.length ?? 0} action="База знаний" onAction={() => onNavigate("knowledge")}>
          {!loading && data?.knowledgeReview.length === 0 ? <DashboardEmpty text="Все записи базы знаний проверены." /> : (
            <div className={styles.dashboardList}>
              {data?.knowledgeReview.map((item) => (
                <button key={item.id} type="button" onClick={() => onNavigate("knowledge")}>
                  <span className={`${styles.dashboardRisk} ${styles[`dashboardRisk_${item.risk_level}`] || ""}`}>•</span>
                  <div><strong>{item.title}</strong><small>{knowledgeTypeLabels[item.item_type] || item.item_type} · {item.category}</small></div>
                  <em>{item.status === "review" ? "На проверке" : "Черновик"}</em>
                </button>
              ))}
            </div>
          )}
        </DashboardPanel>
      </div>

      <section className={styles.dashboardCoverage}>
        <div className={styles.dashboardPanelHeader}>
          <div><p className={styles.eyebrow}>Наполнение</p><h2>Ниши с наименьшим числом утверждённых записей</h2></div>
          <button type="button" onClick={() => onNavigate("knowledge")}>Пополнить базу</button>
        </div>
        {data?.coverageGaps.map((niche) => (
          <button key={niche.slug} type="button" onClick={() => onOpenKnowledge(niche.slug)}>
            <span>Приоритет {niche.priority}</span><strong>{niche.name}</strong><small>{niche.approved_items} утверждено</small>
          </button>
        ))}
        {(data?.summary.tariffs_review ?? 0) > 0 && <p className={styles.dashboardTariffHint}>Тарифы для проверки: <strong>{data?.summary.tariffs_review}</strong>. Их можно использовать в калькуляторе после ручной сверки.</p>}
      </section>
    </section>
  );
}

function DashboardPanel({ title, count, action, onAction, children }: { title: string; count: number; action: string; onAction: () => void; children: ReactNode }) {
  return (
    <section className={styles.dashboardPanel}>
      <div className={styles.dashboardPanelHeader}>
        <div className={styles.dashboardPanelTitle}><h2>{title}</h2><span>{count}</span></div>
        <button type="button" onClick={onAction}>{action}</button>
      </div>
      {children}
    </section>
  );
}

function DashboardEmpty({ text }: { text: string }) {
  return <div className={styles.dashboardEmpty}><span>✓</span><p>{text}</p></div>;
}
