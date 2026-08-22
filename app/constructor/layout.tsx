import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Конструктор общения с клиентами",
  description: "Закрытая рабочая система Джамили Шакуровой",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ConstructorLayout({ children }: { children: ReactNode }) {
  return children;
}
