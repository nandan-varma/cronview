import { Bell, Plus } from 'lucide-react'
import { useJobs } from '../../hooks/useJobs.js'
import { Button } from '../ui/Button.js'

interface TopbarProps {
  onImport: () => void
  onAddJob: () => void
}

export function Topbar({ onImport, onAddJob }: TopbarProps) {
  const { data: jobs } = useJobs()
  const failures = jobs.filter(j => j.latestRun?.status === 'failed').length

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <span className="font-semibold text-gray-900">Jobs</span>
        <span className="text-sm text-gray-400 ml-2">{jobs.length} jobs</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          {failures > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
        <Button variant="secondary" size="sm" onClick={onImport}>
          Import crontab
        </Button>
        <Button variant="primary" size="sm" onClick={onAddJob}>
          <Plus className="w-3.5 h-3.5" />
          Add job
        </Button>
      </div>
    </div>
  )
}
