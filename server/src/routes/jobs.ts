import type { FastifyInstance } from 'fastify'
import { sqlite } from '../db/client.js'
import { nanoid } from 'nanoid'
import { toHumanSchedule, validateExpr, getNextRuns } from '../services/cronParser.js'
import type { JobRecord, ServerRecord, RunRecord } from '../db/schema.js'

function jobToResponse(job: JobRecord, latestRun: RunRecord | undefined, server: ServerRecord | undefined) {
  return {
    id: job.id,
    name: job.name,
    cronExpr: job.cron_expr,
    humanSchedule: toHumanSchedule(job.cron_expr, job.timezone ?? 'UTC'),
    command: job.command,
    serverId: job.server_id,
    group: job.group,
    timezone: job.timezone,
    enabled: job.enabled === 1,
    notes: job.notes,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    server: server ? { id: server.id, name: server.name } : null,
    latestRun: latestRun ? {
      id: latestRun.id,
      status: latestRun.status,
      startedAt: latestRun.started_at,
      durationMs: latestRun.duration_ms,
      exitCode: latestRun.exit_code,
    } : null,
  }
}

function getLatestRunStatus(jobId: string): string {
  const latest = sqlite
    .prepare(`SELECT exit_code, duration_ms, status FROM runs WHERE job_id = ? ORDER BY started_at DESC LIMIT 1`)
    .get(jobId) as { exit_code: number | null; duration_ms: number | null; status: string } | undefined

  if (!latest) return 'unknown'

  if (latest.duration_ms !== null) {
    const recentDurations = (sqlite
      .prepare(`SELECT duration_ms FROM runs WHERE job_id = ? AND duration_ms IS NOT NULL ORDER BY started_at DESC LIMIT 10`)
      .all(jobId) as Array<{ duration_ms: number }>)
      .map(r => r.duration_ms)
      .sort((a, b) => a - b)

    if (recentDurations.length >= 2) {
      const mid = Math.floor(recentDurations.length / 2)
      const median = recentDurations.length % 2 === 0
        ? (recentDurations[mid - 1] + recentDurations[mid]) / 2
        : recentDurations[mid]
      if (median > 0 && latest.duration_ms > median * 3) {
        return 'slow'
      }
    }
  }

  return latest.status
}

export default async function (fastify: FastifyInstance) {
  fastify.get('/jobs', async (req) => {
    const { group, status, search } = req.query as {
      group?: string; status?: string; search?: string
    }

    let query = `SELECT * FROM jobs`
    const params: unknown[] = []
    const conditions: string[] = []

    if (group) { conditions.push(`"group" = ?`); params.push(group) }
    if (search) { conditions.push(`name LIKE ?`); params.push(`%${search}%`) }
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`
    query += ` ORDER BY name`

    const allJobs = sqlite.prepare(query).all(...params) as JobRecord[]

    const result = []
    for (const job of allJobs) {
      const latestRun = sqlite
        .prepare(`SELECT * FROM runs WHERE job_id = ? ORDER BY started_at DESC LIMIT 1`)
        .get(job.id) as RunRecord | undefined

      const jobStatus = latestRun ? getLatestRunStatus(job.id) : 'unknown'
      if (status && jobStatus !== status) continue

      const server = job.server_id
        ? sqlite.prepare(`SELECT * FROM servers WHERE id = ?`).get(job.server_id) as ServerRecord | undefined
        : undefined

      result.push(jobToResponse(job, latestRun, server))
    }

    return result
  })

  fastify.post('/jobs', async (req, reply) => {
    const body = req.body as {
      name: string; cronExpr: string; command?: string; group?: string
      serverId?: string; timezone?: string; notes?: string
      timeoutSeconds?: number; enabled?: boolean
    }

    if (!body.name || !body.cronExpr) {
      return reply.code(400).send({ error: 'name and cronExpr are required' })
    }

    const validation = validateExpr(body.cronExpr)
    if (!validation.valid) {
      return reply.code(400).send({ error: `Invalid cron expression: ${validation.error}` })
    }

    const id = nanoid()
    const now = new Date().toISOString()

    try {
      sqlite.prepare(`
        INSERT INTO jobs (id, name, cron_expr, command, server_id, "group", timezone, timeout_seconds, enabled, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, body.name, body.cronExpr, body.command ?? null, body.serverId ?? null,
             body.group ?? null, body.timezone ?? 'UTC', body.timeoutSeconds ?? null,
             body.enabled !== false ? 1 : 0, body.notes ?? null, now, now)
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).message?.includes('UNIQUE')) {
        return reply.code(409).send({ error: 'A job with this name already exists' })
      }
      throw e
    }

    const job = sqlite.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as JobRecord
    return reply.code(201).send(jobToResponse(job, undefined, undefined))
  })

  fastify.put('/jobs/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as Record<string, unknown>

    const job = sqlite.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as JobRecord | undefined
    if (!job) return reply.code(404).send({ error: 'Job not found' })

    if (body.cronExpr) {
      const validation = validateExpr(body.cronExpr as string)
      if (!validation.valid) {
        return reply.code(400).send({ error: `Invalid cron expression: ${validation.error}` })
      }
    }

    const now = new Date().toISOString()
    sqlite.prepare(`
      UPDATE jobs SET
        name = COALESCE(?, name),
        cron_expr = COALESCE(?, cron_expr),
        command = CASE WHEN ? IS NOT NULL THEN ? ELSE command END,
        "group" = CASE WHEN ? IS NOT NULL THEN ? ELSE "group" END,
        server_id = CASE WHEN ? IS NOT NULL THEN ? ELSE server_id END,
        timezone = COALESCE(?, timezone),
        notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
        timeout_seconds = CASE WHEN ? IS NOT NULL THEN ? ELSE timeout_seconds END,
        enabled = CASE WHEN ? IS NOT NULL THEN ? ELSE enabled END,
        updated_at = ?
      WHERE id = ?
    `).run(
      body.name ?? null, body.cronExpr ?? null,
      body.command !== undefined ? 1 : null, body.command ?? null,
      body.group !== undefined ? 1 : null, body.group ?? null,
      body.serverId !== undefined ? 1 : null, body.serverId ?? null,
      body.timezone ?? null,
      body.notes !== undefined ? 1 : null, body.notes ?? null,
      body.timeoutSeconds !== undefined ? 1 : null, body.timeoutSeconds ?? null,
      body.enabled !== undefined ? 1 : null, body.enabled ? 1 : 0,
      now, id
    )

    const updated = sqlite.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as JobRecord
    return jobToResponse(updated, undefined, undefined)
  })

  fastify.delete('/jobs/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { hard } = req.query as { hard?: string }

    const job = sqlite.prepare(`SELECT id FROM jobs WHERE id = ?`).get(id)
    if (!job) return reply.code(404).send({ error: 'Job not found' })

    if (hard === 'true') {
      sqlite.prepare(`DELETE FROM jobs WHERE id = ?`).run(id)
    } else {
      sqlite.prepare(`UPDATE jobs SET enabled = 0, updated_at = ? WHERE id = ?`).run(new Date().toISOString(), id)
    }

    return reply.code(204).send()
  })

  fastify.get('/jobs/:id/schedule', async (req, reply) => {
    const { id } = req.params as { id: string }
    const job = sqlite.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as JobRecord | undefined
    if (!job) return reply.code(404).send({ error: 'Job not found' })

    const nextRuns = getNextRuns(job.cron_expr, 5, job.timezone ?? 'UTC')

    return {
      cronExpr: job.cron_expr,
      humanSchedule: toHumanSchedule(job.cron_expr, job.timezone ?? 'UTC'),
      nextRuns: nextRuns.map(d => d.toISOString()),
    }
  })

  fastify.post('/jobs/:id/runs', async (req, reply) => {
    const { id } = req.params as { id: string }
    const job = sqlite.prepare(`SELECT id FROM jobs WHERE id = ?`).get(id)
    if (!job) return reply.code(404).send({ error: 'Job not found' })

    const runId = nanoid()
    const now = new Date().toISOString()

    sqlite.prepare(`
      INSERT INTO runs (id, job_id, started_at, status, triggered_by, created_at)
      VALUES (?, ?, ?, 'running', 'manual', ?)
    `).run(runId, id, now, now)

    return reply.code(201).send(sqlite.prepare(`SELECT * FROM runs WHERE id = ?`).get(runId))
  })
}
