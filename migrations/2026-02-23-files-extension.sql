-- Add extension metadata and a hash index for dedupe lookups.
-- This migration is intended to be run once.

ALTER TABLE files_index ADD COLUMN extension TEXT;

CREATE INDEX IF NOT EXISTS idx_files_index_user_hash
    ON files_index (user_id, content_hash);
