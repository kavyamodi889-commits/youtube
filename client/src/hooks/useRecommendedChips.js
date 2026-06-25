// FILE: client/src/hooks/useRecommendedChips.js
// ─────────────────────────────────────────────────────────────────────────────
// Returns a dynamic chip list for the navbar, driven by the recommendation
// engine. Chips are the categories that appear most in the user's personalised
// feed — so each user sees their own set of topics.
//
// Priority order:
//   1. User's signup interests   (always at the front)
//   2. Categories from rec feed  (sorted by frequency)
//   3. Static fallback list      (if the service is down)
//
// Usage:
//   const chips = useRecommendedChips(user?._id, user?.interests)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { getFeed } from '../services/recommendationService.js'
import api from '../services/api'

const INTEREST_TO_CAT = {
  tech: 'Technology', gaming: 'Gaming', music: 'Music', sports: 'Sports',
  comedy: 'Comedy', edu: 'Education', food: 'Food', travel: 'Travel',
  anime: 'Anime', news: 'News', science: 'Science', fashion: 'Fashion',
  health: 'Health', business: 'Business', movies: 'Movies',
}

const FALLBACK_CHIPS = [
  'All', 'Technology', 'Gaming', 'Music', 'Sports',
  'Comedy', 'Education', 'News', 'Science', 'Travel', 'Food', 'Fashion',
]

const MAX_CHIPS    = 14
const CACHE_TTL_MS = 5 * 60 * 1000   // 5 minutes

// Per-user module-level cache
let _cache = null  // { userId, chips, fetchedAt }

export function useRecommendedChips(userId, userInterests = []) {
  const [chips, setChips] = useState(FALLBACK_CHIPS)

  useEffect(() => {
    const cacheKey = userId || 'anon'

    // Serve from cache if fresh and same user
    if (
      _cache &&
      _cache.userId === cacheKey &&
      Date.now() - _cache.fetchedAt < CACHE_TTL_MS
    ) {
      setChips(_cache.chips)
      return
    }

    let cancelled = false

    async function load() {
      try {
        // Fetch feed results AND all DB categories in parallel
        const [results, catRes] = await Promise.allSettled([
          getFeed({ limit: 50, page: 1, category: null }),
          api.get('/categories'),
        ])

        // All DB category names (so newly-added creator categories appear in chips too)
        const dbCats = catRes.status === 'fulfilled'
          ? (catRes.value.data?.categories || []).map(d => d.name)
          : FALLBACK_CHIPS.slice(1)  // skip 'All'

        // Count category frequency in the rec results
        const counts = {}
        const feedResults = results.status === 'fulfilled' ? results.value : []
        for (const video of feedResults) {
          const cat = video.category
          if (cat && cat !== 'General') {
            counts[cat] = (counts[cat] || 0) + 1
          }
        }

        // Sort by frequency
        const byFreq = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([cat]) => cat)

        // Signup interests go first (preserve signup order)
        const interestCats = (userInterests || [])
          .map(i => INTEREST_TO_CAT[i])
          .filter(Boolean)

        // Merge: interests → rec-engine freq → all DB categories, deduplicated
        const merged = ['All']
        const seen   = new Set(['All'])
        for (const cat of [...interestCats, ...byFreq, ...dbCats]) {
          if (!seen.has(cat)) { merged.push(cat); seen.add(cat) }
          if (merged.length >= MAX_CHIPS) break
        }

        // Pad with fallback if we got very few
        if (merged.length < 5) {
          for (const cat of FALLBACK_CHIPS) {
            if (!seen.has(cat)) { merged.push(cat); seen.add(cat) }
            if (merged.length >= MAX_CHIPS) break
          }
        }

        _cache = { userId: cacheKey, chips: merged, fetchedAt: Date.now() }
        if (!cancelled) setChips(merged)
      } catch {
        if (!cancelled) setChips(FALLBACK_CHIPS)
      }
    }

    load()
    return () => { cancelled = true }
  }, [userId, (userInterests || []).join(',')])  // re-fetch on user change

  return chips
}