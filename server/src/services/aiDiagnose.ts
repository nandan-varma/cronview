import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function diagnoseRun(params: {
  jobName: string
  cronExpr: string
  humanSchedule: string
  command: string | null
  exitCode: number
  stdout: string
  stderr: string
  recentRuns: Array<{ date: string; status: string; durationMs: number }>
}): Promise<string> {
  const systemPrompt = `You are a DevOps expert diagnosing failed cron jobs. You give concise, specific diagnoses in plain prose — no bullet points, no "I" as the first word. You identify the likely root cause and state the fix clearly.`

  const userPrompt = `Job name: ${params.jobName}
Schedule: ${params.humanSchedule} (${params.cronExpr})
Command: ${params.command ?? 'unknown'}
Exit code: ${params.exitCode}

Stdout:
${params.stdout?.slice(0, 2000) || '(empty)'}

Stderr:
${params.stderr?.slice(0, 2000) || '(empty)'}

Recent run history (last 10):
${params.recentRuns.map(r => `${r.date}: ${r.status} (${r.durationMs}ms)`).join('\n')}

Diagnose the failure in 2–4 sentences. Be specific about the likely cause. If you can see the fix, state it clearly. If this is a recurring pattern, mention it.`

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  })

  return (msg.content[0] as { text: string }).text
}
