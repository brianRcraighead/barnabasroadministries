ALTER TABLE deployments ADD COLUMN fingerprint TEXT;
CREATE INDEX deployments_fingerprint ON deployments(project_id,fingerprint,status);
