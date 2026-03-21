import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'
import type { Job } from '../types/index.js'

interface UseJobsParams {
  group?: string
  status?: string
  search?: string
}

export function useJobs(params?: UseJobsParams) {
  const [data, setData] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const jobs = await api.getJobs(params)
      setData(jobs)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [params?.group, params?.status, params?.search])

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
