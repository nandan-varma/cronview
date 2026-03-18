import type { RunStatus } from '../../types/index.js'

interface BadgeProps {
  status: RunStatus | 'unknown'
  size?: 'sm' | 'md'
}

const STATUS_STYLES: Record<string, string> = {
  passed: 'bg-[#EAF3DE] text-[#27500A]',
  failed: 'bg-[#FCEBEB] text-[#791F1F]',
  slow: 'bg-[#FAEEDA] text-[#633806]',
  running: 'bg-[#E6F1FB] text-[#0C447C]',
  timeout: 'bg-[#FCEBEB] text-[#791F1F]',
  unknown: 'bg-gray-100 text-gray-500',
}

const STATUS_DOTS: Record<string, string> = {
  passed: 'bg-[#1D9E75]',
  failed: 'bg-[#E24B4A]',
  slow: 'bg-[#EF9F27]',
  running: 'bg-[#378ADD]',
  timeout: 'bg-[#E24B4A]',
  unknown: 'bg-gray-400',
}

export function Badge({ status, size = 'md' }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.unknown
  const dot = STATUS_DOTS[status] ?? STATUS_DOTS.unknown
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${style} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}

export function StatusDot({ status }: { status: string }) {
  const dot = STATUS_DOTS[status] ?? STATUS_DOTS.unknown
  return <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
}
