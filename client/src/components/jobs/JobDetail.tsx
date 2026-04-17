import { useState, useEffect } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Play, Pencil, PowerOff, Trash2, Server, Clock, Terminal } from 'lucide-react'
import { Badge } from '../ui/Badge.js'
import { Button } from '../ui/Button.js'
import { HeatmapGrid } from '../history/HeatmapGrid.js'
import { RunList } from '../history/RunList.js'
import { DiagnosisBox } from '../ai/DiagnosisBox.js'
import { ScheduleEditor } from '../schedule/ScheduleEditor.js'
import { NextRunsPills } from '../schedule/NextRunsPills.js'
import { useRuns } from '../../hooks/useRuns.js'
import { api } from '../../api/client.js'
import type { Job } from '../../types/index.js'

interface JobDetailProps {
  job: Job
  onUpdate: () => void
}

export function JobDetail({ job, onUpdate }: JobDetailProps) {
  const { runs, heatmap, refetch } = useRuns(job.id, { limit: 20 })
  const [nextRuns, setNextRuns] = useState<string[]>([])
  const [triggering, setTriggering] = useState(false)
  const [filterDate, setFilterDate] = useState<string | null>(null)

  const latestStatus = job.latestRun?.status ?? 'unknown'
  const isFailed = latestStatus === 'failed'

  useEffect(() => {
    api.getSchedule(job.id)
      .then(s => setNextRuns(s.nextRuns))
      .catch(() => {})
  }, [job.id])

  async function handleTrigger() {
    setTriggering(true)
    try {
      await api.triggerRun(job.id)
      await refetch()
      onUpdate()
    } finally {
      setTriggering(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${job.name}"? This will also delete all run history.`)) return
    await api.deleteJob(job.id, true)
    onUpdate()
  }

  async function handleToggleEnabled() {
    await api.updateJob(job.id, { enabled: !job.enabled } as Partial<Job>)
    onUpdate()
  }

  const filteredRuns = filterDate
    ? runs.filter(r => r.startedAt.startsWith(filterDate))
    : runs

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-gray-900">{job.name}</h2>
              <Badge status={latestStatus as 'passed' | 'failed' | 'running' | 'slow' | 'unknown'} />
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              {job.latestRun && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(parseISO(job.latestRun.startedAt), { addSuffix: true })}
                </span>
              )}
              {job.server && (
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3" />
                  {job.server.name}
                </span>
              )}
              {job.latestRun?.exitCode !== undefined && job.latestRun?.exitCode !== null && (
                <span className="flex items-center gap-1 font-mono">
                  <Terminal className="w-3 h-3" />
                  exit {job.latestRun.exitCode}
                </span>
              )}
              {job.group && (
                <span className="capitalize bg-gray-100 px-2 py-0.5 rounded-full">{job.group}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="primary" onClick={handleTrigger} disabled={triggering}>
              <Play className="w-3 h-3" />
              {triggering ? 'Running…' : 'Run now'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleToggleEnabled}>
              <PowerOff className="w-3 h-3" />
              {job.enabled ? 'Disable' : 'Enable'}
            </Button>
            <Button size="sm" variant="danger" onClick={handleDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Schedule */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Schedule</h3>
          <ScheduleEditor jobId={job.id} cronExpr={job.cronExpr} timezone={job.timezone} />
          {nextRuns.length > 0 && <div className="mt-2"><NextRunsPills nextRuns={nextRuns} /></div>}
        </section>

        {/* AI Diagnosis */}
        {isFailed && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Diagnosis</h3>
            <DiagnosisBox jobId={job.id} />
          </section>
        )}

        {/* Heatmap */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Run History (28 days)</h3>
            {filterDate && (
              <button onClick={() => setFilterDate(null)} className="text-xs text-indigo-600 hover:underline">
                Clear filter
              </button>
            )}
          </div>
          {heatmap.length > 0 ? (
            <HeatmapGrid heatmap={heatmap} onDayClick={setFilterDate} />
          ) : (
            <p className="text-sm text-gray-400">This job has never run</p>
          )}
        </section>

        {/* Runs */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {filterDate ? `Runs on ${filterDate}` : 'Recent Runs'}
          </h3>
          {runs.length === 0 ? (
            <p className="text-sm text-gray-400">This job has never run</p>
          ) : (
            <RunList runs={filteredRuns} />
          )}
        </section>

        {/* Notes */}
        {job.notes && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{job.notes}</p>
          </section>
        )}
      </div>
    </div>
  )
}
