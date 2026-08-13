"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./constructor.module.css";

type FollowUpKind = "client" | "proposal";
type FollowUpBucket = "overdue" | "today" | "week" | "later";

type FollowUpItem = {
  kind: FollowUpKind;
  id: string;
  title: string;
  clientName: string;
  actionText: string;
  dueAt: string;
  bucket: FollowUpBucket;
  priority: string;
  status: string;
  contactName: string | null;
  contactChannel: string | null;
  contactValue: string | null;
};

type FollowUpResponse = {
  generatedAt: string;
  summary: Record<FollowUpBucket | "total", number>;
  items: FollowUpItem[];
};

type ErrorPayload = { error?: { message?: string } };

const bucketLabels: Record<FollowUpBucket, string> = {
  overdue: "Просрочено",
  today: "Сегодня",
  week: "Ближайшие 7 дней",
  later: "Позже",
};

const statusLabels: Record<string, string> = {
  found: "Найден",
  diagnostic: "Диагностика",
  qualified: "Подходит",
  proposal: "Предложение",
  negotiation: "Переговоры",
  won: "Клиент",
  draft: "Черновик",
  needs_data: "Нужны данные",
  internal_review: "На проверке",
  ready_to_send: "Готово к отправке",
  sent: "Отправлено",
  discussion: "Обсуждение",
  approved: "Утверждено",
};

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

function displayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function movedDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export default function FollowUpWorkspace({ onToast }: { onToast: (message: string) => void }) {
  const [data, setData] = useState<FollowUpResponse | null>(null);
  const [bucket, setBucket] = useState<FollowUpBucket | "all">("all");
  const [kind, setKind] = useState<FollowUpKind | "all">("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/constructor/follow-ups", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as FollowUpResponse;
      setData(payload);
      setDrafts(Object.fromEntries(payload.items.map((item) => [`${item.kind}:${item.id}`, toDateTimeLocal(item.dueAt)])));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить план контактов.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  const visibleItems = useMemo(() => (data?.items ?? []).filter((item) => {
    if (bucket !== "all" && item.bucket !== bucket) return false;
    if (kind !== "all" && item.kind !== kind) return false;
    return true;
  }), [bucket, data?.items, kind]);

  async function updateReminder(item: FollowUpItem, action: "complete" | "reschedule", nextAt?: string) {
    const itemKey = `${item.kind}:${item.id}`;
    setSavingId(itemKey);
    setError("");
    try {
      const response = await fetch(`/api/constructor/follow-ups/${item.kind}/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action, nextAt }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      onToast(action === "complete" ? "Контакт отмечен выполненным" : "Дата контакта обновлена");
      await load();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось обновить напоминание.");
    } finally {
      setSavingId("");
    }
  }

  async function copyContact(item: FollowUpItem) {
    if (!item.contactValue) return;
    try {
      await navigator.clipboard.writeText(item.contactValue);
      onToast("Контакт скопирован");
    } catch {
      onToast("Не удалось скопировать контакт");
    }
  }

  const summary = data?.summary ?? { total: 0, overdue: 0, today: 0, week: 0, later: 0 };

  return (
    <section className={styles.followUpWorkspace}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Работа с клиентами</p>
          <h1>План контактов</h1>
          <span className={styles.dashboardDate}>Кому написать, что уточнить и когда вернуться к предложению</span>
        </div>
        <button className={styles.secondaryButton} type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Обновляю…" : "Обновить"}
        </button>
      </header>

      <section className={styles.followUpStats} aria-label="Сводка контактов">
        {([
          ["all", "Все", summary.total],
          ["overdue", "Просрочено", summary.overdue],
          ["today", "Сегодня", summary.today],
          ["week", "7 дней", summary.week],
          ["later", "Позже", summary.later],
        ] as const).map(([value, label, count]) => (
          <button key={value} type="button" className={bucket === value ? styles.followUpStatActive : ""} onClick={() => setBucket(value)}>
            <span>{label}</span><strong>{count}</strong>
          </button>
        ))}
      </section>

      <div className={styles.followUpToolbar}>
        <div role="group" aria-label="Источник напоминания">
          {(["all", "client", "proposal"] as const).map((value) => (
            <button key={value} type="button" className={kind === value ? styles.followUpFilterActive : ""} onClick={() => setKind(value)}>
              {value === "all" ? "Все" : value === "client" ? "Клиенты" : "Коммерческие предложения"}
            </button>
          ))}
        </div>
        <span>Показано: {visibleItems.length}</span>
      </div>

      {error && <div className={styles.errorPanel}>{error}</div>}

      {!loading && visibleItems.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>{summary.total === 0 ? "Контакты пока не запланированы" : "В этой группе напоминаний нет"}</strong>
          <p>{summary.total === 0 ? "Назначьте следующий контакт в карточке клиента или дату ответа в коммерческом предложении." : "Выберите другой период или источник."}</p>
        </div>
      ) : (
        <div className={styles.followUpList} aria-live="polite" aria-busy={loading}>
          {loading && !data && Array.from({ length: 4 }, (_, index) => <div className={styles.skeleton} key={index} />)}
          {visibleItems.map((item) => {
            const itemKey = `${item.kind}:${item.id}`;
            const saving = savingId === itemKey;
            return (
              <article className={`${styles.followUpCard} ${styles[`followUpCard_${item.bucket}`] || ""}`} key={itemKey}>
                <div className={styles.followUpCardMain}>
                  <div className={styles.followUpBadges}>
                    <span>{item.kind === "client" ? "Клиент" : "КП"}</span>
                    <span>{bucketLabels[item.bucket]}</span>
                    <span>Приоритет {item.priority}</span>
                  </div>
                  <h2>{item.title}</h2>
                  {item.kind === "proposal" && item.clientName !== item.title && <p className={styles.followUpClient}>{item.clientName}</p>}
                  <p className={styles.followUpAction}>{item.actionText}</p>
                  <div className={styles.followUpDetails}>
                    <time>{displayDate(item.dueAt)}</time>
                    <span>{statusLabels[item.status] || item.status}</span>
                    {item.contactValue && <button type="button" onClick={() => void copyContact(item)}>{item.contactChannel || "Контакт"}: {item.contactValue}</button>}
                  </div>
                </div>

                <div className={styles.followUpCardActions}>
                  <button type="button" disabled={saving} onClick={() => void updateReminder(item, "reschedule", movedDate(1))}>Завтра</button>
                  <button type="button" disabled={saving} onClick={() => void updateReminder(item, "reschedule", movedDate(7))}>Через неделю</button>
                  <label>
                    <span>Своя дата</span>
                    <input type="datetime-local" value={drafts[itemKey] || ""} onChange={(event) => setDrafts((current) => ({ ...current, [itemKey]: event.target.value }))} />
                  </label>
                  <button type="button" disabled={saving || !drafts[itemKey]} onClick={() => void updateReminder(item, "reschedule", new Date(drafts[itemKey]).toISOString())}>Перенести</button>
                  <button className={styles.followUpComplete} type="button" disabled={saving} onClick={() => void updateReminder(item, "complete")}>
                    {saving ? "Сохраняю…" : "Выполнено"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
