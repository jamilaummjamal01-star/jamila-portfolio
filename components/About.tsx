import Image from "next/image";
export default function About() {
  return <section className="about" id="about" aria-labelledby="about-title">
    <div className="about-visual"><p className="eyebrow">05 / ОБО МНЕ</p>
      <div className="about-botanical"><Image src="/images/about-tulip-motion.webp" alt="" width={1024} height={1536} unoptimized sizes="(max-width: 900px) 100vw, 43vw" /></div></div>
    <div className="about-copy" data-reveal><p className="eyebrow">JAMILA SHAKUROVA</p><h2 id="about-title">ТЕХНОЛОГИИ<br />ДЛЯ ЛЮДЕЙ</h2>
      <p>Меня зовут Джамиля Шакурова. Я AI-креативный продюсер: создаю анимационные ролики, предметные визуалы и помогаю экспертам и предпринимателям выстроить цельный образ бренда.</p>
      <p>Я татарка и мусульманка. В моей работе соединяются уважение к традициям, скромность, красота и современные технологии. Мне важно создавать честно, с вниманием к людям и без компромиссов со своими ценностями.</p>
      <p>Работаю на стыке визуального сторителлинга, контента, дизайна и digital. ИИ не заменяет характер бренда, а помогает точнее его выразить — через образ, историю, сайт или визуальную систему.</p>
      <div className="about-mission"><p className="eyebrow">МОЯ МИССИЯ</p><p>Делать ИИ понятным и полезным инструментом для бизнеса и экспертов. Соединять эстетику со смыслом, чтобы за красивой формой стояла реальная задача.</p></div>
      <ul className="about-tags" aria-label="Направления экспертизы">{["AI CREATIVE PRODUCER", "DESIGN", "CONTENT PRODUCTION", "VISUAL SYSTEMS", "AI FOR BUSINESS"].map((tag) => <li key={tag}>{tag}</li>)}</ul>
    </div>
  </section>;
}
