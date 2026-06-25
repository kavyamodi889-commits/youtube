// studio/src/pages/AudioLibrary/AudioLibrary.jsx
import { useState, useRef } from 'react'
import './AudioLibrary.css'

// ── Icons ─────────────────────────────────────────────────────────
const MusicIco  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
const PlayIco   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const PauseIco  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const HeartIco  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
const HeartFillIco = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--st-rose)" stroke="var(--st-rose)" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
const SearchIco = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const FilterIco = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>

// ── Track catalogue (royalty-free) ────────────────────────────────
const TRACKS = [
  { id:1,  title:'Neon Drift',       artist:'AURA Originals',  genre:'Electronic',  mood:'Energetic', bpm:128, dur:'3:24', tags:['upbeat','synth'] },
  { id:2,  title:'Golden Hour',      artist:'Solstice',        genre:'Ambient',     mood:'Calm',      bpm:80,  dur:'4:12', tags:['peaceful','warm'] },
  { id:3,  title:'Momentum',         artist:'BaseCraft',       genre:'Hip-Hop',     mood:'Confident', bpm:96,  dur:'2:58', tags:['beats','groove'] },
  { id:4,  title:'Morning Light',    artist:'Harbour',         genre:'Acoustic',    mood:'Happy',     bpm:104, dur:'3:47', tags:['guitar','bright'] },
  { id:5,  title:'Infinite Loop',    artist:'CodeBeat',        genre:'Lo-fi',       mood:'Focused',   bpm:72,  dur:'4:01', tags:['study','lofi'] },
  { id:6,  title:'Storm Protocol',   artist:'Voltage',         genre:'Cinematic',   mood:'Dramatic',  bpm:142, dur:'5:14', tags:['epic','trailer'] },
  { id:7,  title:'Coastal Drive',    artist:'Sunwave',         genre:'Pop',         mood:'Happy',     bpm:115, dur:'3:33', tags:['summer','fun'] },
  { id:8,  title:'Deep Signal',      artist:'SubLayers',       genre:'Electronic',  mood:'Dark',      bpm:140, dur:'4:42', tags:['dark','bass'] },
  { id:9,  title:'Quiet Spaces',     artist:'Milo R.',         genre:'Ambient',     mood:'Calm',      bpm:60,  dur:'6:00', tags:['meditation','drone'] },
  { id:10, title:'Upward',           artist:'AURA Originals',  genre:'Cinematic',   mood:'Inspiring', bpm:110, dur:'3:19', tags:['motivation','build'] },
  { id:11, title:'City Pulse',       artist:'Meridian',        genre:'Hip-Hop',     mood:'Confident', bpm:88,  dur:'2:47', tags:['urban','flow'] },
  { id:12, title:'Forest Path',      artist:'Arbour',          genre:'Acoustic',    mood:'Calm',      bpm:76,  dur:'3:56', tags:['nature','organic'] },
  { id:13, title:'Synthwave Run',    artist:'Neonhex',         genre:'Electronic',  mood:'Energetic', bpm:132, dur:'3:10', tags:['retro','drive'] },
  { id:14, title:'Rain Study',       artist:'CodeBeat',        genre:'Lo-fi',       mood:'Focused',   bpm:68,  dur:'5:30', tags:['rain','chill'] },
  { id:15, title:'Rise Up',          artist:'AURA Originals',  genre:'Cinematic',   mood:'Inspiring', bpm:118, dur:'4:05', tags:['epic','rise'] },
]

const GENRES = ['All', 'Electronic', 'Ambient', 'Hip-Hop', 'Acoustic', 'Lo-fi', 'Cinematic', 'Pop']
const MOODS  = ['All', 'Energetic', 'Calm', 'Confident', 'Happy', 'Focused', 'Dramatic', 'Dark', 'Inspiring']

const MOOD_COLOR = {
  Energetic:'#60a5fa', Calm:'#4ade80', Confident:'var(--st-indigo)',
  Happy:'#fbbf24', Focused:'var(--sn-teal)', Dramatic:'var(--st-rose)',
  Dark:'var(--st-t3)', Inspiring:'var(--sn-amber)',
}

export default function AudioLibrary() {
  const [search,  setSearch]  = useState('')
  const [genre,   setGenre]   = useState('All')
  const [mood,    setMood]    = useState('All')
  const [playing, setPlaying] = useState(null)
  const [saved,   setSaved]   = useState([])

  const filtered = TRACKS.filter(t => {
    if (genre !== 'All' && t.genre !== genre) return false
    if (mood  !== 'All' && t.mood  !== mood)  return false
    if (search) {
      const q = search.toLowerCase()
      return t.title.toLowerCase().includes(q)
        || t.artist.toLowerCase().includes(q)
        || t.tags.some(tg => tg.includes(q))
    }
    return true
  })

  const togglePlay = id => setPlaying(p => p === id ? null : id)
  const toggleSave = id => setSaved(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  return (
    <div className="al-page">

      {/* ── Header ── */}
      <div className="al-header">
        <div className="al-header-left">
          <div className="al-header-icon"><MusicIco /></div>
          <div>
            <h1 className="al-title">Audio Library</h1>
            <p className="al-sub">Royalty-free music for your videos — no attribution required</p>
          </div>
        </div>
        {saved.length > 0 && (
          <span className="al-saved-count">{saved.length} saved</span>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="al-toolbar">
        <div className="al-search-wrap">
          <SearchIco />
          <input
            className="al-search"
            placeholder="Search tracks, artists, tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="al-filter-group">
          <FilterIco />
          <select className="al-select" value={genre} onChange={e => setGenre(e.target.value)}>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="al-filter-group">
          <select className="al-select" value={mood} onChange={e => setMood(e.target.value)}>
            {MOODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <span className="al-count">{filtered.length} track{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Track table ── */}
      {filtered.length === 0 ? (
        <div className="al-empty">
          <MusicIco />
          <p>No tracks match your filters</p>
        </div>
      ) : (
        <div className="al-table-wrap">
          <table className="al-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Track</th>
                <th>Genre</th>
                <th>Mood</th>
                <th>BPM</th>
                <th>Duration</th>
                <th>Tags</th>
                <th style={{ width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} className={`al-row${playing === t.id ? ' al-row-playing' : ''}`}>
                  {/* Play button */}
                  <td>
                    <button className="al-play-btn" onClick={() => togglePlay(t.id)}>
                      {playing === t.id
                        ? <><PauseIco /><span className="al-play-wave"/></>
                        : <PlayIco />
                      }
                    </button>
                  </td>
                  {/* Title */}
                  <td>
                    <p className="al-track-title">{t.title}</p>
                    <p className="al-track-artist">{t.artist}</p>
                  </td>
                  {/* Genre */}
                  <td><span className="al-genre-badge">{t.genre}</span></td>
                  {/* Mood */}
                  <td>
                    <span className="al-mood" style={{ color: MOOD_COLOR[t.mood] || 'var(--st-t3)' }}>
                      {t.mood}
                    </span>
                  </td>
                  {/* BPM */}
                  <td className="al-meta">{t.bpm}</td>
                  {/* Duration */}
                  <td className="al-meta al-dur">{t.dur}</td>
                  {/* Tags */}
                  <td>
                    <div className="al-tags">
                      {t.tags.map(tg => <span key={tg} className="al-tag">#{tg}</span>)}
                    </div>
                  </td>
                  {/* Actions */}
                  <td>
                    <button
                      className={`al-save-btn${saved.includes(t.id) ? ' al-saved' : ''}`}
                      onClick={() => toggleSave(t.id)}
                      title={saved.includes(t.id) ? 'Remove from saved' : 'Save track'}
                    >
                      {saved.includes(t.id) ? <HeartFillIco /> : <HeartIco />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="al-footer-note">
        All tracks are royalty-free for use in your AURA videos. No attribution required.
      </p>
    </div>
  )
}