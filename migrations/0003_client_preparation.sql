ALTER TABLE clients ADD COLUMN sales_channel TEXT;
ALTER TABLE diagnostic_sessions ADD COLUMN stage_slug TEXT REFERENCES stages(slug) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_stage_status
  ON diagnostic_sessions(stage_slug, status);

INSERT OR IGNORE INTO knowledge_items (
  id, item_type, speaker, category, title, prompt_text, short_text,
  next_action_text, channel, tone, required_level, risk_level,
  source_kind, source_reference, status, version, normalized_key,
  reviewed_at, created_at, updated_at
) VALUES
  (
    'universal-prep-audit-presence', 'audit_check', 'system', 'audit',
    'Проверить цифровое присутствие клиента',
    'Проверьте сайт, социальные сети, карточки на маркетплейсах и актуальные контакты клиента.',
    'Отметьте, насколько понятно предложение, кому оно адресовано и какое действие ожидается от посетителя.',
    'Зафиксируйте три сильные стороны и три точки, которые требуют уточнения.',
    'any', 'neutral', 'required', 'normal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-audit-presence', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-audit-visuals', 'audit_check', 'system', 'audit',
    'Проверить визуальную целостность',
    'Сравните упаковку, карточки товара, публикации и рекламные материалы: совпадают ли стиль, продукт и ключевые свойства?',
    'Обратите внимание на устаревшие изображения, нечитаемые надписи и противоречия между площадками.',
    'Составьте короткий список визуальных несоответствий до разговора.',
    'any', 'neutral', 'recommended', 'normal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-audit-visuals', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-question-goal', 'question_to_client', 'creator', 'business',
    'Главная коммерческая задача',
    'Какую конкретную задачу должен решить контент или digital-инструмент в ближайшие три месяца?',
    NULL, 'Уточните измеримый результат и приоритет, если клиент называет несколько задач.',
    'any', 'business', 'required', 'normal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-question-goal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-question-audience', 'question_to_client', 'creator', 'audience',
    'Целевая аудитория и решение о покупке',
    'Кто принимает решение о покупке, что для него важно и что чаще всего мешает сделать следующий шаг?',
    NULL, 'Попросите привести один реальный пример клиента или заказа.',
    'any', 'business', 'required', 'normal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-question-audience', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-question-product', 'question_to_client', 'creator', 'product',
    'Приоритетный продукт',
    'Какой продукт, услуга или направление сейчас приоритетны и почему именно они?',
    NULL, 'Уточните актуальную версию, цену, комплектацию и ограничения.',
    'any', 'business', 'required', 'normal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-question-product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-question-materials', 'question_to_client', 'creator', 'sources',
    'Исходные материалы',
    'Какие исходники уже есть: фото, видео, логотип, брендбук, тексты, отзывы, документы и примеры прошлых материалов?',
    NULL, 'Отдельно уточните качество исходников и право использовать их в проекте.',
    'any', 'business', 'recommended', 'elevated', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-question-materials', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-question-budget-time', 'question_to_client', 'creator', 'budget',
    'Бюджет и сроки',
    'Какой бюджетный ориентир и к какой дате результат должен быть готов или запущен?',
    NULL, 'Если ориентир не определён, согласуйте диапазон и обязательный минимум результата.',
    'any', 'business', 'recommended', 'normal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-question-budget-time', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-client-process', 'question_from_client', 'client', 'process',
    'Как будет устроена работа?',
    'Как проходит работа и что потребуется от нас?',
    'Сначала мы фиксируем задачу, исходные материалы и критерии результата. Затем согласуем объём, этапы и сроки, после чего вы получаете промежуточную проверку и финальные материалы.',
    'Предложите следующий конкретный шаг: короткую диагностику или передачу исходников.',
    'any', 'business', 'recommended', 'normal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-client-process', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-client-timing', 'question_from_client', 'client', 'timing',
    'Сколько времени займёт проект?',
    'Когда будет готов результат?',
    'Точный срок зависит от объёма, готовности исходников и скорости согласования. После короткой диагностики я назову реалистичный график по этапам.',
    'Не обещайте срок до проверки исходников и объёма правок.',
    'any', 'business', 'recommended', 'normal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-client-timing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-first-message', 'first_message', 'creator', 'first_contact',
    'Первое сообщение после изучения клиента',
    'Здравствуйте! Я посмотрела ваш проект и вижу несколько точек, где визуал и структура контента могут яснее раскрыть ценность продукта. Чтобы предложить подходящий формат, хочу уточнить вашу текущую задачу и приоритетное направление.',
    NULL, 'Задайте один конкретный вопрос о коммерческой задаче клиента.',
    'any', 'warm', 'recommended', 'normal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-first-message', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-risk-claims', 'ethical_rule', 'system', 'claims',
    'Не придумывать свойства и результаты',
    'Нельзя добавлять несуществующие свойства продукта, отзывы, сертификаты, клиентов, результаты или гарантии.',
    'Любые сильные заявления должны опираться на данные, которые клиент может подтвердить.',
    'До предложения концепции запросите подтверждение спорных фактов и формулировок.',
    'any', 'firm', 'required', 'refusal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-risk-claims', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'universal-prep-next-step', 'next_action', 'system', 'next_step',
    'Следующий шаг после первого разговора',
    'Зафиксируйте задачу, приоритетный продукт, аудиторию, исходники, ограничения, бюджетный ориентир и срок.',
    NULL, 'Отправьте клиенту краткое резюме договорённостей и предложите формат диагностики или коммерческого предложения.',
    'any', 'business', 'required', 'normal', 'manual', 'constructor-foundation',
    'approved', 1, 'universal-prep-next-step', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );
