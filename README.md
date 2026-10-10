# Джамиля Шакурова — сайт-визитка

Одностраничный сайт AI-креативного продюсера: Creative OS, продукты, избранные работы, процесс, позиционирование и контакты.

## Разработка и проверка

```bash
npm ci
npm run dev
npm run lint
npm run build
npm test
```

Сохранены Next.js 16, React 19, TypeScript, Vinext + Vite и Cloudflare Worker. `npm test` собирает приложение и проверяет реальный HTML через Worker entry point.

## Интерфейс

- `app/page.tsx` собирает секции из `components/`.
- `data/business-card.ts` содержит четыре направления, навигацию, контакты и шаги процесса.
- Один `ServiceOverlay` обслуживает все карточки; переключение не меняет маршрут. Native dialog блокирует фон, поддерживает клавиатуру, возвращает фокус и сохраняет прокрутку.
- Брендовые цвета и адаптивные правила находятся в `app/globals.css`.
- Hero использует локальный прозрачный PNG из Figma и живой текст Nauryz. Локальные NauryzRedKeds (700), No Name 37 Regular (400) и Light (350) подключены через @font-face: подробности в `public/fonts/README.md`.

## Размещение

Существующие `worker/index.ts`, `wrangler.jsonc`, Vite/Vinext-конфигурация и `.github/workflows/deploy.yml` сохранены. Workflow публикует только `main` или запускается вручную. Ветка `redesign/business-card` предназначена для ревью; ее создание не запускает production deployment.

Отчет, ограничения и скриншоты: [docs/redesign-report.md](docs/redesign-report.md).
