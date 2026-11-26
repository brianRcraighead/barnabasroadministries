CREATE TABLE projects (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 document TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE revisions (
 project_id TEXT NOT NULL REFERENCES projects(id),
 revision INTEGER NOT NULL,
 document TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(project_id, revision)
);
CREATE TABLE deployments (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES projects(id),
 revision INTEGER NOT NULL,
 worker_name TEXT NOT NULL,
 url TEXT,
 status TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX deployments_project ON deployments(project_id, created_at DESC);
CREATE TABLE login_limits (ip_hash TEXT PRIMARY KEY, window INTEGER NOT NULL, attempts INTEGER NOT NULL);
