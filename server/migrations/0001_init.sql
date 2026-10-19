-- Submissions of historical sources and their AI analysis.
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  -- 'public': goes to the shared base after review; 'private': only for the sender
  mode TEXT NOT NULL CHECK (mode IN ('public', 'private')),
  -- nowe → w_kolejce → gotowe | do_przegladu → zatwierdzone | odrzucone; blad; czeka_na_budzet
  status TEXT NOT NULL,
  -- SHA-256 of the key handed to the sender; lets them read and delete it
  access_key_hash TEXT NOT NULL,
  device_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  text TEXT,
  link TEXT,
  -- JSON {south, west, north, east}: map view when sent, a hint for georeferencing
  view_bbox TEXT,
  consent_publish INTEGER NOT NULL DEFAULT 0,
  batch_id TEXT,
  error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX submissions_status ON submissions (status);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL
);
CREATE INDEX files_submission ON files (submission_id);

CREATE TABLE results (
  submission_id TEXT PRIMARY KEY REFERENCES submissions (id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  -- JSON: what the model read, the georeference and the proposed context objects
  json TEXT NOT NULL,
  cost_usd REAL NOT NULL,
  created_at INTEGER NOT NULL
);

-- Anthropic spending per calendar month (YYYY-MM)
CREATE TABLE budget (
  month TEXT PRIMARY KEY,
  spent_usd REAL NOT NULL DEFAULT 0
);

-- Daily counters for private analyses: subject = 'device:<id>' or 'ip:<hash>'
CREATE TABLE daily_usage (
  day TEXT NOT NULL,
  subject TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, subject)
);

-- Place-name lookups (OSM) reused between submissions
CREATE TABLE gazetteer_cache (
  query TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  fetched_at INTEGER NOT NULL
);
