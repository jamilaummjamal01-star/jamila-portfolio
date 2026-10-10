import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Джамиля Шакурова — AI-креативный продюсер | Визуал, дизайн, digital",
  description: "AI-визуалы и ролики, сайты, презентации, PDF и визуальные системы для бизнеса. Тихая эстетика. Точная система. Этика в каждой детали.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Джамиля Шакурова — AI-креативный продюсер",
    description: "AI, визуал, контент и digital — в одной системе под задачу вашего бизнеса.",
    type: "website", locale: "ru_RU", siteName: "Джамиля Шакурова",
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
