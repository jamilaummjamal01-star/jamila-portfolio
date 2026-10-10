import { processSteps } from "@/data/business-card";
export default function Process() {
  return <section className="section process" id="approach" aria-labelledby="process-title">
    <div data-reveal><p className="eyebrow">04 / ПРОЦЕСС</p><h2 id="process-title">ОТ ЗАДАЧИ<br />К ГОТОВОЙ СИСТЕМЕ</h2>
      <p className="process-intro">Спокойный диалог, понятные шаги и внимание к деталям. Так идея превращается в рабочее решение.</p></div>
    <ol className="process-list">{processSteps.map(([title, text], index) => <li key={title} data-reveal><span className="micro">0{index + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
  </section>;
}
