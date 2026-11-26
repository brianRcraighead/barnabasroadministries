CREATE TABLE studio_users (
 id TEXT PRIMARY KEY,
 username TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK (role IN ('editor','super_admin')),
 salt TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 credential_version TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE admin_settings (id INTEGER PRIMARY KEY CHECK (id=1), encrypted_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
