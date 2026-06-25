// FILE: client/src/pages/Subscriptions/Subscriptions.jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatViews, timeAgo, formatDuration, formatSubscribers } from '../../utils/formatUtils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFocus } from '../../context/FocusContext.jsx'
import api from '../../services/api.js'
import './Subscriptions.css'

// ── ICONS ──
const BellIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
const BellOffIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.73 21a2 2 0 01-3.46 0"/><path d="M18.63 13A17.888 17.888 0 0118 8"/><path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 00-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
const CheckIcon    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const GridIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
const ListIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const PlayIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const SearchIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const LiveIcon     = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
const VerifiedIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>

const GRADS = [
  'linear-gradient(135deg,#b5294e,#6654a8)',
  'linear-gradient(135deg,#6654a8,#3d9e8c)',
  'linear-gradient(135deg,#3d9e8c,#b8882a)',
  'linear-gradient(135deg,#b8882a,#b5294e)',
  'linear-gradient(135deg,#2d9e6e,#6654a8)',
  'linear-gradient(135deg,#b5294e,#3d9e8c)',
]
const getGrad = (id) => {
  // Stable gradient from id string
  const n = id ? id.charCodeAt(id.length - 1) % GRADS.length : 0
  return GRADS[n]
}

const FILTERS = ['All', 'Today', 'This week', 'Unwatched', 'Live', 'New']

// Normalize API video
const normalizeVideo = (v) => ({
  _id:        v._id,
  title:      v.title,
  thumbnail:  v.thumbnailUrl || '',
  duration:   v.duration     || 0,
  views:      v.viewCount    || 0,
  uploadedAt: v.createdAt,
  channelId:  v.uploader?._id?.toString(),
  isShort:    v.isShort      || false,
  channel: {
    _id:      v.uploader?._id,
    name:     v.uploader?.displayName || v.uploader?.username || 'Unknown',
    avatar:   v.uploader?.avatar      || '',
    verified: v.uploader?.isChannelVerified || false,
  },
})

// Video card for feed
function FeedVideoCard({ video, layout }) {
  const dest = video.isShort ? `/shorts?id=${video._id}` : `/watch/${video._id}`
  if (layout === 'list') {
    return (
      <motion.div className="subs-list-row" layout exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} whileHover={{ x: 3 }}>
        <Link to={dest} className={`subs-list-thumb-wrap${video.isShort ? ' subs-thumb--short' : ''}`}>
          <img src={video.thumbnail} alt={video.title} className="subs-list-thumb" loading="lazy" />
          {video.isShort
            ? <span className="subs-short-badge">Short</span>
            : <span className="subs-list-duration">{formatDuration(video.duration)}</span>
          }
          <div className="subs-list-play-overlay"><PlayIcon /></div>
        </Link>
        <div className="subs-list-info">
          <Link to={dest} className="subs-list-title">{video.title}</Link>
          <Link to={`/channel/${video.channel?._id}`} className="subs-list-channel">
            {video.channel?.avatar && <img src={video.channel.avatar} alt={video.channel.name} className="subs-list-ch-avatar" />}
            {video.channel?.name}
            {video.channel?.verified && <VerifiedIcon />}
          </Link>
          <span className="subs-list-meta">{formatViews(video.views)} views · {timeAgo(video.uploadedAt)}</span>
        </div>
      </motion.div>
    )
  }
  return (
    <motion.div className={`subs-video-card${video.isShort ? ' subs-video-card--short' : ''}`} layout exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} whileHover={{ y: -4 }}>
      <Link to={dest} className={`subs-video-thumb-wrap${video.isShort ? ' subs-thumb--short' : ''}`}>
        <img src={video.thumbnail} alt={video.title} className="subs-video-thumb" loading="lazy" />
        {video.isShort
          ? <span className="subs-short-badge">Short</span>
          : <span className="subs-video-duration">{formatDuration(video.duration)}</span>
        }
        <div className="subs-video-play-overlay"><PlayIcon /></div>
      </Link>
      <div className="subs-video-info">
        <Link to={`/channel/${video.channel?._id}`} className="subs-video-ch-avatar-wrap">
          {video.channel?.avatar
            ? <img src={video.channel.avatar} alt={video.channel.name} className="subs-video-ch-avatar" />
            : <div className="subs-video-ch-avatar" style={{ background: getGrad(video.channelId) }}>{video.channel?.name?.[0]}</div>
          }
        </Link>
        <div className="subs-video-text">
          <Link to={dest} className="subs-video-title">{video.title}</Link>
          <Link to={`/channel/${video.channel?._id}`} className="subs-video-channel">
            {video.channel?.name}
            {video.channel?.verified && <VerifiedIcon />}
          </Link>
          <span className="subs-video-meta">{formatViews(video.views)} views · {timeAgo(video.uploadedAt)}</span>
        </div>
      </div>
    </motion.div>
  )
}

// Channel pill
function ChannelPill({ channel, active, onClick }) {
  return (
    <motion.button className={`ch-pill ${active ? 'ch-pill-active' : ''}`} onClick={onClick}
      whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
      <div className="ch-pill-av-wrap">
        {channel.avatar
          ? <img src={channel.avatar} alt={channel.name} className="ch-pill-av ch-pill-av-img" />
          : <div className="ch-pill-av" style={{ background: getGrad(channel._id) }}>{channel.name?.[0]}</div>
        }
      </div>
      <span className="ch-pill-name">{channel.name.split(' ')[0]}</span>
      {channel.notify && <span className="ch-pill-bell"><BellIcon /></span>}
    </motion.button>
  )
}

// Channel card (Manage tab)
function ChannelCard({ channel, onToggleNotify, onUnsubscribe }) {
  return (
    <motion.div className="channel-card"
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      whileHover={{ y: -3 }}>
      <Link to={`/channel/${channel._id}`} className="cc-av-wrap">
        {channel.avatar
          ? <img src={channel.avatar} alt={channel.name} className="cc-av cc-av-img" />
          : <div className="cc-av" style={{ background: getGrad(channel._id) }}>{channel.name?.[0]}</div>
        }
      </Link>
      <div className="cc-info">
        <div className="cc-name-row">
          <Link to={`/channel/${channel._id}`} className="cc-name">{channel.name}</Link>
          {channel.verified && <span className="cc-check"><CheckIcon /></span>}
        </div>
        <div className="cc-handle">@{channel.handle || channel.username}</div>
        <div className="cc-stats">
          <span>{formatSubscribers(channel.subscriberCount)} subscribers</span>
          {channel.videoCount != null && (
            <>
              <span className="cc-dot">·</span>
              <span>{channel.videoCount} videos</span>
            </>
          )}
        </div>
      </div>
      <div className="cc-actions">
        <motion.button className={`cc-notify-btn ${channel.notify ? 'cc-notify-on' : ''}`}
          onClick={() => onToggleNotify(channel._id)}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}>
          {channel.notify ? <BellIcon /> : <BellOffIcon />}
          {channel.notify ? 'Notifying' : 'Notify'}
        </motion.button>
        <motion.button className="cc-unsub-btn" onClick={() => onUnsubscribe(channel._id)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
          Subscribed
        </motion.button>
      </div>
    </motion.div>
  )
}

function VideoSkeleton() {
  return (
    <div className="subs-video-card subs-skeleton">
      <div className="subs-video-thumb-wrap sk-block" />
      <div className="subs-video-info" style={{ alignItems:'flex-start', paddingTop: 4 }}>
        <div className="sk-block" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, marginLeft: 10 }}>
          <div className="sk-block" style={{ height: 14, width: '80%', marginBottom: 8 }} />
          <div className="sk-block" style={{ height: 12, width: '45%', marginBottom: 6 }} />
          <div className="sk-block" style={{ height: 11, width: '30%' }} />
        </div>
      </div>
    </div>
  )
}

export default function Subscriptions() {
  const { user } = useAuth()
  const { active: focusActive, blockedCategories } = useFocus()
  const [videos,        setVideos]       = useState([])
  const [channels,      setChannels]     = useState([])
  const [loading,       setLoading]      = useState(true)
  const [error,         setError]        = useState(null)
  const [activeChannel, setActive]       = useState(null)
  const [filter,        setFilter]       = useState('All')
  const [layout,        setLayout]       = useState('grid')
  const [tab,           setTab]          = useState('feed')
  const [search,        setSearch]       = useState('')

  const fetchFeed = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/interactions/subscriptions')
      const normalized = (res.data.videos || []).map(normalizeVideo)
      setVideos(normalized)

      // Derive unique channels from video uploaders
      const chanMap = {}
      for (const v of normalized) {
        if (v.channelId && !chanMap[v.channelId]) {
          chanMap[v.channelId] = {
            _id:             v.channel._id,
            name:            v.channel.name,
            avatar:          v.channel.avatar,
            verified:        v.channel.verified,
            handle:          '',
            username:        '',
            subscriberCount: 0,
            videoCount:      null,
            notify:          true,
          }
        }
      }
      setChannels(Object.values(chanMap))
    } catch {
      setError('Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchFeed() }, [fetchFeed])

  const toggleNotify = (id) => {
    setChannels(prev => prev.map(c => c._id?.toString() === id?.toString() ? { ...c, notify: !c.notify } : c))
  }

  const unsubscribe = async (channelId) => {
    setChannels(prev => prev.filter(c => c._id?.toString() !== channelId?.toString()))
    setVideos(prev => prev.filter(v => v.channelId !== channelId?.toString()))
    try {
      await api.post(`/interactions/channel/${channelId}/subscribe`) // toggles off
    } catch {
      fetchFeed()
    }
  }

  // Filtered videos
  const now = Date.now()
  const filteredVideos = useMemo(() => {
    let list = videos
    if (activeChannel) list = list.filter(v => v.channelId === activeChannel?.toString())
    if (filter === 'Today')    list = list.filter(v => now - new Date(v.uploadedAt) < 86400000)
    if (filter === 'This week')list = list.filter(v => now - new Date(v.uploadedAt) < 7*86400000)
    // Focus mode: hide shorts and blocked categories
    if (focusActive) {
      list = list.filter(v => !v.isShort)
      if (blockedCategories.length > 0)
        list = list.filter(v => !blockedCategories.includes(v.category))
    }
    return list
  }, [videos, activeChannel, filter, now, focusActive, blockedCategories])

  const filteredChannels = useMemo(() =>
    channels.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    ), [channels, search])

  if (!user) return (
    <div className="subs-page">
      <motion.div className="subs-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 80 }}>
        <div className="empty-icon">🔒</div>
        <div className="empty-title">Sign in to see subscriptions</div>
        <div className="empty-desc">Subscribe to channels to see their latest videos here</div>
        <Link to="/auth" style={{ marginTop: 16, display:'inline-block', padding:'10px 24px', background:'var(--a)', color:'#fff', borderRadius:8, fontWeight:600, textDecoration:'none' }}>Sign in</Link>
      </motion.div>
    </div>
  )

  return (
    <div className="subs-page">
      <motion.div className="subs-header"
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
        <div className="subs-header-left">
          <h1 className="subs-title">Subscriptions</h1>
          <div className="subs-stats">
            <span className="subs-stat"><span className="stat-num">{channels.length}</span> channels</span>
            {videos.length > 0 && (
              <span className="subs-stat new-stat"><span className="stat-num">{videos.length}</span> videos</span>
            )}
          </div>
        </div>
        <div className="subs-header-right">
          <div className="page-tabs">
            <button className={`page-tab ${tab === 'feed' ? 'page-tab-active' : ''}`} onClick={() => setTab('feed')}>Feed</button>
            <button className={`page-tab ${tab === 'channels' ? 'page-tab-active' : ''}`} onClick={() => setTab('channels')}>Manage</button>
          </div>
          {tab === 'feed' && (
            <div className="layout-btns">
              <motion.button className={`layout-btn ${layout === 'grid' ? 'layout-active' : ''}`} onClick={() => setLayout('grid')} whileTap={{ scale: 0.9 }}><GridIcon /></motion.button>
              <motion.button className={`layout-btn ${layout === 'list' ? 'layout-active' : ''}`} onClick={() => setLayout('list')} whileTap={{ scale: 0.9 }}><ListIcon /></motion.button>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === 'feed' ? (
          <motion.div key="feed"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}>

            {channels.length > 0 && (
              <div className="ch-pills-strip">
                <motion.button
                  className={`ch-pill ch-pill-all ${!activeChannel ? 'ch-pill-active' : ''}`}
                  onClick={() => setActive(null)} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                  <div className="ch-pill-av-wrap"><div className="ch-pill-av ch-pill-av-all">✦</div></div>
                  <span className="ch-pill-name">All</span>
                </motion.button>
                {channels.map((ch, i) => (
                  <motion.div key={ch._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <ChannelPill channel={ch} active={activeChannel?.toString() === ch._id?.toString()} onClick={() => setActive(activeChannel?.toString() === ch._id?.toString() ? null : ch._id)} />
                  </motion.div>
                ))}
              </div>
            )}

            <div className="filter-tabs">
              {FILTERS.map(f => (
                <motion.button key={f} className={`filter-tab ${filter === f ? 'filter-active' : ''}`}
                  onClick={() => setFilter(f)} whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}>
                  {f === 'Live' && <span className="filter-live-dot" />}
                  {f}
                </motion.button>
              ))}
              <div className="filter-count">{filteredVideos.length} videos</div>
            </div>

            {error ? (
              <motion.div className="subs-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="empty-icon">⚠️</div>
                <div className="empty-title">{error}</div>
                <button onClick={fetchFeed} style={{ marginTop:12, padding:'8px 20px', background:'var(--a)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>Try again</button>
              </motion.div>
            ) : loading ? (
              <div className={`subs-video-grid ${layout === 'list' ? 'subs-video-list' : ''}`}>
                {[...Array(8)].map((_, i) => <VideoSkeleton key={i} />)}
              </div>
            ) : filteredVideos.length === 0 ? (
              <motion.div className="subs-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="empty-icon">🔔</div>
                <div className="empty-title">
                  {channels.length === 0 ? 'No subscriptions yet' : 'Nothing here yet'}
                </div>
                <div className="empty-desc">
                  {channels.length === 0
                    ? 'Subscribe to channels to see their latest videos here'
                    : 'Try a different filter or check back later'}
                </div>
              </motion.div>
            ) : (
              <motion.div
                className={`subs-video-grid ${layout === 'list' ? 'subs-video-list' : ''}`}
                layout>
                <AnimatePresence>
                  {filteredVideos.map((v, i) => (
                    <motion.div key={v._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <FeedVideoCard video={v} layout={layout} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="channels"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}>

            <div className="manage-search-wrap">
              <span className="manage-search-icon"><SearchIcon /></span>
              <input className="manage-search" placeholder="Search your subscriptions..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {filteredChannels.length > 0 ? (
              <div className="channels-grid">
                {filteredChannels.map((ch, i) => (
                  <motion.div key={ch._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <ChannelCard channel={ch} onToggleNotify={toggleNotify} onUnsubscribe={unsubscribe} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="subs-empty">
                <div className="empty-icon">🔔</div>
                <div className="empty-title">{search ? 'No results found' : 'No subscriptions yet'}</div>
                <div className="empty-desc">{search ? 'Try a different search term' : 'Channels you subscribe to will appear here'}</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}