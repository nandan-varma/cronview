// TypeScript types matching the SQLite schema

export interface ServerRecord {
  id: string
  name: string
  host: string | null
  agent_key: string
  created_at: string | null
}

export interface JobRecord {
  id: string
  name: string
  cron_expr: string
  command: string | null
  server_id: string | null
  group: string | null
  timezone: string | null
  timeout_seconds: number | null
  enabled: number // SQLite boolean: 0 or 1
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export interface RunRecord {
  id: string
  job_id: string
  started_at: string
  finished_at: string | null
  exit_code: number | null
  duration_ms: number | null
  stdout: string | null
  stderr: string | null
  status: string
  triggered_by: string | null
  created_at: string | null
}

export interface AlertChannelRecord {
  id: string
  job_id: string | null
  type: string
  config: string
  on_failure: number
  on_recovery: number
  created_at: string | null
}

export interface DiagnosisRecord {
  id: string
  run_id: string
  diagnosis: string
  created_at: string | null
}
