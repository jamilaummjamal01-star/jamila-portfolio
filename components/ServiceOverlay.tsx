"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { links, services, type ServiceNumber } from "@/data/business-card";

export default function ServiceOverlay({ active, onSwitch, onClose }: {
  active: ServiceNumber | null;
  onSwitch: (number: ServiceNumber) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [closing, setClosing] = useState(false);
  const service = services.find((item) => item.number === active);
  const opened = active !== null;

  useEffect(() => {
    if (!opened || !dialog.current) return;
    const element = dialog.current;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      if (timer.current) clearTimeout(timer.current);
      element.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [opened]);

  const requestClose = useCallback(() => {
    if (timer.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setClosing(false);
      onClose();
    }, 400);
  }, [onClose]);

  return (
    <dialog ref={dialog} className={`service-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby="service-title" aria-describedby="service-description"
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}>
      {service && <div className="service-panel">
        <div className="overlay-topline">
          <span className="eyebrow">НАПРАВЛЕНИЯ / {service.number}</span>
          <button ref={closeButton} className="icon-button" onClick={requestClose} aria-label="Закрыть направление">×</button>
        </div>
        <div className="service-switcher" role="group" aria-label="Выбрать направление">
          {services.map((item) => <button key={item.number} aria-pressed={active === item.number}
            onClick={() => onSwitch(item.number)}><span>{item.number}</span>{item.title}</button>)}
        </div>
        <div className="overlay-copy" key={service.number}>
          <p className="overlay-number" aria-hidden="true">{service.number}</p>
          <div>
            <p className="eyebrow">{service.title}</p>
            <h2 id="service-title">{service.headline}</h2>
            <p id="service-description">{service.description}</p>
          </div>
        </div>
        <div className="overlay-details">
          <div><p className="eyebrow">ФОРМАТЫ</p><ul>{service.formats.map((format) => <li key={format}>{format}</li>)}</ul></div>
          <div><p className="eyebrow">РЕЗУЛЬТАТ</p><p>{service.result}</p>
            <a className="button button-primary" href={links.telegram} target="_blank" rel="noopener noreferrer">Обсудить проект <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </div>}
    </dialog>
  );
}
