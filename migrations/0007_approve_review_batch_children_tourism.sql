PRAGMA foreign_keys = ON;

-- Owner-approved review batch 1 of 5: children products and tourism.
WITH approved_batch (id) AS (
  VALUES
    ('ki-r-children-q1'),
    ('ki-r-children-q2'),
    ('ki-r-children-ob1'),
    ('ki-r-children-ob2'),
    ('ki-r-children-eth1'),
    ('ki-r-tourism-q1'),
    ('ki-r-tourism-q2'),
    ('ki-r-tourism-ob1'),
    ('ki-r-tourism-ob2'),
    ('ki-r-tourism-eth1')
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
    ('ki-r-children-q1'),
    ('ki-r-children-q2'),
    ('ki-r-children-ob1'),
    ('ki-r-children-ob2'),
    ('ki-r-children-eth1'),
    ('ki-r-tourism-q1'),
    ('ki-r-tourism-q2'),
    ('ki-r-tourism-ob1'),
    ('ki-r-tourism-ob2'),
    ('ki-r-tourism-eth1')
)
INSERT OR IGNORE INTO audit_log (
  id, actor_email, action, entity_type, entity_id,
  old_value_json, new_value_json, created_at
)
SELECT
  'audit-review-batch-1-' || ki.id,
  'jamila.shakurova@gmail.com',
  'approve',
  'knowledge_item',
  ki.id,
  json_object('title', ki.title, 'status', 'review', 'version', 2),
  json_object('title', ki.title, 'status', 'approved', 'version', 3, 'source', 'owner-approved-review-batch-1'),
  CURRENT_TIMESTAMP
FROM knowledge_items ki
JOIN approved_batch batch ON batch.id = ki.id
WHERE ki.status = 'approved' AND ki.version = 3;
