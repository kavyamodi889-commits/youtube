// FILE: client/src/pages/YourCourses/YourCourses.jsx
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import './YourCourses.css'

// ── ICONS ──
const BookOpenIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
const PlayIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const CheckIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const StarIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const ClockIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const SearchIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const CloseIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const FilterIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
const GridIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
const ListIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const VerifiedIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const TrophyIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H4a2 2 0 000 4c0 1.5.8 2.8 2 3.5"/><path d="M17 4h3a2 2 0 010 4c0 1.5-.8 2.8-2 3.5"/><path d="M12 17c-3.3 0-6-2.7-6-6V4h12v7c0 3.3-2.7 6-6 6z"/></svg>

const CATEGORIES = ['All', 'Development', 'Design', 'Data Science', 'Marketing']
const LEVELS     = ['All levels', 'Beginner', 'Intermediate', 'Advanced']

// ── PROGRESS RING ──
function ProgressRing({ pct, size = 44, stroke = 3.5 }) {
  const r   = (size - stroke) / 2
  const c   = 2 * Math.PI * r
  const off = c - (pct / 100) * c
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--s3)" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r}
        stroke="var(--a)" strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', filter: 'drop-shadow(0 0 4px var(--a-glow))' }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily: 'Space Grotesk', fontSize: size * 0.22, fontWeight: 700, fill: 'var(--t1)' }}>
        {pct}%
      </text>
    </svg>
  )
}

// ── COURSE GRID CARD ──
function CourseGridCard({ course }) {
  const pct         = Math.round((course.completedLessons / course.totalLessons) * 100)
  const isCompleted = pct === 100
  return (
    <motion.div className={`cc-grid-card ${isCompleted ? 'completed' : ''}`} layout
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Link to={`/course/${course._id}`} className="cc-grid-thumb-wrap">
        <img src={course.thumbnail} alt={course.title} className="cc-grid-thumb" loading="lazy" />
        {isCompleted && <div className="cc-grid-completed-overlay"><div className="cc-grid-completed-badge"><CheckIcon /> Completed</div></div>}
        {course.certificate && <div className="cc-grid-cert-badge"><TrophyIcon /></div>}
        <div className="cc-grid-play-btn"><PlayIcon /> Continue</div>
      </Link>
      <div className="cc-grid-progress-bar-wrap">
        <div className="cc-grid-progress-bar-track">
          <motion.div className="cc-grid-progress-bar-fill"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }} />
        </div>
      </div>
      <div className="cc-grid-info">
        <div className="cc-grid-top">
          <span className={`cc-grid-level ${course.level.toLowerCase()}`}>{course.level}</span>
          <span className="cc-grid-category">{course.category}</span>
        </div>
        <Link to={`/course/${course._id}`} className="cc-grid-title">{course.title}</Link>
        <Link to={`/channel/${course.instructor.name}`} className="cc-grid-instructor">
          <img src={course.instructor.avatar} alt={course.instructor.name} className="cc-grid-instructor-avatar" />
          {course.instructor.name}
          {course.instructor.verified && <VerifiedIcon />}
        </Link>
        <div className="cc-grid-stats">
          <div className="cc-grid-rating"><StarIcon /><span>{course.rating}</span><span className="cc-grid-reviews">({(course.reviewCount / 1000).toFixed(1)}k)</span></div>
          <span className="cc-grid-dot">·</span>
          <div className="cc-grid-duration"><ClockIcon /> {course.totalDuration}</div>
        </div>
        <div className="cc-grid-progress-row">
          <span className="cc-grid-lessons">{course.completedLessons}/{course.totalLessons} lessons</span>
          <span className="cc-grid-pct">{pct}%</span>
        </div>
        {course.lastWatched && (
          <span className="cc-grid-last">
            Last watched {new Date(course.lastWatched).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ── COURSE LIST ROW ──
function CourseListRow({ course }) {
  const pct         = Math.round((course.completedLessons / course.totalLessons) * 100)
  const isCompleted = pct === 100
  return (
    <motion.div className={`cc-list-row ${isCompleted ? 'completed' : ''}`} layout
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
      <Link to={`/course/${course._id}`} className="cc-list-thumb-wrap">
        <img src={course.thumbnail} alt={course.title} className="cc-list-thumb" loading="lazy" />
        <div className="cc-list-play-overlay"><PlayIcon /></div>
      </Link>
      <div className="cc-list-info">
        <div className="cc-list-top">
          <span className={`cc-list-level ${course.level.toLowerCase()}`}>{course.level}</span>
          <span className="cc-list-category">{course.category}</span>
          {course.certificate && <span className="cc-list-cert"><TrophyIcon /> Certificate</span>}
        </div>
        <Link to={`/course/${course._id}`} className="cc-list-title">{course.title}</Link>
        <Link to={`/channel/${course.instructor.name}`} className="cc-list-instructor">
          <img src={course.instructor.avatar} alt={course.instructor.name} className="cc-list-instructor-avatar" />
          {course.instructor.name}
          {course.instructor.verified && <VerifiedIcon />}
        </Link>
        <div className="cc-list-meta">
          <StarIcon /><span>{course.rating}</span>
          <span className="cc-list-dot">·</span>
          <ClockIcon /><span>{course.totalDuration}</span>
          <span className="cc-list-dot">·</span>
          <span>{course.totalLessons} lessons</span>
        </div>
        <div className="cc-list-progress-wrap">
          <div className="cc-list-progress-track">
            <motion.div className="cc-list-progress-fill"
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
          <span className="cc-list-progress-label">{course.completedLessons}/{course.totalLessons} · {pct}%</span>
        </div>
      </div>
      <div className="cc-list-ring">
        <ProgressRing pct={pct} />
        {isCompleted && <span className="cc-list-done">Done!</span>}
      </div>
      <Link to={`/course/${course._id}`} className="cc-list-continue-btn">
        <PlayIcon /> {isCompleted ? 'Review' : 'Continue'}
      </Link>
    </motion.div>
  )
}

export default function YourCourses() {
  // Courses populated from API — start empty
  const [courses]  = useState([])
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [level,    setLevel]    = useState('All levels')
  const [filter,   setFilter]   = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [sort,     setSort]     = useState('recent')

  const filtered = useMemo(() => {
    let list = courses.filter(c => {
      const pct           = Math.round((c.completedLessons / c.totalLessons) * 100)
      const matchSearch   = c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.name.toLowerCase().includes(search.toLowerCase()) || c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      const matchCategory = category === 'All' || c.category === category
      const matchLevel    = level === 'All levels' || c.level === level
      const matchFilter   = filter === 'all' || (filter === 'completed' && pct === 100) || (filter === 'inprogress' && pct > 0 && pct < 100) || (filter === 'notstarted' && pct === 0)
      return matchSearch && matchCategory && matchLevel && matchFilter
    })
    if (sort === 'az')       list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    if (sort === 'rating')   list = [...list].sort((a, b) => b.rating - a.rating)
    if (sort === 'progress') list = [...list].sort((a, b) => (b.completedLessons/b.totalLessons) - (a.completedLessons/a.totalLessons))
    return list
  }, [courses, search, category, level, filter, sort])

  const totalCompleted = courses.filter(c => c.completedLessons === c.totalLessons).length
  const totalCerts     = courses.filter(c => c.certificate).length

  return (
    <motion.div className="yc-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="yc-header">
        <div className="yc-header-left">
          <div className="yc-header-icon"><BookOpenIcon /></div>
          <div>
            <h1 className="yc-title">Your Courses</h1>
            <p className="yc-subtitle">Courses saved from creators on AURA</p>
          </div>
        </div>
        <div className="yc-stats-strip">
          <div className="yc-stat"><span className="yc-stat-value">{courses.length}</span><span className="yc-stat-label">Enrolled</span></div>
          <div className="yc-stat-divider" />
          <div className="yc-stat"><span className="yc-stat-value">{totalCompleted}</span><span className="yc-stat-label">Completed</span></div>
          <div className="yc-stat-divider" />
          <div className="yc-stat"><span className="yc-stat-value">{totalCerts}</span><span className="yc-stat-label">Certificates</span></div>
        </div>
      </div>

      <div className="yc-filter-tabs">
        {[{id:'all',label:`All (${courses.length})`},{id:'inprogress',label:'In Progress'},{id:'completed',label:'Completed'},{id:'notstarted',label:'Not Started'}].map(f => (
          <motion.button key={f.id} className={`yc-filter-tab ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            {f.label}
          </motion.button>
        ))}
      </div>

      <div className="yc-controls">
        <div className="yc-search-wrap">
          <SearchIcon />
          <input className="yc-search" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="yc-search-clear" onClick={() => setSearch('')}><CloseIcon /></button>}
        </div>
        <div className="yc-controls-right">
          <div className="yc-select-wrap">
            <FilterIcon />
            <select className="yc-select" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="yc-select-wrap">
            <select className="yc-select" value={level} onChange={e => setLevel(e.target.value)}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="yc-select-wrap">
            <select className="yc-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="recent">Recently accessed</option>
              <option value="progress">Most progress</option>
              <option value="rating">Highest rated</option>
              <option value="az">A → Z</option>
            </select>
          </div>
          <div className="yc-view-toggle">
            <button className={`yc-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><GridIcon /></button>
            <button className={`yc-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><ListIcon /></button>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="yc-empty">
          <div className="yc-empty-icon"><BookOpenIcon /></div>
          <p className="yc-empty-title">No courses enrolled yet</p>
          <p className="yc-empty-sub">Browse courses from creators on AURA and start learning</p>
          <Link to="/" className="yc-empty-browse">Browse courses</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="yc-empty">
          <div className="yc-empty-icon"><BookOpenIcon /></div>
          <p className="yc-empty-title">No courses match your filters</p>
          <p className="yc-empty-sub">Try adjusting your search or filters</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div key="grid" className="yc-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} layout>
              <AnimatePresence>{filtered.map(course => <CourseGridCard key={course._id} course={course} />)}</AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="list" className="yc-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <AnimatePresence>{filtered.map(course => <CourseListRow key={course._id} course={course} />)}</AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}