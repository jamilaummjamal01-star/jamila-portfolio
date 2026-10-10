import ServiceCards from "./ServiceCards";
export default function CreativeOS() {
  return <section className="section creative-os" id="services" aria-labelledby="os-title">
    <p className="eyebrow">01 / НАПРАВЛЕНИЯ РАБОТЫ</p>
    <div className="section-heading" data-reveal><h2 id="os-title">ОДНА ИДЕЯ —<br />ЦЕЛАЯ СИСТЕМА</h2>
      <p>Сначала понимаю задачу бизнеса, затем собираю вокруг неё связную визуальную систему. Образ, контент и цифровые продукты работают вместе.</p></div>
    <div data-reveal><ServiceCards variant="section" /></div>
    <div className="section-end micro"><span>ИДЕЯ · ВИЗУАЛ · СИСТЕМА · РЕЗУЛЬТАТ</span><span>ЧЕТЫРЕ НАПРАВЛЕНИЯ. ОДИН ПОДХОД.</span></div>
  </section>;
}
