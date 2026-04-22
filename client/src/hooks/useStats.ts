import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import type { Stats } from '../types/index.js'

export function useStats() {
  const [data, setData] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const stats = await api.getStats()
      setData(stats)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 30000)
    window.addEventListener('focus', fetch)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', fetch)
    }
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}
