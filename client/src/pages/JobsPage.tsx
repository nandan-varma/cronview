import { useParams, useNavigate } from 'react-router-dom'
import { useJobs } from '../hooks/useJobs.js'
import { useStats } from '../hooks/useStats.js'
import { JobList } from '../components/jobs/JobList.js'
import { JobDetail } from '../components/jobs/JobDetail.js'
import { Topbar } from '../components/layout/Topbar.js'
import { StatCard } from '../components/ui/StatCard.js'
import { EmptyState } from '../components/ui/EmptyState.js'
import { ClipboardList, CheckCircle, XCircle, Gauge, Activity, Clock } from 'lucide-react'

interface JobsPageProps {
  onImport: () => void
}

export function JobsPage({ onImport }: JobsPageProps) {
  const { id: selectedJobId } = useParams()
  const navigate = useNavigate()
  const { data: jobs, refetch } = useJobs()
  const { data: stats } = useStats()

  const selectedJob = jobs.find(j => j.id === selectedJobId) ?? null

  function handleUpdate() {
    refetch()
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar onImport={onImport} onAddJob={() => {}} />

      {/* Stat cards */}
      <div className="px-6 py-4 grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 border-b border-gray-100 bg-gray-50">
        <StatCard
          label="Total Jobs"
          value={stats?.total ?? 0}
          icon={<ClipboardList className="w-5 h-5" />}
          color="text-indigo-600"
        />
        <StatCard
          label="Healthy"
          value={stats?.healthy ?? 0}
          icon={<CheckCircle className="w-5 h-5" />}
          color="text-green-600"
        />
        <StatCard
          label="Failed"
          value={stats?.failed ?? 0}
          icon={<XCircle className="w-5 h-5" />}
          color="text-red-600"
        />
        <StatCard
          label="Slow"
          value={stats?.slow ?? 0}
          icon={<Gauge className="w-5 h-5" />}
          color="text-amber-600"
        />
        <StatCard
          label="Runs Today"
          value={stats?.runsToday ?? 0}
          icon={<Activity className="w-5 h-5" />}
          color="text-blue-600"
          subtitle={stats?.avgDurationMs ? `avg ${Math.round(stats.avgDurationMs / 1000)}s` : undefined}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <JobList
          selectedJobId={selectedJobId ?? null}
          onImport={onImport}
        />

        <div className="flex-1 overflow-hidden">
          {selectedJob ? (
            <JobDetail job={selectedJob} onUpdate={handleUpdate} />
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <EmptyState
                icon={<ClipboardList className="w-12 h-12" />}
                heading="Select a job"
                body="Click any job on the left to see its run history, schedule, and AI diagnosis."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
