"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "./constructor.module.css";

type Niche = { slug: string; name: string; priority: string };
type Stage = { slug: string; name: string; sort_order: number };

type PreparationItem = {
  id: string;
  itemType: string;
  category: string;
  title: string;
  text: string;
  answer: string | null;
  nextAction: string | null;
  riskLevel: string;
};

type PreparationResponse = {
  preparation: {
    clientId: string;
    sessionId: string;
    clientName: string;
    nicheName: string;
    stageName: string;
    createdAt: string;
  };
  sections: {
    auditChecks: PreparationItem[];
    questionsToAsk: PreparationItem[];
    likelyClientQuestions: PreparationItem[];
    firstMessages: PreparationItem[];
    risks: PreparationItem[];
    packages: PreparationItem[];
    nextActions: PreparationItem[];
  };
};

type ErrorPayload = { error?: { message?: string } };

type PreparationWorkspaceProps = {
  bootstrap: { niches: Niche[]; stages: Stage[] } | null;
  onToast: (message: string) => void;
};

const businessModels = [
  "Собственный бренд",
  "Производитель",
  "Интернет-магазин",
  "Маркетплейс",
  "Эксперт или специалист",
  "Услуги",
  "B2B",
  "Другое",
];

const messageChannels = ["Instagram", "Telegram", "WhatsApp", "Email", "Созвон", "Другое"];

const resultSections: Array<{
  key: keyof PreparationResponse["sections"];
  title: string;
  description: string;
}> = [
  { key: "auditChecks", title: "Что проверить", description: "Короткий аудит до первого контакта" },
  { key: "questionsToAsk", title: "Что спросить", description: "Вопросы, которые прояснят задачу" },
  { key: "likelyClientQuestions", title: "Что может спросить клиент", description: "Вероятные вопросы и готовые ответы" },
  { key: "firstMessages", title: "Первое сообщение", description: "Основа для начала разговора" },
  { key: "risks", title: "Риски и ограничения", description: "Что нельзя упустить или обещать" },
  { key: "packages", title: "Подходящие решения", description: "Пакеты и блоки предложения" },
  { key: "nextActions", title: "Следующий шаг", description: "Как завершить контакт конкретным действием" },
];

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

export default function PreparationWorkspace({ bootstrap, onToast }: PreparationWorkspaceProps) {
  const [clientName, setClientName] = useState("");
  const [accountUrl, setAccountUrl] = useState("");
  const [nicheSlug, setNicheSlug] = useState("");
  const [stageSlug, setStageSlug] = useState("audit");
  const [businessModel, setBusinessModel] = useState("");
  const [productSummary, setProductSummary] = useState("");
  const [audienceSummary, setAudienceSummary] = useState("");
  const [commercialGoal, setCommercialGoal] = useState("");
  const [salesChannel, setSalesChannel] = useState("");
  const [messageChannel, setMessageChannel] = useState("Instagram");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<PreparationResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCount = useMemo(() => {
    if (!result) return 0;
    return Object.values(result.sections).reduce((total, items) => total + items.length, 0);
  }, [result]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      onToast("Текст скопирован");
    } catch {
      onToast("Не удалось скопировать текст");
    }
  }

  function planText(payload: PreparationResponse): string {
    const lines = [
      `Подготовка к клиенту: ${payload.preparation.clientName}`,
      `Ниша: ${payload.preparation.nicheName}`,
      `Этап: ${payload.preparation.stageName}`,
      "",
    ];

    for (const section of resultSections) {
      const items = payload.sections[section.key];
      if (items.length === 0) continue;
      lines.push(section.title.toUpperCase());
      items.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.title}`);
        lines.push(item.text);
        if (item.answer && item.answer !== item.text) lines.push(`Ответ: ${item.answer}`);
        if (item.nextAction) lines.push(`Дальше: ${item.nextAction}`);
      });
      lines.push("");
    }

    return lines.join("\n").trim();
  }

  async function createPreparation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/constructor/preparations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          clientName,
          accountUrl,
          nicheSlug,
          stageSlug,
          businessModel,
          productSummary,
          audienceSummary,
          commercialGoal,
          salesChannel,
          messageChannel,
          notes,
        }),
      });

      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as PreparationResponse;
      setResult(payload);
      onToast("Подготовка сохранена в карточке клиента");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось подготовить карточку клиента.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Подготовиться к клиенту</p>
          <h1>Контекст, вопросы и план разговора</h1>
        </div>
        {result && (
          <button className={styles.primaryButton} type="button" onClick={() => copyText(planText(result))}>
            Скопировать весь план
          </button>
        )}
      </header>

      <div className={styles.preparationLayout}>
        <form className={styles.preparationForm} onSubmit={createPreparation}>
          <div className={styles.panelHeading}>
            <span>01</span>
            <div>
              <h2>Контекст клиента</h2>
              <p>Заполните то, что уже известно. Обязательные поля отмечены звёздочкой.</p>
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
              <span>Основная ниша *</span>
              <select required value={nicheSlug} onChange={(event) => setNicheSlug(event.target.value)}>
                <option value="">Выберите нишу</option>
                {bootstrap?.niches.map((niche) => <option key={niche.slug} value={niche.slug}>{niche.name}</option>)}
              </select>
            </label>
            <label>
              <span>Бизнес-модель</span>
              <select value={businessModel} onChange={(event) => setBusinessModel(event.target.value)}>
                <option value="">Не указана</option>
                {businessModels.map((model) => <option key={model} value={model}>{model}</option>)}
              </select>
            </label>
          </div>

          <label>
            <span>Продукт или услуга *</span>
            <textarea required rows={3} value={productSummary} onChange={(event) => setProductSummary(event.target.value)} placeholder="Что именно продаёт клиент и что сейчас приоритетно" />
          </label>

          <label>
            <span>Целевая аудитория</span>
            <textarea rows={3} value={audienceSummary} onChange={(event) => setAudienceSummary(event.target.value)} placeholder="Кто покупает и что для него важно" />
          </label>

          <label>
            <span>Коммерческая задача *</span>
            <textarea required rows={3} value={commercialGoal} onChange={(event) => setCommercialGoal(event.target.value)} placeholder="Например: подготовить запуск, повысить доверие, обновить карточки товара" />
          </label>

          <div className={styles.formGrid}>
            <label>
              <span>Этап общения *</span>
              <select required value={stageSlug} onChange={(event) => setStageSlug(event.target.value)}>
                {bootstrap?.stages.map((stage) => <option key={stage.slug} value={stage.slug}>{stage.name}</option>)}
              </select>
            </label>
            <label>
              <span>Канал сообщения</span>
              <select value={messageChannel} onChange={(event) => setMessageChannel(event.target.value)}>
                {messageChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
              </select>
            </label>
          </div>

          <label>
            <span>Канал продаж</span>
            <input value={salesChannel} onChange={(event) => setSalesChannel(event.target.value)} placeholder="Сайт, соцсети, маркетплейс, офлайн..." />
          </label>

          <label>
            <span>Внутренние заметки</span>
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Что уже заметили, ограничения или важные детали" />
          </label>

          {error && <div className={styles.errorPanel}>{error}</div>}

          <button className={styles.primaryButton} type="submit" disabled={saving || !bootstrap}>
            {saving ? "Собираю план…" : "Собрать и сохранить подготовку"}
          </button>
        </form>

        <section className={styles.preparationResults} aria-live="polite">
          <div className={styles.panelHeading}>
            <span>02</span>
            <div>
              <h2>Рабочий план</h2>
              <p>Система подберёт утверждённые материалы по нише и этапу.</p>
            </div>
          </div>

          {!result && (
            <div className={styles.preparationPlaceholder}>
              <strong>План появится здесь</strong>
              <p>После сохранения вы получите аудит, вопросы, вероятные возражения, риски и следующий шаг.</p>
            </div>
          )}

          {result && (
            <>
              <div className={styles.savedPreparation}>
                <div>
                  <span>Сохранено в карточке клиента</span>
                  <strong>{result.preparation.clientName}</strong>
                  <small>{result.preparation.nicheName} · {result.preparation.stageName}</small>
                </div>
                <b>{selectedCount}</b>
              </div>

              {resultSections.map((section) => {
                const sectionItems = result.sections[section.key];
                if (sectionItems.length === 0) return null;
                return (
                  <section className={styles.preparationSection} key={section.key}>
                    <div className={styles.preparationSectionTitle}>
                      <div>
                        <h3>{section.title}</h3>
                        <p>{section.description}</p>
                      </div>
                      <span>{sectionItems.length}</span>
                    </div>

                    <div className={styles.preparationItemList}>
                      {sectionItems.map((item) => (
                        <article className={styles.preparationItem} key={`${section.key}-${item.id}`}>
                          <div>
                            <span>{item.category}</span>
                            <button type="button" onClick={() => copyText(item.answer || item.text)}>Копировать</button>
                          </div>
                          <h4>{item.title}</h4>
                          <p>{item.text}</p>
                          {item.answer && item.answer !== item.text && <blockquote>{item.answer}</blockquote>}
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
