import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './App.css'

function useCountdown() {
  const target = new Date('2027-01-01T00:00:00Z').getTime()
  const calc = () => {
    const diff = Math.max(0, target - Date.now())
    const s = Math.floor(diff / 1000)
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
  }
  const [t, setT] = useState(calc)
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id) }, [])
  return t
}

function useScene(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = window.innerWidth, H = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000508, 0.06)
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200)
    camera.position.set(3.5, 0, 7)
    camera.lookAt(0, 0, 0)

    const ambient = new THREE.AmbientLight(0x0a0a1a, 1)
    scene.add(ambient)
    const pt1 = new THREE.PointLight(0x00c8ff, 80, 30)
    pt1.position.set(5, 3, 3)
    scene.add(pt1)
    const pt2 = new THREE.PointLight(0xffc800, 60, 25)
    pt2.position.set(-5, -2, 2)
    scene.add(pt2)
    const pt3 = new THREE.PointLight(0x0066ff, 40, 20)
    pt3.position.set(0, 6, -4)
    scene.add(pt3)

    const icoGeo = new THREE.IcosahedronGeometry(1.6, 6)
    const icoMat = new THREE.MeshPhysicalMaterial({
      color: 0x040e1a, metalness: 0.95, roughness: 0.05, envMapIntensity: 1.5,
      emissive: new THREE.Color(0x001828), emissiveIntensity: 0.3, transparent: true, opacity: 0.92,
    })
    const ico = new THREE.Mesh(icoGeo, icoMat)
    scene.add(ico)

    const wireGeo = new THREE.IcosahedronGeometry(1.64, 3)
    const wireMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vPos;
        void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        varying vec3 vPos; uniform float uTime;
        void main() {
          float a = atan(vPos.z, vPos.x);
          float sweep = sin(a * 3.0 - uTime * 1.4) * 0.5 + 0.5;
          vec3 col = mix(vec3(0.0, 0.45, 0.85), vec3(0.9, 0.72, 0.0), sweep);
          gl_FragColor = vec4(col, 0.25 + sweep * 0.45);
        }
      `,
      transparent: true, wireframe: true,
    })
    const wire = new THREE.Mesh(wireGeo, wireMat)
    scene.add(wire)

    const glowGeo = new THREE.SphereGeometry(2.1, 32, 32)
    const glowMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        varying vec3 vNormal; uniform float uTime;
        void main() {
          float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.2);
          float pulse = sin(uTime * 1.2) * 0.15 + 0.85;
          vec3 col = mix(vec3(0.0, 0.55, 1.0), vec3(1.0, 0.78, 0.0), sin(uTime * 0.5) * 0.5 + 0.5);
          gl_FragColor = vec4(col * rim * pulse, rim * 0.6);
        }
      `,
      transparent: true, side: THREE.FrontSide, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    scene.add(glow)

    const rings = []
    ;[
      { r: 2.4, tube: 0.008, rx: Math.PI * 0.5,  ry: 0,              speed: 0.4  },
      { r: 2.7, tube: 0.006, rx: Math.PI * 0.25, ry: Math.PI * 0.5,  speed: -0.3 },
      { r: 3.1, tube: 0.005, rx: Math.PI * 0.75, ry: Math.PI * 0.25, speed: 0.2  },
    ].forEach(({ r, tube, rx, ry, speed }) => {
      const geo = new THREE.TorusGeometry(r, tube, 4, 200)
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uSpeed: { value: speed } },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          varying vec2 vUv; uniform float uTime;
          void main() {
            float t = vUv.x + uTime * 0.12;
            float bright = pow(sin(t * 3.14159 * 6.0) * 0.5 + 0.5, 3.0);
            vec3 col = mix(vec3(0.0, 0.72, 1.0), vec3(1.0, 0.82, 0.0), sin(t * 2.0) * 0.5 + 0.5);
            gl_FragColor = vec4(col * (0.4 + bright * 1.2), 0.5 + bright * 0.5);
          }
        `,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = rx; mesh.rotation.y = ry; mesh.userData.speed = speed
      scene.add(mesh); rings.push(mesh)
    })

    const arcs = []
    const ARC_COUNT = 12
    function makeArc() {
      const points = []
      const start = new THREE.Vector3().randomDirection().multiplyScalar(1.65)
      const end   = new THREE.Vector3().randomDirection().multiplyScalar(1.65)
      for (let i = 0; i <= 8; i++) {
        const t = i / 8
        const p = start.clone().lerp(end, t)
        if (i > 0 && i < 8) { p.x += (Math.random()-0.5)*0.5; p.y += (Math.random()-0.5)*0.5; p.z += (Math.random()-0.5)*0.5 }
        points.push(p)
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({
        color: Math.random() > 0.5 ? 0x00c8ff : 0xffc800,
        transparent: true, opacity: 0.7 + Math.random() * 0.3,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const line = new THREE.Line(geo, mat)
      line.userData.life = 0; line.userData.maxLife = 0.3 + Math.random() * 0.5
      scene.add(line); return line
    }
    for (let i = 0; i < ARC_COUNT; i++) arcs.push(makeArc())

    const N = 800
    const pPos = new Float32Array(N*3), pSizes = new Float32Array(N), pPhase = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const r = 4 + Math.random()*8, θ = Math.random()*Math.PI*2, φ = Math.acos(2*Math.random()-1)
      pPos[i*3] = r*Math.sin(φ)*Math.cos(θ); pPos[i*3+1] = r*Math.sin(φ)*Math.sin(θ); pPos[i*3+2] = r*Math.cos(φ)
      pSizes[i] = 0.5 + Math.random()*2.5; pPhase[i] = Math.random()*Math.PI*2
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    pGeo.setAttribute('aSize',    new THREE.BufferAttribute(pSizes, 1))
    pGeo.setAttribute('aPhase',   new THREE.BufferAttribute(pPhase, 1))
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aSize; attribute float aPhase; uniform float uTime; varying float vAlpha;
        void main() {
          vAlpha = sin(uTime * 0.6 + aPhase) * 0.35 + 0.55;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (400.0 / -mv.z); gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - 0.5; if (length(uv) > 0.5) discard;
          float a = smoothstep(0.5, 0.05, length(uv));
          gl_FragColor = vec4(0.65, 0.88, 1.0, a * vAlpha * 0.7);
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(pGeo, pMat)
    scene.add(particles)

    const gridGeo = new THREE.PlaneGeometry(40, 40, 40, 40)
    const gridMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv; varying float vDist;
        void main() { vUv = uv; vDist = length(position.xz); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv; varying float vDist; uniform float uTime;
        void main() {
          vec2 grid = abs(fract(vUv * 20.0 - 0.5) - 0.5) / fwidth(vUv * 20.0);
          float g = 1.0 - min(min(grid.x, grid.y), 1.0);
          float wave = pow(sin(vDist * 1.2 - uTime * 2.5) * 0.5 + 0.5, 4.0) * (1.0 - smoothstep(8.0, 20.0, vDist));
          float fade = 1.0 - smoothstep(4.0, 20.0, vDist);
          vec3 col = mix(vec3(0.0, 0.35, 0.7), vec3(0.9, 0.7, 0.0), wave);
          gl_FragColor = vec4(col, (g * 0.35 + wave * 0.3) * fade);
        }
      `,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    })
    const grid = new THREE.Mesh(gridGeo, gridMat)
    grid.rotation.x = -Math.PI / 2; grid.position.y = -2.8
    scene.add(grid)

    const mouse = { x: 0, y: 0 }
    const onMouseMove = e => { mouse.x = (e.clientX/W-0.5)*2; mouse.y = -(e.clientY/H-0.5)*2 }
    window.addEventListener('mousemove', onMouseMove)

    let raf
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      wireMat.uniforms.uTime.value = t; glowMat.uniforms.uTime.value = t
      pMat.uniforms.uTime.value = t; gridMat.uniforms.uTime.value = t
      rings.forEach(r => { r.material.uniforms.uTime.value = t })

      ico.rotation.y = t*0.12; ico.rotation.x = t*0.07+mouse.y*0.1; ico.rotation.z = t*0.04
      wire.rotation.y = t*0.18+mouse.x*0.08; wire.rotation.x = t*0.09+mouse.y*0.06
      glow.rotation.y = t*0.05

      rings.forEach(r => { r.rotation.z += r.userData.speed*0.008; r.rotation.x += r.userData.speed*0.003 })

      arcs.forEach((arc, i) => {
        arc.userData.life += 0.016
        const life = arc.userData.life, maxL = arc.userData.maxLife
        const alpha = life < 0.1 ? life/0.1 : life > maxL-0.1 ? (maxL-life)/0.1 : 1.0
        arc.material.opacity = Math.max(0, alpha) * 0.8
        if (life > maxL) { scene.remove(arc); arcs[i] = makeArc(); arcs[i].userData.life = Math.random()*0.2 }
      })

      particles.rotation.y = t*0.02
      camera.position.x += (3.5+mouse.x*1.2-camera.position.x)*0.03
      camera.position.y += (mouse.y*0.8-camera.position.y)*0.03
      camera.lookAt(0, 0, 0)
      pt1.intensity = 80+Math.sin(t*1.3)*20; pt2.intensity = 60+Math.sin(t*0.9+1)*15
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => { const w=window.innerWidth,h=window.innerHeight; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix() }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('resize', onResize); renderer.dispose() }
  }, [])
}

export default function App() {
  const canvasRef = useRef(null)
  const cd = useCountdown()
  const [email, setEmail] = useState('')
  const [sent,  setSent]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useScene(canvasRef)

  const pad = n => String(n).padStart(2, '0')

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'ads' }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        setError(data.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="root">
      <canvas ref={canvasRef} className="canvas" />
      <div className="noise" />
      <div className="scanlines" />

      <nav className="nav">
        <a href="http://localhost:5173" className="nav-back">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          AURA
        </a>
        <div className="nav-brand">
          <span className="brand-icon">◈</span>
          <span>AURA ADS</span>
        </div>
        <div className="nav-tag">
          <span className="tag-dot" />
          IN DEVELOPMENT
        </div>
      </nav>

      <main className="main">
        <div className="left">
          <div className="overline">
            <span className="overline-bar" />
            <span>PLATFORM LAUNCH 2026</span>
          </div>

          <h1 className="headline">
            <span className="h-line h-coming">COMING</span>
            <span className="h-line h-soon">SOON</span>
          </h1>

          <p className="body-copy">
            A new era of intelligent advertising
            for creators and brands on AURA.
            Built for the next generation of digital media.
          </p>

          <div className="countdown">
            {[
              { v: pad(cd.d), l: 'DAYS'    },
              { v: pad(cd.h), l: 'HOURS'   },
              { v: pad(cd.m), l: 'MINUTES' },
              { v: pad(cd.s), l: 'SECONDS' },
            ].map(({ v, l }, i) => (
              <div key={l} className="cd-item">
                <div className="cd-val">{v}</div>
                <div className="cd-lbl">{l}</div>
                {i < 3 && <div className="cd-colon">:</div>}
              </div>
            ))}
          </div>

          {!sent ? (
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-row">
                <input
                  className="form-input"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="form-btn" disabled={loading}>
                  {loading ? '...' : 'NOTIFY ME'}
                </button>
              </div>
              <p className="form-sub">Early access. No spam. Unsubscribe anytime.</p>
              {error && <p className="form-sub" style={{color:'#ff6b6b'}}>{error}</p>}
            </form>
          ) : (
            <div className="sent">
              <div className="sent-check">✓</div>
              <p>You're on the list. We'll reach out soon.</p>
            </div>
          )}

          <ul className="features">
            {[
              ['◆', 'AI-driven audience targeting'],
              ['◆', 'Real-time campaign analytics'],
              ['◆', 'Creator-first revenue share'],
              ['◆', 'Cross-format ad placements'],
            ].map(([icon, text]) => (
              <li key={text} className="feature-item">
                <span className="feature-icon">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="right-label">
          <div className="sphere-label">
            <div className="sphere-label-line" />
            <span>AURA ADS ENGINE v1.0</span>
          </div>
        </div>
      </main>

      <footer className="footer">
        <span>© 2025 AURA PLATFORM INC.</span>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  )
}