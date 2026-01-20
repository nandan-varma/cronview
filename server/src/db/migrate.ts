import { sqlite } from './client.js'

export function migrate() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host TEXT,
      agent_key TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      cron_expr TEXT NOT NULL,
      command TEXT,
      server_id TEXT REFERENCES servers(id),
      "group" TEXT,
      timezone TEXT DEFAULT 'UTC',
      timeout_seconds INTEGER,
      enabled INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      exit_code INTEGER,
      duration_ms INTEGER,
      stdout TEXT,
      stderr TEXT,
      status TEXT NOT NULL,
      triggered_by TEXT DEFAULT 'schedule',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alert_channels (
      id TEXT PRIMARY KEY,
      job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      config TEXT NOT NULL,
      on_failure INTEGER DEFAULT 1,
      on_recovery INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diagnoses (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      diagnosis TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_runs_job_id ON runs(job_id);
    CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at);
    CREATE INDEX IF NOT EXISTS idx_jobs_group ON jobs("group");
  `)
}
