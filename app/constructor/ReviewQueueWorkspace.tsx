"use client";

import { useEffect, useMemo, useState } from "react";
import type { KnowledgeItem } from "./ConstructorClient";
import type { KnowledgeUpdatePayload } from "./KnowledgeEditor";
import styles from "./constructor.module.css";

type Option = { slug: string; name: string };
type KnowledgeResponse = { items: KnowledgeItem[] };
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

const riskLabels: Record<string, string> = {
  normal: "Обычный",
  elevated: "Повышенный",
  high: "Высокий",
  refusal: "Основание для отказа",
};

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

function approvalIssue(item: KnowledgeItem): string {
  if (!item.prompt_text && !item.short_text && !item.full_text) {
    return "Добавьте формулировку, короткий или подробный текст.";
  }
  if (item.item_type === "question_from_client" && !item.short_text && !item.full_text) {
    return "Для вопроса клиента нужен короткий или подробный ответ.";
  }
  if ((item.risk_level === "high" || item.risk_level === "refusal") && !item.red_flag_text) {
    return "Добавьте объяснение риска перед одобрением.";
  }
  return "";
}

function toPayload(item: KnowledgeItem, status: "approved" | "draft"): KnowledgeUpdatePayload {
  return {
    version: item.version,
    itemType: item.item_type,
    speaker: item.speaker,
    category: item.category,
    title: item.title,
    promptText: item.prompt_text || "",
    shortText: item.short_text || "",
    fullText: item.full_text || "",
    softText: item.soft_text || "",
    firmText: item.firm_text || "",
    clarificationText: item.clarification_text || "",
    nextActionText: item.next_action_text || "",
    avoidText: item.avoid_text || "",
    diagnosticValue: item.diagnostic_value || "",
    redFlagText: item.red_flag_text || "",
    channel: item.channel,
    tone: item.tone,
    requiredLevel: item.required_level,
    riskLevel: item.risk_level,
    status,
    sourceKind: item.source_kind,
    sourceUrl: item.source_url || "",
    nicheSlugs: item.nicheSlugs,
    stageSlugs: item.stageSlugs,
  };
}

function ReviewText({ title, value, warning = false }: { title: string; value: string | null; warning?: boolean }) {
  if (!value) return null;
  return (
    <section className={`${styles.reviewTextBlock} ${warning ? styles.reviewTextWarning : ""}`}>
      <h3>{title}</h3>
      <p>{value}</p>
    </section>
  );
}

export default function ReviewQueueWorkspace({
  niches,
  refreshKey,
  onOpenEditor,
  onSave,
}: {
  niches: Option[];
  refreshKey: number;
  onOpenEditor: (item: KnowledgeItem) => void;
  onSave: (item: KnowledgeItem, payload: KnowledgeUpdatePayload) => Promise<KnowledgeItem>;
}) {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [risk, setRisk] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const frame = window.requestAnimationFrame(() => {
      setLoading(true);
      setError("");
      void fetch("/api/constructor/knowledge?status=review&limit=100&page=1", {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error(await parseError(response));
          return response.json() as Promise<KnowledgeResponse>;
        })
        .then((payload) => setItems(payload.items))
        .catch((reason: unknown) => {
          if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Не удалось загрузить очередь проверки.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      controller.abort();
    };
  }, [refreshKey]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ru");
    return items.filter((item) => {
      if (niche && !item.nicheSlugs.includes(niche)) return false;
      if (risk && item.risk_level !== risk) return false;
      if (!needle) return true;
      return [item.title, item.category, item.prompt_text, item.short_text, item.full_text, ...item.niches, ...item.stages]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("ru").includes(needle));
    });
  }, [items, niche, query, risk]);

  const selected = filteredItems.find((item) => item.id === selectedId) || filteredItems[0] || null;
  const blockedCount = items.filter((item) => approvalIssue(item)).length;

  async function changeStatus(item: KnowledgeItem, status: "approved" | "draft") {
    if (status === "approved" && approvalIssue(item)) {
      onOpenEditor(item);
      return;
    }
    setSavingId(item.id);
    setError("");
    try {
      const saved = await onSave(item, toPayload(item, status));
      setItems((current) => saved.status === "review"
        ? current.map((candidate) => candidate.id === saved.id ? saved : candidate)
        : current.filter((candidate) => candidate.id !== saved.id));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось изменить статус записи.");
    } finally {
      setSavingId("");
    }
  }

  const issue = selected ? approvalIssue(selected) : "";

  return (
    <section className={styles.reviewWorkspace}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>База знаний</p>
          <h1>Проверка материалов</h1>
          <p className={styles.workspaceIntro}>Просматривайте записи по одной. Одобренные материалы становятся доступны в рабочих сценариях.</p>
        </div>
        <div className={styles.reviewTotals}>
          <strong>{items.length}</strong>
          <span>осталось проверить</span>
        </div>
      </header>

      <section className={styles.reviewSummary} aria-label="Состояние очереди">
        <article><span>Готовы к решению</span><strong>{Math.max(0, items.length - blockedCount)}</strong></article>
        <article><span>Нужно дополнить</span><strong>{blockedCount}</strong></article>
        <article><span>Показано сейчас</span><strong>{filteredItems.length}</strong></article>
      </section>

      <section className={styles.reviewFilters} aria-label="Фильтры очереди">
        <label><span>Поиск</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название или текст…" /></label>
        <label><span>Ниша</span><select value={niche} onChange={(event) => setNiche(event.target.value)}><option value="">Все ниши</option>{niches.map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}</select></label>
        <label><span>Риск</span><select value={risk} onChange={(event) => setRisk(event.target.value)}><option value="">Любой риск</option>{Object.entries(riskLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {(query || niche || risk) && <button type="button" onClick={() => { setQuery(""); setNiche(""); setRisk(""); }}>Сбросить</button>}
      </section>

      {error && <div className={styles.errorPanel}>{error}</div>}

      <div className={styles.reviewLayout} aria-busy={loading}>
        <aside className={styles.reviewQueue} aria-label="Материалы на проверке">
          <div className={styles.reviewQueueHeading}><strong>Очередь</strong><span>{filteredItems.length}</span></div>
          {loading && items.length === 0 && <p className={styles.reviewEmpty}>Загружаю материалы…</p>}
          {!loading && filteredItems.length === 0 && <p className={styles.reviewEmpty}>{items.length === 0 ? "Все материалы проверены." : "По выбранным фильтрам ничего не найдено."}</p>}
          {filteredItems.map((item, index) => {
            const blocked = Boolean(approvalIssue(item));
            return (
              <button className={item.id === selected?.id ? styles.reviewQueueActive : ""} type="button" key={item.id} onClick={() => setSelectedId(item.id)}>
                <span className={styles.reviewQueueNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{item.title}</strong><small>{item.niches[0] || "Универсальная"} · {itemTypeLabels[item.item_type] || item.item_type}</small></span>
                <em className={blocked ? styles.reviewNeedsWork : styles.reviewReady}>{blocked ? "Дополнить" : "Готово"}</em>
              </button>
            );
          })}
        </aside>

        <article className={styles.reviewDetail}>
          {!selected ? (
            <div className={styles.reviewEmptyDetail}><strong>{loading ? "Загружаю…" : "Очередь пуста"}</strong><p>{loading ? "Материалы скоро появятся." : "Все записи обработаны или скрыты фильтрами."}</p></div>
          ) : (
            <>
              <div className={styles.reviewDetailHeading}>
                <div><p className={styles.eyebrow}>{itemTypeLabels[selected.item_type] || selected.item_type}</p><h2>{selected.title}</h2></div>
                <span className={`${styles.riskBadge} ${styles[`risk_${selected.risk_level}`] || ""}`}>{riskLabels[selected.risk_level] || selected.risk_level}</span>
              </div>

              <div className={styles.reviewMeta}>
                <span><small>Категория</small>{selected.category}</span>
                <span><small>Ниша</small>{selected.niches.join(", ") || "Универсальная"}</span>
                <span><small>Этап</small>{selected.stages.join(", ") || "Не указан"}</span>
                <span><small>Версия</small>{selected.version}</span>
              </div>

              {issue && <div className={styles.reviewIssue}><strong>Перед одобрением</strong><p>{issue}</p></div>}

              <div className={styles.reviewTexts}>
                <ReviewText title="Формулировка" value={selected.prompt_text} />
                <ReviewText title="Короткий ответ" value={selected.short_text} />
                <ReviewText title="Подробный ответ" value={selected.full_text} />
                <ReviewText title="Мягкая версия" value={selected.soft_text} />
                <ReviewText title="Твёрдая версия" value={selected.firm_text} />
                <ReviewText title="Уточняющий вопрос" value={selected.clarification_text} />
                <ReviewText title="Следующий шаг" value={selected.next_action_text} />
                <ReviewText title="Чего не говорить" value={selected.avoid_text} warning />
                <ReviewText title="Диагностическая ценность" value={selected.diagnostic_value} />
                <ReviewText title="Объяснение риска" value={selected.red_flag_text} warning />
              </div>

              <div className={styles.reviewActions}>
                <button className={styles.reviewDraftButton} type="button" disabled={Boolean(savingId)} onClick={() => void changeStatus(selected, "draft")}>Вернуть в черновики</button>
                <button className={styles.secondaryButton} type="button" disabled={Boolean(savingId)} onClick={() => onOpenEditor(selected)}>Открыть редактор</button>
                <button className={styles.primaryButton} type="button" disabled={Boolean(savingId)} onClick={() => void changeStatus(selected, "approved")}>{savingId === selected.id ? "Сохраняю…" : issue ? "Дополнить и проверить" : "Одобрить материал"}</button>
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
