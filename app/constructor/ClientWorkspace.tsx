"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import styles from "./constructor.module.css";

type ClientListItem = {
  id: string;
  name: string;
  accountUrl: string | null;
  contactName: string | null;
  contactChannel: string | null;
  contactValue: string | null;
  crmStatus: string;
  priority: string;
  ethicalStatus: string;
  nextAction: string | null;
  nextContactAt: string | null;
  nicheName: string | null;
  sessionCount: number;
  latestSessionStatus: string | null;
  latestSessionAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClientDetail = ClientListItem & {
  city: string | null;
  geography: string | null;
  businessModel: string | null;
  productSummary: string | null;
  audienceSummary: string | null;
  commercialGoal: string | null;
  desiredAction: string | null;
  salesChannel: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  mainObjection: string | null;
  internalNotes: string | null;
};

type ClientSession = {
  id: string;
  format: string;
  status: string;
  channel: string | null;
  stageName: string | null;
  goal: string | null;
  strongSide: string | null;
  mainBarrier: string | null;
  mainDiagnosis: string | null;
  missing: string[];
  nextAction: string | null;
  ethicalDecision: string;
  selectedItems: number;
  createdAt: string;
  updatedAt: string;
};

type ClientListResponse = {
  items: ClientListItem[];
  total: number;
  statusCounts: Array<{ status: string; total: number }>;
};

type ClientDetailResponse = { client: ClientDetail; sessions: ClientSession[] };
type ErrorPayload = { error?: { message?: string } };

type ClientWorkspaceProps = {
  onToast: (message: string) => void;
};

const statusLabels: Record<string, string> = {
  found: "Найден",
  diagnostic: "Диагностика",
  qualified: "Подходит",
  proposal: "Предложение",
  negotiation: "Переговоры",
  won: "Клиент",
  paused: "Пауза",
  lost: "Не состоялось",
  archived: "Архив",
};

const statusOptions = Object.entries(statusLabels);

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

function displayDate(value: string | null, includeTime = false): string {
  if (!value) return "Не назначено";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("ru-RU", includeTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export default function ClientWorkspace({ onToast }: ClientWorkspaceProps) {
  const [items, setItems] = useState<ClientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<ClientDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [crmStatus, setCrmStatus] = useState("found");
  const [priority, setPriority] = useState("B");
  const [contactName, setContactName] = useState("");
  const [contactChannel, setContactChannel] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextContactAt, setNextContactAt] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (status) params.set("status", status);
      if (priorityFilter) params.set("priority", priorityFilter);
      const response = await fetch(`/api/constructor/clients?${params.toString()}`, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as ClientListResponse;
      setItems(payload.items);
      setTotal(payload.total);
      setSelectedId((current) => payload.items.some((item) => item.id === current) ? current : payload.items[0]?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить клиентов.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, priorityFilter, status]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => cancelled ? undefined : loadClients());
    return () => { cancelled = true; };
  }, [loadClients]);

  const loadDetail = useCallback(async (clientId: string) => {
    if (!clientId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/constructor/clients/${encodeURIComponent(clientId)}`, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as ClientDetailResponse;
      setDetail(payload);
      setCrmStatus(payload.client.crmStatus);
      setPriority(payload.client.priority);
      setContactName(payload.client.contactName || "");
      setContactChannel(payload.client.contactChannel || "");
      setContactValue(payload.client.contactValue || "");
      setNextAction(payload.client.nextAction || "");
      setNextContactAt(toDateTimeLocal(payload.client.nextContactAt));
      setInternalNotes(payload.client.internalNotes || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось открыть карточку клиента.");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => cancelled ? undefined : loadDetail(selectedId));
    return () => { cancelled = true; };
  }, [loadDetail, selectedId]);

  async function saveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/constructor/clients/${encodeURIComponent(selectedId)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crmStatus,
          priority,
          contactName,
          contactChannel,
          contactValue,
          nextAction,
          nextContactAt: nextContactAt ? new Date(nextContactAt).toISOString() : "",
          internalNotes,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as ClientDetailResponse;
      setDetail(payload);
      await loadClients();
      onToast("Карточка клиента сохранена");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить карточку.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.clientWorkspace}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Клиенты</p>
          <h1>Карточки и история работы</h1>
          <p className={styles.clientIntro}>Все данные из подготовок и диагностик собраны в одном месте.</p>
        </div>
        <div className={styles.clientTotal}><strong>{total}</strong><span>карточек</span></div>
      </header>

      {error && <div className={styles.errorPanel}>{error}</div>}

      <section className={styles.clientLayout}>
        <aside className={styles.clientListPanel}>
          <div className={styles.clientFilters}>
            <label className={styles.clientSearch}>
              <span>Поиск</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя, контакт или задача" />
            </label>
            <label>
              <span>Статус</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">Все</option>
                {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>Приоритет</span>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="">Все</option>
                <option value="A">A — высокий</option>
                <option value="B">B — средний</option>
                <option value="C">C — низкий</option>
              </select>
            </label>
          </div>

          <div className={styles.clientList} aria-live="polite" aria-busy={loading}>
            {loading && items.length === 0 && Array.from({ length: 4 }, (_, index) => <div className={styles.clientListSkeleton} key={index} />)}
            {!loading && items.length === 0 && (
              <div className={styles.clientEmpty}>
                <strong>Клиентов пока нет</strong>
                <p>Создайте подготовку или диагностику — карточка появится здесь автоматически.</p>
              </div>
            )}
            {items.map((item) => (
              <button className={selectedId === item.id ? styles.clientListActive : styles.clientListItem} key={item.id} type="button" onClick={() => setSelectedId(item.id)}>
                <span className={styles.clientListHeading}><strong>{item.name}</strong><b data-priority={item.priority}>{item.priority}</b></span>
                <span>{item.nicheName || "Ниша не указана"}</span>
                <span className={styles.clientListMeta}>
                  <em>{statusLabels[item.crmStatus] || item.crmStatus}</em>
                  <small>{item.sessionCount} диагностик</small>
                </span>
                {item.nextAction && <p>{item.nextAction}</p>}
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.clientDetailPanel}>
          {detailLoading && <div className={styles.clientDetailLoading}>Открываю карточку…</div>}
          {!detailLoading && !detail && items.length > 0 && <div className={styles.clientDetailLoading}>Выберите клиента слева.</div>}
          {!detailLoading && detail && (
            <>
              <div className={styles.clientDetailHeader}>
                <div>
                  <div className={styles.tagRow}>
                    <span>{detail.client.nicheName || "Без ниши"}</span>
                    <span>{statusLabels[detail.client.crmStatus] || detail.client.crmStatus}</span>
                  </div>
                  <h2>{detail.client.name}</h2>
                  <p>{detail.client.accountUrl || detail.client.contactValue || "Контакт ещё не указан"}</p>
                </div>
                <div className={styles.clientUpdated}><span>Обновлено</span><strong>{displayDate(detail.client.updatedAt, true)}</strong></div>
              </div>

              <div className={styles.clientContextGrid}>
                <article><span>Продукт</span><p>{detail.client.productSummary || "Пока не описан"}</p></article>
                <article><span>Аудитория</span><p>{detail.client.audienceSummary || "Пока не описана"}</p></article>
                <article><span>Цель</span><p>{detail.client.commercialGoal || detail.client.desiredAction || "Пока не зафиксирована"}</p></article>
              </div>

              <form className={styles.clientEditForm} onSubmit={saveClient}>
                <div className={styles.panelHeading}>
                  <div><span>Рабочая карточка</span><h2>Следующий контакт</h2></div>
                  <button className={styles.primaryButton} type="submit" disabled={saving}>{saving ? "Сохраняю…" : "Сохранить"}</button>
                </div>
                <div className={styles.clientFormGrid}>
                  <label><span>Статус</span><select value={crmStatus} onChange={(event) => setCrmStatus(event.target.value)}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label><span>Приоритет</span><select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="A">A — высокий</option><option value="B">B — средний</option><option value="C">C — низкий</option></select></label>
                  <label><span>Имя контакта</span><input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Как обращаться" /></label>
                  <label><span>Канал</span><input value={contactChannel} onChange={(event) => setContactChannel(event.target.value)} placeholder="Telegram, WhatsApp, Email" /></label>
                  <label className={styles.clientWideField}><span>Контакт</span><input value={contactValue} onChange={(event) => setContactValue(event.target.value)} placeholder="@username, телефон или email" /></label>
                  <label className={styles.clientWideField}><span>Следующий шаг</span><textarea value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Что сделать и какой результат нужен" rows={3} /></label>
                  <label><span>Дата контакта</span><input type="datetime-local" value={nextContactAt} onChange={(event) => setNextContactAt(event.target.value)} /></label>
                  <label className={styles.clientWideField}><span>Внутренние заметки</span><textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} placeholder="Важные детали для следующего разговора" rows={4} /></label>
                </div>
              </form>

              <section className={styles.clientHistory}>
                <div className={styles.panelHeading}><div><span>История</span><h2>Подготовки и диагностики</h2></div><strong>{detail.sessions.length}</strong></div>
                {detail.sessions.length === 0 ? (
                  <div className={styles.clientHistoryEmpty}>Сохранённых диагностик пока нет.</div>
                ) : detail.sessions.map((session) => (
                  <article key={session.id}>
                    <div className={styles.clientHistoryHeader}>
                      <div><strong>{session.format === "full" ? "Полная диагностика" : "Экспресс-диагностика"}</strong><span>{session.stageName || "Этап не указан"} · {displayDate(session.createdAt, true)}</span></div>
                      <em>{session.status}</em>
                    </div>
                    {session.mainDiagnosis && <div><span>Диагноз</span><p>{session.mainDiagnosis}</p></div>}
                    {session.strongSide && <div><span>Сильная сторона</span><p>{session.strongSide}</p></div>}
                    {session.mainBarrier && <div><span>Главный барьер</span><p>{session.mainBarrier}</p></div>}
                    {session.missing.length > 0 && <div><span>Нужно уточнить</span><p>{session.missing.join(" · ")}</p></div>}
                    {session.nextAction && <div className={styles.clientHistoryNext}><span>Следующий шаг</span><p>{session.nextAction}</p></div>}
                  </article>
                ))}
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
