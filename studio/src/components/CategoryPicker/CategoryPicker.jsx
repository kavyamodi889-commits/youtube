// FILE: studio/src/components/CategoryPicker/CategoryPicker.jsx
// Shared across studio Upload, VideoEdit, CreateModal (GoLive)
import { useState } from 'react'
import './CategoryPicker.css'

export default function CategoryPicker({
  value        = '',
  subValue     = '',
  categories   = [],
  categoryDocs = [],
  addCategory,
  addSubCategory,
  onChange,
  selectClass  = 'up-select',   // caller can pass their own select class
  label        = 'Category',
}) {
  const [showNewCat, setShowNewCat] = useState(false)
  const [showNewSub, setShowNewSub] = useState(false)
  const [newCat,     setNewCat]     = useState('')
  const [newSub,     setNewSub]     = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const selectedDoc = categoryDocs.find(d => d.name === value)
  const subCats     = selectedDoc?.subCategories || []

  const handleAddCat = async () => {
    if (!newCat.trim()) return
    setSaving(true); setError('')
    try {
      const saved = await addCategory(newCat.trim())
      onChange(saved, '')
      setNewCat(''); setShowNewCat(false)
    } catch (e) { setError(e?.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleAddSub = async () => {
    if (!newSub.trim() || !value) return
    setSaving(true); setError('')
    try {
      await addSubCategory(value, newSub.trim())
      onChange(value, newSub.trim())
      setNewSub(''); setShowNewSub(false)
    } catch (e) { setError(e?.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="cp-wrap">
      <label className="cp-label">{label}</label>

      {/* Top-level category */}
      <div className="cp-row">
        <select className={selectClass} value={value}
          onChange={e => onChange(e.target.value, '')}>
          <option value="">Select a category</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="button" className="cp-add-btn"
          onClick={() => { setShowNewCat(v => !v); setShowNewSub(false) }}>
          + New
        </button>
      </div>

      {showNewCat && (
        <div className="cp-new-row">
          <input className="cp-input" placeholder="New category name…"
            value={newCat} onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCat()} autoFocus />
          <button className="cp-save-btn" onClick={handleAddCat}
            disabled={saving || !newCat.trim()}>
            {saving ? '…' : 'Add'}
          </button>
          <button className="cp-cancel-btn" onClick={() => setShowNewCat(false)}>✕</button>
        </div>
      )}

      {/* Sub-category (only when a category is selected) */}
      {value && (
        <>
          <label className="cp-label cp-sublabel">
            Subcategory <span className="cp-optional">(optional)</span>
          </label>
          <div className="cp-row">
            <select className={selectClass} value={subValue}
              onChange={e => onChange(value, e.target.value)}>
              <option value="">None</option>
              {subCats.map(s => (
                <option key={s._id || s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            <button type="button" className="cp-add-btn"
              onClick={() => { setShowNewSub(v => !v); setShowNewCat(false) }}>
              + New
            </button>
          </div>
          {showNewSub && (
            <div className="cp-new-row">
              <input className="cp-input"
                placeholder={`New subcategory under "${value}"…`}
                value={newSub} onChange={e => setNewSub(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSub()} autoFocus />
              <button className="cp-save-btn" onClick={handleAddSub}
                disabled={saving || !newSub.trim()}>
                {saving ? '…' : 'Add'}
              </button>
              <button className="cp-cancel-btn" onClick={() => setShowNewSub(false)}>✕</button>
            </div>
          )}
        </>
      )}

      {error && <p className="cp-error">{error}</p>}
    </div>
  )
}