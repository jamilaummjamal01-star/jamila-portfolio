# Обновление «Обо мне»

Текст адаптирован из «Брендбук_Джамиля_Шакурова(3).pdf» (найденный экземпляр от 03.08.2026), страницы 2 «Кто я»/«Миссия» и 8 «Ценности». Текущее позиционирование AI-креативного продюсера и локальные Nauryz / No Name 37 сохранены согласно более позднему заданию на сайт.

Для этой секции отдельно создана новая композиция с тюльпанами: в брендбуке тюльпан назван фирменным символом, связанным с татарским орнаментом. Изображение создано встроенным imagegen, сохранено с прозрачным фоном и экспортировано в `public/images/about-tulips.webp` (1024 × 1536, RGBA, 189932 байт). Цветы находятся в потоке отдельного блока и не перекрывают цитату. Фон — точный Powder #EECDD6, текст — Mocha #4A3427.

Проверка: npm run lint; npm test, включающий npm run build (3/3). Browser QA: iframe шириной 320 / 390 / 768 px и desktop 1348 px. Изображение загружено, между ним и цитатой положительный отступ, horizontal overflow отсутствует. Скриншоты: `docs/screenshots/about-mobile.jpg`, `docs/screenshots/about-desktop.jpg`.

## Промпт изображения

Use case: photorealistic-natural. Asset type: transparent botanical cutout for the About section of Jamila Shakurova's premium editorial portfolio website. Primary request: a completely new, realistic flower composition using TULIPS, the brand's heritage symbol, NOT ranunculus. Three elegant natural tulips: one softly opened powder pink bloom, one warm cream bloom, one smaller pale pink closed bud. Fine translucent petals with believable veining, tactile satin texture, natural slight asymmetry. Long slender green-olive stems and only two sculptural curved leaves. Sparse asymmetrical arrangement, gently leaning from lower left toward upper right, stems visible all the way down. Composition: portrait 2:3 canvas; flowers occupy central 70% width and middle 85% height, leave clean 8% padding on every edge, no cropped blooms or stems. Premium botanical studio photograph, soft large window light from upper left, delicate highlights and shadow modelling, true fine botanical details, no hard contrast. Brand palette: Powder #EECDD6 petals, Butter #FDEFBE cream petals, Olive #767F30 stems/leaves, natural light variations within those colors. This will be laid over a flat Powder background by code, so background must be genuinely TRANSPARENT, preserve clean alpha around leaves and petals. No background surface, no pot, no vase, no table, no frame, no shadows outside the flowers. No text, no words, no monogram, no logo, no watermarks. No humans, faces, animals, mystical symbolism, vector drawings, abstract circles, artificial plastic blooms, cheap stock bouquet appearance. Quiet luxury, understated editorial botanical naturalism.

## Ограничения

Без людей, лиц, музыки, мистической символики, текста, логотипов и водяных знаков. Без векторных заменителей, пластиковых цветов, вазы и фона. Прозрачность сохранена при WebP-экспорте.
