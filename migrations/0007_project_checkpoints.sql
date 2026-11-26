-- One immutable, named pointer per project. Existing revision JSON is reused.
CREATE TABLE project_checkpoints (
 project_id TEXT PRIMARY KEY REFERENCES projects(id),
 revision INTEGER NOT NULL,
 label TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(project_id, revision) REFERENCES revisions(project_id, revision)
);
