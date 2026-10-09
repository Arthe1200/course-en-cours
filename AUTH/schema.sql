CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('eleve','prof','admin')),team TEXT,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS annotations(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,content TEXT NOT NULL,team TEXT,created_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE INDEX IF NOT EXISTS idx_annotations_created ON annotations(created_at);
CREATE TABLE IF NOT EXISTS project_items(id INTEGER PRIMARY KEY AUTOINCREMENT,type TEXT NOT NULL CHECK(type IN ('journal','problem','idea','test')),title TEXT NOT NULL,content TEXT NOT NULL,created_by INTEGER NOT NULL,team TEXT,session_date TEXT,status TEXT NOT NULL DEFAULT 'ouvert',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(created_by) REFERENCES users(id));
CREATE INDEX IF NOT EXISTS idx_project_items_type_created ON project_items(type,created_at);
CREATE TABLE IF NOT EXISTS team_progress(team TEXT PRIMARY KEY,percent INTEGER NOT NULL DEFAULT 0,updated_by INTEGER,updated_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS team_leaders(user_id INTEGER PRIMARY KEY,team TEXT NOT NULL UNIQUE,assigned_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS attachments(id INTEGER PRIMARY KEY AUTOINCREMENT,owner_id INTEGER NOT NULL,parent_type TEXT NOT NULL CHECK(parent_type IN ('annotation','item','private_note')),parent_id INTEGER NOT NULL,filename TEXT NOT NULL,mime_type TEXT NOT NULL,data_url TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(owner_id) REFERENCES users(id));
CREATE INDEX IF NOT EXISTS idx_attachments_parent ON attachments(parent_type,parent_id);
CREATE TABLE IF NOT EXISTS private_notes(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT NOT NULL,content TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE INDEX IF NOT EXISTS idx_private_notes_user ON private_notes(user_id,created_at);
