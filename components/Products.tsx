import { links } from "@/data/business-card";
export default function Products() {
  return <section className="section products" id="products" aria-labelledby="products-title">
    <p className="eyebrow">02 / ПРОДУКТЫ И ИНСТРУМЕНТЫ</p>
    <div className="section-heading" data-reveal><h2 id="products-title">ТРИ ФОРМАТА —<br />ДЛЯ РАЗНЫХ ЗАДАЧ</h2>
      <p>Авторские инструменты, которые помогают перейти от идеи к следующему шагу.</p></div>
    <div className="product-grid">
      <article className="product-card" data-reveal><div className="card-top micro"><span>01 / ЦИФРОВОЙ ИНСТРУМЕНТ</span><span aria-hidden="true">↗</span></div>
        <h3>КОНСТРУКТОР /<br />ДИАГНОСТИКА</h3><p>Интерактивный инструмент, чтобы определить задачу и выбрать направление работы с контентом.</p>
        <a className="text-link" href={links.diagnostics} target="_blank" rel="noopener noreferrer">Открыть инструмент <span aria-hidden="true">↗</span></a></article>
      <article className="product-card product-private" data-reveal><span className="micro">ЗАКРЫТЫЙ ДОСТУП</span><h3>ЗАКРЫТАЯ СТРАТЕГИЯ</h3>
        <a className="text-link" href={links.telegram} target="_blank" rel="noopener noreferrer">Доступ по запросу <span aria-hidden="true">↗</span></a></article>
      <article className="product-card product-designer" data-reveal><div className="card-top micro"><span>03 / ИНСТРУМЕНТ ДИЗАЙНА</span><span aria-hidden="true">↗</span></div>
        <h3>КАРМАННЫЙ ДИЗАЙНЕР</h3><p>Личное пространство для работы с дизайном: проект, визуальные материалы и редактируемый макет.</p>
        <a className="text-link" href={links.telegram} target="_blank" rel="noopener noreferrer">Узнать о доступе <span aria-hidden="true">↗</span></a></article>
    </div>
    <div className="section-end micro"><span>ИНСТРУМЕНТЫ ДЛЯ РЕАЛЬНЫХ ЗАДАЧ</span><span>СОЗДАНО ДЖАМИЛЕЙ ШАКУРОВОЙ</span></div>
  </section>;
}
