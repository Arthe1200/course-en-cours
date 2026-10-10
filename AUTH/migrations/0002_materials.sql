-- Migration 0002 : inventaire partagé des matériaux et consommables.
-- À exécuter une seule fois sur la base D1 existante :
-- npx wrangler d1 execute course-en-cours --remote --file=AUTH/migrations/0002_materials.sql
CREATE TABLE IF NOT EXISTS materials(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Divers',
  quantity REAL NOT NULL DEFAULT 0 CHECK(quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'unité',
  team TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  supplier TEXT NOT NULL DEFAULT '',
  cost REAL CHECK(cost IS NULL OR cost >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(created_by) REFERENCES users(id),
  FOREIGN KEY(updated_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_materials_team_category ON materials(team,category,name);
