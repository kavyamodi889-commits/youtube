/**
 * AURA Admin — Report Export Utility
 * PDF: Uses jsPDF to generate a real downloadable .pdf file — NO print dialog.
 *      Charts are drawn using jsPDF vector drawing primitives and embedded directly.
 * CSV/Excel: Plain CSV download (opens perfectly in Excel).
 *
 * All field names verified against real Mongoose models.
 */
import { jsPDF } from 'jspdf'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  rose:   [181, 41,  78],
  indigo: [102, 84, 168],
  teal:   [ 61,158, 140],
  gold:   [184,136,  42],
  blue:   [ 37,100, 235],
  green:  [ 34,197,  94],
  red:    [239, 68,  68],
  yellow: [245,158,  11],
  gray:   [180,180,180],
  black:  [ 17, 17, 17],
  white:  [255,255,255],
  light:  [248,248,252],
  border: [226,226,235],
  t2:     [100,100,120],
}

const CHART_COLORS = [C.rose, C.indigo, C.teal, C.gold, C.blue, C.green, C.red, C.yellow]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtNum(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
function nowStamp() {
  return new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}
function rgb(arr) { return `rgb(${arr.join(',')})` }

// ─── CSV ─────────────────────────────────────────────────────────────────────
function escapeCSV(val) {
  const s = String(val ?? '')
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"` : s
}
function rowsToCSV(headers, rows) {
  return [headers, ...rows].map(r => r.map(escapeCSV).join(',')).join('\r\n')
}
function downloadCSV(filename, headers, rows) {
  const blob = new Blob([rowsToCSV(headers, rows)], { type: 'text/csv' })
  const a    = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: filename,
  })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

// ─── PDF Builder ─────────────────────────────────────────────────────────────
class PDFReport {
  constructor(title, subtitle) {
    this.doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    this.W       = 210   // A4 width mm
    this.H       = 297   // A4 height mm
    this.margin  = 14
    this.y       = this.margin
    this.title   = title
    this.subtitle = subtitle
    this._drawHeader()
  }

  // ── internal helpers ──────────────────────────────────────────────────────
  setColor(arr)   { this.doc.setTextColor(...arr) }
  setFill(arr)    { this.doc.setFillColor(...arr) }
  setStroke(arr)  { this.doc.setDrawColor(...arr) }
  setFont(size, style = 'normal') { this.doc.setFontSize(size); this.doc.setFont('helvetica', style) }
  lineW(w)        { this.doc.setLineWidth(w) }

  text(str, x, y, opts = {}) {
    this.doc.text(str, x, y, opts)
  }

  rect(x, y, w, h, fill = true) {
    this.doc.rect(x, y, w, h, fill ? 'F' : 'S')
  }

  checkPage(needed = 10) {
    if (this.y + needed > this.H - 14) {
      this.doc.addPage()
      this.y = this.margin
      this._drawPageBorder()
    }
  }

  // ── Header ────────────────────────────────────────────────────────────────
  _drawHeader() {
    const d = this.doc
    // Top bar
    this.setFill(C.rose)
    this.rect(0, 0, this.W, 22)
    // Brand
    this.setFont(16, 'bold')
    this.setColor(C.white)
    this.text('AURA', this.margin, 14)
    // Admin tag
    this.setFont(7, 'bold')
    this.setFill([255, 255, 255, 0.18])
    this.rect(this.margin + 22, 7, 18, 8)
    this.setColor(C.white)
    this.text('ADMIN', this.margin + 23, 13)
    // Title
    this.setFont(11, 'bold')
    this.setColor(C.white)
    this.text(this.title, this.margin + 46, 10)
    // Subtitle + timestamp
    this.setFont(7.5, 'normal')
    this.setColor([255, 220, 230])
    this.text(this.subtitle, this.margin + 46, 16)
    this.text('Generated: ' + nowStamp(), this.W - this.margin, 14, { align: 'right' })

    this.y = 30
    this._drawPageBorder()
  }

  _drawPageBorder() {
    this.setStroke(C.border)
    this.lineW(0.2)
    // Bottom line
    this.doc.line(this.margin, this.H - 8, this.W - this.margin, this.H - 8)
    this.setFont(7, 'normal')
    this.setColor(C.gray)
    this.text('AURA Admin Portal — Confidential', this.margin, this.H - 4)
    this.text(nowStamp(), this.W - this.margin, this.H - 4, { align: 'right' })
  }

  // ── Stat cards row ────────────────────────────────────────────────────────
  statCards(cards) {
    this.checkPage(24)
    const perRow = Math.min(cards.length, 4)
    const cardW  = (this.W - this.margin * 2 - (perRow - 1) * 4) / perRow
    let x = this.margin

    cards.slice(0, 8).forEach((card, i) => {
      if (i > 0 && i % perRow === 0) { x = this.margin; this.y += 28 }
      const cx = x + (i % perRow) * (cardW + 4)
      // card bg
      this.setFill(C.light)
      this.rect(cx, this.y, cardW, 22)
      // left accent bar
      const color = card.color || C.rose
      this.setFill(color)
      this.rect(cx, this.y, 2.5, 22)
      // value
      this.setFont(13, 'bold')
      this.setColor(color)
      this.text(String(card.value ?? '—'), cx + 6, this.y + 10)
      // label
      this.setFont(6.5, 'normal')
      this.setColor(C.t2)
      this.text(card.label.toUpperCase(), cx + 6, this.y + 17)
    })

    this.y += 30
  }

  // ── Section heading ───────────────────────────────────────────────────────
  sectionTitle(title) {
    this.checkPage(14)
    this.y += 4
    this.setFont(9, 'bold')
    this.setColor(C.black)
    this.text(title, this.margin, this.y)
    // underline
    this.setStroke(C.rose)
    this.lineW(0.5)
    this.doc.line(this.margin, this.y + 1.5, this.margin + this.doc.getTextWidth(title) + 2, this.y + 1.5)
    this.y += 8
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  table(headers, rows, colWidths) {
    const d         = this.doc
    const availW    = this.W - this.margin * 2
    const totalDef  = colWidths.reduce((a, b) => a + b, 0)
    const widths    = colWidths.map(w => (w / totalDef) * availW)
    const rowH      = 7
    const headerH   = 8

    this.checkPage(headerH + rowH)

    // Header row
    this.setFill(C.black)
    this.rect(this.margin, this.y, availW, headerH)
    this.setFont(6.5, 'bold')
    this.setColor(C.white)
    let x = this.margin + 2
    headers.forEach((h, i) => {
      this.text(String(h).toUpperCase(), x, this.y + 5.5)
      x += widths[i]
    })
    this.y += headerH

    // Data rows
    rows.forEach((row, ri) => {
      this.checkPage(rowH + 2)
      // alternating bg
      if (ri % 2 === 1) {
        this.setFill(C.light)
        this.rect(this.margin, this.y, availW, rowH)
      }
      // border
      this.setStroke(C.border)
      this.lineW(0.1)
      d.line(this.margin, this.y + rowH, this.margin + availW, this.y + rowH)

      this.setFont(7, 'normal')
      this.setColor(C.black)
      let cx = this.margin + 2
      row.forEach((cell, ci) => {
        const str  = String(cell ?? '—')
        const maxW = widths[ci] - 3
        // truncate if too long
        const display = d.getTextWidth(str) > maxW
          ? str.slice(0, Math.floor(str.length * maxW / d.getTextWidth(str)) - 1) + '…'
          : str
        this.text(display, cx, this.y + 5)
        cx += widths[ci]
      })
      this.y += rowH
    })

    this.y += 4
  }

  // ── Bar chart ─────────────────────────────────────────────────────────────
  barChart(data, labelKey, valueKey, title, chartColor = C.rose) {
    if (!data?.length) return
    const chartH = 50
    const chartW = this.W - this.margin * 2
    this.checkPage(chartH + 20)
    this.sectionTitle(title)

    const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1)
    const barW   = Math.min((chartW / data.length) - 3, 18)
    const gap    = (chartW - barW * data.length) / (data.length + 1)

    // axes
    this.setStroke(C.border)
    this.lineW(0.3)
    this.doc.line(this.margin, this.y, this.margin, this.y + chartH)
    this.doc.line(this.margin, this.y + chartH, this.margin + chartW, this.y + chartH)

    data.forEach((d, i) => {
      const val    = d[valueKey] || 0
      const barH   = (val / maxVal) * (chartH - 4)
      const x      = this.margin + gap + i * (barW + gap)
      const y      = this.y + chartH - barH

      // bar
      this.setFill(chartColor)
      this.rect(x, y, barW, barH)

      // value label on top
      this.setFont(5.5, 'bold')
      this.setColor(C.black)
      if (barH > 6) this.text(fmtNum(val), x + barW / 2, y - 1.5, { align: 'center' })

      // x label
      this.setFont(5, 'normal')
      this.setColor(C.t2)
      const lbl = String(d[labelKey] || '').slice(0, 10)
      this.text(lbl, x + barW / 2, this.y + chartH + 5, { align: 'center' })
    })

    this.y += chartH + 12
  }

  // ── Line / area chart ─────────────────────────────────────────────────────
  lineChart(data, labelKey, series, title) {
    if (!data?.length) return
    const chartH = 50
    const chartW = this.W - this.margin * 2
    this.checkPage(chartH + 24)
    this.sectionTitle(title)

    const allVals = series.flatMap(s => data.map(d => d[s.key] || 0))
    const maxVal  = Math.max(...allVals, 1)
    const stepX   = chartW / (data.length - 1 || 1)

    // grid lines
    this.setStroke(C.border)
    this.lineW(0.15)
    ;[0.25, 0.5, 0.75, 1].forEach(pct => {
      const gy = this.y + chartH - pct * chartH
      this.doc.line(this.margin, gy, this.margin + chartW, gy)
      this.setFont(5, 'normal')
      this.setColor(C.gray)
      this.text(fmtNum(Math.round(maxVal * pct)), this.margin - 1, gy + 1.5, { align: 'right' })
    })

    // axes
    this.setStroke(C.border)
    this.lineW(0.3)
    this.doc.line(this.margin, this.y, this.margin, this.y + chartH)
    this.doc.line(this.margin, this.y + chartH, this.margin + chartW, this.y + chartH)

    // series lines
    series.forEach(({ key, color, label }) => {
      const pts = data.map((d, i) => ({
        x: this.margin + i * stepX,
        y: this.y + chartH - ((d[key] || 0) / maxVal) * chartH,
      }))
      this.setStroke(color)
      this.lineW(0.8)
      for (let i = 1; i < pts.length; i++) {
        this.doc.line(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y)
      }
      // dots
      pts.forEach(p => {
        this.setFill(color)
        this.doc.circle(p.x, p.y, 1, 'F')
      })
    })

    // x labels (every nth)
    const every = Math.ceil(data.length / 8)
    data.forEach((d, i) => {
      if (i % every !== 0) return
      this.setFont(5, 'normal')
      this.setColor(C.t2)
      this.text(String(d[labelKey] || '').slice(5), this.margin + i * stepX, this.y + chartH + 5, { align: 'center' })
    })

    // legend
    let lx = this.margin
    series.forEach(({ color, label }) => {
      this.setFill(color)
      this.rect(lx, this.y + chartH + 9, 6, 2.5)
      this.setFont(5.5, 'normal')
      this.setColor(C.black)
      this.text(label, lx + 7.5, this.y + chartH + 11.2)
      lx += this.doc.getTextWidth(label) + 14
    })

    this.y += chartH + 18
  }

  // ── Pie / donut chart ─────────────────────────────────────────────────────
  pieChart(data, labelKey, valueKey, title) {
    if (!data?.length) return
    const r     = 26
    const cx    = this.margin + r + 2
    const chartW = this.W - this.margin * 2
    this.checkPage(r * 2 + 20)
    this.sectionTitle(title)

    const total = data.reduce((s, d) => s + (d[valueKey] || 0), 0) || 1
    let angle   = -Math.PI / 2   // start at top

    // draw slices using approximated arc with many line segments
    data.forEach((d, i) => {
      const slice   = ((d[valueKey] || 0) / total) * 2 * Math.PI
      const color   = CHART_COLORS[i % CHART_COLORS.length]
      const midA    = angle + slice / 2

      // Fill slice via triangles (jsPDF has no native arc fill, approximate with lines)
      const steps   = Math.max(3, Math.ceil(slice * 12))
      const stepA   = slice / steps
      const cy      = this.y + r

      // Build polygon points
      const pts = [[cx, cy]]
      for (let s = 0; s <= steps; s++) {
        const a = angle + s * stepA
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
      }
      this.setFill(color)
      // Use doc.lines for polygon fill
      const lines = pts.slice(1).map((p, j) => {
        const prev = pts[j] // pts[0] is first, pts[j] is previous
        return [p[0] - prev[0], p[1] - prev[1]]
      })
      this.doc.lines(lines, pts[0][0], pts[0][1], [1, 1], 'F')

      angle += slice
    })

    // white center circle (donut hole)
    this.setFill(C.white)
    this.doc.circle(cx, this.y + r, r * 0.45, 'F')

    // legend on right side
    const legendX = this.margin + r * 2 + 10
    const legendW = chartW - r * 2 - 12
    data.forEach((d, i) => {
      if (i > 10) return
      const ly    = this.y + 4 + i * 9
      const color = CHART_COLORS[i % CHART_COLORS.length]
      const pct   = Math.round(((d[valueKey] || 0) / total) * 100)

      this.setFill(color)
      this.rect(legendX, ly, 4, 4)

      this.setFont(7, 'bold')
      this.setColor(C.black)
      this.text(String(d[labelKey] || 'Other').slice(0, 20), legendX + 6, ly + 3.5)

      this.setFont(6.5, 'normal')
      this.setColor(C.t2)
      this.text(`${fmtNum(d[valueKey] || 0)} · ${pct}%`, legendX + 6, ly + 7.5)
    })

    this.y += r * 2 + 10
  }

  // ── Horizontal bar chart (category breakdown) ─────────────────────────────
  hBarChart(data, labelKey, valueKey, title) {
    if (!data?.length) return
    const barH  = 6
    const chartW = this.W - this.margin * 2
    const labelW = 40
    const barMaxW = chartW - labelW - 20

    this.checkPage(data.length * (barH + 3) + 20)
    this.sectionTitle(title)

    const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1)

    data.slice(0, 12).forEach((d, i) => {
      const val  = d[valueKey] || 0
      const w    = (val / maxVal) * barMaxW
      const color = CHART_COLORS[i % CHART_COLORS.length]
      const y    = this.y + i * (barH + 3)

      // label
      this.setFont(6.5, 'normal')
      this.setColor(C.black)
      const lbl = String(d[labelKey] || '').slice(0, 16)
      this.text(lbl, this.margin + labelW - 2, y + barH - 1, { align: 'right' })

      // bg
      this.setFill(C.light)
      this.rect(this.margin + labelW, y, barMaxW, barH)

      // bar
      this.setFill(color)
      this.rect(this.margin + labelW, y, w, barH)

      // value
      this.setFont(6, 'bold')
      this.setColor(C.white)
      if (w > 12) this.text(fmtNum(val), this.margin + labelW + w - 2, y + barH - 1, { align: 'right' })
      else {
        this.setColor(C.t2)
        this.text(fmtNum(val), this.margin + labelW + w + 2, y + barH - 1)
      }
    })

    this.y += data.slice(0, 12).length * (barH + 3) + 8
  }

  // ── Download ──────────────────────────────────────────────────────────────
  save(filename) {
    this.doc.save(filename)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════════════════════
export function exportUsersCSV(users) {
  downloadCSV(`AURA_Users_${Date.now()}.csv`,
    ['Username', 'Display Name', 'Email', 'Role', 'Verified', 'Banned', 'Membership', 'Subscribers', 'Videos', 'Joined'],
    users.map(u => [
      u.username, u.displayName || '', u.email, u.role,
      u.isVerified ? 'Yes' : 'No', u.isBanned ? 'Yes' : 'No',
      u.membershipTier || 'none', u.subscriberCount || 0, u.videoCount || 0,
      fmtDate(u.createdAt),
    ])
  )
}

export function exportUsersPDF(users) {
  const pdf = new PDFReport('User Management Report', `${users.length} users — ${nowStamp()}`)

  pdf.statCards([
    { label: 'Total Users',  value: users.length,                                              color: C.blue   },
    { label: 'Creators',     value: users.filter(u => u.role === 'creator').length,            color: C.rose   },
    { label: 'Premium',      value: users.filter(u => u.membershipTier && u.membershipTier !== 'none').length, color: C.gold },
    { label: 'Banned',       value: users.filter(u => u.isBanned).length,                     color: C.red    },
    { label: 'Verified',     value: users.filter(u => u.isVerified).length,                   color: C.green  },
    { label: 'Avg Subs',     value: fmtNum(Math.round(users.reduce((s,u) => s + (u.subscriberCount||0),0) / (users.length||1))), color: C.indigo },
  ])

  // Role breakdown bar chart
  const roleCounts = ['user','creator','moderator','admin'].map(r => ({
    role: r, count: users.filter(u => u.role === r).length,
  })).filter(r => r.count > 0)
  pdf.barChart(roleCounts, 'role', 'count', 'Users by Role', C.indigo)

  // Membership breakdown
  const tierCounts = ['none','basic','standard','premium','ultra'].map(t => ({
    tier: t, count: users.filter(u => (u.membershipTier || 'none') === t).length,
  })).filter(t => t.count > 0)
  if (tierCounts.length > 1) pdf.barChart(tierCounts, 'tier', 'count', 'Users by Membership Tier', C.gold)

  pdf.sectionTitle('User List')
  pdf.table(
    ['Username', 'Role', 'Verified', 'Status', 'Plan', 'Subs', 'Videos', 'Joined'],
    users.map(u => [
      (u.displayName || u.username || '').slice(0, 22),
      u.role,
      u.isVerified ? '✓ Yes' : 'No',
      u.isBanned ? 'BANNED' : 'Active',
      u.membershipTier || 'none',
      fmtNum(u.subscriberCount || 0),
      u.videoCount || 0,
      fmtDate(u.createdAt),
    ]),
    [22, 12, 12, 12, 14, 10, 10, 18]
  )

  pdf.save(`AURA_Users_${Date.now()}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// VIDEOS
// ══════════════════════════════════════════════════════════════════════════════
export function exportVideosCSV(videos) {
  downloadCSV(`AURA_Videos_${Date.now()}.csv`,
    ['Title', 'Uploader', 'Views', 'Likes', 'Dislikes', 'Status', 'Category', 'Flagged', 'Published'],
    videos.map(v => [
      v.title, v.uploader?.username || v.uploader || '—',
      v.viewCount ?? v.views ?? 0, v.likeCount ?? v.likes ?? 0, v.dislikeCount ?? 0,
      v.status, v.category || '—', v.flagged ? 'Yes' : 'No', fmtDate(v.createdAt),
    ])
  )
}

export function exportVideosPDF(videos) {
  const pdf = new PDFReport('Video Management Report', `${videos.length} videos — ${nowStamp()}`)

  pdf.statCards([
    { label: 'Total Videos',  value: videos.length,                                                        color: C.blue   },
    { label: 'Published',     value: videos.filter(v => v.status === 'published').length,                  color: C.green  },
    { label: 'Flagged',       value: videos.filter(v => v.flagged).length,                                 color: C.red    },
    { label: 'Deleted',       value: videos.filter(v => v.status === 'deleted' || v.status === 'rejected').length, color: C.yellow },
    { label: 'Total Views',   value: fmtNum(videos.reduce((s,v) => s + (v.viewCount||v.views||0), 0)),     color: C.rose   },
    { label: 'Total Likes',   value: fmtNum(videos.reduce((s,v) => s + (v.likeCount||v.likes||0), 0)),     color: C.indigo },
  ])

  // Status breakdown
  const statusCounts = ['published','unlisted','private','processing','rejected','deleted'].map(s => ({
    status: s, count: videos.filter(v => v.status === s).length,
  })).filter(s => s.count > 0)
  pdf.barChart(statusCounts, 'status', 'count', 'Videos by Status', C.rose)

  // Category breakdown
  const catMap = {}
  videos.forEach(v => { const c = v.category || 'Other'; catMap[c] = (catMap[c]||0) + 1 })
  const catData = Object.entries(catMap).map(([name,count]) => ({ name, count })).sort((a,b) => b.count-a.count)
  if (catData.length > 1) pdf.hBarChart(catData, 'name', 'count', 'Videos by Category')

  pdf.sectionTitle('Video List')
  pdf.table(
    ['Title', 'Uploader', 'Views', 'Likes', 'Status', 'Category', 'Date'],
    videos.map(v => [
      (v.title || '').slice(0, 30),
      (v.uploader?.username || v.uploader || '—').slice(0, 16),
      fmtNum(v.viewCount ?? v.views ?? 0),
      fmtNum(v.likeCount ?? v.likes ?? 0),
      v.status,
      (v.category || '—').slice(0, 12),
      fmtDate(v.createdAt),
    ]),
    [30, 16, 10, 10, 14, 12, 18]
  )

  pdf.save(`AURA_Videos_${Date.now()}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════════════════════
export function exportReportsCSV(reports) {
  downloadCSV(`AURA_Reports_${Date.now()}.csv`,
    ['Target Type', 'Reason', 'Status', 'Reporter', 'Description', 'Created At'],
    reports.map(r => [
      r.targetType, r.reason, r.status,
      r.reporter?.username || r.reporter || '—',
      r.description || '—', fmtDate(r.createdAt),
    ])
  )
}

export function exportReportsPDF(reports) {
  const pdf = new PDFReport('Reports & Moderation Report', `${reports.length} reports — ${nowStamp()}`)

  pdf.statCards([
    { label: 'Total Reports', value: reports.length,                                          color: C.blue   },
    { label: 'Pending',       value: reports.filter(r => r.status === 'pending').length,      color: C.yellow },
    { label: 'Actioned',      value: reports.filter(r => r.status === 'actioned').length,     color: C.red    },
    { label: 'Dismissed',     value: reports.filter(r => r.status === 'dismissed').length,    color: C.green  },
  ])

  // Status breakdown pie
  const statusData = ['pending','reviewed','actioned','dismissed'].map(s => ({
    status: s, count: reports.filter(r => r.status === s).length,
  })).filter(s => s.count > 0)
  pdf.pieChart(statusData, 'status', 'count', 'Reports by Status')

  // Type breakdown
  const typeMap = {}
  reports.forEach(r => { const t = r.targetType || 'Unknown'; typeMap[t] = (typeMap[t]||0)+1 })
  const typeData = Object.entries(typeMap).map(([type,count]) => ({ type, count })).sort((a,b)=>b.count-a.count)
  pdf.barChart(typeData, 'type', 'count', 'Reports by Target Type', C.indigo)

  pdf.sectionTitle('Report List')
  pdf.table(
    ['Type', 'Reason', 'Status', 'Reporter', 'Description', 'Date'],
    reports.map(r => [
      r.targetType || '—',
      (r.reason || '—').slice(0, 18),
      r.status,
      (r.reporter?.username || r.reporter || '—').slice(0, 16),
      (r.description || '—').slice(0, 30),
      fmtDate(r.createdAt),
    ]),
    [14, 18, 14, 16, 30, 18]
  )

  pdf.save(`AURA_Reports_${Date.now()}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════════════════════════════════
export function exportPaymentsCSV(payments) {
  downloadCSV(`AURA_Payments_${Date.now()}.csv`,
    ['User', 'Plan/Type', 'Amount (₹)', 'Status', 'Razorpay Order ID', 'Date'],
    payments.map(p => [
      p.user?.username || p.user || '—',
      p.plan || p.membershipTier || p.type || '—',
      Math.round((p.amount || 0) / 100),
      p.status, p.razorpayOrderId || '—', fmtDate(p.createdAt),
    ])
  )
}

export function exportPaymentsPDF(payments) {
  const captured  = payments.filter(p => p.status === 'captured')
  const refunded  = payments.filter(p => p.status === 'refunded')
  const revenue   = captured.reduce((s, p) => s + (p.amount||0), 0)
  const refunds   = refunded.reduce((s, p) => s + (p.amountRefunded||p.amount||0), 0)

  const pdf = new PDFReport('Payment Transactions Report',
    `Revenue: ₹${Math.round(revenue/100).toLocaleString()} — ${nowStamp()}`)

  pdf.statCards([
    { label: 'Transactions',  value: payments.length,                                color: C.blue   },
    { label: 'Revenue (₹)',   value: fmtNum(Math.round(revenue / 100)),               color: C.green  },
    { label: 'Refunded (₹)',  value: fmtNum(Math.round(refunds / 100)),               color: C.yellow },
    { label: 'Failed',        value: payments.filter(p => p.status === 'failed').length, color: C.red },
    { label: 'Captured',      value: captured.length,                                color: C.teal   },
    { label: 'Disputed',      value: payments.filter(p => p.status === 'disputed').length, color: C.rose },
  ])

  // Status breakdown
  const statusData = ['captured','created','failed','refunded','disputed'].map(s => ({
    status: s, count: payments.filter(p => p.status === s).length,
  })).filter(s => s.count > 0)
  pdf.barChart(statusData, 'status', 'count', 'Payments by Status', C.green)

  // Plan breakdown
  const planMap = {}
  payments.forEach(p => { const t = p.plan||p.membershipTier||p.type||'unknown'; planMap[t]=(planMap[t]||0)+1 })
  const planData = Object.entries(planMap).map(([plan,count]) => ({ plan, count })).sort((a,b)=>b.count-a.count)
  if (planData.length > 1) pdf.barChart(planData, 'plan', 'count', 'Payments by Plan', C.gold)

  pdf.sectionTitle('Transaction List')
  pdf.table(
    ['User', 'Plan', 'Amount (₹)', 'Status', 'Order ID', 'Date'],
    payments.map(p => [
      (p.user?.username || p.user || '—').slice(0, 18),
      (p.plan || p.membershipTier || p.type || '—').slice(0, 14),
      `₹${Math.round((p.amount||0)/100).toLocaleString()}`,
      p.status,
      (p.razorpayOrderId || '—').slice(0, 20),
      fmtDate(p.createdAt),
    ]),
    [18, 14, 14, 14, 20, 18]
  )

  pdf.save(`AURA_Payments_${Date.now()}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════
export function exportAnalyticsCSV(chartData) {
  downloadCSV(`AURA_Analytics_${Date.now()}.csv`,
    ['Date', 'New Users', 'Views'],
    (chartData || []).map(d => [d.date || d._id, d.users || d.count || 0, d.views || 0])
  )
}

export function exportAnalyticsPDF(chartData, totals) {
  const pdf = new PDFReport('Platform Analytics Report', `Period overview — ${nowStamp()}`)

  pdf.statCards([
    { label: 'Total Users',   value: fmtNum(totals?.totalUsers   || 0), color: C.blue   },
    { label: 'Total Videos',  value: fmtNum(totals?.totalVideos  || 0), color: C.rose   },
    { label: 'Total Views',   value: fmtNum(totals?.totalViews   || 0), color: C.indigo },
    { label: 'Premium Users', value: fmtNum(totals?.premiumUsers || 0), color: C.gold   },
    { label: 'Creators',      value: fmtNum(totals?.creators     || 0), color: C.teal   },
    { label: 'Banned Users',  value: fmtNum(totals?.bannedUsers  || 0), color: C.red    },
  ])

  if (chartData?.length > 1) {
    pdf.lineChart(
      chartData,
      'date',
      [
        { key: 'users', color: C.rose,   label: 'New Users' },
        { key: 'views', color: C.indigo, label: 'Views'     },
      ],
      'New Users & Views Over Time'
    )
  }

  pdf.sectionTitle('Daily Breakdown')
  pdf.table(
    ['Date', 'New Users', 'Views'],
    (chartData || []).map(d => [d.date || d._id || '—', fmtNum(d.users || d.count || 0), fmtNum(d.views || 0)]),
    [60, 40, 40]
  )

  pdf.save(`AURA_Analytics_${Date.now()}.pdf`)
}

// ══════════════════════════════════════════════════════════════════════════════
// LIVE STREAMS
// ══════════════════════════════════════════════════════════════════════════════
export function exportLiveCSV(streams) {
  downloadCSV(`AURA_LiveStreams_${Date.now()}.csv`,
    ['Title', 'Streamer', 'Status', 'Current Viewers', 'Peak Viewers', 'Category', 'Started At'],
    streams.map(s => [
      s.title, s.streamer || s.host?.username || '—', s.status,
      s.viewers ?? s.currentViewers ?? 0, s.peakViewers || 0,
      s.category || '—', fmtDate(s.startedAt),
    ])
  )
}

export function exportLivePDF(streams) {
  const live = streams.filter(s => s.status === 'live')
  const pdf  = new PDFReport('Live Streams Report',
    `${live.length} active · ${streams.length} total — ${nowStamp()}`)

  pdf.statCards([
    { label: 'Total Streams',  value: streams.length,                                                           color: C.blue  },
    { label: 'Live Now',       value: live.length,                                                               color: C.red   },
    { label: 'Total Viewers',  value: fmtNum(live.reduce((s,st)=>s+(st.viewers??st.currentViewers??0),0)),       color: C.rose  },
    { label: 'Ended',          value: streams.filter(s=>s.status==='ended').length,                              color: C.gray  },
  ])

  // Status breakdown
  const statusData = ['live','scheduled','ended','cancelled'].map(s => ({
    status: s, count: streams.filter(st => st.status === s).length,
  })).filter(s => s.count > 0)
  pdf.barChart(statusData, 'status', 'count', 'Streams by Status', C.rose)

  pdf.sectionTitle('Stream List')
  pdf.table(
    ['Title', 'Streamer', 'Status', 'Viewers', 'Peak', 'Category', 'Started'],
    streams.map(s => [
      (s.title || '').slice(0, 28),
      (s.streamer || s.host?.username || '—').slice(0, 16),
      s.status,
      fmtNum(s.viewers ?? s.currentViewers ?? 0),
      fmtNum(s.peakViewers || 0),
      (s.category || '—').slice(0, 12),
      fmtDate(s.startedAt),
    ]),
    [28, 16, 14, 12, 10, 12, 18]
  )

  pdf.save(`AURA_LiveStreams_${Date.now()}.pdf`)
}