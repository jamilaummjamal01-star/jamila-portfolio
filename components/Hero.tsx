"use client";
import { useRef } from "react";
import Image from "next/image";
import ServiceCards from "./ServiceCards";

export default function Hero() {
  const botanical = useRef<HTMLDivElement>(null);
  return <section className="hero" id="top" aria-labelledby="hero-title"
    onPointerMove={(event) => {
      if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const box = event.currentTarget.getBoundingClientRect();
      botanical.current?.style.setProperty("--botanical-x", `${((event.clientX - box.left) / box.width - .5) * 6}px`);
      botanical.current?.style.setProperty("--botanical-y", `${((event.clientY - box.top) / box.height - .5) * 6}px`);
    }} onPointerLeave={() => {
      botanical.current?.style.setProperty("--botanical-x", "0px");
      botanical.current?.style.setProperty("--botanical-y", "0px");
    }}>
    <div className="hero-burgundy" aria-hidden="true" />
    <div className="hero-botanical" ref={botanical} aria-hidden="true">
      <Image src="/images/ranunculus.png" alt="" width={917} height={900} priority unoptimized />
    </div>
    <div className="hero-text-shield" aria-hidden="true" />
    <p className="hero-eyebrow eyebrow">ИИ · КОНТЕНТ · ДИЗАЙН · РЕШЕНИЯ</p>
    <div className="hero-copy">
      <h1 id="hero-title" aria-label="ДЖАМИЛЯ ШАКУРОВА"><span>ДЖАМИЛЯ</span><span>ШАКУРОВА</span></h1>
      <p className="hero-role">Мультидисциплинарный<br />ИИ-креативный продюсер</p>
      <p className="hero-description">Создаю визуалы, ролики, сайты, презентации, документы и дизайн-системы. С помощью ИИ нахожу креативные и практичные решения для бизнеса.</p>
      <div className="hero-actions"><a className="button button-primary" href="#projects">Проекты <span aria-hidden="true">→</span></a>
        <a className="button button-outline" href="#contact">Обсудить проект</a></div>
    </div>
    <p className="hero-sidebar micro" aria-hidden="true">ИДЕИ · ЛЮДИ · ТЕХНОЛОГИИ</p>
    <p className="hero-right-note micro" aria-hidden="true"><span>ВИЗУАЛЫ</span><span>СМЫСЛЫ</span><span>РЕЗУЛЬТАТЫ</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/figma/guide-3.svg" width="90" height="1" alt="" />
    </p>
    <ServiceCards variant="hero" />
    <div className="hero-footer-note micro" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/figma/guide-4.svg" width="1" height="28" alt="" />
      <span>ЭСТЕТИКА,<br />КОТОРАЯ РАБОТАЕТ
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/figma/guide-5.svg" width="44" height="1" alt="" />
      </span>
    </div>
    <div className="hero-footer-role micro" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/figma/guide-6.svg" width="80" height="1" alt="" />ИИ-КРЕАТИВНЫЙ ПРОДЮСЕР
    </div>
  </section>;
}
