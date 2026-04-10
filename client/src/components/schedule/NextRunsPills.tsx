import { format, isToday, isTomorrow, isThisWeek } from 'date-fns'

interface NextRunsPillsProps {
  nextRuns: string[]
}

function formatRunTime(isoString: string): string {
  const date = new Date(isoString)
  const timeStr = format(date, 'h:mm a')

  if (isToday(date)) return `Today ${timeStr}`
  if (isTomorrow(date)) return `Tomorrow ${timeStr}`
  if (isThisWeek(date)) return `${format(date, 'EEE')} ${timeStr}`
  return `${format(date, 'MMM d')} ${timeStr}`
}

export function NextRunsPills({ nextRuns }: NextRunsPillsProps) {
  if (!nextRuns || nextRuns.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {nextRuns.slice(0, 5).map((run, i) => (
        <span
          key={i}
          className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-1 font-medium"
        >
          {formatRunTime(run)}
        </span>
      ))}
    </div>
  )
}
