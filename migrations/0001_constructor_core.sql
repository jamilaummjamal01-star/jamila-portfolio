PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS niches (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'C' CHECK (priority IN ('A', 'B', 'C')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subniches (
  id TEXT PRIMARY KEY,
  niche_id TEXT NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  business_model TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (niche_id, slug)
);

CREATE TABLE IF NOT EXISTS stages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color TEXT
);

CREATE TABLE IF NOT EXISTS knowledge_items (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'question_to_client',
    'question_from_client',
    'answer',
    'objection',
    'objection_response',
    'clarifying_question',
    'first_message',
    'follow_up',
    'diagnostic_hint',
    'audit_check',
    'red_flag',
    'ethical_rule',
    'proposal_block',
    'package',
    'next_action',
    'refusal_reason'
  )),
  speaker TEXT NOT NULL DEFAULT 'system' CHECK (speaker IN ('creator', 'client', 'system')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt_text TEXT,
  short_text TEXT,
  full_text TEXT,
  soft_text TEXT,
  firm_text TEXT,
  clarification_text TEXT,
  next_action_text TEXT,
  avoid_text TEXT,
  diagnostic_value TEXT,
  red_flag_text TEXT,
  channel TEXT NOT NULL DEFAULT 'any',
  tone TEXT NOT NULL DEFAULT 'neutral',
  required_level TEXT NOT NULL DEFAULT 'recommended' CHECK (required_level IN ('required', 'recommended', 'optional', 'conditional')),
  risk_level TEXT NOT NULL DEFAULT 'normal' CHECK (risk_level IN ('normal', 'elevated', 'high', 'refusal')),
  conditions_json TEXT,
  source_kind TEXT NOT NULL DEFAULT 'manual' CHECK (source_kind IN ('notion', 'manual', 'real_dialogue', 'import')),
  source_url TEXT,
  source_reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  normalized_key TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_item_niches (
  knowledge_item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  niche_id TEXT NOT NULL REFERENCES niches(id) ON DELETE CASCADE,
  relevance TEXT NOT NULL DEFAULT 'primary' CHECK (relevance IN ('primary', 'secondary')),
  PRIMARY KEY (knowledge_item_id, niche_id)
);

CREATE TABLE IF NOT EXISTS knowledge_item_subniches (
  knowledge_item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  subniche_id TEXT NOT NULL REFERENCES subniches(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_item_id, subniche_id)
);

CREATE TABLE IF NOT EXISTS knowledge_item_stages (
  knowledge_item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_item_id, stage_id)
);

CREATE TABLE IF NOT EXISTS knowledge_item_tags (
  knowledge_item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  account_url TEXT,
  contact_name TEXT,
  contact_channel TEXT,
  contact_value TEXT,
  city TEXT,
  geography TEXT,
  business_model TEXT,
  product_summary TEXT,
  audience_summary TEXT,
  commercial_goal TEXT,
  desired_action TEXT,
  crm_status TEXT NOT NULL DEFAULT 'found',
  priority TEXT NOT NULL DEFAULT 'C' CHECK (priority IN ('A', 'B', 'C')),
  budget_min REAL,
  budget_max REAL,
  ethical_status TEXT NOT NULL DEFAULT 'not_checked' CHECK (ethical_status IN ('not_checked', 'approved', 'review', 'refused')),
  main_objection TEXT,
  next_action TEXT,
  next_contact_at TEXT,
  internal_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_niches (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  niche_id TEXT NOT NULL REFERENCES niches(id) ON DELETE RESTRICT,
  relation_type TEXT NOT NULL DEFAULT 'secondary' CHECK (relation_type IN ('primary', 'secondary')),
  PRIMARY KEY (client_id, niche_id)
);

CREATE TABLE IF NOT EXISTS diagnostic_sessions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  format TEXT NOT NULL DEFAULT 'express' CHECK (format IN ('express', 'standard', 'full', 'proposal_clarification')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'needs_clarification', 'ready_for_proposal', 'completed', 'archived')),
  channel TEXT,
  scheduled_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  goal TEXT,
  strong_side TEXT,
  main_barrier TEXT,
  main_diagnosis TEXT,
  recommended_package TEXT,
  missing_data TEXT,
  next_action TEXT,
  ethical_decision TEXT NOT NULL DEFAULT 'not_checked' CHECK (ethical_decision IN ('not_checked', 'approved', 'review', 'refused')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diagnostic_session_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  knowledge_item_id TEXT REFERENCES knowledge_items(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  was_asked INTEGER NOT NULL DEFAULT 0 CHECK (was_asked IN (0, 1)),
  client_answer TEXT,
  internal_note TEXT,
  risk_detected INTEGER NOT NULL DEFAULT 0 CHECK (risk_detected IN (0, 1)),
  include_in_summary INTEGER NOT NULL DEFAULT 0 CHECK (include_in_summary IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  knowledge_item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  label TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (knowledge_item_id)
);

CREATE TABLE IF NOT EXISTS pricing_tariffs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  working_rate REAL NOT NULL DEFAULT 0,
  minimum_rate REAL NOT NULL DEFAULT 0,
  rate_status TEXT NOT NULL DEFAULT 'individual' CHECK (rate_status IN ('active', 'review_before_proposal', 'individual', 'disabled')),
  includes_text TEXT,
  excludes_text TEXT,
  source_reference TEXT,
  review_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_calculations (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  diagnostic_session_id TEXT REFERENCES diagnostic_sessions(id) ON DELETE SET NULL,
  project_type TEXT NOT NULL DEFAULT 'individual' CHECK (project_type IN ('test', 'main', 'system', 'recurring', 'individual')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'editing', 'review', 'ready', 'moved_to_proposal', 'archived')),
  discount_percent REAL NOT NULL DEFAULT 0,
  manual_adjustment REAL NOT NULL DEFAULT 0,
  minimum_price REAL NOT NULL DEFAULT 0,
  external_project_cost REAL NOT NULL DEFAULT 0,
  prepayment_percent REAL NOT NULL DEFAULT 50,
  ethical_status TEXT NOT NULL DEFAULT 'not_checked' CHECK (ethical_status IN ('not_checked', 'approved', 'review', 'refused')),
  valid_until TEXT,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calculation_items (
  id TEXT PRIMARY KEY,
  calculation_id TEXT NOT NULL REFERENCES project_calculations(id) ON DELETE CASCADE,
  tariff_id TEXT REFERENCES pricing_tariffs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  tariff_rate REAL NOT NULL DEFAULT 0,
  manual_rate REAL NOT NULL DEFAULT 0,
  complexity_coefficient REAL NOT NULL DEFAULT 1,
  source_coefficient REAL NOT NULL DEFAULT 1,
  urgency_coefficient REAL NOT NULL DEFAULT 1,
  rights_coefficient REAL NOT NULL DEFAULT 1,
  item_discount_percent REAL NOT NULL DEFAULT 0,
  fixed_cost REAL NOT NULL DEFAULT 0,
  hours REAL NOT NULL DEFAULT 0,
  internal_hour_rate REAL NOT NULL DEFAULT 0,
  external_cost REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  diagnostic_session_id TEXT REFERENCES diagnostic_sessions(id) ON DELETE SET NULL,
  calculation_id TEXT REFERENCES project_calculations(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'needs_data', 'internal_review', 'ready_to_send', 'sent', 'discussion', 'approved', 'rejected', 'archived')),
  title TEXT NOT NULL,
  diagnosis_text TEXT,
  strategy_text TEXT,
  solution_text TEXT,
  scope_text TEXT,
  timeline_text TEXT,
  rights_text TEXT,
  limitations_text TEXT,
  next_step_text TEXT,
  client_document TEXT,
  internal_notes TEXT,
  sent_at TEXT,
  follow_up_at TEXT,
  valid_until TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('notion', 'json', 'csv')),
  source_reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'preview', 'importing', 'completed', 'failed', 'cancelled')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  error_report TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value_json TEXT,
  new_value_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subniches_niche ON subniches(niche_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_type_status ON knowledge_items(item_type, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_items(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_risk ON knowledge_items(risk_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_normalized_key ON knowledge_items(normalized_key);
CREATE INDEX IF NOT EXISTS idx_knowledge_niches_niche ON knowledge_item_niches(niche_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_stages_stage ON knowledge_item_stages(stage_id);
CREATE INDEX IF NOT EXISTS idx_clients_status_next_contact ON clients(crm_status, next_contact_at);
CREATE INDEX IF NOT EXISTS idx_sessions_client_status ON diagnostic_sessions(client_id, status);
CREATE INDEX IF NOT EXISTS idx_session_items_session_order ON diagnostic_session_items(session_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_calculations_client_status ON project_calculations(client_id, status);
CREATE INDEX IF NOT EXISTS idx_calculation_items_calculation ON calculation_items(calculation_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_proposals_client_status ON proposals(client_id, status);

INSERT OR IGNORE INTO stages (id, slug, name, sort_order) VALUES
  ('stage-audit', 'audit', 'Предварительный аудит', 10),
  ('stage-first-message', 'first-message', 'Первое сообщение', 20),
  ('stage-interest-response', 'interest-response', 'Ответ на интерес', 30),
  ('stage-express-diagnostic', 'express-diagnostic', 'Экспресс-диагностика', 40),
  ('stage-full-diagnostic', 'full-diagnostic', 'Полная диагностика', 50),
  ('stage-pre-proposal', 'pre-proposal', 'Уточнение перед КП', 60),
  ('stage-proposal-send', 'proposal-send', 'Отправка КП', 70),
  ('stage-price-discussion', 'price-discussion', 'Обсуждение стоимости', 80),
  ('stage-objections', 'objections', 'Работа с возражениями', 90),
  ('stage-start-approval', 'start-approval', 'Согласование старта', 100),
  ('stage-production', 'production', 'Проект в работе', 110),
  ('stage-delivery', 'delivery', 'Сдача результата', 120),
  ('stage-repeat-sale', 'repeat-sale', 'Повторная продажа', 130),
  ('stage-refusal', 'refusal', 'Корректный отказ', 140);

INSERT OR IGNORE INTO niches (id, slug, name, priority) VALUES
  ('niche-clothing', 'clothing-textile', 'Бренды одежды и текстиля', 'A'),
  ('niche-cosmetics', 'perfume-cosmetics-care', 'Парфюмерия, косметика и уходовые товары', 'A'),
  ('niche-jewelry', 'jewelry-accessories', 'Украшения и женские аксессуары', 'A'),
  ('niche-home', 'home-aesthetic', 'Товары для дома и эстетичного быта', 'A'),
  ('niche-marketplaces', 'marketplaces-ecommerce', 'Продавцы на маркетплейсах и интернет-магазины', 'A'),
  ('niche-food-packaged', 'packaged-food', 'Упакованные продукты питания', 'B'),
  ('niche-islamic', 'islamic-products', 'Исламские товары', 'A'),
  ('niche-children', 'children-products', 'Детские товары', 'B'),
  ('niche-books', 'books-publishing-education-products', 'Книги, издательства и образовательные товары', 'B'),
  ('niche-bakery', 'bakery-desserts', 'Кондитерские, пекарни и десертные бренды', 'B'),
  ('niche-horeca', 'cafes-restaurants', 'Кафе, рестораны и общественное питание', 'B'),
  ('niche-tourism', 'hotels-tourism', 'Отели, гостевые дома и туризм', 'B'),
  ('niche-interior', 'furniture-interior-renovation', 'Мебель, интерьер и ремонт', 'B'),
  ('niche-real-estate', 'real-estate-developers', 'Недвижимость и застройщики', 'C'),
  ('niche-manufacturing', 'manufacturers-workshops', 'Производители и ремесленные мастерские', 'A'),
  ('niche-flowers', 'flowers-gifts', 'Цветочные магазины и подарочные сервисы', 'B'),
  ('niche-women-spaces', 'women-spaces-beauty', 'Женские пространства и допустимые бьюти-услуги', 'B'),
  ('niche-education', 'educational-organizations', 'Образовательные организации', 'A'),
  ('niche-medical', 'medical-rehabilitation', 'Медицинские организации и реабилитационные центры', 'C'),
  ('niche-health-products', 'supplements-health-products', 'БАДы и товары для здоровья', 'C'),
  ('niche-experts', 'experts-specialists', 'Эксперты и специалисты', 'A'),
  ('niche-b2b', 'b2b-suppliers', 'B2B-компании и поставщики', 'A');
