"use client";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/data/business-card";

export default function Header() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    };
    const onClick = (event: MouseEvent) => {
      if (!menu.current?.contains(event.target as Node) && !toggle.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onClick); };
  }, [open]);
  return <header className="site-header">
    <a className="brand" href="#top" aria-label="Джамиля Шакурова — наверх страницы">
      {/* Exact editorial guide assets exported from Figma. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-spine" src="/images/figma/guide-0.svg" width="1" height="38" alt="" />
      <span className="brand-monogram">JS</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-rule" src="/images/figma/guide-1.svg" width="48" height="1" alt="" />
      <span className="brand-note">КРЕАТИВНЫЕ РЕШЕНИЯ<br />ДЛЯ РЕАЛЬНЫХ ЛЮДЕЙ</span>
    </a>
    <button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? "ЗАКРЫТЬ ×" : "МЕНЮ +"}</button>
    <nav ref={menu} id="main-navigation" className={open ? "is-open" : ""} aria-label="Главная навигация">
      {navigation.map((item) => <a href={item.href} key={item.href} onClick={() => setOpen(false)}>{item.label}</a>)}
      <a className="header-cta" href="#contact" onClick={() => setOpen(false)}>Связаться <span aria-hidden="true">↗</span></a>
    </nav>
  </header>;
}
