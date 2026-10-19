-- Trusted community: invited members share context objects and confirm or dispute them.
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  -- SHA-256 of the invitation code; the code itself is shown once to the owner
  token_hash TEXT NOT NULL UNIQUE,
  blocked INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  -- YYYY-MM-DD of the last request, written at most once a day
  last_seen_day TEXT
);

CREATE TABLE community_objects (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('osada', 'droga', 'mlyn', 'karczma', 'brod', 'inne')),
  label TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 200,
  source TEXT NOT NULL DEFAULT '',
  -- NULL: approved public submission or moved from the old packs
  author_id TEXT REFERENCES members (id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- set by the author or the owner; the owner can restore it
  removed_at INTEGER
);
CREATE INDEX community_objects_lat_lng ON community_objects (lat, lng);

CREATE TABLE object_votes (
  object_id TEXT NOT NULL REFERENCES community_objects (id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members (id),
  -- 1: confirmed, -1: disputed
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (object_id, member_id)
);
