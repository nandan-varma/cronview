export interface Server {
  id: string
  name: string
  host: string | null
  createdAt: string | null
}

export interface Job {
  id: string
  name: string
  cronExpr: string
  humanSchedule: string
  command: string | null
  serverId: string | null
  group: string | null
  timezone: string | null
  enabled: boolean
  notes: string | null
  createdAt: string | null
  updatedAt: string | null
  server: { id: string; name: string } | null
  latestRun: LatestRun | null
}

export interface LatestRun {
  id: string
  status: RunStatus
  startedAt: string
  durationMs: number | null
  exitCode: number | null
}

export interface Run {
  id: string
  jobId: string
  status: RunStatus
  startedAt: string
  finishedAt: string | null
  exitCode: number | null
  durationMs: number | null
  stdout?: string | null
  stderr?: string | null
  triggeredBy: string | null
}

export type RunStatus = 'passed' | 'failed' | 'running' | 'slow' | 'timeout' | 'unknown'

export interface HeatmapEntry {
  date: string
  status: 'passed' | 'failed' | 'slow' | 'running' | 'none'
  avgDurationMs: number | null
}

export interface Stats {
  total: number
  healthy: number
  failed: number
  slow: number
  runsToday: number
  avgDurationMs: number
}

export interface ParsedJob {
  cronExpr: string
  command: string
  humanSchedule: string
  suggestedName: string
  nextRuns: string[]
}

export interface AlertChannel {
  id: string
  jobId: string | null
  type: 'email' | 'webhook' | 'slack'
  config: string
  onFailure: boolean
  onRecovery: boolean
}
