-- Which model reads the submission next (Haiku first, Sonnet for a hard second pass)
ALTER TABLE submissions ADD COLUMN model TEXT NOT NULL DEFAULT 'claude-haiku-5-5';
-- JSON {fileId: anthropicFileId}: uploads used by the current batch, deleted afterwards
ALTER TABLE submissions ADD COLUMN anthropic_files TEXT;
