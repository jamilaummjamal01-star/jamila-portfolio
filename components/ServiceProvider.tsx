"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ServiceNumber } from "@/data/business-card";
import ServiceOverlay from "./ServiceOverlay";

const ServiceContext = createContext<((number: ServiceNumber) => void) | null>(null);
export function useServices() {
  const open = useContext(ServiceContext);
  if (!open) throw new Error("Service cards must be inside ServiceProvider");
  return open;
}
export default function ServiceProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ServiceNumber | null>(null);
  const close = useCallback(() => setActive(null), []);
  return (
    <ServiceContext.Provider value={setActive}>
      {children}
      <ServiceOverlay active={active} onSwitch={setActive} onClose={close} />
    </ServiceContext.Provider>
  );
}
