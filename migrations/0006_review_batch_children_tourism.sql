PRAGMA foreign_keys = ON;

-- Review batch 1 of 5: children products and tourism.
-- Records deliberately remain in review for owner approval in the constructor.

UPDATE knowledge_items
SET
  avoid_text = 'Не объединять в одном материале товары для разных возрастов и не обращаться к ребёнку как к единственному покупателю, если решение принимает взрослый.',
  diagnostic_value = 'Разделяет пользователя, покупателя и согласующего, связывает возраст товара с реальной задачей контента.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-children-q1' AND status = 'review';

UPDATE knowledge_items
SET
  avoid_text = 'Не придумывать сертификаты, возрастную маркировку, материалы или правила безопасности и не скрывать предупреждения производителя.',
  diagnostic_value = 'Показывает, какие заявления о безопасности подтверждены и какие детали товара нельзя искажать.',
  red_flag_text = 'Бренд не может подтвердить возрастные ограничения и безопасность либо просит скрыть предупреждение, изменить маркировку или показать опасный сценарий использования.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-children-q2' AND status = 'review';

UPDATE knowledge_items
SET
  avoid_text = 'Не менять цвет, размер, комплектацию и функции товара так, чтобы рекламный образ воспринимался как реальная версия продукта.',
  diagnostic_value = 'Определяет границу между выразительной подачей и искажением характеристик детского товара.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-children-ob1' AND status = 'review';

UPDATE knowledge_items
SET
  avoid_text = 'Не использовать лицо, имя, голос или другие узнаваемые данные реального ребёнка без необходимых согласий и подтверждённых прав.',
  diagnostic_value = 'Выявляет риски приватности, сходства с реальным ребёнком и неэтичной эксплуатации образа несовершеннолетнего.',
  red_flag_text = 'Клиент передаёт материалы реального ребёнка без согласий, просит воспроизвести узнаваемую внешность или создать унижающий, сексуализированный либо опасный образ.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-children-ob2' AND status = 'review';

UPDATE knowledge_items
SET
  avoid_text = 'Не выпускать материал только потому, что сцена выглядит эстетично: безопасность, достоинство ребёнка и точность товара проверяются отдельно.',
  diagnostic_value = 'Даёт финальный контроль безопасности, согласий, возрастной уместности и честности обещаний перед публикацией.',
  red_flag_text = 'В материале есть опасное использование, сексуализация, давление на ребёнка, манипуляция страхом родителя, ложные свойства товара или отсутствие необходимых согласий.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-children-eth1' AND status = 'review';

UPDATE knowledge_items
SET
  avoid_text = 'Не начинать производство, пока не определены конкретный объект, период доступности, тариф и путь к бронированию.',
  diagnostic_value = 'Связывает контент с доступным предложением, сезоном и измеримым действием гостя.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-tourism-q1' AND status = 'review';

UPDATE knowledge_items
SET
  avoid_text = 'Не включать платные, сезонные или недоступные услуги в базовое обещание и не показывать другой тип номера как выбранный тариф.',
  diagnostic_value = 'Отделяет фактически включённые условия от рекламной атмосферы и дополнительных услуг.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-tourism-q2' AND status = 'review';

UPDATE knowledge_items
SET
  avoid_text = 'Не заменять реальный номер, вид, площадь или инфраструктуру вымышленными элементами без явной маркировки концепции.',
  diagnostic_value = 'Определяет допустимые улучшения света и композиции без подмены условий проживания.',
  red_flag_text = 'Клиент просит выдать вымышленный номер, вид, площадь или удобство за реально доступное предложение, влияющее на решение о бронировании.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-tourism-ob1' AND status = 'review';

UPDATE knowledge_items
SET
  avoid_text = 'Не обещать загрузку, число бронирований или окупаемость без учёта сезона, цены, рекламы, сервиса и обработки обращений.',
  diagnostic_value = 'Отделяет вклад контента от коммерческих и операционных факторов туристического объекта.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-tourism-ob2' AND status = 'review';

UPDATE knowledge_items
SET
  avoid_text = 'Не использовать концептуальный визуал рядом с кнопкой бронирования так, чтобы гость принял его за реальный номер, территорию или услугу.',
  diagnostic_value = 'Даёт финальную сверку визуального обещания с объектом, датами, тарифом и условиями бронирования.',
  red_flag_text = 'Материал показывает недоступный тип номера, инфраструктуру, вид или услугу как реальные либо скрывает существенные ограничения бронирования.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-tourism-eth1' AND status = 'review';
