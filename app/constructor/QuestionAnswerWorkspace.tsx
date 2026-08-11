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

type AnswerResponse = {
  query: string;
  recognizedCategory: string | null;
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

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      onToast("Ответ скопирован");
    } catch {
      onToast("Не удалось скопировать ответ");
    }
  }

  function fullAnswerText(item: AnswerItem): string {
    return [
      item.shortText,
      item.clarificationText ? `Уточнение: ${item.clarificationText}` : null,
      item.nextActionText ? `Следующий шаг: ${item.nextActionText}` : null,
    ].filter(Boolean).join("\n\n");
  }

  async function searchAnswers(event?: FormEvent<HTMLFormElement>, categoryOverride?: string) {
    event?.preventDefault();
    const nextCategory = categoryOverride ?? category;
    if (!question.trim() && !nextCategory) {
      setError("Вставьте вопрос клиента или выберите тему.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (question.trim()) params.set("q", question.trim());
      if (nextCategory) params.set("category", nextCategory);
      if (niche) params.set("niche", niche);
      if (channel !== "any") params.set("channel", channel);

      const response = await fetch(`/api/constructor/answers?${params.toString()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await responseError(response));

      const payload = (await response.json()) as AnswerResponse;
      setResult(payload);
      setSelectedId(payload.items[0]?.id || "");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось подобрать ответ.");
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
          <h1>Найти точный ответ без лишних обещаний</h1>
        </div>
        {selected?.shortText && (
          <button className={styles.primaryButton} type="button" onClick={() => copyText(fullAnswerText(selected))}>
            Скопировать готовый ответ
          </button>
        )}
      </header>

      <div className={styles.answerWorkspace}>
        <section className={styles.answerSearchPanel}>
          <div className={styles.panelHeading}>
            <span>01</span>
            <div>
              <h2>Вопрос клиента</h2>
              <p>Вставьте сообщение как есть или выберите быструю тему.</p>
            </div>
          </div>

          <form className={styles.answerSearchForm} onSubmit={(event) => searchAnswers(event)}>
            <label>
              <span>Сообщение клиента</span>
              <textarea
                rows={5}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Например: Почему так дорого, если это делает нейросеть?"
              />
            </label>

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

            <div className={styles.formGrid}>
              <label>
                <span>Ниша</span>
                <select value={niche} onChange={(event) => setNiche(event.target.value)}>
                  <option value="">Все ниши</option>
                  {bootstrap?.niches.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                </select>
              </label>
              <label>
                <span>Канал</span>
                <select value={channel} onChange={(event) => setChannel(event.target.value)}>
                  <option value="any">Любой</option>
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
              {loading ? "Ищу подходящие ответы…" : "Подобрать ответ"}
            </button>
          </form>

          {result && (
            <div className={styles.answerMatches} aria-live="polite">
              <div className={styles.answerMatchesHeading}>
                <div>
                  <span>Найдено</span>
                  <strong>{result.items.length}</strong>
                </div>
                {result.recognizedCategory && (
                  <small>Тема: {categoryLabels[result.recognizedCategory] || result.recognizedCategory}</small>
                )}
              </div>

              {result.items.length === 0 ? (
                <div className={styles.answerEmpty}>
                  <strong>Точного ответа пока нет</strong>
                  <p>Выберите тему или добавьте этот вопрос в базу знаний как новый черновик.</p>
                </div>
              ) : (
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
              )}
            </div>
          )}
        </section>

        <section className={styles.answerResultPanel} aria-live="polite" aria-busy={loading}>
          <div className={styles.panelHeading}>
            <span>02</span>
            <div>
              <h2>Готовый ответ</h2>
              <p>Выберите подходящий тон и проверьте риск перед отправкой.</p>
            </div>
          </div>

          {!selected && (
            <div className={styles.preparationPlaceholder}>
              <strong>Ответ появится здесь</strong>
              <p>Система использует только утверждённые формулировки из закрытой базы.</p>
            </div>
          )}

          {selected && (
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
  onCopy: (text: string) => void;
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
