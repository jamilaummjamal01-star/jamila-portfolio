"use client";
import { services } from "@/data/business-card";
import { useServices } from "./ServiceProvider";

export default function ServiceCards({ variant }: { variant: "hero" | "section" }) {
  const open = useServices();
  return <div className={`${variant}-services`}>
    {services.map((service, index) => <button className={`service-card service-card-${index + 1}`} key={service.number}
      onClick={() => open(service.number)} aria-haspopup="dialog" aria-label={`${service.number} ${service.title}: ${service.summary}`}>
      <span className="card-top"><span>{service.number}</span><span aria-hidden="true">↗</span></span>
      <strong>{service.title}</strong><span className="card-summary">{service.summary}</span>
      {variant === "section" && <span className="card-open">ОТКРЫТЬ <span aria-hidden="true">↗</span></span>}
    </button>)}
  </div>;
}
