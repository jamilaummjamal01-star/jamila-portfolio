import Image from "next/image";
import { links } from "@/data/business-card";
import InstagramNotice from "./InstagramNotice";
const projects = [
  { number: "01", type: "AI / ПРЕДМЕТНЫЙ ВИЗУАЛ", title: "Естественная фактура", text: "Предметная композиция, свет и атмосфера для beauty-визуала.", src: "/images/projects/botanical-beauty.webp", alt: "Предметная композиция косметики в мягком естественном свете", className: "project-featured" },
  { number: "02", type: "AI / ВИЗУАЛЬНАЯ КОНЦЕПЦИЯ", title: "Тихая эстетика", text: "Композиция и предметный визуал для свечи в форме ракушки.", src: "/images/projects/seashell-candle.webp", alt: "Свеча в форме ракушки в мягком предметном свете", className: "project-candle" },
  { number: "03", type: "AI / ИЛЛЮСТРАЦИЯ", title: "Характер в деталях", text: "Разработка живописного стиля и образа без черт лица.", src: "/images/projects/samir.webp", alt: "Безликий персонаж в оливковой и охристой живописной палитре", className: "project-illustration" },
];
export default function Projects() {
  return <section className="section projects" id="projects" aria-labelledby="projects-title">
    <p className="eyebrow">03 / SELECTED PROJECTS</p>
    <div className="section-heading" data-reveal><h2 id="projects-title">РАБОТЫ, ГДЕ ВИЗУАЛ<br />РЕШАЕТ ЗАДАЧУ</h2>
      <p>Внимание к продукту, характеру и деталям — в каждом выбранном образе.</p></div>
    <div className="project-grid">{projects.map((project) => <article className={`project-card ${project.className}`} key={project.number} data-reveal>
      <div className="project-image"><Image src={project.src} alt={project.alt} width={1000} height={1200} unoptimized sizes="(max-width: 700px) 90vw, 45vw" /></div>
      <div className="project-caption"><span className="micro">{project.number} / {project.type}</span><h3>{project.title}</h3><p>{project.text}</p></div>
    </article>)}</div>
    <a className="button button-powder" href={links.instagram} target="_blank" rel="noopener noreferrer" aria-describedby="projects-instagram-notice"><span>Больше работ в Instagram<sup>*</sup></span> <span aria-hidden="true">↗</span></a>
    <InstagramNotice id="projects-instagram-notice" />
  </section>;
}
