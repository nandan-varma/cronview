import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import type { Run, HeatmapEntry } from '../types/index.js'

export function useRuns(jobId: string | null, params?: { limit?: number; days?: number }) {
  const [runs, setRuns] = useState<Run[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    try {
      const result = await api.getRuns(jobId, params)
      setRuns(result.runs)
      setHeatmap(result.heatmap)
      setTotal(result.total)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [jobId, params?.limit, params?.days])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { runs, heatmap, total, loading, error, refetch: fetch }
}
