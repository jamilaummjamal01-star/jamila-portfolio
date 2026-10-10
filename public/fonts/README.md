# Локальные брендовые шрифты

Файлы предоставлены автором. Name tables и OS/2 проверены fontTools перед подключением.

| Файл | Внутреннее семейство (name ID 1) | Стиль (ID 2) | Вес (OS/2 usWeightClass) | PostScript name (ID 6) |
| --- | --- | --- | --- | --- |
| NAURYZREDKEDS.ttf | NauryzRedKeds | Bold | 700 | NauryzRedKeds |
| no_name_37_Regular.otf | no_name_37 | Regular | 400 | no_name_37 |
| no_name_37_Light.otf | no_name_37 | Light | 350 | no_name_37_Light |

Все файлы статические, normal, поддерживают русский текст. Light имеет вес **350**, а не 300. Других весов не заявлено.

Nauryz используется для живого h1 с именем, display-заголовков и названий продуктов/проектов. No Name 37 Regular — интерфейс, основной текст, карточки и кнопки; Light — вступительные тексты секций. @font-face находится в app/globals.css, font-display: swap. font-synthesis: none предотвращает искусственные начертания. Generic sans-serif остается только системным fallback на время загрузки.

Исходный SVG имени из Figma сохранен как референс; h1 больше не заменяется изображением.
