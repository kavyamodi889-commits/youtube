// FILE: studio/src/hooks/useCategoryList.js
// Same logic as the client hook — fetches from /api/categories
import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

let _cache      = null
const CACHE_TTL = 5 * 60 * 1000

const FALLBACK = [
  'Education', 'Entertainment', 'Gaming', 'Music',
  'News & Politics', 'Science & Technology', 'Sports',
  'Travel & Events', 'Comedy', 'Film & Animation',
  'Howto & Style', 'People & Blogs', 'General',
  'Motivation', 'Technology', 'Finance', 'Fitness',
  'Just Chatting', 'Art', 'Cooking',
]

export function useCategoryList() {
  const [categoryDocs, setCategoryDocs] = useState(() => {
    if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL) return _cache.categories
    return FALLBACK.map(name => ({ name, subCategories: [] }))
  })
  const [loading, setLoading] = useState(false)
  const [tick,    setTick]    = useState(0)

  const refresh = useCallback(() => { _cache = null; setTick(t => t + 1) }, [])

  useEffect(() => {
    if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL) {
      setCategoryDocs(_cache.categories)
      return
    }
    let cancelled = false
    setLoading(true)
    api.get('/categories')
      .then(res => {
        if (cancelled) return
        const docs = res.data?.categories || res.data?.data?.categories || []
        if (docs.length === 0) return
        _cache = { categories: docs, fetchedAt: Date.now() }
        setCategoryDocs(docs)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tick])

  const addCategory = useCallback(async (name) => {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Name required')
    const res = await api.post('/categories', { name: trimmed })
    refresh()
    return res.data?.category?.name || trimmed
  }, [refresh])

  const addSubCategory = useCallback(async (catName, subName) => {
    const trimmed = subName.trim()
    if (!trimmed) throw new Error('Name required')
    await api.post(`/categories/${encodeURIComponent(catName)}/subcategories`, { name: trimmed })
    refresh()
  }, [refresh])

  const categories = categoryDocs.map(d => d.name)
  return { categories, categoryDocs, loading, addCategory, addSubCategory, refresh }
}