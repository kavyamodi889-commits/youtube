// FILE: client/src/pages/Home/Home.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion }            from 'framer-motion'
import { useSearchParams, Link } from 'react-router-dom'
import { pageTransition }    from '../../utils/animationUtils.js'
import { useFocus }          from '../../context/FocusContext.jsx'
import { useAuth }           from '../../context/AuthContext.jsx'
import { timeAgo }           from '../../utils/formatUtils.js'
import api                   from '../../services/api'
import { getFeed }           from '../../services/recommendationService.js'
import VideoCard             from '../../components/VideoCard/VideoCard.jsx'
import ShortCard             from '../../components/ShortCard/ShortCard.jsx'
import SkeletonLoader        from '../../components/SkeletonLoader/SkeletonLoader.jsx'
import '../../styles/home.css'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const NO_THUMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='270' viewBox='0 0 480 270'%3E%3Crect width='480' height='270' fill='%230e0e20'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23444' font-family='sans-serif' font-size='14'%3ENo Thumbnail%3C/text%3E%3C/svg%3E"

const INTEREST_TO_CAT = {
  tech: 'Technology', gaming: 'Gaming', music: 'Music', sports: 'Sports',
  comedy: 'Comedy', edu: 'Education', food: 'Food', travel: 'Travel',
  anime: 'Anime', news: 'News', science: 'Science', fashion: 'Fashion',
  health: 'Health', business: 'Business', movies: 'Movies',
}

// Pattern: v2 = 6 video cards (2 grid rows x 3 cols)
//          s  = 1 shorts row (up to 5 cards)
//          v3 = 9 video cards (3 grid rows x 3 cols)
// Repeats indefinitely until all content is exhausted.
const ROW_PATTERN  = ['v2', 's', 'v3', 's']
const COLS         = 3
const SHORTS_COLS  = 5
const FETCH_LIMIT  = 60
// Start fetching next batch when remaining unrendered pool is below this
const PREFETCH_AT  = 18

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function adaptVideo(v) {
  const ch = v.uploader || {}
  return {
    _id:          v._id,
    title:        v.title,
    thumbnail:    v.thumbnailUrl || v.thumbnail || NO_THUMB,
    thumbnailUrl: v.thumbnailUrl || v.thumbnail || NO_THUMB,
    duration:     v.duration    || 0,
    views:        v.viewCount   || 0,
    likes:        v.likeCount   || 0,
    uploadedAt:   v.createdAt,
    tags:         v.tags        || [],
    category:     v.category    || '',
    videoUrl:     v.videoUrl    || '',
    channel: {
      _id:         ch._id,
      name:        ch.displayName || ch.username || 'Unknown',
      avatar:      ch.avatar      || '',
      verified:    ch.isChannelVerified || false,
      subscribers: ch.subscriberCount   || 0,
    },
  }
}

function dedup(arr) {
  const seen = new Set()
  return arr.filter(v => {
    if (seen.has(v._id)) return false
    seen.add(v._id)
    return true
  })
}

function applyInterestBoost(results, interests = []) {
  if (!interests.length) return results
  const preferred = new Set(interests.map(i => INTEREST_TO_CAT[i]).filter(Boolean))
  if (!preferred.size) return results
  const pref = results.filter(v =>  preferred.has(v.category))
  const rest = results.filter(v => !preferred.has(v.category))
  const out = []
  let pi = 0, ri = 0
  while (pi < pref.length || ri < rest.length) {
    if (pi < pref.length) out.push(pref[pi++])
    if (pi < pref.length) out.push(pref[pi++])
    if (ri < rest.length) out.push(rest[ri++])
  }
  return out
}

// ─── LIVE CARD ────────────────────────────────────────────────────────────────
function LiveCard({ stream }) {
  const ch      = stream.host || {}
  const thumb   = stream.thumbnailUrl || stream.thumbnail || null
  const viewers = stream.currentViewers ?? stream.viewerCount ?? 0
  const name    = ch.displayName || ch.username || 'Unknown'
  const initial = name[0]?.toUpperCase() || 'L'
  return (
    <motion.div className="live-card" whileHover={{ y: -4 }} transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}>
      <Link to={`/live/${stream._id}`} className="live-card-thumb-wrap">
        {thumb
          ? <img src={thumb} alt={stream.title} className="live-card-thumb" loading="lazy" />
          : <div className="live-card-thumb-placeholder">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="2"/>
                <path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/>
              </svg>
            </div>
        }
        <div className="live-card-badge"><span className="live-card-dot" />LIVE</div>
      </Link>
      <div className="live-card-info">
        <Link to={`/channel/${ch._id || '#'}`} className="live-card-avatar-wrap">
          {ch.avatar
            ? <img src={ch.avatar} alt={name} className="live-card-avatar" />
            : <div className="live-card-avatar live-card-avatar-fallback">{initial}</div>}
        </Link>
        <div className="live-card-meta">
          <div className="live-card-title-wrap">
            <Link to={`/live/${stream._id}`} className="live-card-title">{stream.title}</Link>
          </div>
          <div className="live-card-channel-row">
            <Link to={`/channel/${ch._id || '#'}`} className="live-card-channel">{name}</Link>
          </div>
          <p className="live-card-stats">
            {viewers.toLocaleString()} watching {'\u00b7'} {timeAgo(stream.startedAt || stream.createdAt)}
            {stream.category && <> {'\u00b7'} {stream.category}</>}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── VIDEO BLOCK ──────────────────────────────────────────────────────────────
function VideoBlock({ videos, skeleton, skeletonCount, liveCards }) {
  const items = skeleton ? Array(skeletonCount).fill(null) : videos
  if (!skeleton && items.length === 0) return null
  return (
    <section className="home-videos-section">
      <div className="video-grid">
        {!skeleton && liveCards && liveCards.map((stream, i) => (
          <motion.div key={`live-${stream._id}`}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}>
            <LiveCard stream={stream} />
          </motion.div>
        ))}
        {items.map((video, i) =>
          skeleton || !video
            ? <SkeletonLoader key={`sk-${i}`} type="video" />
            : (
              <motion.div key={video._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: (i % 9) * 0.04 }}>
                <VideoCard video={adaptVideo(video)} />
              </motion.div>
            )
        )}
      </div>
    </section>
  )
}

// ─── SHORTS ROW ───────────────────────────────────────────────────────────────
function ShortsRow({ shorts, skeleton, label }) {
  if (!skeleton && shorts.length === 0) return null
  return (
    <section className="home-shorts-section">
      <div className="home-section-header">
        <div className="home-section-title-wrap">
          <span className="shorts-dot" />
          <h2 className="home-section-title">{label || 'Shorts'}</h2>
        </div>
      </div>
      <div className="shorts-row">
        {skeleton
          ? Array(SHORTS_COLS).fill(0).map((_, i) => <SkeletonLoader key={i} type="short" />)
          : shorts.map((short, i) => (
              <motion.div key={short._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}>
                <ShortCard short={short} />
              </motion.div>
            ))
        }
      </div>
    </section>
  )
}

// ─── BUILD FEED ───────────────────────────────────────────────────────────────
// Converts videoPool + shortPool into an ordered array of section descriptors.
// Rules:
//   * Follow ROW_PATTERN cyclically.
//   * A video step takes exactly targetCards items (6 for v2, 9 for v3),
//     or fewer if pool is nearly exhausted — partial last row is ok at the end.
//   * A shorts step takes up to SHORTS_COLS items from shortPool.
//   * If a shorts step has no shorts left, skip it silently — no blank space.
//   * After the pattern loop, flush any remaining shorts as extra rows.
//   * Result: zero mid-feed gaps, ALL content rendered.
function buildFeedSections(videoPool, shortPool, liveStreams, focusActive, initialLoad) {
  if (initialLoad) {
    return [
      { key: 'sk-v2', kind: 'video',  skeleton: true, skeletonCount: 2 * COLS },
      { key: 'sk-s1', kind: 'shorts', skeleton: true },
      { key: 'sk-v3', kind: 'video',  skeleton: true, skeletonCount: 3 * COLS },
    ]
  }

  const feed    = []
  let vCursor   = 0
  let sCursor   = 0
  let patPos    = 0
  let serial    = 0
  let shortsIdx = 0
  let isFirst   = true

  while (vCursor < videoPool.length) {
    const step = ROW_PATTERN[patPos % ROW_PATTERN.length]
    patPos++

    if (step === 's') {
      // Skip shorts silently if focus mode is on or shorts pool is empty
      if (focusActive || sCursor >= shortPool.length) continue

      const take   = Math.min(SHORTS_COLS, shortPool.length - sCursor)
      const shorts = shortPool.slice(sCursor, sCursor + take)
      sCursor += take

      feed.push({
        key:   `s-${serial++}`,
        kind:  'shorts',
        items: shorts,
        label: shortsIdx === 0 ? 'Shorts' : 'More Shorts',
      })
      shortsIdx++
      continue
    }

    // Video step — fill the grid rows, allow partial at the very end
    const targetCards = (step === 'v2' ? 2 : 3) * COLS
    const take        = Math.min(targetCards, videoPool.length - vCursor)
    if (take === 0) break

    feed.push({
      key:       `v-${serial++}`,
      kind:      'video',
      items:     videoPool.slice(vCursor, vCursor + take),
      liveCards: isFirst ? liveStreams : [],
    })
    isFirst  = false
    vCursor += take
  }

  // Flush remaining shorts after all videos are placed
  if (!focusActive) {
    while (sCursor < shortPool.length) {
      const take   = Math.min(SHORTS_COLS, shortPool.length - sCursor)
      const shorts = shortPool.slice(sCursor, sCursor + take)
      sCursor += take
      feed.push({
        key:   `s-tail-${serial++}`,
        kind:  'shorts',
        items: shorts,
        label: shortsIdx === 0 ? 'Shorts' : 'More Shorts',
      })
      shortsIdx++
    }
  }

  return feed
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const [searchParams] = useSearchParams()
  const activeChip     = searchParams.get('category') || 'All'

  const { user }                                   = useAuth()
  const { active: focusActive, blockedCategories } = useFocus()

  const [videoPool,   setVideoPool]   = useState([])
  const [shortPool,   setShortPool]   = useState([])
  const [liveStreams, setLiveStreams]  = useState([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [isEmpty,     setIsEmpty]     = useState(false)
  const [hasMore,     setHasMore]     = useState(true)

  // Use refs so callbacks always see current values without stale closures
  const pageRef       = useRef(1)
  const fetchingRef   = useRef(false)
  const hasMoreRef    = useRef(true)
  const sentinelRef   = useRef(null)
  const observerRef   = useRef(null)
  const categoryRef   = useRef(activeChip)

  // Keep categoryRef in sync
  useEffect(() => { categoryRef.current = activeChip }, [activeChip])
  // Keep hasMoreRef in sync
  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const fetchVideos = useCallback(async (pageNum, category, reset = false) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      let results = await getFeed({ limit: FETCH_LIMIT, page: pageNum, category })

      if (focusActive && blockedCategories.length > 0) {
        results = results.filter(v => !blockedCategories.includes(v.category))
      }

      if (results.length === 0) {
        setHasMore(false)
        hasMoreRef.current = false
        if (pageNum === 1) setIsEmpty(true)
        return
      }

      if (activeChip === 'All' && user?.interests?.length) {
        results = applyInterestBoost(results, user.interests)
      }

      const vids   = results.filter(v => !v.isShort)
      const shorts = results.filter(v =>  v.isShort)

      if (reset) {
        setVideoPool(dedup(vids))
        setShortPool(dedup(shorts))
        setIsEmpty(false)
      } else {
        setVideoPool(prev => dedup([...prev, ...vids]))
        setShortPool(prev => dedup([...prev, ...shorts]))
      }
    } catch {
      if (pageNum === 1) setIsEmpty(true)
    } finally {
      setInitialLoad(false)
      fetchingRef.current = false
    }
  }, [focusActive, blockedCategories, activeChip, user?.interests])

  // ── Fetch next page ────────────────────────────────────────────────────────
  const fetchNext = useCallback(() => {
    if (!hasMoreRef.current || fetchingRef.current) return
    pageRef.current += 1
    fetchVideos(pageRef.current, categoryRef.current === 'All' ? null : categoryRef.current)
  }, [fetchVideos])

  // ── Reset on category / focus change ──────────────────────────────────────
  useEffect(() => {
    setInitialLoad(true)
    setVideoPool([])
    setShortPool([])
    setLiveStreams([])
    setIsEmpty(false)
    setHasMore(true)
    hasMoreRef.current  = true
    pageRef.current     = 1
    fetchingRef.current = false

    api.get('/live').then(r => setLiveStreams(r.data.streams || [])).catch(() => {})
    fetchVideos(1, activeChip === 'All' ? null : activeChip, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChip, focusActive, blockedCategories])

  // ── IntersectionObserver sentinel — true infinite scroll, no blocking ──────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) fetchNext()
      },
      { rootMargin: '1000px' }  // trigger 1000px before sentinel enters viewport
    )

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [fetchNext])

  // ── Belt-and-suspenders: prefetch when pool gets small ────────────────────
  useEffect(() => {
    if (initialLoad || !hasMore || fetchingRef.current) return
    if (videoPool.length < PREFETCH_AT) fetchNext()
  }, [videoPool.length, initialLoad, hasMore, fetchNext])

  // ── Build feed ─────────────────────────────────────────────────────────────
  const feed = buildFeedSections(
    videoPool, shortPool, liveStreams, focusActive, initialLoad
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="home-page"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Empty state */}
      {!initialLoad && isEmpty && (
        <motion.div className="home-empty"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}>
          <div className="home-empty-icon">🎬</div>
          <p className="home-empty-title">
            {activeChip === 'All' ? 'No videos yet' : `No ${activeChip} videos yet`}
          </p>
          <p className="home-empty-sub">
            {activeChip === 'All'
              ? <>Be the first to upload — click <strong>+ Create</strong> to get started</>
              : <>Nothing in <strong>{activeChip}</strong> yet. Try another category or <a href="/" className="home-empty-reset">view all</a></>
            }
          </p>
        </motion.div>
      )}

      {/* Interleaved feed */}
      {feed.map(section => {
        if (section.kind === 'video') {
          return (
            <VideoBlock
              key={section.key}
              videos={section.items || []}
              skeleton={!!section.skeleton}
              skeletonCount={section.skeletonCount || 6}
              liveCards={section.liveCards || []}
            />
          )
        }
        if (section.kind === 'shorts') {
          return (
            <div key={section.key}>
              <div className="home-divider" />
              <ShortsRow
                shorts={section.items || []}
                skeleton={!!section.skeleton}
                label={section.label}
              />
              <div className="home-divider" />
            </div>
          )
        }
        return null
      })}

      {/* Invisible sentinel div — IntersectionObserver target */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

      {/* Subtle loader — shows only while actively fetching more content */}
      {!initialLoad && hasMore && videoPool.length > 0 && (
        <div className="home-load-more-indicator">
          <span className="home-load-spinner" />
        </div>
      )}
    </motion.div>
  )
}