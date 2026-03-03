import type { FastifyInstance } from 'fastify'
import { sqlite } from '../db/client.js'
import { nanoid } from 'nanoid'
import { diagnoseRun } from '../services/aiDiagnose.js'
import { toHumanSchedule } from '../services/cronParser.js'
import type { JobRecord, RunRecord, DiagnosisRecord } from '../db/schema.js'

export default async function (fastify: FastifyInstance) {
  fastify.get('/jobs/:id/diagnose', async (req, reply) => {
    const { id } = req.params as { id: string }

    const job = sqlite.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as JobRecord | undefined
    if (!job) return reply.code(404).send({ error: 'Job not found' })

    const latestRun = sqlite
      .prepare(`SELECT * FROM runs WHERE job_id = ? ORDER BY started_at DESC LIMIT 1`)
      .get(id) as RunRecord | undefined

    if (!latestRun || latestRun.status !== 'failed') {
      return reply.code(400).send({ error: 'Latest run did not fail' })
    }

    // Check diagnosis cache
    const cached = sqlite
      .prepare(`SELECT * FROM diagnoses WHERE run_id = ? LIMIT 1`)
      .get(latestRun.id) as DiagnosisRecord | undefined

    if (cached) {
      return { runId: latestRun.id, diagnosis: cached.diagnosis, cached: true }
    }

    const recentRuns = sqlite.prepare(`
      SELECT date(started_at) as date, status, duration_ms as durationMs
      FROM runs WHERE job_id = ? ORDER BY started_at DESC LIMIT 10
    `).all(id) as Array<{ date: string; status: string; durationMs: number }>

    const diagnosis = await diagnoseRun({
      jobName: job.name,
      cronExpr: job.cron_expr,
      humanSchedule: toHumanSchedule(job.cron_expr, job.timezone ?? 'UTC'),
      command: job.command,
      exitCode: latestRun.exit_code ?? 1,
      stdout: latestRun.stdout ?? '',
      stderr: latestRun.stderr ?? '',
      recentRuns,
    })

    sqlite.prepare(`
      INSERT INTO diagnoses (id, run_id, diagnosis, created_at) VALUES (?, ?, ?, ?)
    `).run(nanoid(), latestRun.id, diagnosis, new Date().toISOString())

    return { runId: latestRun.id, diagnosis, cached: false }
  })
}
