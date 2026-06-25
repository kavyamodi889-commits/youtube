// FILE: client/src/pages/Channel/Channel.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext.jsx'
import { useStats } from '../../context/StatsContext.jsx'
import { formatViews, formatSubscribers, timeAgo, formatDuration } from '../../utils/formatUtils.js'
import './Channel.css'

// ── ICONS ──
const VerifiedIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--a)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const BellIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
const ShareIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
const SearchIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const LinkIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
const CalendarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const EyeIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const PlaylistIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const PlayIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const GlobeIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>

const TABS = ['Videos', 'Shorts', 'Live', 'Playlists', 'About']

function adaptVideo(v) {
  return {
    _id:        v._id,
    title:      v.title,
    thumbnail:  v.thumbnailUrl || '',
    duration:   v.duration   || 0,
    views:      v.viewCount  || 0,
    uploadedAt: v.createdAt,
    isShort:    v.isShort    || false,
  }
}

// ── Skeleton loaders ──
function SkeletonCard() {
  return (
    <div className="ch-video-card ch-skeleton">
      <div className="ch-video-thumb-wrap sk-block" />
      <div className="ch-video-info">
        <div className="sk-block" style={{ height:13, width:'80%', marginBottom:6 }} />
        <div className="sk-block" style={{ height:11, width:'50%' }} />
      </div>
    </div>
  )
}

export default function Channel() {
  const { id: channelId } = useParams()
  const { user } = useAuth()
  const { getChannelStats, updateChannelStats } = useStats()

  const tabBarRef = useRef(null)

  const [channel,     setChannel]    = useState(null)
  const [videos,      setVideos]     = useState([])
  const [shorts,      setShorts]     = useState([])
  const [playlists,   setPlaylists]  = useState([])
  const [streams,     setStreams]    = useState([])
  const [loading,     setLoading]    = useState(true)
  const [error,       setError]      = useState(null)
  const [activeTab,   setActiveTab]  = useState('Videos')
  const [subscribed,  setSubscribed] = useState(false)
  const [subCount,    setSubCount]   = useState(0)
  const [notified,    setNotified]   = useState(false)
  const [shareMsg,    setShareMsg]   = useState('')

  const liveChannelStats  = getChannelStats(channelId)
  const displaySubCount   = liveChannelStats.subscriberCount ?? subCount
  const displaySubscribed = liveChannelStats.subscribed      ?? subscribed

  const fetchChannel = useCallback(async () => {
    if (!channelId) return
    setLoading(true); setError(null)
    try {
      const [profileRes, videosRes] = await Promise.all([
        api.get(`/user/${channelId}/public`).catch(() => null),
        api.get(`/videos/user/${channelId}?limit=100`),
      ])

      const allVids = (videosRes.data.videos || []).map(adaptVideo)
      setVideos(allVids.filter(v => !v.isShort))
      setShorts(allVids.filter(v =>  v.isShort))

      if (profileRes?.data?.user) {
        const u = profileRes.data.user
        setChannel({
          _id:         u._id,
          name:        u.displayName || u.username || 'Unknown',
          handle:      u.handle || u.username || '',
          avatar:      u.avatar || '',
          banner:      u.bannerImage || '',
          verified:    u.isChannelVerified || false,
          subscribers: u.subscriberCount   || 0,
          totalViews:  u.totalViews        || 0,
          videoCount:  u.videoCount        || 0,
          bio:         u.bio               || '',
          website:     u.website           || '',
          location:    u.location          || '',
          // ← links array from DB: [{label, url}]
          links:       Array.isArray(u.links) ? u.links.filter(l => l.url) : [],
          createdAt:   u.createdAt,
        })
        setSubCount(u.subscriberCount || 0)
      } else if (videosRes.data.videos?.[0]?.uploader) {
        const u = videosRes.data.videos[0].uploader
        setChannel({
          _id:         u._id,
          name:        u.displayName || u.username || 'Unknown',
          handle:      u.handle || u.username || '',
          avatar:      u.avatar || '',
          banner:      '',
          verified:    u.isChannelVerified || false,
          subscribers: u.subscriberCount   || 0,
          totalViews:  0,
          videoCount:  allVids.length,
          bio:         u.bio || '',
          website:     '',
          location:    '',
          links:       [],
          createdAt:   null,
        })
        setSubCount(u.subscriberCount || 0)
      } else {
        setChannel({
          _id: channelId, name: 'AURA Creator', handle: channelId,
          avatar: '', banner: '', verified: false, subscribers: 0,
          totalViews: 0, videoCount: 0, bio: '', website: '', location: '',
          links: [], createdAt: null,
        })
      }

      api.get(`/playlists/channel/${channelId}`).then(r => {
        setPlaylists(r.data.playlists || [])
      }).catch(() => {})

      api.get(`/live/channel/${channelId}`).then(r => {
        setStreams(r.data.streams || [])
      }).catch(() => {})

    } catch (err) {
      setError('Could not load channel')
    } finally {
      setLoading(false)
    }
  }, [channelId, user])

  useEffect(() => {
    if (!channelId || !user) return
    api.get(`/interactions/channel/${channelId}/state`)
      .then(r => setSubscribed(r.data.subscribed || false))
      .catch(() => {})
  }, [channelId, user])

  useEffect(() => { fetchChannel() }, [fetchChannel])

  const handleSubscribe = async () => {
    if (!user) return
    const was = subscribed
    setSubscribed(!was)
    setSubCount(c => was ? c - 1 : c + 1)
    try {
      const r = await api.post(`/interactions/channel/${channelId}/subscribe`)
      setSubscribed(r.data.subscribed)
      setSubCount(r.data.subscriberCount ?? subCount)
      updateChannelStats(channelId, {
        subscribed:      r.data.subscribed,
        subscriberCount: r.data.subscriberCount,
      })
    } catch {
      setSubscribed(was)
      setSubCount(c => was ? c + 1 : c - 1)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setShareMsg('Copied!'); setTimeout(() => setShareMsg(''), 2000)
    } catch {}
  }

  // ── Loading skeleton ──
  if (loading) return (
    <div className="channel-page">
      <div className="channel-banner" style={{ background:'var(--s2)', minHeight:200 }} />
      <div className="channel-info-wrap">
        <div className="channel-info-inner" style={{ gap:16 }}>
          <div style={{ width:90, height:90, borderRadius:'50%', background:'var(--s3)' }} />
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ height:20, width:200, borderRadius:6, background:'var(--s3)' }} />
            <div style={{ height:14, width:140, borderRadius:6, background:'var(--s3)' }} />
          </div>
        </div>
      </div>
    </div>
  )

  if (error || !channel) return (
    <div className="channel-page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <p style={{ color:'var(--t2)', fontFamily:'DM Sans,sans-serif' }}>{error || 'Channel not found'}</p>
    </div>
  )

  const joinDate   = channel.createdAt
    ? new Date(channel.createdAt).toLocaleDateString('en', { month:'long', year:'numeric' })
    : null
  const totalViews = channel.totalViews || videos.reduce((a, v) => a + (v.views||0), 0)
  const isOwnChannel = user && user._id === channelId

  // Combine website + links array for display
  const allLinks = [
    ...(channel.website ? [{ label: channel.website, url: channel.website }] : []),
    ...(channel.links || []),
  ]

  return (
    <div className="channel-page">

      {/* ── BANNER ── */}
      <div className="channel-banner">
        {channel.banner
          ? <img src={channel.banner} alt="banner" className="channel-banner-img" />
          : <div className="channel-banner-gradient" />
        }
        <div className="channel-banner-overlay" />
      </div>

      {/* ── CHANNEL INFO ── */}
      <div className="channel-info-wrap">
        <div className="channel-info-inner">
          <div className="channel-avatar-wrap">
            {channel.avatar
              ? <img src={channel.avatar} alt={channel.name} className="channel-avatar" />
              : <div className="channel-avatar channel-avatar-fallback">{channel.name?.[0]?.toUpperCase()}</div>
            }
            {channel.verified && <div className="channel-avatar-badge"><VerifiedIcon /></div>}
          </div>

          <div className="channel-meta">
            <div className="channel-name-row">
              <h1 className="channel-name">{channel.name}</h1>
              {channel.verified && <span className="channel-verified-badge"><VerifiedIcon /> Verified</span>}
            </div>
            <div className="channel-stats-row">
              <span className="channel-handle">@{channel.handle}</span>
              <span className="channel-stat-dot">·</span>
              <span className="channel-stat">{formatSubscribers(displaySubCount)} subscribers</span>
              <span className="channel-stat-dot">·</span>
              <span className="channel-stat">{videos.length + shorts.length} video{videos.length + shorts.length !== 1 ? 's' : ''}</span>
            </div>
            {channel.bio && (
              <p className="channel-short-desc">{channel.bio.slice(0, 120)}{channel.bio.length > 120 ? '...' : ''}</p>
            )}
          </div>

          <div className="channel-actions">
            {isOwnChannel ? (
              <Link to="http://localhost:5174" className="channel-subscribe-btn subscribed" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center' }}>
                Manage Channel
              </Link>
            ) : displaySubscribed ? (
              <div className="channel-subscribed-wrap">
                <motion.button className="channel-subscribe-btn subscribed"
                  onClick={handleSubscribe} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  Subscribed
                </motion.button>
                <motion.button className={`channel-bell-btn ${notified ? 'active' : ''}`}
                  onClick={() => setNotified(v => !v)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <BellIcon />
                </motion.button>
              </div>
            ) : (
              <motion.button className="channel-subscribe-btn"
                onClick={handleSubscribe} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                Subscribe
              </motion.button>
            )}
            <motion.button className="channel-share-btn" onClick={handleShare}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
              <ShareIcon /> {shareMsg || 'Share'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="channel-tab-bar" ref={tabBarRef}>
        <div className="channel-tabs">
          {TABS.map(tab => {
            const hasLive = tab === 'Live' && streams.some(s => s.status === 'live')
            return (
              <motion.button key={tab}
                className={`channel-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                {tab}
                {hasLive && <span className="channel-tab-live-dot" />}
                {activeTab === tab && (
                  <motion.div className="channel-tab-indicator" layoutId="channel-tab-indicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
              </motion.button>
            )
          })}
        </div>
        <button className="channel-search-btn" title="Search channel"><SearchIcon /></button>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="channel-content">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-10 }} transition={{ duration:0.2 }}>

            {/* VIDEOS */}
            {activeTab === 'Videos' && (
              <div className="channel-videos-section">
                <div className="channel-section-header">
                  <h2 className="channel-section-title">Latest Videos</h2>
                  <span className="channel-section-count">{videos.length} videos</span>
                </div>
                {videos.length === 0 ? (
                  <EmptyTab message="No videos uploaded yet" />
                ) : (
                  <div className="channel-video-grid">
                    {videos.map((video, i) => (
                      <motion.div key={video._id}
                        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                        <ChannelVideoCard video={video} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SHORTS */}
            {activeTab === 'Shorts' && (
              <div className="channel-shorts-section">
                <div className="channel-section-header">
                  <h2 className="channel-section-title">Shorts</h2>
                  <span className="channel-section-count">{shorts.length} shorts</span>
                </div>
                {shorts.length === 0 ? (
                  <EmptyTab message="No shorts uploaded yet" />
                ) : (
                  <div className="channel-shorts-grid">
                    {shorts.map((short, i) => (
                      <motion.div key={short._id}
                        initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                        transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                        <ChannelShortCard short={short} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PLAYLISTS */}
            {activeTab === 'Playlists' && (
              <div className="channel-playlists-section">
                <div className="channel-section-header">
                  <h2 className="channel-section-title">Playlists</h2>
                  <span className="channel-section-count">{playlists.length} playlists</span>
                </div>
                {playlists.length === 0 ? (
                  <EmptyTab message="No public playlists" />
                ) : (
                  <div className="channel-playlists-grid">
                    {playlists.map((pl, i) => (
                      <motion.div key={pl._id} className="channel-playlist-card"
                        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                        transition={{ delay: Math.min(i * 0.06, 0.3) }} whileHover={{ y:-4 }}>
                        <Link to={`/playlists/${pl._id}`} className="channel-playlist-thumb-wrap">
                          <img src={pl.thumbnail || ''} alt={pl.title} className="channel-playlist-thumb" />
                          <div className="channel-playlist-stack-2" />
                          <div className="channel-playlist-stack-1" />
                          <div className="channel-playlist-count-badge">
                            <PlaylistIcon /><span>{pl.count} videos</span>
                          </div>
                        </Link>
                        <div className="channel-playlist-info">
                          <Link to={`/playlists/${pl._id}`} className="channel-playlist-title">{pl.title}</Link>
                          <p className="channel-playlist-meta">View full playlist</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LIVE */}
            {activeTab === 'Live' && (
              <div className="channel-live-section">
                <div className="channel-section-header">
                  <h2 className="channel-section-title">Live</h2>
                  <span className="channel-section-count">{streams.length} stream{streams.length !== 1 ? 's' : ''}</span>
                </div>
                {streams.length === 0 ? (
                  <EmptyTab message="No live streams yet" />
                ) : (
                  <div className="channel-live-grid">
                    {streams.map((stream, i) => (
                      <motion.div key={stream._id}
                        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                        transition={{ delay: Math.min(i * 0.05, 0.3) }}>
                        <ChannelLiveCard stream={stream} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABOUT */}
            {activeTab === 'About' && (
              <div className="channel-about-section">
                <div className="channel-about-grid">
                  <div className="channel-about-left">
                    <div className="channel-about-card">
                      <h3 className="channel-about-card-title">Description</h3>
                      <p className="channel-about-desc">
                        {channel.bio || `Welcome to ${channel.name}! Creating content on AURA.`}
                      </p>
                    </div>

                    {/* Show links: website + all custom links from studio */}
                    {allLinks.length > 0 && (
                      <div className="channel-about-card">
                        <h3 className="channel-about-card-title">Links</h3>
                        <div className="channel-about-links">
                          {allLinks.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="channel-about-link"
                            >
                              {link.label && link.label !== link.url
                                ? <><GlobeIcon /><span>{link.label}</span></>
                                : <><LinkIcon /><span>{link.url}</span></>
                              }
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {channel.location && (
                      <div className="channel-about-card">
                        <h3 className="channel-about-card-title">Location</h3>
                        <p className="channel-about-desc">{channel.location}</p>
                      </div>
                    )}
                  </div>

                  <div className="channel-about-right">
                    <div className="channel-about-card">
                      <h3 className="channel-about-card-title">Stats</h3>
                      <div className="channel-about-stats">
                        {joinDate && (
                          <div className="channel-about-stat">
                            <CalendarIcon />
                            <div>
                              <p className="channel-about-stat-label">Joined</p>
                              <p className="channel-about-stat-value">{joinDate}</p>
                            </div>
                          </div>
                        )}
                        <div className="channel-about-stat">
                          <EyeIcon />
                          <div>
                            <p className="channel-about-stat-label">Total views</p>
                            <p className="channel-about-stat-value">{formatViews(totalViews)}</p>
                          </div>
                        </div>
                        <div className="channel-about-stat">
                          <PlaylistIcon />
                          <div>
                            <p className="channel-about-stat-label">Videos</p>
                            <p className="channel-about-stat-value">{videos.length + shorts.length}</p>
                          </div>
                        </div>
                        <div className="channel-about-stat">
                          <BellIcon />
                          <div>
                            <p className="channel-about-stat-label">Subscribers</p>
                            <p className="channel-about-stat-value">{formatSubscribers(displaySubCount)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function EmptyTab({ message }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 32px', color:'var(--t3)', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem' }}>
      {message}
    </div>
  )
}

function ChannelVideoCard({ video }) {
  return (
    <Link to={`/watch/${video._id}`} className="ch-video-card">
      <div className="ch-video-thumb-wrap">
        <img src={video.thumbnail} alt={video.title} className="ch-video-thumb" loading="lazy" />
        <span className="ch-video-duration">{formatDuration(video.duration)}</span>
        <div className="ch-video-play-overlay"><PlayIcon /></div>
      </div>
      <div className="ch-video-info">
        <p className="ch-video-title">{video.title}</p>
        <p className="ch-video-meta">{formatViews(video.views)} views · {timeAgo(video.uploadedAt)}</p>
      </div>
    </Link>
  )
}

function ChannelShortCard({ short }) {
  return (
    <Link to={`/shorts?id=${short._id}`} className="ch-short-card">
      <div className="ch-short-thumb-wrap">
        <img src={short.thumbnail} alt={short.title} className="ch-short-thumb" loading="lazy" />
        <div className="ch-short-overlay">
          <span className="ch-short-views">{formatViews(short.views)} views</span>
        </div>
        <span className="ch-short-badge">Short</span>
      </div>
      <p className="ch-short-title">{short.title}</p>
    </Link>
  )
}

function ChannelLiveCard({ stream }) {
  const isLive   = stream.status === 'live'
  const thumb    = stream.thumbnailUrl || ''
  // For archived streams, link to the watch page (VOD) — not the live page
  const watchUrl = (stream.isArchived && stream.vodVideo?._id)
    ? `/watch/${stream.vodVideo._id}`
    : `/live/${stream._id}`

  return (
    <Link to={watchUrl} className="ch-live-card">
      <div className="ch-live-thumb-wrap">
        {thumb
          ? <img src={thumb} alt={stream.title} className="ch-live-thumb" loading="lazy" />
          : <div className="ch-live-thumb-placeholder" />
        }
        {isLive ? (
          <span className="ch-live-badge">
            <span className="ch-live-dot" /> LIVE
          </span>
        ) : (
          <span className="ch-live-ended-badge">Ended</span>
        )}
        <div className="ch-live-play-overlay"><PlayIcon /></div>
      </div>
      <div className="ch-live-info">
        <p className="ch-live-title">{stream.title}</p>
        <p className="ch-live-meta">
          {isLive
            ? 'Streaming now'
            : timeAgo(stream.endedAt || stream.createdAt)
          }
        </p>
      </div>
    </Link>
  )
}