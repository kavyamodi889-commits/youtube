// FILE: client/src/utils/particleUtils.js
// Particle burst animation for delete actions — same as chat delete spec

/**
 * triggerDeleteParticles(rect, isSent, canvasEl)
 * rect     — DOMRect of the element being deleted
 * isSent   — true = rose+indigo palette, false = dark+rose+indigo
 * canvasEl — full-screen fixed canvas element (pointer-events:none)
 */
export function triggerDeleteParticles(rect, isSent = true, canvasEl) {
  if (!canvasEl) return

  const ctx = canvasEl.getContext('2d')
  canvasEl.width  = window.innerWidth
  canvasEl.height = window.innerHeight

  const cx = rect.left + rect.width  / 2
  const cy = rect.top  + rect.height / 2

  // Colour palettes
  const sentColors  = ['#b5294e','#c0392b','#6654a8','#8e44ad','#e056fd','#ff6b9d']
  const recvColors  = ['#b5294e','#6654a8','#2c3e50','#3d9e8c','#ff6b9d','#a29bfe']
  const colors = isSent ? sentColors : recvColors

  const particles = []

  // 36 main particles
  for (let i = 0; i < 36; i++) {
    const angle = (Math.random() * Math.PI * 2)
    const speed = 2 + Math.random() * 5
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 4,
      size: 3 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: 0.018 + Math.random() * 0.012,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      gravity: 0.12 + Math.random() * 0.08,
    })
  }

  // 14 bright sparks
  for (let i = 0; i < 14; i++) {
    const angle = (Math.random() * Math.PI * 2)
    const speed = 4 + Math.random() * 8
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 1.5 + Math.random() * 2.5,
      color: '#ffffff',
      alpha: 1,
      decay: 0.025 + Math.random() * 0.02,
      shape: 'circle',
      rotation: 0, rotSpeed: 0,
      gravity: 0.08,
    })
  }

  // 10 dust
  for (let i = 0; i < 10; i++) {
    const angle = (Math.random() * Math.PI * 2)
    const speed = 1 + Math.random() * 2.5
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 1.5,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.7,
      decay: 0.012 + Math.random() * 0.01,
      shape: 'circle',
      rotation: 0, rotSpeed: 0,
      gravity: 0.05,
    })
  }

  let rafId

  function draw() {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
    let alive = false

    for (const p of particles) {
      if (p.alpha <= 0) continue
      alive = true

      p.x  += p.vx
      p.y  += p.vy
      p.vy += p.gravity
      p.vx *= 0.98
      p.alpha -= p.decay
      p.rotation += p.rotSpeed

      ctx.save()
      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.fillStyle   = p.color
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    if (alive) {
      rafId = requestAnimationFrame(draw)
    } else {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
      cancelAnimationFrame(rafId)
    }
  }

  draw()
}