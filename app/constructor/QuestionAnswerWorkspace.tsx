"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "./constructor.module.css";

type Niche = { slug: string; name: string; priority: string };

type AnswerItem = {
  id: string;
  itemType: string;
  category: string;
  title: string;
  question: string | null;
  shortText: string | null;
  fullText: string | null;
  softText: string | null;
  firmText: string | null;
  clarificationText: string | null;
  nextActionText: string | null;
  avoidText: string | null;
  redFlagText: string | null;
  riskLevel: string;
  niches: string[];
  score: number;
};

type MessageAnalysis = {
  contactName: string | null;
  brandName: string | null;
  nicheSlug: string | null;
  nicheName: string | null;
  product: string | null;
  launchTiming: string | null;
  stage: string;
  intents: string[];
  intentLabels: string[];
  summary: string;
  signals: Array<{ label: string; value: string }>;
};

type MessageDraft = {
  readyText: string;
  clarifyingQuestions: string[];
  recommendations: string[];
  pricing: { configured: boolean; title: string; text: string };
  nextAction: string;
  sourceQuestionIds: string[];
};

type AnswerResponse = {
  query: string;
  recognizedCategory: string | null;
  analysis: MessageAnalysis | null;
  draft: MessageDraft | null;
  items: AnswerItem[];
};

type ErrorPayload = { error?: { message?: string } };

type QuestionAnswerWorkspaceProps = {
  bootstrap: { niches: Niche[] } | null;
  onToast: (message: string) => void;
};

const quickCategories = [
  ["price", "Стоимость"],
  ["timeline", "Сроки"],
  ["revisions", "Правки"],
  ["ai", "AI"],
  ["guarantees", "Гарантии"],
  ["rights", "Права"],
  ["privacy", "Конфиденциальность"],
  ["sources", "Исходники"],
  ["quality", "Результат"],
  ["trust", "Опыт и доверие"],
] as const;

const categoryLabels: Record<string, string> = Object.fromEntries(quickCategories);

const riskLabels: Record<string, string> = {
  normal: "Обычный риск",
  elevated: "Нужна внимательность",
  high: "Высокий риск",
  refusal: "Основание для отказа",
};

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

export default function QuestionAnswerWorkspace({ bootstrap, onToast }: QuestionAnswerWorkspaceProps) {
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [niche, setNiche] = useState("");
  const [channel, setChannel] = useState("any");
  const [result, setResult] = useState<AnswerResponse | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => result?.items.find((item) => item.id === selectedId) || result?.items[0] || null,
    [result, selectedId],
  );

  async function copyText(text: string, successMessage = "Текст скопирован") {
    try {
      await navigator.clipboard.writeText(text);
      onToast(successMessage);
    } catch {
      onToast("Не удалось скопировать текст");
    }
  }

  async function searchAnswers(event?: FormEvent<HTMLFormElement>, categoryOverride?: string) {
    event?.preventDefault();
    const nextCategory = categoryOverride ?? category;
    if (!question.trim() && !nextCategory) {
      setError("Вставьте сообщение клиента целиком или выберите тему.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/constructor/answers", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question.trim(), category: nextCategory, niche, channel }),
      });
      if (!response.ok) throw new Error(await responseError(response));

      const payload = (await response.json()) as AnswerResponse;
      setResult(payload);
      setSelectedId(payload.items[0]?.id || "");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось разобрать сообщение клиента.");
    } finally {
      setLoading(false);
    }
  }

  function chooseCategory(value: string) {
    setCategory(value);
    void searchAnswers(undefined, value);
  }

  return (
    <>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Клиент задал вопрос</p>
          <h1>Разобрать сообщение и подготовить ответ</h1>
        </div>
        {result?.draft?.readyText && (
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => copyText(result.draft?.readyText || "", "Готовый ответ скопирован")}
          >
            Скопировать готовый ответ
          </button>
        )}
      </header>

      <div className={styles.answerWorkspace}>
        <section className={styles.answerSearchPanel}>
          <div className={styles.panelHeading}>
            <span>01</span>
            <div>
              <h2>Сообщение клиента целиком</h2>
              <p>Вставьте обращение без сокращений. Конструктор выделит контекст, вопросы и следующий шаг.</p>
            </div>
          </div>

          <form className={styles.answerSearchForm} onSubmit={(event) => searchAnswers(event)}>
            <label>
              <span>Входящее сообщение</span>
              <textarea
                rows={9}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Например: Ассаляму алейкум. У нас бренд косметики, через месяц запускаем сыворотку. Пока не понимаем, нужны фото или ролики. Как Вы работаете и сколько это стоит?"
              />
            </label>

            <div className={styles.formGrid}>
              <label>
                <span>Ниша, если известна</span>
                <select value={niche} onChange={(event) => setNiche(event.target.value)}>
                  <option value="">Определить автоматически</option>
                  {bootstrap?.niches.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                </select>
              </label>
              <label>
                <span>Канал</span>
                <select value={channel} onChange={(event) => setChannel(event.target.value)}>
                  <option value="any">Не указан</option>
                  <option value="instagram">Instagram</option>
                  <option value="telegram">Telegram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="call">Созвон</option>
                </select>
              </label>
            </div>

            {error && <div className={styles.errorPanel}>{error}</div>}

            <button className={styles.primaryButton} type="submit" disabled={loading || !bootstrap}>
              {loading ? "Разбираю сообщение…" : "Разобрать и подготовить ответ"}
            </button>

            <div className={styles.answerLibraryShortcut}>
              <span>Или открыть готовые материалы по одной теме</span>
              <div className={styles.quickFilters} aria-label="Быстрые темы ответа">
                {quickCategories.map(([value, label]) => (
                  <button
                    className={category === value ? styles.quickFilterActive : ""}
                    key={value}
                    type="button"
                    onClick={() => chooseCategory(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {result?.analysis && (
            <section className={styles.answerAnalysis} aria-live="polite">
              <div className={styles.answerAnalysisHeading}>
                <span>Что распознано</span>
                <strong>{result.analysis.intentLabels.length}</strong>
              </div>
              <p>{result.analysis.summary}</p>
              <div className={styles.answerSignalGrid}>
                {result.analysis.signals.map((signal) => (
                  <div key={`${signal.label}-${signal.value}`}>
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                  </div>
                ))}
              </div>
              <div className={styles.answerIntentList}>
                {result.analysis.intentLabels.map((intent) => <span key={intent}>{intent}</span>)}
              </div>
            </section>
          )}

          {result && result.items.length > 0 && (
            <details className={styles.answerSourceLibrary} open={!result.draft}>
              <summary>Материалы базы, использованные как опора · {result.items.length}</summary>
              <div className={styles.answerMatchList}>
                {result.items.map((item) => (
                  <button
                    className={selected?.id === item.id ? styles.answerMatchActive : ""}
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span>{categoryLabels[item.category] || item.category}</span>
                    <strong>{item.title}</strong>
                    {item.question && <small>{item.question}</small>}
                  </button>
                ))}
              </div>
            </details>
          )}
        </section>

        <section className={styles.answerResultPanel} aria-live="polite" aria-busy={loading}>
          <div className={styles.panelHeading}>
            <span>02</span>
            <div>
              <h2>Разбор и готовый ответ</h2>
              <p>Проверьте факты и стоимость перед отправкой клиенту.</p>
            </div>
          </div>

          {!result?.draft && !selected && (
            <div className={styles.preparationPlaceholder}>
              <strong>Здесь появится единый ответ</strong>
              <p>Конструктор не просто найдёт похожую карточку, а соберёт весь диалог в понятный следующий шаг.</p>
            </div>
          )}

          {result?.draft && (
            <div className={styles.answerComposer}>
              <section className={styles.answerReady}>
                <div>
                  <div>
                    <span>Можно отправлять после проверки</span>
                    <h2>Готовый ответ клиенту</h2>
                  </div>
                  <button type="button" onClick={() => copyText(result.draft?.readyText || "", "Готовый ответ скопирован")}>Копировать</button>
                </div>
                <p>{result.draft.readyText}</p>
              </section>

              <div className={styles.answerSectionsGrid}>
                <section className={styles.answerInfoCard}>
                  <span>Что уточнить</span>
                  <ol>
                    {result.draft.clarifyingQuestions.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </section>

                <section className={styles.answerInfoCard}>
                  <span>Что можно предложить</span>
                  <ul>
                    {result.draft.recommendations.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>

                <section className={`${styles.answerInfoCard} ${result.draft.pricing.configured ? styles.answerPriceReady : styles.answerPriceWarning}`}>
                  <span>Стоимость</span>
                  <h3>{result.draft.pricing.title}</h3>
                  <p>{result.draft.pricing.text}</p>
                </section>

                <section className={`${styles.answerInfoCard} ${styles.answerNextAction}`}>
                  <span>Следующий шаг</span>
                  <p>{result.draft.nextAction}</p>
                </section>
              </div>
            </div>
          )}

          {!result?.draft && selected && (
            <div className={styles.answerDetail}>
              <div className={styles.answerDetailHeader}>
                <div>
                  <span>{categoryLabels[selected.category] || selected.category}</span>
                  <h2>{selected.title}</h2>
                </div>
                <b className={styles[`risk_${selected.riskLevel}`] || ""}>{riskLabels[selected.riskLevel] || selected.riskLevel}</b>
              </div>

              {selected.question && <blockquote className={styles.clientQuestion}>{selected.question}</blockquote>}
              {selected.shortText && <AnswerVariant title="Короткий ответ" text={selected.shortText} onCopy={copyText} primary />}
              {selected.fullText && <AnswerVariant title="Подробный ответ" text={selected.fullText} onCopy={copyText} />}
              {selected.softText && <AnswerVariant title="Мягкий вариант" text={selected.softText} onCopy={copyText} />}
              {selected.firmText && <AnswerVariant title="Твёрдый вариант" text={selected.firmText} onCopy={copyText} />}
              {selected.clarificationText && <AnswerVariant title="Уточняющий вопрос" text={selected.clarificationText} onCopy={copyText} accent />}
              {selected.avoidText && <AnswerVariant title="Чего не писать" text={selected.avoidText} onCopy={copyText} warning />}
              {selected.redFlagText && <AnswerVariant title="Риск" text={selected.redFlagText} onCopy={copyText} warning />}
              {selected.nextActionText && <AnswerVariant title="Следующий шаг" text={selected.nextActionText} onCopy={copyText} accent />}
              {selected.niches.length > 0 && (
                <div className={styles.answerNiches}>{selected.niches.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function AnswerVariant({
  title,
  text,
  onCopy,
  primary = false,
  accent = false,
  warning = false,
}: {
  title: string;
  text: string;
  onCopy: (text: string, successMessage?: string) => void;
  primary?: boolean;
  accent?: boolean;
  warning?: boolean;
}) {
  const className = [
    styles.answerVariant,
    primary ? styles.answerVariantPrimary : "",
    accent ? styles.answerVariantAccent : "",
    warning ? styles.answerVariantWarning : "",
  ].filter(Boolean).join(" ");

  return (
    <section className={className}>
      <div>
        <h3>{title}</h3>
        <button type="button" onClick={() => onCopy(text)}>Копировать</button>
      </div>
      <p>{text}</p>
    </section>
  );
}
