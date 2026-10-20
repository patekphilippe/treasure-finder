-- One pipeline run at a time. With the cron every minute a run that takes longer (placing maps,
-- gazetteer lookups) must not collect or send the same submissions twice. A run holds the lock
-- until it ends; the lock of a run that crashed expires on its own (`until`, ms).
CREATE TABLE pipeline_lock (
  name TEXT PRIMARY KEY,
  until INTEGER NOT NULL
);
