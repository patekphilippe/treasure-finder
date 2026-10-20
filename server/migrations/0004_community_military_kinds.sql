-- Military maps: community objects may also be positions ('wojsko') and war graves ('grob_wojenny').
-- SQLite cannot change a CHECK, so both tables are rebuilt. Order matters: object_votes deletes
-- with its object (ON DELETE CASCADE), so the votes move to a new table bound to the new objects
-- table before the old ones are dropped; renaming then rewrites the reference.
PRAGMA defer_foreign_keys = true;

CREATE TABLE community_objects_new (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (
    kind IN ('osada', 'droga', 'mlyn', 'karczma', 'brod', 'inne', 'wojsko', 'grob_wojenny')
  ),
  label TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 200,
  source TEXT NOT NULL DEFAULT '',
  author_id TEXT REFERENCES members (id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  removed_at INTEGER
);
INSERT INTO community_objects_new
  SELECT id, kind, label, lat, lng, radius_m, source, author_id, created_at, updated_at, removed_at
  FROM community_objects;

CREATE TABLE object_votes_new (
  object_id TEXT NOT NULL REFERENCES community_objects_new (id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members (id),
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (object_id, member_id)
);
INSERT INTO object_votes_new
  SELECT object_id, member_id, vote, note, created_at FROM object_votes;

DROP TABLE object_votes;
DROP TABLE community_objects;
ALTER TABLE community_objects_new RENAME TO community_objects;
ALTER TABLE object_votes_new RENAME TO object_votes;
CREATE INDEX community_objects_lat_lng ON community_objects (lat, lng);
