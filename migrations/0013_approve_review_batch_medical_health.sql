PRAGMA foreign_keys = ON;

-- Owner-approved review batch 4 of 5: medical organizations and health products.
WITH approved_batch (id) AS (
  VALUES
    ('ki-r-medical-q1'),
    ('ki-r-medical-q2'),
    ('ki-r-medical-ob1'),
    ('ki-r-medical-ob2'),
    ('ki-r-medical-eth1'),
    ('ki-r-health-q1'),
    ('ki-r-health-q2'),
    ('ki-r-health-ob1'),
    ('ki-r-health-ob2'),
    ('ki-r-health-eth1')
)
UPDATE knowledge_items
SET
  status = 'approved',
  version = version + 1,
  reviewed_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT id FROM approved_batch)
  AND status = 'review'
  AND version = 2;

WITH approved_batch (id) AS (
  VALUES
    ('ki-r-medical-q1'),
    ('ki-r-medical-q2'),
    ('ki-r-medical-ob1'),
    ('ki-r-medical-ob2'),
    ('ki-r-medical-eth1'),
    ('ki-r-health-q1'),
    ('ki-r-health-q2'),
    ('ki-r-health-ob1'),
    ('ki-r-health-ob2'),
    ('ki-r-health-eth1')
)
INSERT OR IGNORE INTO audit_log (
  id, actor_email, action, entity_type, entity_id,
  old_value_json, new_value_json, created_at
)
SELECT
  'audit-review-batch-4-' || ki.id,
  'jamila.shakurova@gmail.com',
  'approve',
  'knowledge_item',
  ki.id,
  json_object('title', ki.title, 'status', 'review', 'version', 2),
  json_object('title', ki.title, 'status', 'approved', 'version', 3, 'source', 'owner-approved-review-batch-4'),
  CURRENT_TIMESTAMP
FROM knowledge_items ki
JOIN approved_batch batch ON batch.id = ki.id
WHERE ki.status = 'approved' AND ki.version = 3;
