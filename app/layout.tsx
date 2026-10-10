import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Джамиля Шакурова — ИИ-креативный продюсер | Визуал, дизайн, цифровые решения",
  description: "ИИ-визуалы и ролики, сайты, презентации, документы и визуальные системы для бизнеса. Тихая эстетика. Точная система. Этика в каждой детали.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Джамиля Шакурова — ИИ-креативный продюсер",
    description: "ИИ, визуал, контент и цифровые продукты — в одной системе под задачу вашего бизнеса.",
    type: "website", locale: "ru_RU", siteName: "Джамиля Шакурова",
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
