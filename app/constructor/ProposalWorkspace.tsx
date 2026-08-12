"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./constructor.module.css";

type ProposalClient = { id: string; name: string; crmStatus: string; priority: string };
type ProposalCalculation = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  title: string;
  currency: string;
  total: number;
  validUntil: string | null;
  updatedAt: string;
};
type ProposalDiagnostic = {
  id: string;
  clientId: string;
  clientName: string;
  goal: string | null;
  mainDiagnosis: string | null;
  createdAt: string;
};
type Proposal = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  diagnosticSessionId: string | null;
  diagnosticLabel: string | null;
  calculationId: string | null;
  calculationTitle: string | null;
  calculationCurrency: string | null;
  calculationTotal: number | null;
  version: number;
  status: string;
  title: string;
  diagnosisText: string;
  strategyText: string;
  solutionText: string;
  scopeText: string;
  timelineText: string;
  rightsText: string;
  limitationsText: string;
  nextStepText: string;
  clientDocument: string;
  internalNotes: string;
  sentAt: string | null;
  followUpAt: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
};
type ProposalBootstrap = {
  clients: ProposalClient[];
  calculations: ProposalCalculation[];
  diagnostics: ProposalDiagnostic[];
  proposals: Proposal[];
};
type ProposalDetailResponse = { proposal: Proposal };
type ErrorPayload = { error?: { message?: string } };
type ProposalWorkspaceProps = { onToast: (message: string) => void };

type ProposalDraft = {
  clientId: string;
  diagnosticSessionId: string;
  calculationId: string;
  status: string;
  title: string;
  diagnosisText: string;
  strategyText: string;
  solutionText: string;
  scopeText: string;
  timelineText: string;
  rightsText: string;
  limitationsText: string;
  nextStepText: string;
  clientDocument: string;
  internalNotes: string;
  followUpAt: string;
  validUntil: string;
};

const statuses = [
  ["draft", "Черновик"],
  ["needs_data", "Нужны данные"],
  ["internal_review", "Проверка"],
  ["ready_to_send", "Готово к отправке"],
  ["sent", "Отправлено"],
  ["discussion", "Обсуждение"],
  ["approved", "Согласовано"],
  ["rejected", "Отклонено"],
] as const;

function emptyDraft(): ProposalDraft {
  return {
    clientId: "",
    diagnosticSessionId: "",
    calculationId: "",
    status: "draft",
    title: "Коммерческое предложение",
    diagnosisText: "",
    strategyText: "",
    solutionText: "",
    scopeText: "",
    timelineText: "",
    rightsText: "",
    limitationsText: "",
    nextStepText: "",
    clientDocument: "",
    internalNotes: "",
    followUpAt: "",
    validUntil: "",
  };
}

function toDateInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
}

function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function displayDate(value: string | null): string {
  if (!value) return "Без срока";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function money(value: number, currency = "RUB"): string {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
  } catch {
    return `${Math.round(value || 0).toLocaleString("ru-RU")} ₽`;
  }
}

function draftFromProposal(proposal: Proposal): ProposalDraft {
  return {
    clientId: proposal.clientId || "",
    diagnosticSessionId: proposal.diagnosticSessionId || "",
    calculationId: proposal.calculationId || "",
    status: proposal.status,
    title: proposal.title,
    diagnosisText: proposal.diagnosisText,
    strategyText: proposal.strategyText,
    solutionText: proposal.solutionText,
    scopeText: proposal.scopeText,
    timelineText: proposal.timelineText,
    rightsText: proposal.rightsText,
    limitationsText: proposal.limitationsText,
    nextStepText: proposal.nextStepText,
    clientDocument: proposal.clientDocument,
    internalNotes: proposal.internalNotes,
    followUpAt: toDateTimeLocal(proposal.followUpAt),
    validUntil: toDateInput(proposal.validUntil),
  };
}

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

export default function ProposalWorkspace({ onToast }: ProposalWorkspaceProps) {
  const [bootstrap, setBootstrap] = useState<ProposalBootstrap>({ clients: [], calculations: [], diagnostics: [], proposals: [] });
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<ProposalDraft>(emptyDraft());
  const [creating, setCreating] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectProposal = useCallback((proposal: Proposal) => {
    setSelectedId(proposal.id);
    setDraft(draftFromProposal(proposal));
    setCreating(false);
  }, []);

  const loadBootstrap = useCallback(async (preferredId?: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/constructor/proposals/bootstrap", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as ProposalBootstrap;
      setBootstrap(payload);
      const preferred = preferredId ? payload.proposals.find((proposal) => proposal.id === preferredId) : payload.proposals[0];
      if (preferred) selectProposal(preferred);
      else {
        setSelectedId("");
        setDraft(emptyDraft());
        setCreating(true);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить коммерческие предложения.");
    } finally {
      setLoading(false);
    }
  }, [selectProposal]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => cancelled ? undefined : loadBootstrap());
    return () => { cancelled = true; };
  }, [loadBootstrap]);

  const selectedClient = useMemo(
    () => bootstrap.clients.find((client) => client.id === draft.clientId) || null,
    [bootstrap.clients, draft.clientId],
  );
  const selectedCalculation = useMemo(
    () => bootstrap.calculations.find((calculation) => calculation.id === draft.calculationId) || null,
    [bootstrap.calculations, draft.calculationId],
  );
  const diagnostics = useMemo(
    () => bootstrap.diagnostics.filter((diagnostic) => !draft.clientId || diagnostic.clientId === draft.clientId),
    [bootstrap.diagnostics, draft.clientId],
  );
  const calculations = useMemo(
    () => bootstrap.calculations.filter((calculation) => !draft.clientId || !calculation.clientId || calculation.clientId === draft.clientId),
    [bootstrap.calculations, draft.clientId],
  );

  function updateDraft<K extends keyof ProposalDraft>(key: K, value: ProposalDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function startNew() {
    setCreating(true);
    setSelectedId("");
    setDraft(emptyDraft());
    setError("");
  }

  function applyCalculation(calculationId: string) {
    const calculation = bootstrap.calculations.find((item) => item.id === calculationId);
    setDraft((current) => ({
      ...current,
      calculationId,
      clientId: current.clientId || calculation?.clientId || "",
      validUntil: current.validUntil || toDateInput(calculation?.validUntil || null),
      title: current.title === "Коммерческое предложение" && calculation
        ? `Коммерческое предложение — ${calculation.title}`
        : current.title,
    }));
  }

  function generateClientDocument() {
    const calculationLine = selectedCalculation
      ? `Стоимость: ${money(selectedCalculation.total, selectedCalculation.currency)}${draft.validUntil ? `\nПредложение действительно до ${displayDate(draft.validUntil)}.` : ""}`
      : "";
    const sections = [
      selectedClient ? `Здравствуйте!\n\nПодготовила предложение для ${selectedClient.name}.` : "Здравствуйте!\n\nПодготовила коммерческое предложение по вашему проекту.",
      draft.diagnosisText && `Текущая ситуация и задача\n${draft.diagnosisText}`,
      draft.strategyText && `Предлагаемая стратегия\n${draft.strategyText}`,
      draft.solutionText && `Решение\n${draft.solutionText}`,
      draft.scopeText && `Состав работ\n${draft.scopeText}`,
      draft.timelineText && `Этапы и сроки\n${draft.timelineText}`,
      calculationLine,
      draft.rightsText && `Права использования\n${draft.rightsText}`,
      draft.limitationsText && `Условия и ограничения\n${draft.limitationsText}`,
      draft.nextStepText && `Следующий шаг\n${draft.nextStepText}`,
    ].filter(Boolean);
    updateDraft("clientDocument", sections.join("\n\n"));
    onToast("Клиентский текст собран");
  }

  async function copyDocument() {
    if (!draft.clientDocument.trim()) {
      setError("Сначала соберите или заполните клиентский текст.");
      return;
    }
    try {
      await navigator.clipboard.writeText(draft.clientDocument);
      onToast("Текст КП скопирован");
    } catch {
      setError("Не удалось скопировать текст.");
    }
  }

  async function saveProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError("Укажите название коммерческого предложения.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(creating ? "/api/constructor/proposals" : `/api/constructor/proposals/${encodeURIComponent(selectedId)}`, {
        method: creating ? "POST" : "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          followUpAt: draft.followUpAt ? new Date(draft.followUpAt).toISOString() : "",
          validUntil: draft.validUntil || "",
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as ProposalDetailResponse;
      await loadBootstrap(payload.proposal.id);
      onToast(creating ? "КП создано и сохранено в D1" : "Изменения КП сохранены");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить коммерческое предложение.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.proposalWorkspace}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Коммерческие предложения</p>
          <h1>От черновика до согласования</h1>
          <p className={styles.clientIntro}>Клиентский текст, внутренние заметки, расчёт и сроки собраны в одной карточке.</p>
        </div>
        <button className={styles.primaryButton} type="button" onClick={startNew}>+ Новое КП</button>
      </header>

      {error && <div className={styles.errorPanel}>{error}</div>}

      <section className={styles.proposalBoard} aria-label="Доска коммерческих предложений" aria-busy={loading}>
        {statuses.map(([status, label]) => {
          const items = bootstrap.proposals.filter((proposal) => proposal.status === status);
          return (
            <article className={styles.proposalColumn} data-status={status} key={status}>
              <div className={styles.proposalColumnHeader}><span>{label}</span><strong>{items.length}</strong></div>
              <div className={styles.proposalColumnCards}>
                {items.length === 0 && <p>Пока пусто</p>}
                {items.map((proposal) => (
                  <button className={selectedId === proposal.id ? styles.proposalCardActive : styles.proposalCard} key={proposal.id} type="button" onClick={() => selectProposal(proposal)}>
                    <strong>{proposal.title}</strong>
                    <span>{proposal.clientName || "Без клиента"}</span>
                    {proposal.calculationTotal !== null && <b>{money(proposal.calculationTotal, proposal.calculationCurrency || "RUB")}</b>}
                    <small>Версия {proposal.version} · {displayDate(proposal.updatedAt)}</small>
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <form className={styles.proposalEditor} onSubmit={saveProposal}>
        <div className={styles.proposalEditorHeader}>
          <div><span>{creating ? "Новое предложение" : `Версия ${bootstrap.proposals.find((proposal) => proposal.id === selectedId)?.version || 1}`}</span><h2>{draft.title || "Без названия"}</h2></div>
          <div><button className={styles.secondaryButton} type="button" onClick={generateClientDocument}>Собрать клиентский текст</button><button className={styles.primaryButton} type="submit" disabled={saving}>{saving ? "Сохраняю…" : "Сохранить КП"}</button></div>
        </div>

        <section className={styles.proposalMetaGrid}>
          <label className={styles.proposalWide}><span>Название</span><input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} required /></label>
          <label><span>Статус</span><select value={draft.status} onChange={(event) => updateDraft("status", event.target.value)}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Клиент</span><select value={draft.clientId} onChange={(event) => setDraft((current) => ({ ...current, clientId: event.target.value, diagnosticSessionId: "", calculationId: "" }))}><option value="">Без привязки</option>{bootstrap.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label><span>Диагностика</span><select value={draft.diagnosticSessionId} onChange={(event) => updateDraft("diagnosticSessionId", event.target.value)}><option value="">Без привязки</option>{diagnostics.map((diagnostic) => <option key={diagnostic.id} value={diagnostic.id}>{diagnostic.clientName} · {diagnostic.goal || displayDate(diagnostic.createdAt)}</option>)}</select></label>
          <label><span>Сохранённый расчёт</span><select value={draft.calculationId} onChange={(event) => applyCalculation(event.target.value)}><option value="">Без расчёта</option>{calculations.map((calculation) => <option key={calculation.id} value={calculation.id}>{calculation.title} · {money(calculation.total, calculation.currency)}</option>)}</select></label>
          <label><span>Действует до</span><input type="date" value={draft.validUntil} onChange={(event) => updateDraft("validUntil", event.target.value)} /></label>
          <label><span>Связаться после отправки</span><input type="datetime-local" value={draft.followUpAt} onChange={(event) => updateDraft("followUpAt", event.target.value)} /></label>
        </section>

        {selectedCalculation && <div className={styles.proposalCalculation}><span>Расчёт прикреплён</span><strong>{selectedCalculation.title}</strong><b>{money(selectedCalculation.total, selectedCalculation.currency)}</b><small>{selectedCalculation.clientName || "Без клиента"}</small></div>}

        <section className={styles.proposalSections}>
          <div className={styles.proposalClientFields}>
            <div className={styles.panelHeading}><div><span>Содержание</span><h2>Структура предложения</h2></div></div>
            <label><span>Текущая ситуация и задача</span><textarea rows={4} value={draft.diagnosisText} onChange={(event) => updateDraft("diagnosisText", event.target.value)} placeholder="Что происходит сейчас и какую задачу нужно решить" /></label>
            <label><span>Стратегия</span><textarea rows={4} value={draft.strategyText} onChange={(event) => updateDraft("strategyText", event.target.value)} placeholder="Почему предлагается именно такой путь" /></label>
            <label><span>Решение</span><textarea rows={4} value={draft.solutionText} onChange={(event) => updateDraft("solutionText", event.target.value)} placeholder="Какой результат и формат работы получает клиент" /></label>
            <label><span>Состав работ</span><textarea rows={5} value={draft.scopeText} onChange={(event) => updateDraft("scopeText", event.target.value)} placeholder="Пакет, этапы, количество материалов и правок" /></label>
            <label><span>Сроки</span><textarea rows={3} value={draft.timelineText} onChange={(event) => updateDraft("timelineText", event.target.value)} placeholder="Срок старта, этапы и дата готовности" /></label>
            <label><span>Права использования</span><textarea rows={3} value={draft.rightsText} onChange={(event) => updateDraft("rightsText", event.target.value)} placeholder="Где и как клиент сможет использовать материалы" /></label>
            <label><span>Условия и ограничения</span><textarea rows={3} value={draft.limitationsText} onChange={(event) => updateDraft("limitationsText", event.target.value)} placeholder="Что не входит, зависимости и важные условия" /></label>
            <label><span>Следующий шаг</span><textarea rows={3} value={draft.nextStepText} onChange={(event) => updateDraft("nextStepText", event.target.value)} placeholder="Что клиенту нужно сделать, чтобы начать" /></label>
          </div>

          <aside className={styles.proposalDocumentPanel}>
            <div className={styles.panelHeading}><div><span>Готово для отправки</span><h2>Клиентская версия</h2></div><button type="button" onClick={() => void copyDocument()}>Копировать</button></div>
            <textarea rows={24} value={draft.clientDocument} onChange={(event) => updateDraft("clientDocument", event.target.value)} placeholder="Нажмите «Собрать клиентский текст» или напишите финальную версию вручную." />
            <label><span>Внутренние заметки — клиент их не увидит</span><textarea rows={7} value={draft.internalNotes} onChange={(event) => updateDraft("internalNotes", event.target.value)} placeholder="Риски, аргументы для переговоров, предел скидки и договорённости" /></label>
            {!creating && <div className={styles.proposalAuditHint}>Сохранение создаст новую версию и запись в журнале изменений.</div>}
          </aside>
        </section>
      </form>
    </div>
  );
}
