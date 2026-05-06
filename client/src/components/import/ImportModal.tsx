import { useState, useEffect } from 'react'
import { X, Upload, Check } from 'lucide-react'
import { api } from '../../api/client.js'
import { Button } from '../ui/Button.js'
import type { ParsedJob, Server } from '../../types/index.js'

interface ImportModalProps {
  onClose: () => void
  onImported: () => void
}

type Step = 'paste' | 'review' | 'success'

const EXAMPLE_CRONTAB = `# Daily database backup
0 1 * * * /scripts/backup-postgres.sh

# Weekly report email
0 9 * * 1 /scripts/weekly-report.sh

# Temp file cleanup
0 2 * * * /usr/bin/find /tmp -name 'app-*' -mtime +1 -delete

@daily /scripts/daily-health-check.sh`

export function ImportModal({ onClose, onImported }: ImportModalProps) {
  const [step, setStep] = useState<Step>('paste')
  const [crontab, setCrontab] = useState('')
  const [parsed, setParsed] = useState<ParsedJob[]>([])
  const [names, setNames] = useState<Record<number, string>>({})
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [servers, setServers] = useState<Server[]>([])
  const [serverId, setServerId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [importedCount, setImportedCount] = useState(0)

  useEffect(() => {
    api.getServers().then(s => {
      setServers(s)
      if (s.length > 0) setServerId(s[0].id)
    }).catch(() => {})
  }, [])

  async function handleParse() {
    if (!crontab.trim()) return
    setLoading(true)
    try {
      const result = await api.importCrontab(crontab)
      setParsed(result.parsed)
      setErrors(result.errors)
      const nameMap: Record<number, string> = {}
      const sel = new Set<number>()
      result.parsed.forEach((p, i) => { nameMap[i] = p.suggestedName; sel.add(i) })
      setNames(nameMap)
      setSelected(sel)
      setStep('review')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    const toImport = parsed
      .filter((_, i) => selected.has(i))
      .map((p, i) => ({ ...p, name: names[i] ?? p.suggestedName }))

    setLoading(true)
    try {
      const created = await api.confirmImport(toImport, serverId || undefined)
      setImportedCount(created.length)
      setStep('success')
      onImported()
    } finally {
      setLoading(false)
    }
  }

  function toggleAll(val: boolean) {
    setSelected(val ? new Set(parsed.map((_, i) => i)) : new Set())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Import Crontab</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'paste' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Paste your crontab contents below. Comments and environment variables will be skipped automatically.</p>
              <textarea
                className="w-full h-56 font-mono text-sm border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder={EXAMPLE_CRONTAB}
                value={crontab}
                onChange={e => setCrontab(e.target.value)}
              />
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{parsed.length} jobs parsed. Review and edit names before importing.</p>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.size === parsed.length}
                    onChange={e => toggleAll(e.target.checked)}
                    className="rounded"
                  />
                  Select all
                </label>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  {errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
                </div>
              )}

              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                {parsed.map((p, i) => (
                  <div key={i} className={`p-3 flex items-center gap-3 ${selected.has(i) ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={e => {
                        const next = new Set(selected)
                        e.target.checked ? next.add(i) : next.delete(i)
                        setSelected(next)
                      }}
                      className="rounded shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={names[i] ?? p.suggestedName}
                        onChange={e => setNames(n => ({ ...n, [i]: e.target.value }))}
                        className="text-sm font-medium border-0 border-b border-dashed border-gray-300 focus:outline-none focus:border-indigo-500 bg-transparent w-full"
                      />
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        <code className="font-mono">{p.cronExpr}</code>
                        <span>→</span>
                        <span>{p.humanSchedule}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {servers.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 font-medium">Server:</label>
                  <select
                    value={serverId}
                    onChange={e => setServerId(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No server</option>
                    {servers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {importedCount} job{importedCount !== 1 ? 's' : ''} imported
              </h3>
              <p className="text-sm text-gray-500 mb-6">Your jobs are now being tracked in CronView.</p>
              <button onClick={onClose} className="text-sm text-indigo-600 hover:underline font-medium">
                View all jobs →
              </button>
            </div>
          )}
        </div>

        {step !== 'success' && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            {step === 'review' && (
              <Button variant="ghost" onClick={() => setStep('paste')}>Back</Button>
            )}
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            {step === 'paste' && (
              <Button variant="primary" onClick={handleParse} disabled={!crontab.trim() || loading}>
                <Upload className="w-3.5 h-3.5" />
                {loading ? 'Parsing…' : 'Parse'}
              </Button>
            )}
            {step === 'review' && (
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={selected.size === 0 || loading}
              >
                {loading ? 'Importing…' : `Import ${selected.size} job${selected.size !== 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
