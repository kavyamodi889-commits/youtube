// src/hooks/useAdminAPI.js
// Generic hook for fetching paginated admin data with loading/error states
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api.js'

export function useAdminFetch(endpoint, params = {}, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const abortRef = useRef(null)

  const fetch = useCallback(async (extraParams = {}) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    try {
      const res = await api.get(endpoint, {
        params: { ...params, ...extraParams },
        signal: abortRef.current.signal,
      })
      setData(res.data)
    } catch (err) {
      if (err.name !== 'CanceledError') setError(err?.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, ...deps])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// One-shot mutation helper
export async function adminAction(method, endpoint, body = {}) {
  const res = await api({ method, url: endpoint, data: body })
  return res.data
}
