import { useState } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '../ui/Badge.js'
import type { Run } from '../../types/index.js'

interface RunListProps {
  runs: Run[]
}

function fmtDuration(ms: number | null): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function RunList({ runs }: RunListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (runs.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No runs yet</p>
  }

  return (
    <div className="divide-y divide-gray-100">
      {runs.map(run => (
        <div key={run.id}>
          <div
            className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-50 px-1 rounded transition-colors"
            onClick={() => toggle(run.id)}
          >
            <span className="text-gray-400">
              {expanded.has(run.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
            <span className="text-xs text-gray-500 w-36 shrink-0">
              {formatDistanceToNow(parseISO(run.startedAt), { addSuffix: true })}
            </span>
            <Badge status={run.status as 'passed' | 'failed' | 'running' | 'slow'} size="sm" />
            <span className="ml-auto text-xs text-gray-400 font-mono">{fmtDuration(run.durationMs)}</span>
            {run.exitCode !== null && (
              <span className="text-xs text-gray-400 font-mono">exit {run.exitCode}</span>
            )}
          </div>

          {expanded.has(run.id) && (run.stdout || run.stderr) && (
            <div className="px-5 pb-3 space-y-2">
              {run.stdout && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">stdout</p>
                  <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-auto max-h-48 font-mono">
                    {run.stdout}
                  </pre>
                </div>
              )}
              {run.stderr && (
                <div>
                  <p className="text-xs font-medium text-red-500 mb-1">stderr</p>
                  <pre className="text-xs bg-red-950 text-red-200 rounded-lg p-3 overflow-auto max-h-48 font-mono">
                    {run.stderr}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
