"use client";

import { FormEvent, useState } from "react";
import styles from "./constructor.module.css";

type Option = { slug: string; name: string };

export type KnowledgeEditorItem = {
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
  version: number;
  nicheSlugs: string[];
  stageSlugs: string[];
};

export type KnowledgeUpdatePayload = {
  version: number;
  itemType: string;
  speaker: string;
  category: string;
  title: string;
  promptText: string;
  shortText: string;
  fullText: string;
  softText: string;
  firmText: string;
  clarificationText: string;
  nextActionText: string;
  avoidText: string;
  diagnosticValue: string;
  redFlagText: string;
  channel: string;
  tone: string;
  requiredLevel: string;
  riskLevel: string;
  status: string;
  sourceKind: string;
  sourceUrl: string;
  nicheSlugs: string[];
  stageSlugs: string[];
};

const itemTypes = [
  ["question_to_client", "Вопрос клиенту"],
  ["question_from_client", "Вопрос клиента"],
  ["answer", "Ответ"],
  ["objection", "Возражение"],
  ["objection_response", "Ответ на возражение"],
  ["clarifying_question", "Уточняющий вопрос"],
  ["first_message", "Первое сообщение"],
  ["follow_up", "Повторное сообщение"],
  ["diagnostic_hint", "Подсказка диагностики"],
  ["audit_check", "Проверка аудита"],
  ["red_flag", "Красный флаг"],
  ["ethical_rule", "Этическое правило"],
  ["proposal_block", "Блок КП"],
  ["package", "Пакет"],
  ["next_action", "Следующий шаг"],
  ["refusal_reason", "Основание для отказа"],
] as const;

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function KnowledgeEditor({
  item,
  niches,
  stages,
  onCancel,
  onSave,
}: {
  item: KnowledgeEditorItem;
  niches: Option[];
  stages: Option[];
  onCancel: () => void;
  onSave: (payload: KnowledgeUpdatePayload) => Promise<void>;
}) {
  const [itemType, setItemType] = useState(item.item_type);
  const [speaker, setSpeaker] = useState(item.speaker);
  const [category, setCategory] = useState(item.category);
  const [title, setTitle] = useState(item.title);
  const [promptText, setPromptText] = useState(item.prompt_text || "");
  const [shortText, setShortText] = useState(item.short_text || "");
  const [fullText, setFullText] = useState(item.full_text || "");
  const [softText, setSoftText] = useState(item.soft_text || "");
  const [firmText, setFirmText] = useState(item.firm_text || "");
  const [clarificationText, setClarificationText] = useState(item.clarification_text || "");
  const [nextActionText, setNextActionText] = useState(item.next_action_text || "");
  const [avoidText, setAvoidText] = useState(item.avoid_text || "");
  const [diagnosticValue, setDiagnosticValue] = useState(item.diagnostic_value || "");
  const [redFlagText, setRedFlagText] = useState(item.red_flag_text || "");
  const [channel, setChannel] = useState(item.channel || "any");
  const [tone, setTone] = useState(item.tone || "neutral");
  const [requiredLevel, setRequiredLevel] = useState(item.required_level || "recommended");
  const [riskLevel, setRiskLevel] = useState(item.risk_level || "normal");
  const [status, setStatus] = useState(item.status || "draft");
  const [sourceKind, setSourceKind] = useState(item.source_kind || "manual");
  const [sourceUrl, setSourceUrl] = useState(item.source_url || "");
  const [nicheSlugs, setNicheSlugs] = useState(item.nicheSlugs);
  const [stageSlugs, setStageSlugs] = useState(item.stageSlugs);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        version: item.version,
        itemType,
        speaker,
        category,
        title,
        promptText,
        shortText,
        fullText,
        softText,
        firmText,
        clarificationText,
        nextActionText,
        avoidText,
        diagnosticValue,
        redFlagText,
        channel,
        tone,
        requiredLevel,
        riskLevel,
        status,
        sourceKind,
        sourceUrl,
        nicheSlugs,
        stageSlugs,
      });
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить изменения.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.knowledgeEditor} onSubmit={submit}>
      <div className={styles.editorHeading}>
        <div>
          <p className={styles.eyebrow}>Редактор записи</p>
          <h2>Версия {item.version}</h2>
        </div>
        <button className={styles.secondaryButton} type="button" onClick={onCancel} disabled={saving}>Отмена</button>
      </div>

      {error && <div className={styles.errorPanel}>{error}</div>}

      <section className={styles.editorSection}>
        <h3>Классификация</h3>
        <label>
          <span>Внутреннее название *</span>
          <input required value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <div className={styles.formGrid}>
          <label>
            <span>Тип *</span>
            <select value={itemType} onChange={(event) => setItemType(event.target.value)}>
              {itemTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            <span>Категория *</span>
            <input required value={category} onChange={(event) => setCategory(event.target.value)} />
          </label>
          <label>
            <span>Статус</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="draft">Черновик</option>
              <option value="review">На проверке</option>
              <option value="approved">Утверждено</option>
              <option value="archived">Архив</option>
            </select>
          </label>
          <label>
            <span>Сторона диалога</span>
            <select value={speaker} onChange={(event) => setSpeaker(event.target.value)}>
              <option value="creator">Автор</option>
              <option value="client">Клиент</option>
              <option value="system">Система</option>
            </select>
          </label>
          <label>
            <span>Обязательность</span>
            <select value={requiredLevel} onChange={(event) => setRequiredLevel(event.target.value)}>
              <option value="required">Обязательно</option>
              <option value="recommended">Рекомендуется</option>
              <option value="optional">Дополнительно</option>
              <option value="conditional">По условию</option>
            </select>
          </label>
          <label>
            <span>Риск</span>
            <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}>
              <option value="normal">Обычный</option>
              <option value="elevated">Повышенный</option>
              <option value="high">Высокий</option>
              <option value="refusal">Отказ</option>
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
          <label>
            <span>Тон</span>
            <select value={tone} onChange={(event) => setTone(event.target.value)}>
              <option value="neutral">Нейтральный</option>
              <option value="warm">Тёплый</option>
              <option value="business">Деловой</option>
              <option value="short">Короткий</option>
              <option value="firm">Твёрдый</option>
            </select>
          </label>
        </div>
      </section>

      <section className={styles.editorSection}>
        <h3>Тексты</h3>
        <label><span>Вопрос или формулировка</span><textarea rows={3} value={promptText} onChange={(event) => setPromptText(event.target.value)} /></label>
        <label><span>Короткий ответ</span><textarea rows={4} value={shortText} onChange={(event) => setShortText(event.target.value)} /></label>
        <label><span>Подробный ответ</span><textarea rows={6} value={fullText} onChange={(event) => setFullText(event.target.value)} /></label>
        <div className={styles.formGrid}>
          <label><span>Мягкая версия</span><textarea rows={5} value={softText} onChange={(event) => setSoftText(event.target.value)} /></label>
          <label><span>Твёрдая версия</span><textarea rows={5} value={firmText} onChange={(event) => setFirmText(event.target.value)} /></label>
        </div>
        <label><span>Уточняющий вопрос</span><textarea rows={3} value={clarificationText} onChange={(event) => setClarificationText(event.target.value)} /></label>
        <label><span>Следующий шаг</span><textarea rows={3} value={nextActionText} onChange={(event) => setNextActionText(event.target.value)} /></label>
        <label><span>Диагностическая ценность</span><textarea rows={3} value={diagnosticValue} onChange={(event) => setDiagnosticValue(event.target.value)} /></label>
        <label><span>Чего не говорить</span><textarea rows={3} value={avoidText} onChange={(event) => setAvoidText(event.target.value)} /></label>
        <label><span>Объяснение красного флага</span><textarea rows={3} value={redFlagText} onChange={(event) => setRedFlagText(event.target.value)} /></label>
      </section>

      <section className={styles.editorSection}>
        <h3>Ниши и этапы</h3>
        <fieldset className={styles.editorOptions}>
          <legend>Ниши <small>ничего не выбрано — запись универсальная</small></legend>
          <div>
            {niches.map((option) => (
              <label key={option.slug}>
                <input type="checkbox" checked={nicheSlugs.includes(option.slug)} onChange={() => setNicheSlugs((values) => toggleValue(values, option.slug))} />
                <span>{option.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.editorOptions}>
          <legend>Этапы</legend>
          <div>
            {stages.map((option) => (
              <label key={option.slug}>
                <input type="checkbox" checked={stageSlugs.includes(option.slug)} onChange={() => setStageSlugs((values) => toggleValue(values, option.slug))} />
                <span>{option.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className={styles.editorSection}>
        <h3>Источник</h3>
        <div className={styles.formGrid}>
          <label>
            <span>Тип источника</span>
            <select value={sourceKind} onChange={(event) => setSourceKind(event.target.value)}>
              <option value="manual">Добавлено вручную</option>
              <option value="notion">Notion</option>
              <option value="real_dialogue">Реальный диалог</option>
              <option value="import">Импорт</option>
            </select>
          </label>
          <label><span>Ссылка на источник</span><input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" /></label>
        </div>
      </section>

      <div className={styles.editorStickyActions}>
        <span>{status === "approved" ? "После сохранения запись будет доступна в рабочих режимах." : "Изменения сохранятся как новая версия."}</span>
        <button className={styles.primaryButton} type="submit" disabled={saving}>{saving ? "Сохраняю…" : "Сохранить изменения"}</button>
      </div>
    </form>
  );
}
