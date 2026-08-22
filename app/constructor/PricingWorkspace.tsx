"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./constructor.module.css";

type PricingClient = { id: string; name: string; crmStatus: string; priority: string };
type PricingTariff = { id: string; name: string; category: string; unit: string; workingRate: number; minimumRate: number; rateStatus: string };
type RecentCalculation = { id: string; title: string; clientName: string | null; status: string; currency: string; total: number; itemCount: number; updatedAt: string };
type PricingBootstrap = { clients: PricingClient[]; tariffs: PricingTariff[]; recent: RecentCalculation[] };
type ErrorPayload = { error?: { message?: string } };

type Line = {
  id: string;
  tariffId: string;
  name: string;
  unit: string;
  quantity: number;
  manualRate: number;
  tariffRate: number;
  complexityCoefficient: number;
  sourceCoefficient: number;
  urgencyCoefficient: number;
  rightsCoefficient: number;
  itemDiscountPercent: number;
  fixedCost: number;
  hours: number;
  internalHourRate: number;
  externalCost: number;
  comment: string;
};

type CalculationResponse = {
  calculation: {
    id: string;
    title: string;
    clientName: string | null;
    subtotal: number;
    afterDiscount: number;
    total: number;
    prepayment: number;
    prepaymentPercent: number;
    discountPercent: number;
    minimumPrice: number;
    validUntil: string | null;
    updatedAt: string;
  };
  items: Array<Line & { total: number }>;
};

type PricingWorkspaceProps = { onToast: (message: string) => void };

const serviceSuggestions = [
  "Аудит и стратегия",
  "Концепция и арт-дирекшн",
  "Генерация ключевого визуала",
  "Серия визуалов",
  "Дизайн карточки товара",
  "Адаптация под формат",
  "Ретушь и доработка",
  "Подготовка исходников",
  "Дополнительный круг правок",
  "Передача расширенных прав",
];

const projectTypes = [
  ["individual", "Индивидуальный"],
  ["test", "Тестовый"],
  ["main", "Основной"],
  ["system", "Система контента"],
  ["recurring", "Регулярный"],
] as const;

function emptyLine(id = "initial"): Line {
  return {
    id,
    tariffId: "",
    name: "",
    unit: "услуга",
    quantity: 1,
    manualRate: 0,
    tariffRate: 0,
    complexityCoefficient: 1,
    sourceCoefficient: 1,
    urgencyCoefficient: 1,
    rightsCoefficient: 1,
    itemDiscountPercent: 0,
    fixedCost: 0,
    hours: 0,
    internalHourRate: 0,
    externalCost: 0,
    comment: "",
  };
}

function money(value: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value || 0);
}

function lineTotal(line: Line): number {
  const rate = line.manualRate > 0 ? line.manualRate : line.tariffRate;
  const production = line.quantity * rate * line.complexityCoefficient * line.sourceCoefficient * line.urgencyCoefficient * line.rightsCoefficient;
  const beforeDiscount = production + line.fixedCost + line.hours * line.internalHourRate + line.externalCost;
  return Math.max(0, beforeDiscount * (1 - line.itemDiscountPercent / 100));
}

function displayDate(value: string | null): string {
  if (!value) return "Без срока";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

export default function PricingWorkspace({ onToast }: PricingWorkspaceProps) {
  const [bootstrap, setBootstrap] = useState<PricingBootstrap>({ clients: [], tariffs: [], recent: [] });
  const [title, setTitle] = useState("Расчёт проекта");
  const [clientId, setClientId] = useState("");
  const [projectType, setProjectType] = useState("individual");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [manualAdjustment, setManualAdjustment] = useState(0);
  const [minimumPrice, setMinimumPrice] = useState(0);
  const [externalProjectCost, setExternalProjectCost] = useState(0);
  const [prepaymentPercent, setPrepaymentPercent] = useState(50);
  const [validUntil, setValidUntil] = useState("");
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState<CalculationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/constructor/pricing/bootstrap", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error(await responseError(response));
      setBootstrap((await response.json()) as PricingBootstrap);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить калькулятор.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => cancelled ? undefined : loadBootstrap());
    return () => { cancelled = true; };
  }, [loadBootstrap]);

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + lineTotal(line), 0), [lines]);
  const afterDiscount = subtotal * (1 - discountPercent / 100);
  const calculatedTotal = afterDiscount + manualAdjustment + externalProjectCost;
  const total = Math.max(0, minimumPrice, calculatedTotal);
  const prepayment = total * prepaymentPercent / 100;

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
    setSaved(null);
  }

  function applyTariff(id: string, tariffId: string) {
    const tariff = bootstrap.tariffs.find((item) => item.id === tariffId);
    if (!tariff) {
      updateLine(id, { tariffId: "", tariffRate: 0 });
      return;
    }
    updateLine(id, {
      tariffId: tariff.id,
      name: tariff.name,
      unit: tariff.unit,
      tariffRate: tariff.workingRate,
      manualRate: tariff.workingRate,
    });
  }

  function addLine() {
    setLines((current) => [...current, emptyLine(crypto.randomUUID())]);
  }

  function removeLine(id: string) {
    setLines((current) => current.length === 1 ? [emptyLine()] : current.filter((line) => line.id !== id));
    setSaved(null);
  }

  async function saveCalculation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lines.some((line) => !line.name.trim())) {
      setError("Заполните название каждой позиции расчёта.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/constructor/calculations", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          clientId,
          projectType,
          discountPercent,
          manualAdjustment,
          minimumPrice,
          externalProjectCost,
          prepaymentPercent,
          validUntil: validUntil || "",
          comment,
          items: lines,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setSaved((await response.json()) as CalculationResponse);
      await loadBootstrap();
      onToast("Расчёт сохранён в D1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить расчёт.");
    } finally {
      setSaving(false);
    }
  }

  async function openCalculation(id: string) {
    setError("");
    try {
      const response = await fetch(`/api/constructor/calculations/${encodeURIComponent(id)}`, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error(await responseError(response));
      setSaved((await response.json()) as CalculationResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось открыть расчёт.");
    }
  }

  return (
    <div className={styles.pricingWorkspace}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Калькулятор</p>
          <h1>Стоимость и объём работ</h1>
          <p className={styles.clientIntro}>Рабочий расчёт без скрытых формул: каждую ставку и коэффициент можно проверить.</p>
        </div>
        <div className={styles.pricingHeadlineTotal}><span>Итого</span><strong>{money(total)}</strong><small>предоплата {money(prepayment)}</small></div>
      </header>

      {error && <div className={styles.errorPanel}>{error}</div>}

      <form className={styles.pricingLayout} onSubmit={saveCalculation}>
        <section className={styles.pricingMain}>
          <div className={styles.pricingProjectFields}>
            <label><span>Название расчёта</span><input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
            <label><span>Клиент</span><select value={clientId} onChange={(event) => setClientId(event.target.value)} disabled={loading}><option value="">Без привязки</option>{bootstrap.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
            <label><span>Тип проекта</span><select value={projectType} onChange={(event) => setProjectType(event.target.value)}>{projectTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Расчёт действует до</span><input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></label>
          </div>

          <div className={styles.pricingSectionHeading}><div><span>Состав работ</span><h2>Позиции расчёта</h2></div><button className={styles.secondaryButton} type="button" onClick={addLine}>+ Добавить позицию</button></div>

          <div className={styles.pricingLines}>
            {lines.map((line, index) => (
              <article className={styles.pricingLine} key={line.id}>
                <div className={styles.pricingLineHeader}>
                  <strong>{index + 1}. {line.name || "Новая позиция"}</strong>
                  <span>{money(lineTotal(line))}</span>
                  <button type="button" onClick={() => removeLine(line.id)} aria-label="Удалить позицию">×</button>
                </div>
                {bootstrap.tariffs.length > 0 && <label className={styles.pricingWide}><span>Рабочий тариф</span><select value={line.tariffId} onChange={(event) => applyTariff(line.id, event.target.value)}><option value="">Ручной расчёт</option>{bootstrap.tariffs.map((tariff) => <option key={tariff.id} value={tariff.id}>{tariff.category} · {tariff.name} · {money(tariff.workingRate)}</option>)}</select></label>}
                <div className={styles.pricingLineGrid}>
                  <label className={styles.pricingLineName}><span>Услуга</span><input list="constructor-services" value={line.name} onChange={(event) => updateLine(line.id, { name: event.target.value })} placeholder="Например, серия визуалов" required /></label>
                  <label><span>Единица</span><input value={line.unit} onChange={(event) => updateLine(line.id, { unit: event.target.value })} /></label>
                  <label><span>Количество</span><input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })} /></label>
                  <label><span>Ставка, ₽</span><input type="number" min="0" step="100" value={line.manualRate} onChange={(event) => updateLine(line.id, { manualRate: Number(event.target.value) })} /></label>
                  <label><span>Сложность</span><select value={line.complexityCoefficient} onChange={(event) => updateLine(line.id, { complexityCoefficient: Number(event.target.value) })}><option value="1">Обычная ×1</option><option value="1.25">Повышенная ×1,25</option><option value="1.5">Высокая ×1,5</option><option value="2">Особая ×2</option></select></label>
                  <label><span>Исходники</span><select value={line.sourceCoefficient} onChange={(event) => updateLine(line.id, { sourceCoefficient: Number(event.target.value) })}><option value="1">Готовы ×1</option><option value="1.15">Нужна подготовка ×1,15</option><option value="1.3">Нужно собрать ×1,3</option></select></label>
                  <label><span>Срочность</span><select value={line.urgencyCoefficient} onChange={(event) => updateLine(line.id, { urgencyCoefficient: Number(event.target.value) })}><option value="1">Планово ×1</option><option value="1.25">Срочно ×1,25</option><option value="1.5">Очень срочно ×1,5</option></select></label>
                  <label><span>Права</span><select value={line.rightsCoefficient} onChange={(event) => updateLine(line.id, { rightsCoefficient: Number(event.target.value) })}><option value="1">Базовые ×1</option><option value="1.2">Расширенные ×1,2</option><option value="1.5">Эксклюзивные ×1,5</option></select></label>
                  <label><span>Скидка, %</span><input type="number" min="0" max="100" value={line.itemDiscountPercent} onChange={(event) => updateLine(line.id, { itemDiscountPercent: Number(event.target.value) })} /></label>
                  <label><span>Внешние расходы, ₽</span><input type="number" min="0" step="100" value={line.externalCost} onChange={(event) => updateLine(line.id, { externalCost: Number(event.target.value) })} /></label>
                  <label><span>Часы</span><input type="number" min="0" step="0.5" value={line.hours} onChange={(event) => updateLine(line.id, { hours: Number(event.target.value) })} /></label>
                  <label><span>Внутренняя ставка/час</span><input type="number" min="0" step="100" value={line.internalHourRate} onChange={(event) => updateLine(line.id, { internalHourRate: Number(event.target.value) })} /></label>
                </div>
              </article>
            ))}
          </div>
          <datalist id="constructor-services">{serviceSuggestions.map((service) => <option key={service} value={service} />)}</datalist>
        </section>

        <aside className={styles.pricingSidebar}>
          <section className={styles.pricingSummary}>
            <p className={styles.eyebrow}>Итог проекта</p>
            <dl>
              <div><dt>Позиции</dt><dd>{money(subtotal)}</dd></div>
              <div><dt>После скидки</dt><dd>{money(afterDiscount)}</dd></div>
              <div><dt>Внешние расходы</dt><dd>{money(externalProjectCost)}</dd></div>
              <div><dt>Корректировка</dt><dd>{money(manualAdjustment)}</dd></div>
              <div><dt>Минимальная цена</dt><dd>{money(minimumPrice)}</dd></div>
              <div className={styles.pricingFinal}><dt>Итого</dt><dd>{money(total)}</dd></div>
              <div><dt>Предоплата</dt><dd>{money(prepayment)}</dd></div>
            </dl>
            <div className={styles.pricingControls}>
              <label><span>Общая скидка, %</span><input type="number" min="0" max="100" value={discountPercent} onChange={(event) => setDiscountPercent(Number(event.target.value))} /></label>
              <label><span>Корректировка, ₽</span><input type="number" step="100" value={manualAdjustment} onChange={(event) => setManualAdjustment(Number(event.target.value))} /></label>
              <label><span>Минимальная цена, ₽</span><input type="number" min="0" step="100" value={minimumPrice} onChange={(event) => setMinimumPrice(Number(event.target.value))} /></label>
              <label><span>Общие внешние расходы, ₽</span><input type="number" min="0" step="100" value={externalProjectCost} onChange={(event) => setExternalProjectCost(Number(event.target.value))} /></label>
              <label><span>Предоплата, %</span><input type="number" min="0" max="100" value={prepaymentPercent} onChange={(event) => setPrepaymentPercent(Number(event.target.value))} /></label>
              <label><span>Комментарий</span><textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Что важно учесть в предложении" /></label>
            </div>
            <button className={styles.primaryButton} type="submit" disabled={saving}>{saving ? "Сохраняю…" : "Сохранить расчёт"}</button>
          </section>

          {saved && <section className={styles.pricingSaved}><span>Сохранено в D1</span><h2>{saved.calculation.title}</h2><strong>{money(saved.calculation.total)}</strong><p>Предоплата: {money(saved.calculation.prepayment)} · {saved.items.length} позиций</p><small>{saved.calculation.clientName || "Без привязки к клиенту"}</small></section>}

          <section className={styles.pricingRecent}>
            <div className={styles.pricingSectionHeading}><div><span>История</span><h2>Последние расчёты</h2></div></div>
            {bootstrap.recent.length === 0 ? <p className={styles.clientHistoryEmpty}>Сохранённых расчётов пока нет.</p> : bootstrap.recent.map((item) => <button key={item.id} type="button" onClick={() => void openCalculation(item.id)}><span><strong>{item.title}</strong><small>{item.clientName || "Без клиента"} · {displayDate(item.updatedAt)}</small></span><b>{money(item.total)}</b></button>)}
          </section>
        </aside>
      </form>
    </div>
  );
}
