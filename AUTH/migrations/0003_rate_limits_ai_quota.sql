-- Migration 0003 : limitation des tentatives de connexion et quotas IA.
-- À exécuter une seule fois sur la base D1 existante.
CREATE TABLE IF NOT EXISTS login_rate_limits(
  key_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_usage(
  user_id INTEGER NOT NULL,
  usage_date TEXT NOT NULL,
  feature TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id,usage_date,feature),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(usage_date);
