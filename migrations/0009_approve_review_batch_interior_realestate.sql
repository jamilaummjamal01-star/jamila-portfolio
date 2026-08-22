PRAGMA foreign_keys = ON;

-- Owner-approved review batch 2 of 5: interiors and real estate.
WITH approved_batch (id) AS (
  VALUES
    ('ki-r-interior-q1'),
    ('ki-r-interior-q2'),
    ('ki-r-interior-ob1'),
    ('ki-r-interior-ob2'),
    ('ki-r-interior-eth1'),
    ('ki-r-realestate-q1'),
    ('ki-r-realestate-q2'),
    ('ki-r-realestate-ob1'),
    ('ki-r-realestate-ob2'),
    ('ki-r-realestate-eth1')
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
    ('ki-r-interior-q1'),
    ('ki-r-interior-q2'),
    ('ki-r-interior-ob1'),
    ('ki-r-interior-ob2'),
    ('ki-r-interior-eth1'),
    ('ki-r-realestate-q1'),
    ('ki-r-realestate-q2'),
    ('ki-r-realestate-ob1'),
    ('ki-r-realestate-ob2'),
    ('ki-r-realestate-eth1')
)
INSERT OR IGNORE INTO audit_log (
  id, actor_email, action, entity_type, entity_id,
  old_value_json, new_value_json, created_at
)
SELECT
  'audit-review-batch-2-' || ki.id,
  'jamila.shakurova@gmail.com',
  'approve',
  'knowledge_item',
  ki.id,
  json_object('title', ki.title, 'status', 'review', 'version', 2),
  json_object('title', ki.title, 'status', 'approved', 'version', 3, 'source', 'owner-approved-review-batch-2'),
  CURRENT_TIMESTAMP
FROM knowledge_items ki
JOIN approved_batch batch ON batch.id = ki.id
WHERE ki.status = 'approved' AND ki.version = 3;
