// FILE: client/src/hooks/useCategoryList.js
// Fetches the global category list from MongoDB.
// All modals (UploadModal, GoLiveModal) and studio pages import this.
// Includes a local fallback so UI never breaks if the server is slow.

import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

// Module-level cache — shared across all hook instances in the same session
let _cache      = null   // { categories, fetchedAt }
const CACHE_TTL = 5 * 60 * 1000   // 5 min

const FALLBACK = [
  'Education', 'Entertainment', 'Gaming', 'Music',
  'News & Politics', 'Science & Technology', 'Sports',
  'Travel & Events', 'Comedy', 'Film & Animation',
  'Howto & Style', 'People & Blogs', 'General',
  'Motivation', 'Technology', 'Finance', 'Fitness',
  'Just Chatting', 'Art', 'Cooking',
]

/**
 * @returns {{
 *   categories: string[],          // flat list of category names
 *   categoryDocs: object[],        // full docs (name, subCategories, …)
 *   loading: boolean,
 *   addCategory: (name: string) => Promise<string>,       // returns saved name
 *   addSubCategory: (cat: string, sub: string) => Promise<void>,
 *   refresh: () => void,
 * }}
 */
export function useCategoryList() {
  const [categoryDocs, setCategoryDocs] = useState(() => {
    // Serve from cache immediately if fresh
    if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL) return _cache.categories
    return FALLBACK.map(name => ({ name, subCategories: [] }))
  })
  const [loading, setLoading] = useState(false)
  const [tick,    setTick]    = useState(0)

  const refresh = useCallback(() => {
    _cache = null   // invalidate cache
    setTick(t => t + 1)
  }, [])

  useEffect(() => {
    // Skip if cache is still fresh
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
        if (docs.length === 0) return  // don't override with empty

        _cache = { categories: docs, fetchedAt: Date.now() }
        setCategoryDocs(docs)
      })
      .catch(() => {
        // Keep whatever we have (fallback or previous)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [tick])

  // Add a new top-level category — posts to server, then refreshes
  const addCategory = useCallback(async (name) => {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Name required')
    const res = await api.post('/categories', { name: trimmed })
    refresh()
    return res.data?.category?.name || trimmed
  }, [refresh])

  // Add a subcategory under an existing category
  const addSubCategory = useCallback(async (catName, subName) => {
    const trimmed = subName.trim()
    if (!trimmed) throw new Error('Name required')
    await api.post(`/categories/${encodeURIComponent(catName)}/subcategories`, { name: trimmed })
    refresh()
  }, [refresh])

  const categories = categoryDocs.map(d => d.name)

  return { categories, categoryDocs, loading, addCategory, addSubCategory, refresh }
}