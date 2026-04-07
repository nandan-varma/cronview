import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { HeatmapEntry } from '../../types/index.js'

interface HeatmapGridProps {
  heatmap: HeatmapEntry[]
  onDayClick?: (date: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  passed: '#5DCAA5',
  failed: '#F09595',
  slow: '#EF9F27',
  running: '#378ADD',
  none: '#E5E7EB',
}

function fmtDuration(ms: number | null): string {
  if (!ms) return ''
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function HeatmapGrid({ heatmap, onDayClick }: HeatmapGridProps) {
  const [tooltip, setTooltip] = useState<{ entry: HeatmapEntry; x: number; y: number } | null>(null)

  return (
    <div className="relative">
      <div className="flex gap-1 flex-wrap">
        {heatmap.map((entry) => (
          <div
            key={entry.date}
            className="w-6 h-6 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: STATUS_COLORS[entry.status] ?? STATUS_COLORS.none }}
            onMouseEnter={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect()
              setTooltip({ entry, x: rect.left, y: rect.top })
            }}
            onMouseLeave={() => setTooltip(null)}
            onClick={() => onDayClick?.(entry.date)}
          />
        ))}
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 pointer-events-none shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 36 }}
        >
          <span className="font-medium">
            {format(parseISO(tooltip.entry.date), 'EEE d MMM')}
          </span>
          {' — '}
          <span className="capitalize">{tooltip.entry.status}</span>
          {tooltip.entry.avgDurationMs && (
            <span className="text-gray-300"> ({fmtDuration(tooltip.entry.avgDurationMs)})</span>
          )}
        </div>
      )}
    </div>
  )
}
