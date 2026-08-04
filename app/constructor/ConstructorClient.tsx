"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./constructor.module.css";

type Niche = { slug: string; name: string; priority: string };
type Stage = { slug: string; name: string; sort_order: number };

type BootstrapData = {
  identity: { email: string };
  niches: Niche[];
  stages: Stage[];
  counts: {
    total: number;
    approved: number;
    review: number;
    high_risk: number;
  };
};

type KnowledgeItem = {
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
  niches: string[];
  nicheSlugs: string[];
  stages: string[];
  stageSlugs: string[];
};

type KnowledgeResponse = {
  items: KnowledgeItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

type ErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

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
  refusal: "Отказ",
};

const statusLabels: Record<string, string> = {
  approved: "Утверждено",
  review: "На проверке",
  draft: "Черновик",
  archived: "Архив",
};

const navigation = [
  ["База знаний", "knowledge", true],
  ["Подготовиться к клиенту", "prepare", false],
  ["Клиент задал вопрос", "answer", false],
  ["Диагностика", "diagnostic", false],
  ["Клиенты", "clients", false],
  ["Калькулятор", "pricing", false],
  ["Коммерческие предложения", "proposals", false],
] as const;

function getErrorMessage(payload: ErrorPayload | null, fallback: string): string {
  return payload?.error?.message || fallback;
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return getErrorMessage(payload, `Ошибка ${response.status}`);
  } catch {
    return `Ошибка ${response.status}`;
  }
}

function primaryCopyText(item: KnowledgeItem): string {
  return item.short_text || item.prompt_text || item.full_text || item.title;
}

function displayDate(value: string | null): string {
  if (!value) return "Не проверено";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("ru-RU").format(date);
}

export default function ConstructorClient() {
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [pagination, setPagination] = useState<KnowledgeResponse["pagination"]>({ page: 1, limit: 30, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [stage, setStage] = useState("");
  const [itemType, setItemType] = useState("");
  const [risk, setRisk] = useState("");
  const [status, setStatus] = useState("approved");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<KnowledgeItem | null>(null);
  const [toast, setToast] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("question_to_client");
  const [newCategory, setNewCategory] = useState("business");
  const [newPrompt, setNewPrompt] = useState("");
  const [newShort, setNewShort] = useState("");
  const [newNiche, setNewNiche] = useState("");
  const [newStage, setNewStage] = useState("");
  const [newRisk, setNewRisk] = useState("normal");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, niche, stage, itemType, risk, status]);

  const loadBootstrap = useCallback(async () => {
    const response = await fetch("/api/constructor/bootstrap", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await parseError(response));
    setBootstrap((await response.json()) as BootstrapData);
  }, []);

  const loadItems = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "30",
      status,
    });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (niche) params.set("niche", niche);
    if (stage) params.set("stage", stage);
    if (itemType) params.set("type", itemType);
    if (risk) params.set("risk", risk);

    const response = await fetch(`/api/constructor/knowledge?${params.toString()}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await parseError(response));
    const payload = (await response.json()) as KnowledgeResponse;
    setItems(payload.items);
    setPagination(payload.pagination);
  }, [debouncedQuery, itemType, niche, page, risk, stage, status]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([bootstrap ? Promise.resolve() : loadBootstrap(), loadItems()])
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Не удалось загрузить конструктор.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bootstrap, loadBootstrap, loadItems]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const categories = useMemo(() => {
    const values = new Set(items.map((item) => item.category).filter(Boolean));
    return [...values].sort((a, b) => a.localeCompare(b, "ru"));
  }, [items]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Текст скопирован");
    } catch {
      setToast("Не удалось скопировать текст");
    }
  }

  async function createKnowledgeItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/constructor/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: newTitle,
          itemType: newType,
          category: newCategory,
          promptText: newPrompt,
          shortText: newShort,
          nicheSlugs: newNiche ? [newNiche] : [],
          stageSlugs: newStage ? [newStage] : [],
          riskLevel: newRisk,
          speaker: newType === "question_from_client" || newType === "objection" ? "client" : "creator",
        }),
      });

      if (!response.ok) throw new Error(await parseError(response));

      setNewTitle("");
      setNewPrompt("");
      setNewShort("");
      setNewNiche("");
      setNewStage("");
      setNewRisk("normal");
      setShowAdd(false);
      setStatus("all");
      setPage(1);
      setToast("Черновик добавлен");
      await loadBootstrap();
      await loadItems();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить запись.");
    } finally {
      setSaving(false);
    }
  }

  const hasFilters = Boolean(query || niche || stage || itemType || risk || status !== "approved");

  function resetFilters() {
    setQuery("");
    setNiche("");
    setStage("");
    setItemType("");
    setRisk("");
    setStatus("approved");
    setPage(1);
  }

  return (
    <main className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>JS</div>
          <div>
            <strong>Клиентский конструктор</strong>
            <span>закрытая рабочая система</span>
          </div>
        </div>

        <nav className={styles.navigation} aria-label="Разделы конструктора">
          {navigation.map(([label, key, active]) => (
            <button className={active ? styles.navActive : styles.navDisabled} key={key} type="button" disabled={!active}>
              <span>{label}</span>
              {!active && <small>скоро</small>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <span>Вход подтверждён</span>
          <strong>{bootstrap?.identity.email || "Cloudflare Access"}</strong>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>База знаний</p>
            <h1>Вопросы, ответы и сценарии</h1>
          </div>
          <button className={styles.primaryButton} type="button" onClick={() => setShowAdd(true)}>
            + Добавить запись
          </button>
        </header>

        <section className={styles.statGrid} aria-label="Состояние базы">
          <article>
            <span>Всего записей</span>
            <strong>{bootstrap?.counts.total ?? "—"}</strong>
          </article>
          <article>
            <span>Утверждено</span>
            <strong>{bootstrap?.counts.approved ?? "—"}</strong>
          </article>
          <article>
            <span>На проверке</span>
            <strong>{bootstrap?.counts.review ?? "—"}</strong>
          </article>
          <article>
            <span>Высокий риск</span>
            <strong>{bootstrap?.counts.high_risk ?? "—"}</strong>
          </article>
        </section>

        <section className={styles.filters} aria-label="Фильтры базы знаний">
          <label className={styles.searchField}>
            <span>Поиск</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: дорого, правки, упаковка…" />
          </label>

          <label>
            <span>Ниша</span>
            <select value={niche} onChange={(event) => setNiche(event.target.value)}>
              <option value="">Все ниши</option>
              {bootstrap?.niches.map((option) => (
                <option key={option.slug} value={option.slug}>{option.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Этап</span>
            <select value={stage} onChange={(event) => setStage(event.target.value)}>
              <option value="">Все этапы</option>
              {bootstrap?.stages.map((option) => (
                <option key={option.slug} value={option.slug}>{option.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Тип записи</span>
            <select value={itemType} onChange={(event) => setItemType(event.target.value)}>
              <option value="">Все типы</option>
              {Object.entries(itemTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Риск</span>
            <select value={risk} onChange={(event) => setRisk(event.target.value)}>
              <option value="">Любой риск</option>
              {Object.entries(riskLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Статус</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="approved">Утверждено</option>
              <option value="review">На проверке</option>
              <option value="draft">Черновики</option>
              <option value="all">Все активные</option>
            </select>
          </label>

          {hasFilters && (
            <button className={styles.resetButton} type="button" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          )}
        </section>

        {categories.length > 0 && (
          <div className={styles.categoryHint}>Найденные категории: {categories.slice(0, 8).join(" · ")}</div>
        )}

        {error && <div className={styles.errorPanel}>{error}</div>}

        <div className={styles.resultsHeader}>
          <div>
            <strong>{pagination.total}</strong>
            <span> записей найдено</span>
          </div>
          <span>Страница {pagination.page} из {pagination.pages}</span>
        </div>

        <section className={styles.cardGrid} aria-live="polite" aria-busy={loading}>
          {loading && items.length === 0 && Array.from({ length: 6 }, (_, index) => <div className={styles.skeleton} key={index} />)}

          {!loading && !error && items.length === 0 && (
            <div className={styles.emptyState}>
              <strong>Подходящих записей пока нет</strong>
              <p>Измените фильтры или добавьте новый вопрос в черновики.</p>
            </div>
          )}

          {items.map((item) => (
            <article className={styles.knowledgeCard} key={item.id}>
              <div className={styles.cardMeta}>
                <span className={styles.typeBadge}>{itemTypeLabels[item.item_type] || item.item_type}</span>
                <span className={`${styles.riskBadge} ${styles[`risk_${item.risk_level}`] || ""}`}>
                  {riskLabels[item.risk_level] || item.risk_level}
                </span>
              </div>

              <div className={styles.cardTitleBlock}>
                <span>{item.category}</span>
                <h2>{item.title}</h2>
              </div>

              {item.prompt_text && <p className={styles.promptText}>{item.prompt_text}</p>}
              {item.short_text && <p className={styles.answerPreview}>{item.short_text}</p>}

              <div className={styles.tagRow}>
                {item.niches.slice(0, 2).map((value) => <span key={value}>{value}</span>)}
                {item.stages.slice(0, 1).map((value) => <span key={value}>{value}</span>)}
                {item.niches.length === 0 && <span>Универсальная</span>}
              </div>

              <div className={styles.cardActions}>
                <button type="button" onClick={() => copyText(primaryCopyText(item))}>Копировать</button>
                <button type="button" onClick={() => setSelected(item)}>Открыть</button>
              </div>
            </article>
          ))}
        </section>

        {pagination.pages > 1 && (
          <div className={styles.pagination}>
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Назад</button>
            <span>{page} / {pagination.pages}</span>
            <button type="button" disabled={page >= pagination.pages || loading} onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))}>Дальше</button>
          </div>
        )}
      </section>

      {selected && (
        <div className={styles.drawerBackdrop} role="presentation" onMouseDown={() => setSelected(null)}>
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={selected.title} onMouseDown={(event) => event.stopPropagation()}>
            <button className={styles.closeButton} type="button" onClick={() => setSelected(null)} aria-label="Закрыть">×</button>
            <p className={styles.eyebrow}>{itemTypeLabels[selected.item_type] || selected.item_type}</p>
            <h2>{selected.title}</h2>

            <dl className={styles.detailMeta}>
              <div><dt>Категория</dt><dd>{selected.category}</dd></div>
              <div><dt>Статус</dt><dd>{statusLabels[selected.status] || selected.status}</dd></div>
              <div><dt>Риск</dt><dd>{riskLabels[selected.risk_level] || selected.risk_level}</dd></div>
              <div><dt>Проверено</dt><dd>{displayDate(selected.reviewed_at)}</dd></div>
            </dl>

            {selected.prompt_text && <DetailBlock title="Формулировка" text={selected.prompt_text} onCopy={copyText} />}
            {selected.short_text && <DetailBlock title="Короткий ответ" text={selected.short_text} onCopy={copyText} />}
            {selected.full_text && <DetailBlock title="Подробный ответ" text={selected.full_text} onCopy={copyText} />}
            {selected.soft_text && <DetailBlock title="Мягкая версия" text={selected.soft_text} onCopy={copyText} />}
            {selected.firm_text && <DetailBlock title="Твёрдая версия" text={selected.firm_text} onCopy={copyText} />}
            {selected.clarification_text && <DetailBlock title="Уточняющий вопрос" text={selected.clarification_text} onCopy={copyText} />}
            {selected.next_action_text && <DetailBlock title="Следующий шаг" text={selected.next_action_text} onCopy={copyText} />}
            {selected.avoid_text && <DetailBlock title="Чего не говорить" text={selected.avoid_text} warning onCopy={copyText} />}
            {selected.red_flag_text && <DetailBlock title="Красный флаг" text={selected.red_flag_text} warning onCopy={copyText} />}

            <div className={styles.drawerTags}>
              {[...selected.niches, ...selected.stages].map((value) => <span key={value}>{value}</span>)}
            </div>
          </aside>
        </div>
      )}

      {showAdd && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => !saving && setShowAdd(false)}>
          <form className={styles.modal} onSubmit={createKnowledgeItem} onMouseDown={(event) => event.stopPropagation()}>
            <button className={styles.closeButton} type="button" onClick={() => setShowAdd(false)} aria-label="Закрыть">×</button>
            <p className={styles.eyebrow}>Новая запись</p>
            <h2>Добавить в черновики</h2>

            <label>
              <span>Внутреннее название *</span>
              <input required value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Например: Клиент просит гарантию продаж" />
            </label>

            <div className={styles.formGrid}>
              <label>
                <span>Тип *</span>
                <select value={newType} onChange={(event) => setNewType(event.target.value)}>
                  {Object.entries(itemTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                <span>Категория *</span>
                <input required value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="стоимость" />
              </label>
            </div>

            <label>
              <span>Вопрос или формулировка</span>
              <textarea value={newPrompt} onChange={(event) => setNewPrompt(event.target.value)} rows={3} />
            </label>

            <label>
              <span>Короткий ответ</span>
              <textarea value={newShort} onChange={(event) => setNewShort(event.target.value)} rows={4} />
            </label>

            <div className={styles.formGrid}>
              <label>
                <span>Ниша</span>
                <select value={newNiche} onChange={(event) => setNewNiche(event.target.value)}>
                  <option value="">Универсальная</option>
                  {bootstrap?.niches.map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}
                </select>
              </label>
              <label>
                <span>Этап</span>
                <select value={newStage} onChange={(event) => setNewStage(event.target.value)}>
                  <option value="">Без этапа</option>
                  {bootstrap?.stages.map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}
                </select>
              </label>
            </div>

            <label>
              <span>Уровень риска</span>
              <select value={newRisk} onChange={(event) => setNewRisk(event.target.value)}>
                {Object.entries(riskLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} type="button" onClick={() => setShowAdd(false)} disabled={saving}>Отмена</button>
              <button className={styles.primaryButton} type="submit" disabled={saving}>{saving ? "Сохраняю…" : "Сохранить черновик"}</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </main>
  );
}

function DetailBlock({ title, text, warning = false, onCopy }: { title: string; text: string; warning?: boolean; onCopy: (text: string) => void }) {
  return (
    <section className={`${styles.detailBlock} ${warning ? styles.detailWarning : ""}`}>
      <div>
        <h3>{title}</h3>
        <button type="button" onClick={() => onCopy(text)}>Копировать</button>
      </div>
      <p>{text}</p>
    </section>
  );
}
