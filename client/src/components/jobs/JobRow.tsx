import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge.js'
import type { Job } from '../../types/index.js'

interface JobRowProps {
  job: Job
  selected: boolean
}

function fmtDuration(ms: number | null): string {
  if (!ms) return ''
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function JobRow({ job, selected }: JobRowProps) {
  const status = (job.latestRun?.status ?? 'unknown') as 'passed' | 'failed' | 'running' | 'slow' | 'unknown'

  return (
    <Link
      to={`/jobs/${job.id}`}
      replace
      className={`flex items-center justify-between px-4 py-3 transition-colors cursor-pointer border-b border-gray-100 last:border-0 ${
        selected
          ? 'bg-indigo-50 text-indigo-800'
          : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold truncate ${selected ? 'text-indigo-800' : 'text-gray-900'}`}>
          {job.name}
        </p>
        <p className={`text-xs mt-0.5 truncate ${selected ? 'text-indigo-600' : 'text-gray-400'}`}>
          {job.humanSchedule}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-3 shrink-0">
        <Badge status={status} size="sm" />
        {job.latestRun?.durationMs && (
          <span className="text-xs text-gray-400 font-mono hidden sm:block">
            {fmtDuration(job.latestRun.durationMs)}
          </span>
        )}
      </div>
    </Link>
  )
}
