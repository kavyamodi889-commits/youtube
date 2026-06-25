// FILE: client/src/pages/Search/Search.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import { formatViews, timeAgo, formatDuration } from '../../utils/formatUtils.js'
import { useFocus } from '../../context/FocusContext.jsx'
import './Search.css'

// ── ICONS ─────────────────────────────────────────────────────────────────────
const GridIcon        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
const ListIcon        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const FilterIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
const ChevronDownIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
const VerifiedIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const CloseIcon       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

const SORT_OPTIONS     = [
  { label: 'Relevance',    val: 'relevance' },
  { label: 'Upload date',  val: 'date'      },
  { label: 'View count',   val: 'views'     },
  { label: 'Rating',       val: 'rating'    },
]
const DURATION_OPTIONS = [
  { label: 'Any duration',       val: ''       },
  { label: 'Short (< 4 min)',    val: 'short'  },
  { label: 'Medium (4–20 min)',  val: 'medium' },
  { label: 'Long (> 20 min)',    val: 'long'   },
]
const DATE_OPTIONS = [
  { label: 'Any time',   val: ''      },
  { label: 'Today',      val: 'today' },
  { label: 'This week',  val: 'week'  },
  { label: 'This month', val: 'month' },
  { label: 'This year',  val: 'year'  },
]
const TYPE_OPTIONS = ['All', 'Videos', 'Shorts', 'Channels']

// adapt API video → display shape
function adapt(v) {
  const ch = v.uploader || {}
  return {
    _id:         v._id,
    title:       v.title,
    description: v.description || '',
    thumbnail:   v.thumbnailUrl || 'https://via.placeholder.com/480x270/0e0e20/fff?text=No+Thumb',
    duration:    v.duration || 0,
    views:       v.viewCount || 0,
    uploadedAt:  v.createdAt,
    isShort:     v.isShort || false,
    channel: {
      _id:      ch._id,
      name:     ch.displayName || ch.username || 'Unknown',
      avatar:   ch.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${ch.username}`,
      verified: ch.isChannelVerified || false,
      subscribers: ch.subscriberCount || 0,
    },
  }
}

export default function Search() {
  const [searchParams]   = useSearchParams()
  const rawQuery         = searchParams.get('q') || ''

  const [activeType,    setActiveType]    = useState('All')
  const [sort,          setSort]          = useState('relevance')
  const [duration,      setDuration]      = useState('')
  const [date,          setDate]          = useState('')
  const [viewMode,      setViewMode]      = useState('list')
  const [openDropdown,  setOpenDropdown]  = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [results,       setResults]       = useState([])
  const [total,         setTotal]         = useState(0)

  const { active: focusActive, blockedCategories } = useFocus()

  const fetchResults = useCallback(() => {
    if (!rawQuery.trim()) { setResults([]); setTotal(0); return }
    setLoading(true)
    const params = new URLSearchParams({ q: rawQuery, sort, limit: 30 })
    if (duration) params.set('duration', duration)
    if (date)     params.set('date', date)
    api.get(`/videos/search?${params}`)
      .then(res => {
        const data = res.data
        let vids = (data.videos || data.data?.videos || []).map(adapt)
        if (activeType === 'Videos') vids = vids.filter(v => !v.isShort)
        if (activeType === 'Shorts') vids = vids.filter(v => v.isShort)
        // Focus mode: always remove shorts + blocked categories
        if (focusActive) {
          vids = vids.filter(v => !v.isShort)
          if (blockedCategories.length > 0)
            vids = vids.filter(v => !blockedCategories.includes(v.category))
        }
        setResults(vids)
        setTotal(data.total || data.data?.total || vids.length)
        setLoading(false)
      })
      .catch(() => { setResults([]); setLoading(false) })
  }, [rawQuery, sort, duration, date, activeType, focusActive, blockedCategories])

  useEffect(() => { fetchResults() }, [fetchResults])

  // reset filters on new query
  useEffect(() => {
    setActiveType('All'); setSort('relevance'); setDuration(''); setDate('')
  }, [rawQuery])

  const activeFilters = [
    sort !== 'relevance'  && SORT_OPTIONS.find(o => o.val === sort)?.label,
    duration              && DURATION_OPTIONS.find(o => o.val === duration)?.label,
    date                  && DATE_OPTIONS.find(o => o.val === date)?.label,
  ].filter(Boolean)

  const clearFilter = f => {
    if (SORT_OPTIONS.find(o => o.label === f))     setSort('relevance')
    if (DURATION_OPTIONS.find(o => o.label === f)) setDuration('')
    if (DATE_OPTIONS.find(o => o.label === f))     setDate('')
  }

  const sortLabel     = SORT_OPTIONS.find(o => o.val === sort)?.label     || 'Relevance'
  const durationLabel = DURATION_OPTIONS.find(o => o.val === duration)?.label || 'Any duration'
  const dateLabel     = DATE_OPTIONS.find(o => o.val === date)?.label     || 'Any time'

  return (
    <motion.div className="search-page" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.25}}
      onClick={() => setOpenDropdown(null)}
    >
      {rawQuery && (
        <div className="search-heading">
          Results for <span className="search-heading-query">"{rawQuery}"</span>
        </div>
      )}

      {/* Type tabs */}
      <div className="search-type-tabs">
        {TYPE_OPTIONS.map(type => (
          <motion.button key={type} className={`search-type-tab ${activeType===type?'active':''}`}
            onClick={() => setActiveType(type)} whileHover={{scale:1.04}} whileTap={{scale:0.96}}>
            {type}
          </motion.button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="search-filter-bar" onClick={e => e.stopPropagation()}>
        <div className="filter-bar-left"><FilterIcon /><span className="filter-label">Filters</span></div>
        <div className="filter-dropdowns">
          {/* Sort */}
          <div className="filter-dropdown-wrap">
            <button className={`filter-dropdown-btn ${sort!=='relevance'?'active':''}`}
              onClick={() => setOpenDropdown(v => v==='sort'?null:'sort')}>
              {sortLabel} <ChevronDownIcon />
            </button>
            <AnimatePresence>
              {openDropdown === 'sort' && (
                <motion.div className="filter-dropdown-menu"
                  initial={{opacity:0,y:-8,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.95}} transition={{duration:0.15}}>
                  <div className="filter-dropdown-label">Sort by</div>
                  {SORT_OPTIONS.map(o => (
                    <button key={o.val} className={`filter-dropdown-item ${sort===o.val?'active':''}`}
                      onClick={() => { setSort(o.val); setOpenDropdown(null) }}>{o.label}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Duration */}
          <div className="filter-dropdown-wrap">
            <button className={`filter-dropdown-btn ${duration?'active':''}`}
              onClick={() => setOpenDropdown(v => v==='duration'?null:'duration')}>
              {durationLabel} <ChevronDownIcon />
            </button>
            <AnimatePresence>
              {openDropdown === 'duration' && (
                <motion.div className="filter-dropdown-menu"
                  initial={{opacity:0,y:-8,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.95}} transition={{duration:0.15}}>
                  <div className="filter-dropdown-label">Duration</div>
                  {DURATION_OPTIONS.map(o => (
                    <button key={o.val} className={`filter-dropdown-item ${duration===o.val?'active':''}`}
                      onClick={() => { setDuration(o.val); setOpenDropdown(null) }}>{o.label}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Date */}
          <div className="filter-dropdown-wrap">
            <button className={`filter-dropdown-btn ${date?'active':''}`}
              onClick={() => setOpenDropdown(v => v==='date'?null:'date')}>
              {dateLabel} <ChevronDownIcon />
            </button>
            <AnimatePresence>
              {openDropdown === 'date' && (
                <motion.div className="filter-dropdown-menu"
                  initial={{opacity:0,y:-8,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.95}} transition={{duration:0.15}}>
                  <div className="filter-dropdown-label">Upload date</div>
                  {DATE_OPTIONS.map(o => (
                    <button key={o.val} className={`filter-dropdown-item ${date===o.val?'active':''}`}
                      onClick={() => { setDate(o.val); setOpenDropdown(null) }}>{o.label}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="view-mode-toggle">
          <button className={`view-mode-btn ${viewMode==='list'?'active':''}`} onClick={() => setViewMode('list')} title="List view"><ListIcon /></button>
          <button className={`view-mode-btn ${viewMode==='grid'?'active':''}`} onClick={() => setViewMode('grid')} title="Grid view"><GridIcon /></button>
        </div>
      </div>

      {/* Active filter chips */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div className="active-filters-row" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
            {activeFilters.map(f => (
              <motion.button key={f} className="active-filter-chip" onClick={() => clearFilter(f)}
                initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.8,opacity:0}} whileHover={{scale:1.05}}>
                {f} <CloseIcon />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="search-results-wrap">
        {loading ? (
          <div className={`search-results ${viewMode}`}>
            {Array.from({length:6}).map((_,i) => (
              <div key={i} className={`search-skeleton ${viewMode}`}>
                <div className="skeleton-thumb" />
                <div className="skeleton-info">
                  <div className="skeleton-line w80" />
                  <div className="skeleton-line w50" />
                  <div className="skeleton-line w60" />
                </div>
              </div>
            ))}
          </div>
        ) : !rawQuery.trim() ? (
          <div className="search-empty">
            <div className="search-empty-icon">🔍</div>
            <p className="search-empty-title">Search for something</p>
            <p className="search-empty-sub">Type in the search bar above to find videos, shorts and channels</p>
          </div>
        ) : results.length === 0 ? (
          <div className="search-empty">
            <div className="search-empty-icon">😕</div>
            <p className="search-empty-title">No results for "{rawQuery}"</p>
            <p className="search-empty-sub">Try different keywords or remove filters</p>
          </div>
        ) : (
          <>
            <div className="search-result-count">
              About {formatViews(total)} results for <strong>"{rawQuery}"</strong>
            </div>
            <div className={`search-results ${viewMode}`}>
              {results.map((video, i) => (
                <motion.div key={video._id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.25,delay:i*0.04}}>
                  {viewMode === 'list' ? <ListResultCard video={video} /> : <GridResultCard video={video} />}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

function ListResultCard({ video }) {
  return (
    <Link to={`/watch/${video._id}`} className="list-result-card">
      <div className="list-result-thumb-wrap">
        <img src={video.thumbnail} alt={video.title} className="list-result-thumb" loading="lazy" />
        <span className="list-result-duration">{formatDuration(video.duration)}</span>
        {video.isShort && <span className="list-result-short-badge">Short</span>}
      </div>
      <div className="list-result-info">
        <h3 className="list-result-title">{video.title}</h3>
        <div className="list-result-meta">
          <span>{formatViews(video.views)} views</span>
          <span className="meta-dot">·</span>
          <span>{timeAgo(video.uploadedAt)}</span>
        </div>
        <Link to={`/channel/${video.channel?._id}`} className="list-result-channel" onClick={e => e.stopPropagation()}>
          <img src={video.channel?.avatar} alt={video.channel?.name} className="list-result-channel-avatar" />
          <span>{video.channel?.name}</span>
          {video.channel?.verified && <VerifiedIcon />}
        </Link>
        <p className="list-result-desc">{video.description?.slice(0,120)}{video.description?.length > 120 ? '...' : ''}</p>
      </div>
    </Link>
  )
}

function GridResultCard({ video }) {
  return (
    <Link to={`/watch/${video._id}`} className="grid-result-card">
      <div className="grid-result-thumb-wrap">
        <img src={video.thumbnail} alt={video.title} className="grid-result-thumb" loading="lazy" />
        <span className="grid-result-duration">{formatDuration(video.duration)}</span>
        {video.isShort && <span className="grid-result-short-badge">Short</span>}
      </div>
      <div className="grid-result-info">
        <div className="grid-result-channel-row">
          <img src={video.channel?.avatar} alt={video.channel?.name} className="grid-result-channel-avatar" />
          <div>
            <p className="grid-result-title">{video.title}</p>
            <p className="grid-result-channel">{video.channel?.name}</p>
            <p className="grid-result-meta">{formatViews(video.views)} views · {timeAgo(video.uploadedAt)}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}