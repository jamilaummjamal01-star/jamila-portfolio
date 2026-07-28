# Джамиля Шакурова — сайт-портфолио

Главная страница AI-креатора и контент-продюсера Джамили Шакуровой.

## Услуги

- нейрофото товаров;
- AI-видео и Reels;
- презентации и PDF-гайды;
- интерактивные конструкторы;
- AI-аватары и анимация;
- визуальные концепции.

## Локальный запуск

```bash
npm ci
npm run dev
```

## Проверка

```bash
npm run lint
npm test
```

## Размещение в Cloudflare Workers

В настройках сборки Cloudflare используйте:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

Конфигурация размещения находится в `wrangler.jsonc`.
