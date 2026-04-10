import { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { api } from '../../api/client.js'

interface CronTranslatorProps {
  cronExpr: string
  jobId?: string
  editable?: boolean
  onChange?: (expr: string) => void
}

export function CronTranslator({ cronExpr, jobId, editable = false, onChange }: CronTranslatorProps) {
  const [value, setValue] = useState(cronExpr)
  const [humanLabel, setHumanLabel] = useState<string | null>(null)
  const [valid, setValid] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setValue(cronExpr)
  }, [cronExpr])

  useEffect(() => {
    if (!jobId) return
    api.getSchedule(jobId)
      .then(s => { setHumanLabel(s.humanSchedule); setValid(true) })
      .catch(() => {})
  }, [jobId])

  function handleChange(newVal: string) {
    setValue(newVal)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!newVal.trim()) return
      try {
        // Validate client-side via import
        const { parseExpression } = await import('cron-parser')
        parseExpression(newVal)
        setValid(true)
        setError(null)
        onChange?.(newVal)
      } catch (e) {
        setValid(false)
        setError((e as Error).message)
      }
    }, 400)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <code
        className={`font-mono text-sm px-3 py-1.5 rounded-lg border outline-none transition-colors ${
          editable ? 'bg-white' : 'bg-gray-50 cursor-default'
        } ${
          valid === false
            ? 'border-red-300 bg-red-50'
            : valid === true
            ? 'border-green-300'
            : 'border-gray-200'
        }`}
        contentEditable={editable}
        suppressContentEditableWarning
        onInput={e => editable && handleChange((e.target as HTMLElement).innerText)}
      >
        {value}
      </code>

      <span className="text-gray-400 text-sm">→</span>

      {humanLabel && valid !== false && (
        <span className="text-sm text-gray-700 font-medium">{humanLabel}</span>
      )}

      {valid === true && <CheckCircle className="w-4 h-4 text-green-500" />}
      {valid === false && (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <XCircle className="w-3.5 h-3.5" />
          {error}
        </span>
      )}
    </div>
  )
}
