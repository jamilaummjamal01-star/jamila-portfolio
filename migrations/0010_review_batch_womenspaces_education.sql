PRAGMA foreign_keys = ON;

-- Review batch 3 of 5: women-focused spaces and education.
-- Records deliberately remain in review for owner approval in the constructor.

UPDATE knowledge_items
SET
  avoid_text = 'Не использовать медицинские обещания для бытовой, эстетической или образовательной услуги и не скрывать границы её назначения.',
  diagnostic_value = 'Определяет категорию услуги, допустимый результат и границу между эстетикой, обучением и медицинской помощью.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-womenspaces-q1' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не приписывать специалисту квалификацию, не подтверждённую документами, и не обещать результат без раскрытия ограничений.',
  diagnostic_value = 'Показывает, какие заявления подтверждены квалификацией, условиями оказания услуги и проверяемыми результатами.',
  red_flag_text = 'Квалификация, санитарные условия или заявленный эффект не подтверждены, а клиент просит скрыть ограничения либо использовать медицинское обещание.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-womenspaces-q2' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не создавать, не ретушировать и не публиковать искусственное сравнение как доказательство результата реальной процедуры.',
  diagnostic_value = 'Отделяет иллюстративный AI-контент от доказательного материала о результате услуги.',
  red_flag_text = 'Клиент требует создать несуществующий результат, изменить тело или лицо и представить изображение как реальное «до и после».',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-womenspaces-ob1' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не использовать унижающий, сексуализированный или нарушающий приватность образ ради внимания и не раскрывать чувствительные детали клиентки.',
  diagnostic_value = 'Проверяет, можно ли показать ценность услуги выразительно, сохранив достоинство, приватность и уместность образа.',
  red_flag_text = 'Запрос предполагает сексуализацию, унижение, демонстрацию интимных деталей или использование узнаваемой клиентки без необходимого согласия.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-womenspaces-ob2' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не публиковать изображения и истории клиенток без проверки согласий, необходимости раскрытия и безопасной альтернативы.',
  diagnostic_value = 'Даёт финальную проверку достоинства, приватности, подтверждённости результата и корректной категории услуги.',
  red_flag_text = 'Материал раскрывает чувствительные данные, сексуализирует женщину, имитирует медицинский эффект или использует личный образ без подтверждённых прав.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-womenspaces-eth1' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не объединять программы для разных уровней и аудиторий в одно обещание и не скрывать требования к поступлению или обучению.',
  diagnostic_value = 'Связывает программу, уровень подготовки, формат, ожидаемый результат и путь записи конкретного ученика.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-education-q1' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не указывать неподтверждённые лицензии, квалификации, документы и проценты трудоустройства или успеваемости.',
  diagnostic_value = 'Отделяет проверяемые факты об организации и результатах от рекламных обобщений.',
  red_flag_text = 'Организация не подтверждает лицензию, квалификацию, выдаваемый документ или статистику, но требует использовать эти сведения в рекламе.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-education-q2' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не обещать трудоустройство, доход, поступление или оценку как гарантированный индивидуальный результат программы.',
  diagnostic_value = 'Разделяет качество программы и поддержки от усилий ученика, внешней оценки и ситуации на рынке.',
  red_flag_text = 'Клиент требует гарантировать работу, доход, поступление или балл независимо от исходного уровня, участия ученика и внешних условий.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-education-ob1' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не создавать вымышленного выпускника, цитату, фотографию или результат и не смешивать несколько реальных историй в один отзыв.',
  diagnostic_value = 'Проверяет подлинность кейса, согласие участника и точность контекста образовательного результата.',
  red_flag_text = 'Клиент просит придумать отзыв, личность или результат ученика и выдать их за реальный опыт обучения.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-education-ob2' AND status = 'review' AND version = 1;

UPDATE knowledge_items
SET
  avoid_text = 'Не публиковать историю, учебный материал или изображение несовершеннолетнего без проверки авторства, согласий и необходимости раскрытия.',
  diagnostic_value = 'Даёт финальную сверку доказательств, условий программы, прав на материалы и защиты данных учеников.',
  red_flag_text = 'Материал содержит вымышленное доказательство, нарушает авторские права, раскрывает данные несовершеннолетнего или скрывает существенные условия программы.',
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'ki-r-education-eth1' AND status = 'review' AND version = 1;
