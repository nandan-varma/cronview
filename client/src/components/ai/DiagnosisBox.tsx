import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { api } from '../../api/client.js'

interface DiagnosisBoxProps {
  jobId: string
}

type DiagnosisState = 'loading' | 'loaded' | 'error'

const SECURITY_KEYWORDS = ['permission', 'denied', 'unauthorized', 'forbidden', 'privilege', 'root', 'sudo']
const PERF_KEYWORDS = ['slow', 'timeout', 'memory', 'cpu', 'disk', 'hung', 'deadlock']

function detectBgClass(text: string): string {
  const lower = text.toLowerCase()
  if (SECURITY_KEYWORDS.some(k => lower.includes(k))) return 'bg-red-50 border-red-200'
  if (PERF_KEYWORDS.some(k => lower.includes(k))) return 'bg-amber-50 border-amber-200'
  return 'bg-blue-50 border-blue-200'
}

function detectIconClass(text: string): string {
  const lower = text.toLowerCase()
  if (SECURITY_KEYWORDS.some(k => lower.includes(k))) return 'text-red-500'
  if (PERF_KEYWORDS.some(k => lower.includes(k))) return 'text-amber-500'
  return 'text-blue-500'
}

export function DiagnosisBox({ jobId }: DiagnosisBoxProps) {
  const [state, setState] = useState<DiagnosisState>('loading')
  const [diagnosis, setDiagnosis] = useState<string | null>(null)
  const [cached, setCached] = useState(false)

  useEffect(() => {
    api.diagnoseJob(jobId)
      .then(result => {
        setDiagnosis(result.diagnosis)
        setCached(result.cached)
        setState('loaded')
      })
      .catch(() => setState('error'))
  }, [jobId])

  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-blue-700">AI Diagnosis</span>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-blue-200 rounded animate-pulse w-full" />
          <div className="h-3 bg-blue-200 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-blue-200 rounded animate-pulse w-3/5" />
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700">
            Couldn't generate diagnosis. Check your API key.
          </span>
        </div>
      </div>
    )
  }

  if (!diagnosis) return null

  const bgClass = detectBgClass(diagnosis)
  const iconClass = detectIconClass(diagnosis)

  return (
    <div className={`rounded-xl border p-4 ${bgClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${iconClass}`} />
          <span className="text-xs font-semibold text-gray-700">AI Diagnosis</span>
        </div>
        {cached && <span className="text-xs text-gray-400">cached</span>}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{diagnosis}</p>
    </div>
  )
}
