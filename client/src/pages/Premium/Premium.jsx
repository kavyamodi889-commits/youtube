// FILE: client/src/pages/Premium/Premium.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext.jsx'
import './Premium.css'

// ── ICONS ──────────────────────────────────────────────────────────
const StarIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
const CheckIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const XIcon        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const ShieldIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const ZapIcon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const DownloadIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const MusicIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
const VideoIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
const UsersIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const GlobeIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
const ArrowIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const InfoIcon     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const SparkIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>

// ── PLAN DATA ──────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free', name: 'Free', planId: null,
    price: { monthly: 0, yearly: 0 }, badge: null,
    desc: 'The AURA experience, always free.', color: 'free',
    cta: 'Free Plan', ctaStyle: 'ghost',
    features: [
      { label: 'Watch videos with ads',          ok: true  },
      { label: 'Standard 1080p quality',         ok: true  },
      { label: 'AURA Shorts',                    ok: true  },
      { label: 'Ad-free viewing',                ok: false },
      { label: 'Background play',                ok: false },
      { label: 'Offline downloads',              ok: false },
      { label: 'AURA Music included',            ok: false },
      { label: '4K Ultra HD',                    ok: false },
      { label: 'Exclusive content',              ok: false },
      { label: 'Family sharing (6 members)',     ok: false },
    ],
  },
  {
    id: 'premium', name: 'Premium',
    planId: { monthly: 'premium_monthly', yearly: 'premium_yearly' },
    price: { monthly: 149, yearly: 1190 }, badge: 'Most Popular',
    desc: 'The full AURA experience. Zero limits.', color: 'premium',
    cta: 'Get Premium', ctaStyle: 'gradient',
    features: [
      { label: 'Watch videos with ads',          ok: true  },
      { label: 'Standard 1080p quality',         ok: true  },
      { label: 'AURA Shorts',                    ok: true  },
      { label: 'Ad-free viewing',                ok: true  },
      { label: 'Background play',                ok: true  },
      { label: 'Offline downloads',              ok: true  },
      { label: 'AURA Music included',            ok: true  },
      { label: '4K Ultra HD',                    ok: true  },
      { label: 'Exclusive content',              ok: false },
      { label: 'Family sharing (6 members)',     ok: false },
    ],
  },
  {
    id: 'ultra', name: 'Ultra',
    planId: { monthly: 'ultra_monthly', yearly: 'ultra_yearly' },
    price: { monthly: 249, yearly: 1990 }, badge: 'All Inclusive',
    desc: 'Premium + family + exclusive perks.', color: 'ultra',
    cta: 'Go Ultra', ctaStyle: 'gold',
    features: [
      { label: 'Watch videos with ads',          ok: true  },
      { label: 'Standard 1080p quality',         ok: true  },
      { label: 'AURA Shorts',                    ok: true  },
      { label: 'Ad-free viewing',                ok: true  },
      { label: 'Background play',                ok: true  },
      { label: 'Offline downloads',              ok: true  },
      { label: 'AURA Music included',            ok: true  },
      { label: '4K Ultra HD',                    ok: true  },
      { label: 'Exclusive content',              ok: true  },
      { label: 'Family sharing (6 members)',     ok: true  },
    ],
  },
]

const PERKS = [
  { icon: <ZapIcon />,      title: 'Zero Ads',         desc: 'Watch everything without a single interruption. Ever.' },
  { icon: <DownloadIcon />, title: 'Offline Mode',      desc: 'Download videos and watch anywhere, even without internet.' },
  { icon: <MusicIcon />,    title: 'AURA Music',        desc: 'Full access to 80M+ songs. Background play included.' },
  { icon: <VideoIcon />,    title: '4K Ultra HD',       desc: 'Every video in the highest quality your screen can display.' },
  { icon: <ShieldIcon />,   title: 'Background Play',   desc: 'Keep audio playing when you switch apps or lock your screen.' },
  { icon: <UsersIcon />,    title: 'Family Sharing',    desc: 'Share Ultra with up to 6 family members at no extra cost.' },
  { icon: <GlobeIcon />,    title: 'Exclusive Content', desc: 'AURA Originals, early access, and creator-only drops.' },
  { icon: <SparkIcon />,    title: 'Priority Support',  desc: '24/7 dedicated support — issues resolved in under 1 hour.' },
]

const FAQS = [
  { q: 'Is there a free trial?',            a: 'Yes! AURA Premium comes with a 30-day free trial. No charges until the trial ends and you can cancel anytime.' },
  { q: 'Can I cancel anytime?',             a: 'Absolutely. Cancel from your account settings at any time. You keep access until the end of your billing period.' },
  { q: 'Can I earn Premium for free?',      a: 'Yes! Complete 100 thirty-minute focus sessions in one calendar month and get 1 month of Premium free. Complete 100 one-hour sessions in a month and earn 1 month of Ultra free. Rewards activate automatically — no code needed.' },
  { q: 'What is AURA Music?',               a: 'AURA Music is a full music streaming service included with Premium and Ultra plans — 80M+ songs, ad-free, with offline and background play.' },
  { q: 'How does family sharing work?',     a: 'Ultra subscribers can invite up to 5 additional family members. Each person gets their own account with full Ultra features.' },
  { q: 'What devices are supported?',       a: 'AURA works on all devices — web, iOS, Android, Smart TVs, and game consoles. Sign in once, enjoy everywhere.' },
  { q: 'Is 4K available on all videos?',    a: '4K requires the creator to upload in 4K. Premium unlocks playback up to the highest available quality for every video.' },
]

// ── Load Razorpay script ────────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

// ── FAQ Item ────────────────────────────────────────────────────────
function FaqItem({ item, index }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div className={`faq-item ${open ? 'faq-open' : ''}`}
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: index*0.06 }}>
      <button className="faq-q" onClick={() => setOpen(o => !o)}>
        <span>{item.q}</span>
        <motion.span className="faq-arrow" animate={{ rotate: open ? 90 : 0 }}
          transition={{ type:'spring', stiffness:320, damping:26 }}>
          <ArrowIcon />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="faq-a"
            initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ type:'spring', stiffness:320, damping:30 }}>
            <p>{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Success Modal ───────────────────────────────────────────────────
function SuccessModal({ plan, onClose }) {
  const isUltra = plan?.id === 'ultra'
  const perks = isUltra
    ? ['Ad-free viewing', '4K Ultra HD', 'AURA Music', 'Offline downloads', 'Family sharing', 'Exclusive content']
    : ['Ad-free viewing', '4K Ultra HD', 'AURA Music', 'Offline downloads', 'Background play']

  return (
    <motion.div className="prem-modal-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className={`prem-modal prem-modal-${plan?.id}`}
        initial={{ opacity: 0, scale: 0.88, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 32 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        onClick={e => e.stopPropagation()}>

        {/* Animated glow background */}
        <div className="prem-modal-glow" />

        {/* Top badge */}
        <div className={`prem-modal-badge ${isUltra ? 'badge-ultra' : 'badge-premium'}`}>
          <StarIcon /> {isUltra ? 'AURA ULTRA' : 'AURA PREMIUM'}
        </div>

        {/* Emoji + confetti */}
        <div className="prem-modal-emoji">
          {isUltra ? '👑' : '⭐'}
        </div>

        <h2 className="prem-modal-title">
          Welcome to<br />
          <span className={isUltra ? 'modal-ultra-text' : 'modal-premium-text'}>
            AURA {plan?.name}!
          </span>
        </h2>

        <p className="prem-modal-sub">
          Your subscription is now active. Here's what you unlocked:
        </p>

        {/* Unlocked perks */}
        <div className="prem-modal-perks">
          {perks.map((p, i) => (
            <motion.div key={p} className="prem-modal-perk"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}>
              <span className="prem-perk-check">✓</span>
              {p}
            </motion.div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="prem-modal-actions">
          <motion.button
            className={`prem-modal-btn-primary ${isUltra ? 'btn-ultra' : 'btn-premium'}`}
            onClick={onClose}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            Start Watching →
          </motion.button>
          <button className="prem-modal-btn-secondary" onClick={onClose}>
            Maybe later
          </button>
        </div>

        {/* Fine print */}
        <p className="prem-modal-fine">
          Subscription active · Cancel anytime from Settings
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────
export default function Premium() {
  const { user } = useAuth()   // setUser not needed — status loaded fresh from API
  const navigate  = useNavigate()
  const [billing,   setBilling]   = useState('monthly')
  const [paying,    setPaying]    = useState(null)  // planId being paid
  const [subStatus, setSubStatus] = useState(null)  // { tier, expiresAt, isActive }
  const [success,   setSuccess]   = useState(null)  // plan that was just purchased
  const [error,     setError]     = useState('')
  const [focusRewards, setFocusRewards] = useState(null) // monthly focus reward progress

  // Load current subscription status (now also returns focusRewards)
  useEffect(() => {
    if (!user) return
    api.get('/payments/status').then(r => {
      setSubStatus(r.data)
      if (r.data.focusRewards) setFocusRewards(r.data.focusRewards)
    }).catch(() => {})
  }, [user])

  const handleSubscribe = async (plan) => {
    if (!user) { navigate('/auth'); return }
    if (plan.id === 'free') return

    const planId = plan.planId[billing]
    setPaying(planId)
    setError('')

    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript()
      if (!loaded) { setError('Failed to load Razorpay. Check your connection.'); setPaying(null); return }

      // Create order on server
      const r = await api.post('/payments/create-order', { planId })
      const { order, key } = r.data

      // Open Razorpay checkout
      const options = {
        key,
        amount:      order.amount,
        currency:    order.currency,
        name:        'AURA',
        description: r.data.plan.label,
        order_id:    order.id,
        notes:       { plan: r.data.plan.label },
        prefill: {
          name:    user.displayName || user.username,
          email:   user.email,
          contact: '9999999999',
        },
        theme: { color: '#b5294e' },
        handler: async (response) => {
          // Verify payment on server
          try {
            const verify = await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              planId,
            })
            if (verify.data.success) {
              // Update local subscription status
              setSubStatus({ tier: verify.data.user.membershipTier, expiresAt: verify.data.user.membershipExpiresAt, isActive: true })
              setSuccess(plan)
            }
          } catch {
            setError('Payment verification failed. Contact support if money was deducted.')
          } finally {
            setPaying(null)
          }
        },
        modal: {
          ondismiss: () => setPaying(null),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        setError(`Payment failed: ${resp.error.description}`)
        setPaying(null)
      })
      rzp.open()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
      setPaying(null)
    }
  }

  const saving = plan => {
    if (!plan.price.yearly || plan.price.monthly === 0) return null
    const annualMonthly = plan.price.monthly * 12
    const saved = annualMonthly - plan.price.yearly
    return Math.round((saved / annualMonthly) * 100)
  }

  const isCurrentPlan = (plan) => {
    if (plan.id === 'free') return !subStatus?.isActive   // free only when no active paid sub
    if (!subStatus?.isActive) return false                 // paid plans never current if no active sub
    return subStatus.tier === plan.id                      // match exact tier
  }

  const getCtaLabel = (plan) => {
    if (isCurrentPlan(plan)) return '✓ Current Plan'
    if (paying === plan.planId?.[billing]) return 'Opening payment…'
    return plan.cta
  }

  return (
    <div className="premium-page">

      {/* ── HERO ── */}
      <div className="prem-hero">
        <motion.div className="prem-hero-glow"
          animate={{ opacity:[0.4,0.7,0.4], scale:[1,1.08,1] }}
          transition={{ duration:5, repeat:Infinity, ease:'easeInOut' }} />

        <motion.div className="prem-hero-content"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ type:'spring', stiffness:280, damping:26 }}>
          <div className="prem-eyebrow"><StarIcon /> AURA Premium</div>
          <h1 className="prem-title">
            The best of AURA.<br />
            <span className="prem-title-accent">Without limits.</span>
          </h1>
          <p className="prem-subtitle">
            Ad-free videos, offline downloads, 4K Ultra HD, AURA Music,<br/>
            background play — all in one subscription.
          </p>

          {/* Active subscription banner */}
          {subStatus?.isActive && (
            <motion.div className="prem-active-banner"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
              <StarIcon />
              You're on <strong>AURA {subStatus.tier.charAt(0).toUpperCase() + subStatus.tier.slice(1)}</strong>
              {subStatus.expiresAt && ` · Renews ${new Date(subStatus.expiresAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}`}
            </motion.div>
          )}
        </motion.div>

        {/* Billing toggle */}
        <motion.div className="billing-toggle-wrap"
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.15, type:'spring', stiffness:280, damping:26 }}>
          <div className="billing-toggle">
            <button className={`billing-opt ${billing==='monthly'?'billing-active':''}`}
              onClick={() => setBilling('monthly')}>Monthly</button>
            <button className={`billing-opt ${billing==='yearly'?'billing-active':''}`}
              onClick={() => setBilling('yearly')}>Yearly</button>
            <motion.div className="billing-slider"
              animate={{ x: billing==='monthly' ? 0 : '100%' }}
              transition={{ type:'spring', stiffness:400, damping:32 }} />
          </div>
          <span className="billing-save-tag">Save up to 20%</span>
        </motion.div>

      </div>{/* end .prem-hero */}

      {error && (
        <div className="prem-error">⚠️ {error}</div>
      )}

      {/* ── PLANS ── */}
      <div className="plans-row">
        {PLANS.map((plan, i) => {
          const price   = billing==='monthly' ? plan.price.monthly : plan.price.yearly
          const savePct = saving(plan)
          const isCurrent = isCurrentPlan(plan)
          const isLoading = paying === plan.planId?.[billing]

          return (
            <motion.div key={plan.id}
              className={`plan-card plan-${plan.color} ${plan.id==='premium'?'plan-featured':''} ${isCurrent?'plan-current':''}`}
              initial={{ opacity:0, y:28, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
              transition={{ type:'spring', stiffness:280, damping:24, delay:i*0.1 }}
              whileHover={{ y: isCurrent ? 0 : -6 }}>

              {plan.badge && <div className={`plan-badge plan-badge-${plan.color}`}>{plan.badge}</div>}
              {isCurrent && <div className="plan-current-badge">✓ Active</div>}

              <div className="plan-top">
                <div className="plan-name-row">
                  <span className="plan-name">{plan.name}</span>
                  {plan.id !== 'free' && <span className={`plan-icon plan-icon-${plan.color}`}><StarIcon /></span>}
                </div>
                <p className="plan-desc">{plan.desc}</p>

                <div className="plan-price-row">
                  {price === 0 ? (
                    <span className="plan-price-free">Free</span>
                  ) : (
                    <>
                      <span className="plan-currency">₹</span>
                      <span className="plan-price-num">{price.toLocaleString('en-IN')}</span>
                      <span className="plan-price-period">/{billing==='monthly'?'mo':'yr'}</span>
                    </>
                  )}
                  {billing==='yearly' && savePct && (
                    <span className="plan-save-badge">−{savePct}%</span>
                  )}
                </div>

                {billing==='yearly' && plan.price.monthly > 0 && (
                  <div className="plan-equiv">≈ ₹{Math.round(plan.price.yearly/12)}/month</div>
                )}
              </div>

              <motion.button
                className={`plan-cta plan-cta-${isCurrent?'ghost':plan.ctaStyle}`}
                disabled={isCurrent || isLoading}
                onClick={() => handleSubscribe(plan)}
                whileHover={{ scale: isCurrent||isLoading ? 1 : 1.03 }}
                whileTap={{   scale: isCurrent||isLoading ? 1 : 0.96 }}
              >
                {isLoading ? (
                  <span className="prem-spinner"/>
                ) : (
                  <>{getCtaLabel(plan)} {!isCurrent && plan.ctaStyle!=='ghost' && <ArrowIcon />}</>
                )}
              </motion.button>

              <div className="plan-features">
                {plan.features.map((f, fi) => (
                  <div key={fi} className={`plan-feature ${f.ok?'feat-ok':'feat-no'}`}>
                    <span className="feat-icon">{f.ok ? <CheckIcon /> : <XIcon />}</span>
                    <span className="feat-label">{f.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── PERKS GRID ── */}
      <motion.section className="perks-section"
        initial={{ opacity:0 }} whileInView={{ opacity:1 }}
        viewport={{ once:true }} transition={{ duration:0.5 }}>
        <div className="section-header">
          <h2 className="section-title">Everything included</h2>
          <p className="section-sub">Every Premium feature, explained.</p>
        </div>
        <div className="perks-grid">
          {PERKS.map((p, i) => (
            <motion.div key={i} className="perk-card"
              initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay:i*0.06, type:'spring', stiffness:280, damping:24 }}
              whileHover={{ y:-4 }}>
              <div className="perk-icon">{p.icon}</div>
              <div className="perk-title">{p.title}</div>
              <div className="perk-desc">{p.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── FOCUS REWARD SECTION ── */}
      <motion.section className="focus-earn-section"
        initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }} transition={{ type:'spring', stiffness:260, damping:26 }}>
        <div className="section-header">
          <div className="focus-earn-eyebrow">🎯 Focus & Earn</div>
          <h2 className="section-title">Get Premium for Free</h2>
          <p className="section-sub">Use Focus Mode to earn free subscriptions — the more you focus, the more you unlock.</p>
        </div>

        <div className="focus-earn-cards">
          {/* Premium card */}
          <motion.div className="focus-earn-card fec-premium"
            whileHover={{ y:-4 }} transition={{ type:'spring', stiffness:340, damping:28 }}>
            <div className="fec-glow fec-glow-premium" />
            <div className="fec-top">
              <span className="fec-emoji">⭐</span>
              <span className="fec-badge fec-badge-premium">AURA Premium</span>
            </div>
            <div className="fec-goal">
              Complete <strong>100 × 30-minute</strong> focus sessions in a single calendar month
            </div>
            <div className="fec-reward">→ Get 1 month Premium <em>absolutely free</em></div>

            {/* Progress bar if user is logged in */}
            {focusRewards && (
              <div className="fec-progress-wrap">
                <div className="fec-progress-top">
                  <span>{focusRewards.premiumRewardClaimed ? '✓ Claimed this month!' : `${focusRewards.count30} / 100 sessions`}</span>
                </div>
                <div className="fec-bar-track">
                  <motion.div className="fec-bar-fill fec-bar-premium"
                    initial={{ width:0 }}
                    animate={{ width: focusRewards.premiumRewardClaimed ? '100%' : `${focusRewards.count30}%` }}
                    transition={{ duration:1, ease:'easeOut' }} />
                </div>
              </div>
            )}

            <div className="fec-footer">
              <button className="fec-cta" onClick={() => navigate('/focus')}>Start a Session →</button>
            </div>
          </motion.div>

          {/* Ultra card */}
          <motion.div className="focus-earn-card fec-ultra"
            whileHover={{ y:-4 }} transition={{ type:'spring', stiffness:340, damping:28 }}>
            <div className="fec-glow fec-glow-ultra" />
            <div className="fec-top">
              <span className="fec-emoji">👑</span>
              <span className="fec-badge fec-badge-ultra">AURA Ultra</span>
            </div>
            <div className="fec-goal">
              Complete <strong>100 × 1-hour</strong> focus sessions in a single calendar month
            </div>
            <div className="fec-reward">→ Get 1 month Ultra <em>absolutely free</em></div>

            {focusRewards && (
              <div className="fec-progress-wrap">
                <div className="fec-progress-top">
                  <span>{focusRewards.ultraRewardClaimed ? '✓ Claimed this month!' : `${focusRewards.count60} / 100 sessions`}</span>
                </div>
                <div className="fec-bar-track">
                  <motion.div className="fec-bar-fill fec-bar-ultra"
                    initial={{ width:0 }}
                    animate={{ width: focusRewards.ultraRewardClaimed ? '100%' : `${focusRewards.count60}%` }}
                    transition={{ duration:1, ease:'easeOut', delay:0.1 }} />
                </div>
              </div>
            )}

            <div className="fec-footer">
              <button className="fec-cta fec-cta-ultra" onClick={() => navigate('/focus')}>Start a Session →</button>
            </div>
          </motion.div>
        </div>

        <p className="focus-earn-note">
          ✦ Rewards reset each month · Sessions must be fully completed · Automatically applied — no code needed
        </p>
      </motion.section>

      {/* ── TRIAL BANNER ── */}
      <motion.div className="trial-banner"
        initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }} transition={{ type:'spring', stiffness:280, damping:26 }}>
        <div className="tb-glow" />
        <div className="tb-content">
          <div className="tb-star"><StarIcon /></div>
          <div className="tb-text">
            <div className="tb-title">Try Premium free for 30 days</div>
            <div className="tb-sub">No commitment. Cancel anytime before your trial ends.</div>
          </div>
          <motion.button className="tb-cta"
            whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={() => handleSubscribe(PLANS[1])}>
            Start Free Trial <ArrowIcon />
          </motion.button>
        </div>
      </motion.div>

      {/* ── FAQ ── */}
      <motion.section className="faq-section"
        initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
        <div className="section-header">
          <h2 className="section-title">Frequently asked</h2>
          <p className="section-sub">Everything you need to know about AURA Premium.</p>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => <FaqItem key={i} item={f} index={i} />)}
        </div>
      </motion.section>

      {/* ── FOOTNOTE ── */}
      <div className="prem-footnote">
        <InfoIcon />
        Prices shown in Indian Rupees (INR). GST may apply. Powered by Razorpay. Test mode — use card 4111 1111 1111 1111.
      </div>

      {/* ── SUCCESS MODAL ── */}
      <AnimatePresence>
        {success && <SuccessModal plan={success} onClose={() => { setSuccess(null); navigate('/') }} />}
      </AnimatePresence>

    </div>
  )
}