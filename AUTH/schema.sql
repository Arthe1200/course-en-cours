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

CREATE TABLE IF NOT EXISTS ai_journal(id INTEGER PRIMARY KEY AUTOINCREMENT,entry_date TEXT NOT NULL UNIQUE,title TEXT NOT NULL,content TEXT NOT NULL,generated_at TEXT NOT NULL,model TEXT NOT NULL DEFAULT 'grok-4.7');
CREATE INDEX IF NOT EXISTS idx_ai_journal_date ON ai_journal(entry_date DESC);
CREATE TABLE IF NOT EXISTS ai_suggestions(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,content TEXT NOT NULL,entry_date TEXT NOT NULL,created_at TEXT NOT NULL,model TEXT NOT NULL DEFAULT 'grok-4.7');
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_date ON ai_suggestions(entry_date DESC,created_at DESC);


CREATE TABLE IF NOT EXISTS tasks(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  team TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','doing','blocked','done')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
  due_date TEXT,
  assignee_user_id INTEGER,
  file_links TEXT NOT NULL DEFAULT '[]',
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(assignee_user_id) REFERENCES users(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_team_status ON tasks(team,status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE TABLE IF NOT EXISTS task_history(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  actor_user_id INTEGER,
  actor_username TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('created','updated')),
  changes_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY(actor_user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_task_history_task_date ON task_history(task_id,created_at DESC);
