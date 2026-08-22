PRAGMA foreign_keys = ON;

-- Review batch 2 of 5: interiors and real estate.
-- Records deliberately remain in review for owner approval in the constructor.

UPDATE knowledge_items
SET
  avoid_text = 'Не смешивать в одном кейсе реализованный объект, каталог и концепцию без понятного обозначения статуса каждого изображения.',
  diagnostic_value = 'Определяет, что именно подтверждает материал: выполненную работу, доступный товар или проектное намерение.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-interior-q1' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не заменять реальные размеры, материалы и комплектацию визуально похожими вариантами без согласования и маркировки.',
  diagnostic_value = 'Фиксирует технические параметры, по которым проверяется соответствие визуала проекту или товару.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-interior-q2' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не публиковать визуализацию среди фотографий портфолио без подписи и не приписывать себе ещё не выполненную работу.',
  diagnostic_value = 'Отделяет подтверждённое портфолио от проектной визуализации и сохраняет прозрачность авторства.',
  red_flag_text = 'Клиент просит выдать концепцию или чужую реализацию за собственный завершённый объект либо скрыть проектный статус изображения.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-interior-ob1' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не растягивать помещение, не убирать несущие элементы и не менять масштаб мебели так, чтобы визуал выглядел реализуемым без проверки.',
  diagnostic_value = 'Выявляет расхождения между привлекательной подачей, реальной геометрией и технической возможностью реализации.',
  red_flag_text = 'Запрошенное изменение противоречит чертежу, конструктивным ограничениям или безопасности, но клиент требует показать его как реальное решение.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-interior-ob2' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не использовать изображения без проверки статуса проекта, авторства, доступности показанных материалов и соответствия комплектации.',
  diagnostic_value = 'Даёт финальную сверку статуса, авторства, технической точности и доступности предложения перед публикацией.',
  red_flag_text = 'Материал скрывает, что объект не реализован, присваивает чужое авторство либо показывает недоступную или технически невозможную комплектацию как выполненную.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-interior-eth1' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не начинать рекламный материал без проверки актуального остатка, стадии объекта и конкретного следующего действия покупателя.',
  diagnostic_value = 'Связывает визуал с реально доступным объектом, стадией строительства и маршрутом обращения.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-realestate-q1' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не использовать устаревшие цены, сроки и условия покупки и не превращать предварительные сведения в гарантированные.',
  diagnostic_value = 'Определяет источник и ответственного за актуальность каждого существенного обещания в рекламе объекта.',
  red_flag_text = 'Сроки, цены, площади, отделка или юридический статус не подтверждены, а клиент просит представить их как окончательные условия сделки.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-realestate-q2' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не добавлять на рендер вид, транспорт, благоустройство или социальные объекты, которых нет в утверждённом проекте и актуальном плане реализации.',
  diagnostic_value = 'Проверяет, соответствует ли каждый значимый элемент рендера проекту, стадии и ожидаемому сроку появления.',
  red_flag_text = 'Клиент требует показать неутверждённую инфраструктуру, вид или готовность объекта как существующие и способные повлиять на решение покупателя.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-realestate-ob1' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не обещать продажу, определённую цену сделки или срок реализации объекта как результат одного контент-проекта.',
  diagnostic_value = 'Отделяет влияние контента на обращения от цены, документов, спроса, финансирования и работы отдела продаж.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-realestate-ob2' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не публиковать материал без даты актуальности и проверки рендеров, цен, сроков, доступности, отделки и существенных ограничений.',
  diagnostic_value = 'Даёт финальную проверку прозрачности рендера и достоверности условий, влияющих на решение покупателя.',
  red_flag_text = 'Реклама маскирует рендер под фотографию, содержит недоступный объект или заведомо устаревшие существенные условия покупки.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-realestate-eth1' AND status = 'review' AND version = 1;
