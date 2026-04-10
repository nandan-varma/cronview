import { useState } from 'react'
import { CronTranslator } from './CronTranslator.js'
import { NextRunsPills } from './NextRunsPills.js'
import { api } from '../../api/client.js'

interface ScheduleEditorProps {
  jobId: string
  cronExpr: string
  timezone?: string | null
}

export function ScheduleEditor({ jobId, cronExpr, timezone }: ScheduleEditorProps) {
  const [nextRuns, setNextRuns] = useState<string[]>([])

  async function handleChange(newExpr: string) {
    try {
      const schedule = await api.getSchedule(jobId)
      if (schedule.cronExpr === newExpr) {
        setNextRuns(schedule.nextRuns)
      }
    } catch {}
  }

  return (
    <div className="space-y-3">
      <CronTranslator
        cronExpr={cronExpr}
        jobId={jobId}
        editable={false}
        onChange={handleChange}
      />
      {nextRuns.length > 0 && <NextRunsPills nextRuns={nextRuns} />}
      {timezone && timezone !== 'UTC' && (
        <p className="text-xs text-gray-400">Timezone: {timezone}</p>
      )}
    </div>
  )
}
