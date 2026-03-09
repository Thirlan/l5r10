/**
 * React hooks for API communication
 */

import { useState, useEffect } from 'react'
import { fetchPing, PingResponse } from './api'

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * Hook to fetch the ping endpoint
 */
export function usePing(): UseApiState<PingResponse> {
  const [data, setData] = useState<PingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchPing()
        if (mounted) {
          setData(response)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [])

  return { data, loading, error }
}
