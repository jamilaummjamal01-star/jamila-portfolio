import Image from "next/image";
export default function About() {
  return <section className="about" id="about" aria-labelledby="about-title">
    <div className="about-visual"><p className="eyebrow">05 / ОБО МНЕ</p><Image src="/images/ranunculus.png" alt="" width={917} height={900} unoptimized />
      <p className="about-quote">Тихая эстетика.<br />Точная система.<br />Этика в каждой детали.</p></div>
    <div className="about-copy" data-reveal><p className="eyebrow">JAMILA SHAKUROVA</p><h2 id="about-title">ТЕХНОЛОГИИ —<br />НЕ РАДИ ТЕХНОЛОГИЙ</h2>
      <p>Я работаю на стыке AI, визуала, контента, дизайна, digital и бизнес-задач. Мне важно, чтобы красивый образ был связан с тем, что вы хотите сказать и кому он адресован.</p>
      <p>ИИ не заменяет характер бренда, а помогает точнее его выразить. Поэтому в основе моей работы — смысл, внимательное отношение к людям и этика в каждой детали.</p>
      <ul className="about-tags" aria-label="Направления экспертизы">{["AI CREATIVE PRODUCER", "DESIGN", "CONTENT PRODUCTION", "VISUAL SYSTEMS", "AI FOR BUSINESS"].map((tag) => <li key={tag}>{tag}</li>)}</ul>
    </div>
  </section>;
}
