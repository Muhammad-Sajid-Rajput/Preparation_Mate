import { useState, useEffect, useCallback } from 'react'
import { handleApiError } from '../utils/handleApiError'

export const useApi = (apiFunc, immediate = true) => {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFunc(...args)
      setData(result)
      return { success: true, data: result }
    } catch (err) {
      const formattedError = handleApiError(err)
      setError(formattedError)
      return { success: false, error: formattedError }
    } finally {
      setLoading(false)
    }
  }, [apiFunc])

  useEffect(() => {
    if (immediate) execute()
  }, [])

  return { data, loading, error, execute, setData }
}
