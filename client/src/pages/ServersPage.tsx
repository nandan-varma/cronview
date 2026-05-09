import { useState } from 'react'
import { Server, Plus, Copy, Check } from 'lucide-react'
import { api } from '../api/client.js'
import { Button } from '../components/ui/Button.js'
import { EmptyState } from '../components/ui/EmptyState.js'
import { useEffect } from 'react'
import type { Server as ServerType } from '../types/index.js'

export function ServersPage() {
  const [servers, setServers] = useState<ServerType[]>([])
  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [adding, setAdding] = useState(false)
  const [agentKey, setAgentKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.getServers().then(setServers).catch(() => {})
  }, [])

  async function handleAdd() {
    if (!name.trim()) return
    setAdding(true)
    try {
      const server = await api.createServer({ name: name.trim(), host: host.trim() || undefined })
      setServers(s => [...s, server])
      setAgentKey((server as ServerType & { agentKey?: string }).agentKey ?? null)
      setName('')
      setHost('')
    } finally {
      setAdding(false)
    }
  }

  function copyKey() {
    if (!agentKey) return
    navigator.clipboard.writeText(agentKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Servers</h1>

      {agentKey && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">Server created — save this agent key now</p>
          <p className="text-xs text-green-700 mb-3">This key will never be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-white border border-green-200 rounded px-3 py-2 truncate">
              {agentKey}
            </code>
            <Button size="sm" variant="secondary" onClick={copyKey}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Server</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Server name (e.g. prod-1)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Host (optional)"
            value={host}
            onChange={e => setHost(e.target.value)}
            className="w-48 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button variant="primary" onClick={handleAdd} disabled={!name.trim() || adding}>
            <Plus className="w-3.5 h-3.5" />
            {adding ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </div>

      {servers.length === 0 ? (
        <EmptyState
          icon={<Server className="w-10 h-10" />}
          heading="No servers yet"
          body="Add a server to start tracking cron jobs from your infrastructure."
        />
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
          {servers.map(s => (
            <div key={s.id} className="px-4 py-3 bg-white flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                {s.host && <p className="text-xs text-gray-400 font-mono">{s.host}</p>}
              </div>
              <span className="text-xs text-gray-400">{s.createdAt?.split('T')[0]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
