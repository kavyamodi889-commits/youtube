import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './App.css'

function useCountdown() {
  const target = new Date('2027-01-01T00:00:00Z').getTime()
  const calc = () => {
    const s = Math.max(0, Math.floor((target - Date.now()) / 1000))
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
  }
  const [t, setT] = useState(calc)
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id) }, [])
  return t
}

function useScene(ref) {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const W = window.innerWidth, H = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x020814, 0.04)

    const camera = new THREE.PerspectiveCamera(54, W / H, 0.1, 200)
    camera.position.set(-1.8, 0.5, 8.5)
    camera.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0x04081a, 1.5))
    const ptGreen = new THREE.PointLight(0x00ff88, 70, 30)
    ptGreen.position.set(4, 3, 4); scene.add(ptGreen)
    const ptBlue = new THREE.PointLight(0x0066ff, 50, 26)
    ptBlue.position.set(-5, -2, 3); scene.add(ptBlue)
    const ptGold = new THREE.PointLight(0xffaa00, 35, 20)
    ptGold.position.set(0, -5, 2); scene.add(ptGold)

    /* ── VINYL ── */
    const vinylGroup = new THREE.Group()
    scene.add(vinylGroup)

    const discMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv; varying vec3 vNorm;
        void main(){ vUv=uv; vNorm=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        varying vec2 vUv; varying vec3 vNorm; uniform float uTime;
        void main(){
          vec2 c=vUv-0.5; float r=length(c)*2.3; float a=atan(c.y,c.x);
          float g=pow(sin(r*90.0)*0.5+0.5,10.0)*0.12;
          float sh=sin(r*10.0-uTime*1.2+a*2.5)*0.5+0.5;
          vec3 dark=vec3(0.02,0.06,0.03); vec3 shine=mix(vec3(0.0,0.8,0.4),vec3(0.0,0.4,1.0),sh);
          vec3 disc=mix(dark,shine*0.35,sh*0.6)+g;
          float lbl=smoothstep(0.35,0.33,r);
          vec3 lblC=mix(vec3(0.0,0.55,0.28),vec3(0.0,0.22,0.5),sin(uTime*0.7)*0.5+0.5);
          float hole=smoothstep(0.05,0.04,r);
          vec3 final=mix(disc,lblC,lbl); final=mix(final,vec3(0.0),hole);
          float rim=pow(1.0-abs(dot(vNorm,vec3(0.,1.,0.))),4.0); final+=vec3(0.0,0.9,0.4)*rim*0.5;
          gl_FragColor=vec4(final,1.0);
        }`,
      side: THREE.DoubleSide,
    })
    vinylGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.07, 128, 1), discMat))

    const glowRingMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        varying vec2 vUv; uniform float uTime;
        void main(){
          float t=vUv.x+uTime*0.06; float b=pow(sin(t*3.14159*10.0)*0.5+0.5,5.0);
          vec3 col=mix(vec3(0.0,1.0,0.5),vec3(0.1,0.5,1.0),sin(t*3.0)*0.5+0.5);
          gl_FragColor=vec4(col*(0.4+b*1.8),0.55+b*0.45);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    vinylGroup.add(new THREE.Mesh(new THREE.TorusGeometry(2.32, 0.045, 8, 180), glowRingMat))

    /* ── RIPPLE RINGS ── */
    const ripples = []
    for (let i = 0; i < 7; i++) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uIdx: { value: i } },
        vertexShader: `
          varying vec2 vUv; uniform float uTime; uniform float uIdx;
          void main(){
            vUv=uv; vec3 p=position;
            p+=normal*sin(uv.x*3.14159*16.0-uTime*3.0+uIdx*1.1)*(0.09-uIdx*0.01);
            gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
          }`,
        fragmentShader: `
          varying vec2 vUv; uniform float uTime; uniform float uIdx;
          void main(){
            float a=pow(sin(vUv.x*3.14159*12.0-uTime*0.05*uIdx)*0.5+0.5,4.0);
            vec3 col=mix(vec3(0.0,0.9,0.45),vec3(0.0,0.45,0.9),uIdx/7.0);
            gl_FragColor=vec4(col,a*(1.0-uIdx/7.0)*0.65);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(2.7 + i * 0.55, 0.013 - i * 0.001, 4, 180), mat)
      vinylGroup.add(mesh)
      ripples.push(mesh)
    }

    /* ── EQ BARS ── */
    const eqBars = []
    const BAR_N = 40
    for (let i = 0; i < BAR_N; i++) {
      const angle = (i / BAR_N) * Math.PI * 2
      const col = new THREE.Color().setHSL(0.37 - (i / BAR_N) * 0.22, 0.95, 0.52)
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.75 })
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1, 0.09), mat)
      bar.position.set(Math.cos(angle) * 4.1, 0, Math.sin(angle) * 4.1)
      bar.lookAt(0, 0, 0)
      bar.userData = { phase: Math.random() * Math.PI * 2, baseH: 0.25 + Math.random() * 0.8 }
      scene.add(bar)
      eqBars.push(bar)
    }

    /* ── SPEAKER CONE ── */
    const conePoints = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      conePoints.push(new THREE.Vector2((0.15 + t * 0.85) * (1 + Math.pow(t, 1.5) * 0.3), t * 1.2))
    }
    const speakerMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vPos; varying vec3 vNorm; uniform float uTime;
        void main(){
          vPos=position; vNorm=normalize(normalMatrix*normal);
          vec3 p=position; p.y+=sin(uTime*8.0)*0.012*smoothstep(0.0,1.0,length(position.xz));
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
        }`,
      fragmentShader: `
        varying vec3 vPos; varying vec3 vNorm; uniform float uTime;
        void main(){
          float r=length(vPos.xz); float rings=sin(r*14.0)*0.5+0.5;
          vec3 col=mix(vec3(0.02,0.06,0.04),mix(vec3(0.0,0.75,0.38),vec3(0.0,0.4,0.8),rings),rings*0.55);
          float rim=pow(1.0-abs(dot(vNorm,vec3(0.,0.,1.))),3.0);
          col+=vec3(0.0,1.0,0.5)*rim*0.6*(sin(uTime*4.0)*0.3+0.7);
          gl_FragColor=vec4(col,0.88);
        }`,
      transparent: true, side: THREE.DoubleSide,
    })
    const speaker = new THREE.Mesh(new THREE.LatheGeometry(conePoints, 48), speakerMat)
    speaker.position.set(3.8, 0, -1); speaker.rotation.z = -Math.PI / 2; speaker.rotation.y = 0.4
    scene.add(speaker)
    const surround = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.06, 12, 80),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.35 })
    )
    surround.position.copy(speaker.position); surround.rotation.y = 0.4
    scene.add(surround)

    /* ── WAVEFORM ── */
    const waveMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv; uniform float uTime;
        void main(){
          vUv=uv; vec3 p=position;
          p.y+=sin(p.x*2.8+uTime*2.2)*0.35+sin(p.x*6.0-uTime*3.5)*0.18+sin(p.x*11.0+uTime*1.8)*0.08;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
        }`,
      fragmentShader: `
        varying vec2 vUv; uniform float uTime;
        void main(){
          float yf=1.0-abs(vUv.y-0.5)*2.0;
          vec3 col=mix(vec3(0.0,1.0,0.5),vec3(0.0,0.5,1.0),vUv.x+sin(uTime*0.3)*0.15);
          gl_FragColor=vec4(col,sin(vUv.x*3.14159)*yf*0.5);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })
    const waveRibbon = new THREE.Mesh(new THREE.PlaneGeometry(18, 1.4, 140, 1), waveMat)
    waveRibbon.rotation.x = -Math.PI / 2; waveRibbon.position.y = -2.9
    scene.add(waveRibbon)

    /* ── GRID FLOOR ── */
    const gridMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vD=length(position.xz); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        varying vec2 vUv; varying float vD; uniform float uTime;
        void main(){
          vec2 g=abs(fract(vUv*22.0-0.5)-0.5)/fwidth(vUv*22.0);
          float line=1.0-min(min(g.x,g.y),1.0);
          float pulse=pow(sin(vD*1.1-uTime*2.8)*0.5+0.5,5.0)*(1.0-smoothstep(7.0,20.0,vD));
          float fade=1.0-smoothstep(3.0,18.0,vD);
          vec3 col=mix(vec3(0.0,0.7,0.35),vec3(0.9,0.65,0.0),pulse);
          gl_FragColor=vec4(col,(line*0.28+pulse*0.35)*fade);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    })
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 44, 44), gridMat)
    grid.rotation.x = -Math.PI / 2; grid.position.y = -2.9
    scene.add(grid)

    /* ── FLOATING NOTES ── */
    const notes = []
    for (let i = 0; i < 16; i++) {
      const g = new THREE.Group()
      const col = [0x00ff88, 0x00aaff, 0xffaa00][i % 3]
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 + Math.random() * 0.35 })
      const head = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.055, 8, 22), mat)
      head.rotation.x = Math.PI / 2; g.add(head)
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.45, 6), mat)
      stem.position.set(0.13, 0.21, 0); g.add(stem)
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.03), mat)
      flag.position.set(0.2, 0.38, 0); g.add(flag)
      const θ = Math.random() * Math.PI * 2, r = 4.5 + Math.random() * 3.5
      g.position.set(Math.cos(θ) * r, (Math.random() - 0.5) * 5.5, Math.sin(θ) * r)
      g.rotation.z = (Math.random() - 0.5) * 0.5
      g.userData = { baseY: g.position.y, speed: 0.28 + Math.random() * 0.55, phase: Math.random() * Math.PI * 2, rs: (Math.random() - 0.5) * 0.45 }
      scene.add(g); notes.push(g)
    }

    /* ── PARTICLES ── */
    const N = 750
    const pp = new Float32Array(N * 3), ps = new Float32Array(N), ph = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const r = 5 + Math.random() * 11, θ = Math.random() * Math.PI * 2, φ = Math.acos(2 * Math.random() - 1)
      pp[i*3] = r*Math.sin(φ)*Math.cos(θ); pp[i*3+1] = r*Math.sin(φ)*Math.sin(θ); pp[i*3+2] = r*Math.cos(φ)
      ps[i] = 0.7 + Math.random() * 2.5; ph[i] = Math.random() * Math.PI * 2
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3))
    pGeo.setAttribute('aSize',    new THREE.BufferAttribute(ps, 1))
    pGeo.setAttribute('aPhase',   new THREE.BufferAttribute(ph, 1))
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aSize; attribute float aPhase; uniform float uTime; varying float vA;
        void main(){ vA=sin(uTime*0.55+aPhase)*0.3+0.65; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*(390.0/-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `
        varying float vA;
        void main(){ vec2 uv=gl_PointCoord-0.5; if(length(uv)>0.5)discard; float a=smoothstep(0.5,0.05,length(uv)); gl_FragColor=vec4(0.2,0.9,0.55,a*vA*0.5); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    scene.add(new THREE.Points(pGeo, pMat))

    /* ── MOUSE / ANIMATE ── */
    const mouse = { x: 0, y: 0 }
    const onMouse = e => { mouse.x = (e.clientX/W-0.5)*2; mouse.y = -(e.clientY/H-0.5)*2 }
    window.addEventListener('mousemove', onMouse)

    let raf; const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      discMat.uniforms.uTime.value = t; glowRingMat.uniforms.uTime.value = t
      speakerMat.uniforms.uTime.value = t; waveMat.uniforms.uTime.value = t
      gridMat.uniforms.uTime.value = t; pMat.uniforms.uTime.value = t
      ripples.forEach(r => { r.material.uniforms.uTime.value = t })

      vinylGroup.rotation.y = t * 0.52
      vinylGroup.rotation.x = mouse.y * 0.08
      vinylGroup.rotation.z = -mouse.x * 0.05

      const beat = Math.abs(Math.sin(t * 2.4))
      speaker.scale.setScalar(1 + beat * 0.018)
      surround.material.opacity = 0.25 + beat * 0.4

      eqBars.forEach(b => {
        const bv = Math.abs(Math.sin(t * 2.6 + b.userData.phase))
        b.scale.y = b.userData.baseH * (0.3 + bv * 1.6)
        b.material.opacity = 0.25 + bv * 0.65
      })

      notes.forEach(n => {
        n.position.y = n.userData.baseY + Math.sin(t * n.userData.speed + n.userData.phase) * 0.65
        n.rotation.y += n.userData.rs * 0.012
        n.rotation.z = Math.sin(t * 0.45 + n.userData.phase) * 0.28
      })

      ptGreen.intensity = 70 + Math.sin(t * 2.0) * 22
      ptBlue.intensity  = 50 + Math.sin(t * 1.4 + 1) * 16

      camera.position.x += (-1.8 + mouse.x * 1.4 - camera.position.x) * 0.03
      camera.position.y += (0.5  + mouse.y * 0.9 - camera.position.y) * 0.03
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => { const w=window.innerWidth,h=window.innerHeight; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix() }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', onResize); renderer.dispose() }
  }, [])
}

export default function App() {
  const canvasRef = useRef(null)
  const cd = useCountdown()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  useScene(canvasRef)

  const pad = n => String(n).padStart(2, '0')
  const submit = async e => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'music' }),
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
      <div className="overlay" />

      <nav className="nav">
        <a href="http://localhost:5173" className="nav-back">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          AURA
        </a>
        <div className="nav-logo">
          <span className="logo-ic">♫</span>
          AURA MUSIC
        </div>
        <div className="nav-badge">
          <span className="badge-dot" />
          IN DEVELOPMENT
        </div>
      </nav>

      <main className="main">
        <div className="left">
          <div className="eyebrow">
            <span className="ey-dash" />
            STREAMING PLATFORM · 2025
          </div>

          <h1 className="hero">
            <span className="h-coming">COMING</span>
            <span className="h-row2">
              <span className="h-soon">SOON</span>
              <span className="h-note">♪</span>
            </span>
          </h1>

          <p className="tagline">
            Lossless audio. Intelligent discovery.<br />
            <em>Every beat, perfectly delivered.</em>
          </p>

          <div className="cd">
            {[{v:pad(cd.d),l:'DAYS'},{v:pad(cd.h),l:'HRS'},{v:pad(cd.m),l:'MIN'},{v:pad(cd.s),l:'SEC'}].map(({v,l})=>(
              <div key={l} className="cd-cell">
                <span className="cd-val">{v}</span>
                <span className="cd-lbl">{l}</span>
              </div>
            ))}
          </div>

          {!sent ? (
            <form className="form" onSubmit={submit}>
              <div className="form-row">
                <input className="form-in" type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
                <button type="submit" className="form-btn" disabled={loading}>{loading ? '...' : 'NOTIFY ME'}</button>
              </div>
              <p className="form-hint">Early listener access. No spam, ever.</p>
              {error && <p className="form-hint" style={{color:'#ff6b6b'}}>{error}</p>}
            </form>
          ) : (
            <div className="sent">
              <span className="sent-ic">♫</span>
              <span>You're on the list — we'll reach out soon.</span>
            </div>
          )}

          <ul className="feats">
            {[['▸','Hi-fi lossless & spatial audio'],['▸','AI-curated playlists & mood radio'],['▸','Artist-first royalty model'],['▸','Offline listening & cross-device sync']].map(([ic,txt])=>(
              <li key={txt} className="feat"><span className="feat-ic">{ic}</span>{txt}</li>
            ))}
          </ul>
        </div>

        <div className="vtag">
          <span className="vtag-txt">AURA MUSIC ENGINE v1.0</span>
          <span className="vtag-line" />
        </div>
      </main>

      <footer className="foot">
        <span>© 2025 AURA PLATFORM INC.</span>
        <div className="foot-links">
          <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a>
        </div>
      </footer>
    </div>
  )
}