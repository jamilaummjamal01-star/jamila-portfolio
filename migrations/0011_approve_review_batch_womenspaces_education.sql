PRAGMA foreign_keys = ON;

-- Owner-approved review batch 3 of 5: women-focused spaces and education.
WITH approved_batch (id) AS (
  VALUES
    ('ki-r-womenspaces-q1'),
    ('ki-r-womenspaces-q2'),
    ('ki-r-womenspaces-ob1'),
    ('ki-r-womenspaces-ob2'),
    ('ki-r-womenspaces-eth1'),
    ('ki-r-education-q1'),
    ('ki-r-education-q2'),
    ('ki-r-education-ob1'),
    ('ki-r-education-ob2'),
    ('ki-r-education-eth1')
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
    ('ki-r-womenspaces-q1'),
    ('ki-r-womenspaces-q2'),
    ('ki-r-womenspaces-ob1'),
    ('ki-r-womenspaces-ob2'),
    ('ki-r-womenspaces-eth1'),
    ('ki-r-education-q1'),
    ('ki-r-education-q2'),
    ('ki-r-education-ob1'),
    ('ki-r-education-ob2'),
    ('ki-r-education-eth1')
)
INSERT OR IGNORE INTO audit_log (
  id, actor_email, action, entity_type, entity_id,
  old_value_json, new_value_json, created_at
)
SELECT
  'audit-review-batch-3-' || ki.id,
  'jamila.shakurova@gmail.com',
  'approve',
  'knowledge_item',
  ki.id,
  json_object('title', ki.title, 'status', 'review', 'version', 2),
  json_object('title', ki.title, 'status', 'approved', 'version', 3, 'source', 'owner-approved-review-batch-3'),
  CURRENT_TIMESTAMP
FROM knowledge_items ki
JOIN approved_batch batch ON batch.id = ki.id
WHERE ki.status = 'approved' AND ki.version = 3;
