"use client";

import { useCallback, useEffect, useState } from "react";
import type { KnowledgeItem } from "./ConstructorClient";
import styles from "./constructor.module.css";

type ActivityItem = {
  id: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string | null;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
};

type ActivityResponse = {
  items: ActivityItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

type KnowledgeResponse = {
  items: KnowledgeItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

type ErrorPayload = { error?: { message?: string } };

const itemTypeLabels: Record<string, string> = {
  question_to_client: "Вопрос клиенту",
  question_from_client: "Вопрос клиента",
  answer: "Ответ",
  objection: "Возражение",
  objection_response: "Ответ на возражение",
  clarifying_question: "Уточняющий вопрос",
  first_message: "Первое сообщение",
  follow_up: "Повторное сообщение",
  diagnostic_hint: "Подсказка диагностики",
  audit_check: "Проверка аудита",
  red_flag: "Красный флаг",
  ethical_rule: "Этическое правило",
  proposal_block: "Блок КП",
  package: "Пакет",
  next_action: "Следующий шаг",
  refusal_reason: "Основание для отказа",
};

const actionLabels: Record<string, string> = {
  create: "Создано",
  update: "Изменено",
  approve: "Утверждено",
  archive: "Перенесено в архив",
  import: "Импортировано",
  favorite_add: "Добавлено в избранное",
  favorite_remove: "Удалено из избранного",
};

const entityLabels: Record<string, string> = {
  knowledge_item: "База знаний",
  client: "Клиент",
  client_preparation: "Подготовка",
  diagnostic_session: "Диагностика",
  project_calculation: "Расчёт",
  proposal: "Коммерческое предложение",
  import_batch: "Импорт",
};

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

function primaryCopyText(item: KnowledgeItem): string {
  return item.short_text || item.prompt_text || item.full_text || item.title;
}

function displayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function activitySummary(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  const parts = [
    typeof record.status === "string" ? `статус: ${record.status}` : "",
    typeof record.version === "number" ? `версия ${record.version}` : "",
    typeof record.imported === "number" ? `добавлено: ${record.imported}` : "",
    typeof record.skipped === "number" ? `пропущено: ${record.skipped}` : "",
    typeof record.total === "number" ? `итого: ${record.total.toLocaleString("ru-RU")} ₽` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

export default function FavoritesHistoryWorkspace({
  onOpen,
  onToggleFavorite,
  onToast,
}: {
  onOpen: (item: KnowledgeItem) => void;
  onToggleFavorite: (item: KnowledgeItem) => Promise<boolean>;
  onToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<"favorites" | "history">("favorites");
  const [favorites, setFavorites] = useState<KnowledgeItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPages, setActivityPages] = useState(1);
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFavorites = useCallback(async () => {
    const params = new URLSearchParams({ favorite: "true", status: "all", limit: "100" });
    const response = await fetch(`/api/constructor/knowledge?${params.toString()}`, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error(await parseError(response));
    const payload = (await response.json()) as KnowledgeResponse;
    setFavorites(payload.items);
  }, []);

  const loadActivity = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);
    const response = await fetch(`/api/constructor/activity?${params.toString()}`, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error(await parseError(response));
    const payload = (await response.json()) as ActivityResponse;
    setActivity(payload.items);
    setActivityTotal(payload.pagination.total);
    setActivityPages(payload.pagination.pages);
  }, [action, entity, page]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadFavorites(), loadActivity()]);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить избранное и историю.");
    } finally {
      setLoading(false);
    }
  }, [loadActivity, loadFavorites]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  async function removeFavorite(item: KnowledgeItem) {
    try {
      const isFavorite = await onToggleFavorite(item);
      if (!isFavorite) setFavorites((current) => current.filter((candidate) => candidate.id !== item.id));
      await loadActivity();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось изменить избранное.");
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      onToast("Текст скопирован");
    } catch {
      onToast("Не удалось скопировать текст");
    }
  }

  return (
    <section className={styles.libraryWorkspace}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Рабочая библиотека</p>
          <h1>Избранное и история</h1>
          <span className={styles.dashboardDate}>Быстрый доступ к важным материалам и всем изменениям</span>
        </div>
        <button className={styles.secondaryButton} type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Обновляю…" : "Обновить"}
        </button>
      </header>

      <div className={styles.libraryTabs} role="tablist" aria-label="Рабочая библиотека">
        <button type="button" role="tab" aria-selected={tab === "favorites"} className={tab === "favorites" ? styles.libraryTabActive : ""} onClick={() => setTab("favorites")}>
          Избранное <span>{favorites.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "history"} className={tab === "history" ? styles.libraryTabActive : ""} onClick={() => setTab("history")}>
          История <span>{activityTotal}</span>
        </button>
      </div>

      {error && <div className={styles.errorPanel}>{error}</div>}

      {tab === "favorites" ? (
        <>
          {!loading && favorites.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>В избранном пока ничего нет</strong>
              <p>Нажмите звёздочку на нужной записи в базе знаний — она появится здесь.</p>
            </div>
          ) : (
            <section className={styles.cardGrid} aria-live="polite" aria-busy={loading}>
              {loading && favorites.length === 0 && Array.from({ length: 3 }, (_, index) => <div className={styles.skeleton} key={index} />)}
              {favorites.map((item) => (
                <article className={styles.knowledgeCard} key={item.id}>
                  <div className={styles.cardMeta}>
                    <span className={styles.typeBadge}>{itemTypeLabels[item.item_type] || item.item_type}</span>
                    <button className={`${styles.favoriteButton} ${styles.favoriteButtonActive}`} type="button" onClick={() => void removeFavorite(item)} aria-label="Удалить из избранного" title="Удалить из избранного">★</button>
                  </div>
                  <div className={styles.cardTitleBlock}><span>{item.category}</span><h2>{item.title}</h2></div>
                  {item.prompt_text && <p className={styles.promptText}>{item.prompt_text}</p>}
                  {item.short_text && <p className={styles.answerPreview}>{item.short_text}</p>}
                  <div className={styles.tagRow}>
                    {item.niches.slice(0, 2).map((value) => <span key={value}>{value}</span>)}
                    {item.niches.length === 0 && <span>Универсальная</span>}
                  </div>
                  <div className={styles.cardActions}>
                    <button type="button" onClick={() => void copyText(primaryCopyText(item))}>Копировать</button>
                    <button type="button" onClick={() => onOpen(item)}>Открыть</button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      ) : (
        <section className={styles.activityPanel}>
          <div className={styles.activityFilters}>
            <label><span>Действие</span><select value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }}>
              <option value="">Все действия</option>
              {Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
            <label><span>Раздел</span><select value={entity} onChange={(event) => { setEntity(event.target.value); setPage(1); }}>
              <option value="">Все разделы</option>
              {Object.entries(entityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
          </div>

          {!loading && activity.length === 0 ? (
            <div className={styles.emptyState}><strong>Изменений не найдено</strong><p>Сбросьте фильтры или выполните первое действие в конструкторе.</p></div>
          ) : (
            <div className={styles.activityList} aria-live="polite" aria-busy={loading}>
              {activity.map((item) => {
                const summary = activitySummary(item.newValue);
                return (
                  <article key={item.id}>
                    <span className={styles.activityMark}>●</span>
                    <div>
                      <strong>{actionLabels[item.action] || item.action}</strong>
                      <h2>{item.entityTitle || entityLabels[item.entityType] || "Запись конструктора"}</h2>
                      <p>{entityLabels[item.entityType] || item.entityType}{summary ? ` · ${summary}` : ""}</p>
                    </div>
                    <div className={styles.activityMeta}>
                      <time>{displayDate(item.createdAt)}</time>
                      <span>{item.actorEmail || "Система"}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activityPages > 1 && <div className={styles.pagination}>
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Назад</button>
            <span>{page} / {activityPages}</span>
            <button type="button" disabled={page >= activityPages || loading} onClick={() => setPage((value) => Math.min(activityPages, value + 1))}>Дальше</button>
          </div>}
        </section>
      )}
    </section>
  );
}
