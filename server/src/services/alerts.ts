import { sqlite } from '../db/client.js'
import nodemailer from 'nodemailer'
import type { AlertChannelRecord, JobRecord, RunRecord } from '../db/schema.js'

interface AlertConfig {
  url?: string
  email?: string
  webhookUrl?: string
}

export async function dispatchAlerts(jobId: string, runId: string) {
  const channels = sqlite
    .prepare(`SELECT * FROM alert_channels WHERE job_id = ? OR job_id IS NULL`)
    .all(jobId) as AlertChannelRecord[]

  const job = sqlite.prepare(`SELECT * FROM jobs WHERE id = ?`).get(jobId) as JobRecord | undefined
  const run = sqlite.prepare(`SELECT * FROM runs WHERE id = ?`).get(runId) as RunRecord | undefined

  if (!job || !run) return

  for (const channel of channels) {
    if (!channel.on_failure) continue
    const config: AlertConfig = JSON.parse(channel.config)

    try {
      if (channel.type === 'webhook' || channel.type === 'slack') {
        const url = config.url ?? config.webhookUrl
        if (!url) continue
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `CronView: Job "${job.name}" failed with exit code ${run.exit_code}`,
            job: job.name,
            runId,
            exitCode: run.exit_code,
            stderr: run.stderr?.slice(0, 500),
          }),
        })
      } else if (channel.type === 'email') {
        if (!config.email) continue
        const transporter = nodemailer.createTransport({ sendmail: true })
        await transporter.sendMail({
          from: 'cronview@localhost',
          to: config.email,
          subject: `[CronView] Job "${job.name}" failed`,
          text: `Job: ${job.name}\nExit code: ${run.exit_code}\nStarted: ${run.started_at}\nStderr:\n${run.stderr ?? '(empty)'}`,
        })
      }
    } catch {
      // Alert failures are non-fatal
    }
  }
}
