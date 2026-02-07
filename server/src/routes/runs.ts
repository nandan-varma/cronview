import type { FastifyInstance } from 'fastify'
import { sqlite } from '../db/client.js'
import { nanoid } from 'nanoid'
import { dispatchAlerts } from '../services/alerts.js'
import type { JobRecord, ServerRecord } from '../db/schema.js'

const STATUS_RANK: Record<string, number> = {
  failed: 3, slow: 2, passed: 1, running: 0,
}

function rankToStatus(rank: number): string {
  return Object.entries(STATUS_RANK).find(([, v]) => v === rank)?.[0] ?? 'none'
}

export default async function (fastify: FastifyInstance) {
  fastify.get('/jobs/:id/runs', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { limit = '50', offset = '0', days = '28' } = req.query as {
      limit?: string; offset?: string; days?: string
    }

    const job = sqlite.prepare(`SELECT id FROM jobs WHERE id = ?`).get(id)
    if (!job) return reply.code(404).send({ error: 'Job not found' })

    const limitN = Math.min(parseInt(limit), 200)
    const offsetN = parseInt(offset)
    const daysN = parseInt(days)
    const since = new Date(Date.now() - daysN * 24 * 60 * 60 * 1000).toISOString()

    const jobRuns = sqlite.prepare(`
      SELECT id, status, started_at as startedAt, finished_at as finishedAt,
             exit_code as exitCode, duration_ms as durationMs, stderr
      FROM runs
      WHERE job_id = ? AND started_at >= ?
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `).all(id, since, limitN, offsetN)

    const totalRow = sqlite.prepare(`SELECT COUNT(*) as cnt FROM runs WHERE job_id = ? AND started_at >= ?`).get(id, since) as { cnt: number }

    // 28-day heatmap
    const heatmapRows = sqlite.prepare(`
      SELECT date(started_at) as day,
             MAX(CASE status
               WHEN 'failed' THEN 3
               WHEN 'slow' THEN 2
               WHEN 'passed' THEN 1
               ELSE 0
             END) as worst,
             AVG(duration_ms) as avgDuration
      FROM runs
      WHERE job_id = ? AND started_at >= datetime('now', '-28 days')
      GROUP BY date(started_at)
    `).all(id) as Array<{ day: string; worst: number; avgDuration: number | null }>

    const heatmapByDay = new Map(heatmapRows.map(r => [r.day, r]))

    const heatmap = []
    for (let i = 27; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const row = heatmapByDay.get(dateStr)
      heatmap.push({
        date: dateStr,
        status: row ? rankToStatus(row.worst) : 'none',
        avgDurationMs: row?.avgDuration ? Math.round(row.avgDuration) : null,
      })
    }

    return { runs: jobRuns, total: totalRow.cnt, heatmap }
  })

  fastify.get('/jobs/:id/runs/:runId', async (req, reply) => {
    const { id, runId } = req.params as { id: string; runId: string }
    const run = sqlite.prepare(`SELECT * FROM runs WHERE id = ? AND job_id = ?`).get(runId, id)
    if (!run) return reply.code(404).send({ error: 'Run not found' })
    return run
  })

  fastify.post('/runs', async (req, reply) => {
    const agentKey = (req.headers['x-agent-key'] as string) ?? ''

    const body = req.body as {
      jobName: string; serverId: string; startedAt: string; finishedAt: string
      exitCode: number; stdout?: string; stderr?: string
    }

    const server = sqlite
      .prepare(`SELECT * FROM servers WHERE id = ? AND agent_key = ?`)
      .get(body.serverId, agentKey) as ServerRecord | undefined

    if (!server) {
      return reply.code(401).send({ error: 'Invalid agent key or server ID' })
    }

    const job = sqlite
      .prepare(`SELECT * FROM jobs WHERE name = ? AND server_id = ?`)
      .get(body.jobName, body.serverId) as JobRecord | undefined

    if (!job) {
      return reply.code(404).send({ error: `Job "${body.jobName}" not found on server` })
    }

    const durationMs = body.finishedAt && body.startedAt
      ? new Date(body.finishedAt).getTime() - new Date(body.startedAt).getTime()
      : null

    const status = body.exitCode === 0 ? 'passed' : 'failed'
    const runId = nanoid()
    const now = new Date().toISOString()

    sqlite.prepare(`
      INSERT INTO runs (id, job_id, started_at, finished_at, exit_code, duration_ms, stdout, stderr, status, triggered_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'schedule', ?)
    `).run(runId, job.id, body.startedAt, body.finishedAt, body.exitCode, durationMs,
           body.stdout?.slice(0, 100000) ?? null, body.stderr?.slice(0, 100000) ?? null,
           status, now)

    if (body.exitCode !== 0) {
      setImmediate(() => dispatchAlerts(job.id, runId).catch(() => {}))
    }

    return reply.code(201).send({ id: runId, status })
  })
}
