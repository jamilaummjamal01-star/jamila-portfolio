"use client";

import { FormEvent, useMemo, useState, type CSSProperties } from "react";
import styles from "./constructor.module.css";

type Niche = { slug: string; name: string; priority: string };

type DiagnosticItem = {
  id: string;
  category: string;
  title: string;
  text: string;
  nextAction: string | null;
  riskLevel: string;
};

type DiagnosticResponse = {
  diagnostic: {
    clientId: string;
    sessionId: string;
    clientName: string;
    nicheName: string;
    format: "express" | "full";
    stageName: string;
    readiness: number;
    readinessLevel: "ready" | "clarify" | "early";
    status: string;
    strongSide: string;
    mainBarrier: string;
    mainDiagnosis: string;
    nextAction: string;
    ethicalDecision: string;
    missing: string[];
    confirmed: Array<{ label: string; value: string }>;
    createdAt: string;
  };
  sections: {
    questions: DiagnosticItem[];
    risks: DiagnosticItem[];
    nextActions: DiagnosticItem[];
  };
};

type ErrorPayload = { error?: { message?: string } };

type DiagnosticWorkspaceProps = {
  bootstrap: { niches: Niche[] } | null;
  onToast: (message: string) => void;
};

const channels = ["Созвон", "Встреча", "Telegram", "WhatsApp", "Email", "Другое"];

const readinessLabels = {
  ready: "Можно переходить к предложению",
  clarify: "Нужно уточнить детали",
  early: "Контекста пока недостаточно",
};

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

export default function DiagnosticWorkspace({ bootstrap, onToast }: DiagnosticWorkspaceProps) {
  const [clientName, setClientName] = useState("");
  const [accountUrl, setAccountUrl] = useState("");
  const [nicheSlug, setNicheSlug] = useState("");
  const [format, setFormat] = useState<"express" | "full">("express");
  const [channel, setChannel] = useState("Созвон");
  const [goal, setGoal] = useState("");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [materials, setMaterials] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [approver, setApprover] = useState("");
  const [desiredAction, setDesiredAction] = useState("");
  const [constraints, setConstraints] = useState("");
  const [rightsStatus, setRightsStatus] = useState("unknown");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<DiagnosticResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const suggestionsCount = useMemo(() => {
    if (!result) return 0;
    return Object.values(result.sections).reduce((total, items) => total + items.length, 0);
  }, [result]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      onToast("Резюме скопировано");
    } catch {
      onToast("Не удалось скопировать текст");
    }
  }

  function summaryText(payload: DiagnosticResponse): string {
    const value = payload.diagnostic;
    const lines = [
      `Диагностика: ${value.clientName}`,
      `Ниша: ${value.nicheName}`,
      `Готовность: ${value.readiness}% — ${readinessLabels[value.readinessLevel]}`,
      "",
      `Диагноз: ${value.mainDiagnosis}`,
      `Сильная сторона: ${value.strongSide}`,
      `Главный барьер: ${value.mainBarrier}`,
      `Следующий шаг: ${value.nextAction}`,
    ];

    if (value.confirmed.length > 0) {
      lines.push("", "УЖЕ ПОНЯТНО");
      value.confirmed.forEach((item) => lines.push(`• ${item.label}: ${item.value}`));
    }
    if (value.missing.length > 0) {
      lines.push("", "НУЖНО УТОЧНИТЬ", ...value.missing.map((item) => `• ${item}`));
    }
    if (payload.sections.risks.length > 0) {
      lines.push("", "РИСКИ", ...payload.sections.risks.map((item) => `• ${item.title}: ${item.text}`));
    }

    return lines.join("\n");
  }

  async function createDiagnostic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/constructor/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          clientName,
          accountUrl,
          nicheSlug,
          format,
          channel,
          goal,
          product,
          audience,
          materials,
          deadline,
          budget,
          approver,
          desiredAction,
          constraints,
          rightsStatus,
          notes,
        }),
      });

      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as DiagnosticResponse;
      setResult(payload);
      onToast("Диагностика сохранена в D1");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить диагностику.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Диагностика</p>
          <h1>Проверить готовность проекта к предложению</h1>
        </div>
        {result && (
          <button className={styles.primaryButton} type="button" onClick={() => copyText(summaryText(result))}>
            Скопировать резюме
          </button>
        )}
      </header>

      <div className={styles.preparationLayout}>
        <form className={styles.preparationForm} onSubmit={createDiagnostic}>
          <div className={styles.panelHeading}>
            <span>01</span>
            <div>
              <h2>Ответы клиента</h2>
              <p>Обязательны только клиент, ниша и задача. Остальные пробелы попадут в список уточнений.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>Клиент или бренд *</span>
              <input required value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Название компании" />
            </label>
            <label>
              <span>Ссылка</span>
              <input type="url" value={accountUrl} onChange={(event) => setAccountUrl(event.target.value)} placeholder="https://..." />
            </label>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>Ниша *</span>
              <select required value={nicheSlug} onChange={(event) => setNicheSlug(event.target.value)}>
                <option value="">Выберите нишу</option>
                {bootstrap?.niches.map((niche) => <option key={niche.slug} value={niche.slug}>{niche.name}</option>)}
              </select>
            </label>
            <label>
              <span>Формат</span>
              <select value={format} onChange={(event) => setFormat(event.target.value as "express" | "full")}>
                <option value="express">Экспресс</option>
                <option value="full">Полная</option>
              </select>
            </label>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>Канал разговора</span>
              <select value={channel} onChange={(event) => setChannel(event.target.value)}>
                {channels.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span>Права на исходники</span>
              <select value={rightsStatus} onChange={(event) => setRightsStatus(event.target.value)}>
                <option value="unknown">Нужно уточнить</option>
                <option value="confirmed">Подтверждены</option>
                <option value="restricted">Есть ограничения</option>
              </select>
            </label>
          </div>

          <label>
            <span>Главная задача *</span>
            <textarea required value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Какой результат нужен бизнесу?" />
          </label>
          <label>
            <span>Приоритетный продукт</span>
            <textarea value={product} onChange={(event) => setProduct(event.target.value)} placeholder="Что именно продвигаем или упаковываем?" />
          </label>
          <label>
            <span>Целевая аудитория</span>
            <textarea value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Кто принимает решение и что для него важно?" />
          </label>
          <label>
            <span>Исходные материалы</span>
            <textarea value={materials} onChange={(event) => setMaterials(event.target.value)} placeholder="Фото, видео, тексты, брендбук, отзывы, документы" />
          </label>

          <div className={styles.formGrid}>
            <label>
              <span>Срок</span>
              <input value={deadline} onChange={(event) => setDeadline(event.target.value)} placeholder="Дата или ориентир" />
            </label>
            <label>
              <span>Бюджет</span>
              <input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Диапазон или ограничение" />
            </label>
          </div>

          <label>
            <span>Кто согласует результат</span>
            <input value={approver} onChange={(event) => setApprover(event.target.value)} placeholder="Имя, роль и порядок согласования" />
          </label>
          <label>
            <span>Целевое действие аудитории</span>
            <input value={desiredAction} onChange={(event) => setDesiredAction(event.target.value)} placeholder="Написать, купить, оставить заявку..." />
          </label>
          <label>
            <span>Ограничения и риски</span>
            <textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="Запрещённые обещания, юридические рамки, технические ограничения" />
          </label>
          <label>
            <span>Внутренние заметки</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="То, что не войдёт в резюме для клиента" />
          </label>

          {error && <div className={styles.errorPanel}>{error}</div>}
          <button className={styles.primaryButton} type="submit" disabled={saving || !bootstrap}>
            {saving ? "Сохраняю…" : "Завершить диагностику"}
          </button>
        </form>

        <section className={styles.preparationResults} aria-live="polite">
          <div className={styles.panelHeading}>
            <span>02</span>
            <div>
              <h2>Результат</h2>
              <p>Готовность, пробелы и безопасный следующий шаг.</p>
            </div>
          </div>

          {!result && (
            <div className={styles.preparationPlaceholder}>
              <strong>Резюме появится здесь</strong>
              <p>После сохранения конструктор оценит полноту данных и добавит утверждённые вопросы и ограничения.</p>
            </div>
          )}

          {result && (
            <>
              <div className={styles.diagnosticScore}>
                <div className={styles.diagnosticScoreRing} style={{ "--diagnostic-score": `${result.diagnostic.readiness * 3.6}deg` } as CSSProperties}>
                  <strong>{result.diagnostic.readiness}%</strong>
                </div>
                <div>
                  <span>Готовность проекта</span>
                  <h2>{readinessLabels[result.diagnostic.readinessLevel]}</h2>
                  <p>{result.diagnostic.mainDiagnosis}</p>
                </div>
              </div>

              <div className={styles.savedPreparation}>
                <div>
                  <span>Сохранено в D1</span>
                  <strong>{result.diagnostic.clientName}</strong>
                  <small>{result.diagnostic.nicheName} · {result.diagnostic.stageName}</small>
                </div>
                <b>{suggestionsCount}</b>
              </div>

              <section className={styles.diagnosticSummaryGrid}>
                <article>
                  <span>Сильная сторона</span>
                  <p>{result.diagnostic.strongSide}</p>
                </article>
                <article>
                  <span>Главный барьер</span>
                  <p>{result.diagnostic.mainBarrier}</p>
                </article>
                <article>
                  <span>Следующий шаг</span>
                  <p>{result.diagnostic.nextAction}</p>
                </article>
              </section>

              {result.diagnostic.confirmed.length > 0 && (
                <section className={styles.preparationSection}>
                  <div className={styles.preparationSectionTitle}>
                    <div><h3>Что уже понятно</h3><p>Зафиксированные ответы клиента</p></div>
                    <span>{result.diagnostic.confirmed.length}</span>
                  </div>
                  <div className={styles.diagnosticFacts}>
                    {result.diagnostic.confirmed.map((item) => (
                      <article key={item.label}><span>{item.label}</span><p>{item.value}</p></article>
                    ))}
                  </div>
                </section>
              )}

              {result.diagnostic.missing.length > 0 && (
                <section className={styles.preparationSection}>
                  <div className={styles.preparationSectionTitle}>
                    <div><h3>Что уточнить</h3><p>Без этих данных рано фиксировать предложение</p></div>
                    <span>{result.diagnostic.missing.length}</span>
                  </div>
                  <ul className={styles.diagnosticMissing}>
                    {result.diagnostic.missing.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>
              )}

              {(["questions", "risks", "nextActions"] as const).map((section) => {
                const items = result.sections[section];
                if (items.length === 0) return null;
                const labels = {
                  questions: ["Вопросы из базы", "Что спросить дальше"],
                  risks: ["Риски и ограничения", "Что нельзя упустить"],
                  nextActions: ["Сценарий следующего шага", "Утверждённые действия"],
                } as const;
                return (
                  <section className={styles.preparationSection} key={section}>
                    <div className={styles.preparationSectionTitle}>
                      <div><h3>{labels[section][0]}</h3><p>{labels[section][1]}</p></div>
                      <span>{items.length}</span>
                    </div>
                    <div className={styles.preparationItemList}>
                      {items.map((item) => (
                        <article className={styles.preparationItem} key={`${section}-${item.id}`}>
                          <div><span>{item.category}</span><button type="button" onClick={() => copyText(item.text)}>Копировать</button></div>
                          <h4>{item.title}</h4>
                          <p>{item.text}</p>
                          {item.nextAction && <small>Дальше: {item.nextAction}</small>}
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </section>
      </div>
    </>
  );
}

