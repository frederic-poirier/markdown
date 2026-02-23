PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS files_index (
    user_id TEXT NOT NULL,
    file_id TEXT NOT NULL,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    content_hash TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    extension TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    PRIMARY KEY (user_id, file_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_index_user_updated_at
    ON files_index (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_files_index_user_hash
    ON files_index (user_id, content_hash);
