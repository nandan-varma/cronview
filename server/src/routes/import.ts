import type { FastifyInstance } from 'fastify'
import { sqlite } from '../db/client.js'
import { nanoid } from 'nanoid'
import { normaliseAtSyntax, toHumanSchedule, getNextRuns, validateExpr } from '../services/cronParser.js'
import type { JobRecord } from '../db/schema.js'

const ENV_LINE_RE = /^\s*(MAILTO|PATH|SHELL|HOME|CRON_TZ|CRONDIR|LOGNAME)\s*=/i
const COMMENT_RE = /^\s*#/

interface ParsedJob {
  cronExpr: string
  command: string
  humanSchedule: string
  suggestedName: string
  nextRuns: string[]
}

function suggestName(command: string): string {
  return command
    .trim()
    .replace(/^\/[^\s]+ /, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 50) || 'job'
}

function parseLine(line: string): { cronExpr: string; command: string } | null {
  const trimmed = line.trim()
  if (!trimmed || COMMENT_RE.test(trimmed) || ENV_LINE_RE.test(trimmed)) return null

  if (trimmed.startsWith('@')) {
    const spaceIdx = trimmed.indexOf(' ')
    if (spaceIdx === -1) return null
    const atPart = trimmed.slice(0, spaceIdx)
    const cmd = trimmed.slice(spaceIdx + 1).trim()
    const normalised = normaliseAtSyntax(atPart)
    if (normalised === atPart) return null
    return { cronExpr: normalised, command: cmd }
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length < 6) return null

  const cronExpr = parts.slice(0, 5).join(' ')
  const command = parts.slice(5).join(' ')
  return { cronExpr, command }
}

export default async function (fastify: FastifyInstance) {
  fastify.post('/import', async (req, reply) => {
    const { crontab } = req.body as { crontab: string }
    if (!crontab) return reply.code(400).send({ error: 'crontab is required' })

    const lines = crontab.split('\n')
    const parsed: ParsedJob[] = []
    const errors: string[] = []
    let skipped = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || COMMENT_RE.test(trimmed)) continue
      if (ENV_LINE_RE.test(trimmed)) { skipped++; continue }

      const result = parseLine(line)
      if (!result) { skipped++; continue }

      const validation = validateExpr(result.cronExpr)
      if (!validation.valid) {
        errors.push(`Invalid expression "${result.cronExpr}": ${validation.error}`)
        continue
      }

      parsed.push({
        cronExpr: result.cronExpr,
        command: result.command,
        humanSchedule: toHumanSchedule(result.cronExpr),
        suggestedName: suggestName(result.command),
        nextRuns: getNextRuns(result.cronExpr, 3).map(d => d.toISOString()),
      })
    }

    return { parsed, skipped, errors }
  })

  fastify.post('/import/confirm', async (req, reply) => {
    const { jobs: parsedJobs, serverId } = req.body as {
      jobs: Array<{ name?: string; suggestedName?: string; cronExpr: string; command: string }>
      serverId?: string
    }

    const created = []
    for (const pj of parsedJobs) {
      const name = (pj.name ?? pj.suggestedName ?? 'job').trim()
      const id = nanoid()
      const now = new Date().toISOString()

      try {
        sqlite.prepare(`
          INSERT INTO jobs (id, name, cron_expr, command, server_id, enabled, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        `).run(id, name, pj.cronExpr, pj.command, serverId ?? null, now, now)

        const job = sqlite.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as JobRecord
        created.push({
          id: job.id,
          name: job.name,
          cronExpr: job.cron_expr,
          humanSchedule: toHumanSchedule(job.cron_expr),
          command: job.command,
          enabled: job.enabled === 1,
        })
      } catch {
        // Skip duplicate names
      }
    }

    return reply.code(201).send(created)
  })
}
