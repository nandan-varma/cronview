import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useJobs } from '../../hooks/useJobs.js'
import { JobRow } from './JobRow.js'
import { EmptyState } from '../ui/EmptyState.js'
import { ClipboardList } from 'lucide-react'

interface JobListProps {
  selectedJobId: string | null
  onImport: () => void
  statusFilter?: string
  groupFilter?: string
}

const STATUS_PILLS = ['all', 'passed', 'failed', 'slow', 'running'] as const

export function JobList({ selectedJobId, onImport, statusFilter, groupFilter }: JobListProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>(statusFilter ?? 'all')

  const { data: jobs, loading } = useJobs({
    group: groupFilter,
  })

  const filtered = useMemo(() => {
    return jobs.filter(job => {
      if (search && !job.name.toLowerCase().includes(search.toLowerCase())) return false
      if (status !== 'all' && job.latestRun?.status !== status) return false
      return true
    })
  }, [jobs, search, status])

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white w-80 shrink-0">
      <div className="p-3 border-b border-gray-100 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_PILLS.map(pill => (
            <button
              key={pill}
              onClick={() => setStatus(pill)}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors capitalize ${
                status === pill
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && jobs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-10 h-10" />}
            heading={jobs.length === 0 ? 'No jobs yet' : 'No matching jobs'}
            body={jobs.length === 0 ? 'Import your crontab to get started' : 'Try a different search or filter'}
            action={
              jobs.length === 0 ? (
                <button
                  onClick={onImport}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Import crontab →
                </button>
              ) : undefined
            }
          />
        ) : (
          filtered.map(job => (
            <JobRow key={job.id} job={job} selected={job.id === selectedJobId} />
          ))
        )}
      </div>
    </div>
  )
}
