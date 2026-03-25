import { Link, useLocation } from 'react-router-dom'
import { ClipboardList, AlertTriangle, Clock, Server, Bell, Settings, Zap, Upload } from 'lucide-react'
import { useJobs } from '../../hooks/useJobs.js'
import { StatusDot } from '../ui/Badge.js'

interface SidebarProps {
  onImport: () => void
}

export function Sidebar({ onImport }: SidebarProps) {
  const location = useLocation()
  const { data: jobs } = useJobs()

  const total = jobs.length
  const failures = jobs.filter(j => j.latestRun?.status === 'failed').length

  // Build groups with worst status
  const groups = Array.from(
    jobs.reduce((acc, job) => {
      if (!job.group) return acc
      const current = acc.get(job.group) ?? 'unknown'
      const worst = worstStatus(current, job.latestRun?.status ?? 'unknown')
      acc.set(job.group, worst)
      return acc
    }, new Map<string, string>())
  )

  function isActive(path: string) {
    return location.pathname.startsWith(path)
  }

  function navClass(path: string) {
    return `flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive(path)
        ? 'bg-indigo-50 text-indigo-700 font-medium'
        : 'text-gray-600 hover:bg-gray-100'
    }`
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-gray-900 text-base">CronView</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 pl-7">{total} jobs</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <Link to="/jobs" className={navClass('/jobs')}>
          <span className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            All Jobs
          </span>
          {total > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5 font-medium">
              {total}
            </span>
          )}
        </Link>

        <Link to="/jobs?status=failed" className={navClass('/jobs?status=failed')}>
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Failures
          </span>
          {failures > 0 && (
            <span className="text-xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 font-medium">
              {failures}
            </span>
          )}
        </Link>

        {groups.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Groups</p>
            </div>
            {groups.map(([group, status]) => (
              <Link key={group} to={`/jobs?group=${encodeURIComponent(group)}`} className={navClass(`/jobs?group=${encodeURIComponent(group)}`)}>
                <span className="flex items-center gap-2 capitalize">{group}</span>
                <StatusDot status={status} />
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <button
          onClick={onImport}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import Crontab
        </button>
        <Link to="/servers" className={navClass('/servers')}>
          <span className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Servers
          </span>
        </Link>
        <Link to="/settings" className={navClass('/settings')}>
          <span className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </span>
        </Link>
      </div>
    </aside>
  )
}

function worstStatus(a: string, b: string): string {
  const rank: Record<string, number> = { failed: 4, timeout: 3, slow: 2, running: 1, passed: 0, unknown: -1 }
  return (rank[a] ?? -1) >= (rank[b] ?? -1) ? a : b
}
