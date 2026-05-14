import { useState, useEffect } from 'react'
import { Bell, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button.js'
import { EmptyState } from '../components/ui/EmptyState.js'

interface AlertChannel {
  id: string
  type: string
  config: string
  onFailure: boolean
  onRecovery: boolean
}

export function SettingsPage() {
  const [channels, setChannels] = useState<AlertChannel[]>([])
  const [type, setType] = useState<'email' | 'webhook' | 'slack'>('email')
  const [configValue, setConfigValue] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!configValue.trim()) return
    setAdding(true)
    try {
      const config = type === 'email'
        ? { email: configValue }
        : { url: configValue }

      const res = await fetch('/api/alert-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config: JSON.stringify(config), onFailure: true, onRecovery: true }),
      })
      if (res.ok) {
        const ch = await res.json()
        setChannels(c => [...c, ch])
        setConfigValue('')
      }
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Alert Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Alert Channel</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['email', 'webhook', 'slack'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium capitalize transition-colors ${
                  type === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={type === 'email' ? 'alert@example.com' : 'https://hooks.example.com/…'}
              value={configValue}
              onChange={e => setConfigValue(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button variant="primary" onClick={handleAdd} disabled={!configValue.trim() || adding}>
              {adding ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </div>
      </div>

      {channels.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-10 h-10" />}
          heading="No alert channels"
          body="Add an email or webhook to get notified when jobs fail."
        />
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
          {channels.map(ch => (
            <div key={ch.id} className="px-4 py-3 bg-white flex items-center justify-between">
              <div>
                <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 capitalize font-medium mr-2">
                  {ch.type}
                </span>
                <span className="text-sm text-gray-700">
                  {JSON.parse(ch.config).email ?? JSON.parse(ch.config).url}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
