"use client";
import { useEffect } from "react";
export default function Reveal() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || !("IntersectionObserver" in window)) return;
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.remove("reveal-pending"); observer.unobserve(entry.target); }
      });
    }, { threshold: .08 });
    elements.forEach((element, index) => {
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.style.setProperty("--reveal-delay", `${(index % 4) * 100}ms`);
      element.classList.add("reveal-pending"); observer.observe(element);
    });
    const stopMotion = () => { if (media.matches) { observer.disconnect(); elements.forEach((element) => element.classList.remove("reveal-pending")); } };
    media.addEventListener("change", stopMotion);
    return () => { observer.disconnect(); media.removeEventListener("change", stopMotion); elements.forEach((element) => element.classList.remove("reveal-pending")); };
  }, []);
  return null;
}
