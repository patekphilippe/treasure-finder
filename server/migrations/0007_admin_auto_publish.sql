-- Test phase (ADMIN_AUTO_PUBLISH in wrangler.toml): a source an admin shares goes to the shared base
-- right after the analysis, without the review in the panel. Set when the submission is made.
ALTER TABLE submissions ADD COLUMN auto_publish INTEGER NOT NULL DEFAULT 0;
