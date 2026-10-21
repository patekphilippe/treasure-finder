-- Own maps shared with the community (docs/BACKEND.md, "Wspólne mapy"): the scan lies in R2 under
-- mapy/<id>, its placement here. The id is the app's own map id, so objects read from the map
-- (ContextFeature.seen) point at the same map on every device.
CREATE TABLE shared_maps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  -- image pixel → coordinates in `epsg`, homography row-major (JSON array of 9 numbers)
  pixel_to_source TEXT NOT NULL,
  epsg INTEGER NOT NULL,
  method TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  author_id TEXT NOT NULL REFERENCES members (id),
  -- read whole by AI: other devices do not read it again
  read_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  removed_at INTEGER
);
CREATE INDEX shared_maps_updated ON shared_maps (updated_at);
