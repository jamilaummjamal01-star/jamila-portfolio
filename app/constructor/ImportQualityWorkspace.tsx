"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./constructor.module.css";

type PreviewItem = {
  itemType: string;
  category: string;
  title: string;
  status: "draft" | "review";
  nicheSlugs: string[];
  stageSlugs: string[];
  [key: string]: unknown;
};

type PreviewRow = {
  row: number;
  state: "ready" | "duplicate" | "error";
  errors: string[];
  warnings: string[];
  item: PreviewItem | null;
};

type PreviewResponse = {
  rows: PreviewRow[];
  counts: { total: number; ready: number; duplicate: number; error: number };
};

type QualityIssue = {
  key: string;
  title: string;
  description: string;
  count: number;
  samples: { id: string; title: string }[];
};

type MatrixRow = {
  slug: string;
  name: string;
  approved: number | string;
  questions: number | string;
  answers: number | string;
  risks: number | string;
};

type ImportBatch = {
  id: string;
  source_kind: string;
  source_reference: string | null;
  status: string;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  error_rows: number;
  created_at: string;
  completed_at: string | null;
};

type QualityResponse = {
  summary: Record<string, number>;
  issues: QualityIssue[];
  matrix: MatrixRow[];
  recentImports: ImportBatch[];
};

type ErrorPayload = { error?: { message?: string } };

const sourceLabels: Record<string, string> = {
  notion: "Notion",
  json: "JSON",
  csv: "CSV",
};

const stateLabels: Record<PreviewRow["state"], string> = {
  ready: "Готово",
  duplicate: "Дубль",
  error: "Ошибка",
};

function displayDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.error?.message || `Ошибка ${response.status}`;
  } catch {
    return `Ошибка ${response.status}`;
  }
}

export default function ImportQualityWorkspace({ onToast }: { onToast: (message: string) => void }) {
  const [quality, setQuality] = useState<QualityResponse | null>(null);
  const [qualityError, setQualityError] = useState("");
  const [qualityLoading, setQualityLoading] = useState(true);
  const [sourceKind, setSourceKind] = useState("notion");
  const [sourceReference, setSourceReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [importError, setImportError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const loadQuality = useCallback(async () => {
    setQualityLoading(true);
    setQualityError("");
    try {
      const response = await fetch("/api/constructor/quality", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      setQuality((await response.json()) as QualityResponse);
    } catch (error) {
      setQualityError(error instanceof Error ? error.message : "Не удалось проверить качество базы");
    } finally {
      setQualityLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadQuality(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadQuality]);

  const readyItems = useMemo(
    () => preview?.rows.filter((row): row is PreviewRow & { item: PreviewItem } => row.state === "ready" && Boolean(row.item)).map((row) => row.item) ?? [],
    [preview],
  );

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setPreview(null);
    setImportError("");
  }

  async function previewFile() {
    if (!file) return;
    setPreviewing(true);
    setImportError("");
    setPreview(null);
    try {
      if (file.size > 2_000_000) throw new Error("Файл должен быть не больше 2 МБ");
      const content = await file.text();
      const format = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
      const response = await fetch("/api/constructor/import/preview", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, format }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setPreview((await response.json()) as PreviewResponse);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Не удалось проверить файл");
    } finally {
      setPreviewing(false);
    }
  }

  async function confirmImport() {
    if (readyItems.length === 0) return;
    setConfirming(true);
    setImportError("");
    try {
      const response = await fetch("/api/constructor/import/confirm", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceKind, sourceReference, items: readyItems }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const result = (await response.json()) as { imported: number; skipped: number };
      onToast(`Импортировано записей: ${result.imported}`);
      setPreview(null);
      setFile(null);
      await loadQuality();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Не удалось выполнить импорт");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Контроль данных</p>
          <h1>Импорт и качество</h1>
          <p className={styles.workspaceIntro}>Проверяйте новые материалы до загрузки и следите за полнотой рабочей базы.</p>
        </div>
        <a className={styles.secondaryLinkButton} href="/api/constructor/export" download>
          Скачать резервную копию
        </a>
      </header>

      {qualityError && <div className={styles.errorPanel}>{qualityError}</div>}

      <section className={styles.qualityOverview} aria-busy={qualityLoading}>
        <article>
          <span>Активных записей</span>
          <strong>{qualityLoading ? "—" : quality?.summary.total ?? 0}</strong>
        </article>
        <article>
          <span>Утверждено</span>
          <strong>{qualityLoading ? "—" : quality?.summary.approved ?? 0}</strong>
        </article>
        <article>
          <span>Требуют внимания</span>
          <strong>{qualityLoading ? "—" : quality?.issues.filter((issue) => issue.count > 0).length ?? 0}</strong>
        </article>
        <article>
          <span>Последний импорт</span>
          <strong className={styles.qualityDate}>{qualityLoading ? "—" : displayDate(quality?.recentImports[0]?.completed_at ?? null)}</strong>
        </article>
      </section>

      <section className={styles.importPanel}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Безопасная загрузка</p>
            <h2>Добавить записи из JSON или CSV</h2>
          </div>
          <span>До 100 строк · до 2 МБ</span>
        </div>

        <div className={styles.importControls}>
          <label>
            <span>Источник</span>
            <select value={sourceKind} onChange={(event) => setSourceKind(event.target.value)}>
              <option value="notion">Экспорт из Notion</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </label>
          <label>
            <span>Название или ссылка на источник</span>
            <input value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} placeholder="Например: База ответов, август 2026" />
          </label>
          <label className={styles.importFileField}>
            <span>Файл</span>
            <input type="file" accept=".json,.csv,application/json,text/csv" onChange={chooseFile} />
            <small>{file ? `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} КБ` : "Выберите JSON или CSV"}</small>
          </label>
          <button className={styles.primaryButton} type="button" disabled={!file || previewing || confirming} onClick={() => void previewFile()}>
            {previewing ? "Проверяю…" : "Проверить файл"}
          </button>
        </div>

        <details className={styles.importHelp}>
          <summary>Какие колонки распознаются</summary>
          <p>Минимум: <b>тип записи</b>, <b>категория</b> и <b>название</b>. Также можно передать вопрос, короткий и подробный ответ, следующий шаг, риск, нишу, этап и ссылку на источник. Названия колонок можно писать по-русски или по-английски.</p>
        </details>

        {importError && <div className={styles.errorPanel}>{importError}</div>}

        {preview && (
          <div className={styles.importPreview}>
            <div className={styles.importSummary}>
              <span>Всего <strong>{preview.counts.total}</strong></span>
              <span className={styles.importReady}>Готово <strong>{preview.counts.ready}</strong></span>
              <span className={styles.importDuplicate}>Дубли <strong>{preview.counts.duplicate}</strong></span>
              <span className={styles.importError}>Ошибки <strong>{preview.counts.error}</strong></span>
              <button className={styles.primaryButton} type="button" disabled={readyItems.length === 0 || confirming} onClick={() => void confirmImport()}>
                {confirming ? "Импортирую…" : `Импортировать ${readyItems.length}`}
              </button>
            </div>
            <div className={styles.importTableWrap}>
              <table className={styles.importTable}>
                <thead>
                  <tr><th>Строка</th><th>Статус</th><th>Название</th><th>Категория</th><th>Комментарий</th></tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.row}>
                      <td>{row.row}</td>
                      <td><span className={`${styles.importState} ${styles[`importState_${row.state}`]}`}>{stateLabels[row.state]}</span></td>
                      <td>{row.item?.title || "—"}</td>
                      <td>{row.item?.category || "—"}</td>
                      <td>{[...row.errors, ...row.warnings].join(" · ") || "Проверка пройдена"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className={styles.qualityPanel}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Автоматическая проверка</p>
            <h2>Что требует внимания</h2>
          </div>
          <button className={styles.resetButton} type="button" disabled={qualityLoading} onClick={() => void loadQuality()}>Обновить</button>
        </div>
        <div className={styles.qualityIssueGrid}>
          {quality?.issues.map((issue) => (
            <article className={issue.count > 0 ? styles.qualityIssueActive : styles.qualityIssueClean} key={issue.key}>
              <div><strong>{issue.count}</strong><span>{issue.count > 0 ? "проверить" : "в порядке"}</span></div>
              <h3>{issue.title}</h3>
              <p>{issue.description}</p>
              {issue.samples.length > 0 && <small>{issue.samples.map((sample) => sample.title).join(" · ")}</small>}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.qualityPanel}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Покрытие базы</p>
            <h2>Материалы по нишам</h2>
          </div>
        </div>
        <div className={styles.importTableWrap}>
          <table className={styles.importTable}>
            <thead><tr><th>Ниша</th><th>Утверждено</th><th>Вопросы</th><th>Ответы</th><th>Риски</th></tr></thead>
            <tbody>
              {quality?.matrix.map((row) => (
                <tr key={row.slug}><td><strong>{row.name}</strong></td><td>{Number(row.approved)}</td><td>{Number(row.questions)}</td><td>{Number(row.answers)}</td><td>{Number(row.risks)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.qualityPanel}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>История</p>
            <h2>Последние импорты</h2>
          </div>
        </div>
        {quality?.recentImports.length ? (
          <div className={styles.importHistory}>
            {quality.recentImports.map((batch) => (
              <article key={batch.id}>
                <div><strong>{sourceLabels[batch.source_kind] || batch.source_kind}</strong><span>{batch.source_reference || "Без названия"}</span></div>
                <span>Добавлено {batch.imported_rows} из {batch.total_rows}</span>
                <time>{displayDate(batch.completed_at || batch.created_at)}</time>
              </article>
            ))}
          </div>
        ) : <p className={styles.qualityEmpty}>Импортов пока не было.</p>}
      </section>
    </>
  );
}
