import type { Job, Run, Server, Stats, HeatmapEntry, ParsedJob } from '../types/index.js'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(options?.headers as Record<string, string>) }
  if (options?.body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  getStats: () => req<Stats>('/api/stats'),

  getJobs: (params?: { group?: string; status?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.group) qs.set('group', params.group)
    if (params?.status) qs.set('status', params.status)
    if (params?.search) qs.set('search', params.search)
    const q = qs.toString()
    return req<Job[]>(`/api/jobs${q ? `?${q}` : ''}`)
  },

  createJob: (data: Partial<Job>) =>
    req<Job>('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),

  updateJob: (id: string, data: Partial<Job>) =>
    req<Job>(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteJob: (id: string, hard?: boolean) =>
    req<void>(`/api/jobs/${id}${hard ? '?hard=true' : ''}`, { method: 'DELETE' }),

  getSchedule: (id: string) =>
    req<{ cronExpr: string; humanSchedule: string; nextRuns: string[] }>(`/api/jobs/${id}/schedule`),

  getRuns: (jobId: string, params?: { limit?: number; offset?: number; days?: number }) => {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    if (params?.days) qs.set('days', String(params.days))
    const q = qs.toString()
    return req<{ runs: Run[]; total: number; heatmap: HeatmapEntry[] }>(
      `/api/jobs/${jobId}/runs${q ? `?${q}` : ''}`
    )
  },

  getRun: (jobId: string, runId: string) =>
    req<Run>(`/api/jobs/${jobId}/runs/${runId}`),

  triggerRun: (jobId: string) =>
    req<Run>(`/api/jobs/${jobId}/runs`, { method: 'POST', body: JSON.stringify({}) }),

  diagnoseJob: (jobId: string) =>
    req<{ runId: string; diagnosis: string; cached: boolean }>(`/api/jobs/${jobId}/diagnose`),

  importCrontab: (crontab: string) =>
    req<{ parsed: ParsedJob[]; skipped: number; errors: string[] }>(
      '/api/import',
      { method: 'POST', body: JSON.stringify({ crontab }) }
    ),

  confirmImport: (jobs: Array<ParsedJob & { name?: string }>, serverId?: string) =>
    req<Job[]>('/api/import/confirm', {
      method: 'POST',
      body: JSON.stringify({ jobs, serverId }),
    }),

  getServers: () => req<Server[]>('/api/servers'),

  createServer: (data: { name: string; host?: string }) =>
    req<Server & { agentKey: string }>('/api/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
