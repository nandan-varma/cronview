import type { FastifyInstance } from 'fastify'
import { sqlite } from '../db/client.js'

export default async function (fastify: FastifyInstance) {
  fastify.get('/stats', async () => {
    const total = (sqlite.prepare(`SELECT COUNT(*) as cnt FROM jobs WHERE enabled = 1`).get() as { cnt: number }).cnt

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const runsToday = (sqlite.prepare(`SELECT COUNT(*) as cnt FROM runs WHERE started_at >= ?`).get(todayStr) as { cnt: number }).cnt

    const avgRow = sqlite.prepare(`SELECT AVG(duration_ms) as avg FROM runs WHERE duration_ms IS NOT NULL`).get() as { avg: number | null }

    const allJobs = sqlite.prepare(`SELECT id FROM jobs WHERE enabled = 1`).all() as Array<{ id: string }>

    let failed = 0
    let slow = 0

    for (const job of allJobs) {
      const latestRuns = sqlite
        .prepare(`SELECT exit_code, duration_ms, status FROM runs WHERE job_id = ? ORDER BY started_at DESC LIMIT 10`)
        .all(job.id) as Array<{ exit_code: number | null; duration_ms: number | null; status: string }>

      if (latestRuns.length === 0) continue

      const latest = latestRuns[0]
      if (latest.exit_code !== null && latest.exit_code !== 0) {
        failed++
      }

      if (latestRuns.length >= 2 && latest.duration_ms !== null) {
        const durations = latestRuns
          .slice(1)
          .map(r => r.duration_ms)
          .filter((d): d is number => d !== null)
          .sort((a, b) => a - b)

        if (durations.length > 0) {
          const mid = Math.floor(durations.length / 2)
          const median = durations.length % 2 === 0
            ? (durations[mid - 1] + durations[mid]) / 2
            : durations[mid]

          if (median > 0 && latest.duration_ms > median * 3) {
            slow++
          }
        }
      }
    }

    return {
      total,
      healthy: Math.max(0, total - failed - slow),
      failed,
      slow,
      runsToday,
      avgDurationMs: Math.round(avgRow.avg ?? 0),
    }
  })
}
