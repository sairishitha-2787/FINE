import { useNavigate } from 'react-router-dom'
import { useRef, useCallback } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion'

// ─── Data ────────────────────────────────────────────────────────────────────

const cards = [
  { title: 'TRACK MOODS',   body: 'See which emotions trigger your spending' },
  { title: 'FIND PATTERNS', body: 'Discover your emotional spending habits' },
  { title: 'BREAK CYCLES',  body: 'Get nudged before you overspend' },
]

// ─── FINEHeroVisual ───────────────────────────────────────────────────────────

function FINEHeroVisual() {
  const containerRef = useRef(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)

  const tiltX = useTransform(rotateX, [-1, 1], [10, -10])
  const tiltY = useTransform(rotateY, [-1, 1], [-10, 10])

  const handleMouseMove = useCallback((e) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    rotateX.set((e.clientY - cy) / (rect.height / 2))
    rotateY.set((e.clientX - cx) / (rect.width / 2))
  }, [rotateX, rotateY])

  const handleMouseLeave = useCallback(() => {
    animate(rotateX, 0, { duration: 0.5 })
    animate(rotateY, 0, { duration: 0.5 })
  }, [rotateX, rotateY])

  // SVG path for the spending wave
  const spendingPath = 'M 10 150 Q 60 80 110 120 Q 160 160 210 90 Q 255 30 290 70'

  // Dot markers along the path (key spend moments)
  const dotPoints = [
    { cx: 110, cy: 120 },
    { cx: 210, cy: 90  },
    { cx: 290, cy: 70  },
    { cx: 60,  cy: 100 },
  ]

  // Mood pixel elements
  const moodElements = [
    { char: '⚡', color: '#ea6890', size: '32px', top: '4%',  left: '4%',  duration: 3.5, delay: 0   },
    { char: '★', color: '#efe3ff', size: '28px', top: '2%',  left: '74%', duration: 4,   delay: 0.5 },
    { char: '☽', color: '#a89bc4', size: '30px', top: '72%', left: '2%',  duration: 5,   delay: 1   },
    { char: '!', color: '#ea6890', size: '36px', top: '42%', left: '88%', duration: 3,   delay: 1.5 },
    { char: '▼', color: '#292451', size: '28px', top: '78%', left: '78%', duration: 4.5, delay: 0.8 },
  ]

  // Connection lines from mood elements to graph points
  const connectionLines = [
    { x1: 30,  y1: 30,  x2: 110, y2: 120, delay: 0   },
    { x1: 270, y1: 20,  x2: 210, y2: 90,  delay: 1.2 },
  ]

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '360px',
        height: '340px',
        perspective: '1000px',
        rotateX: tiltX,
        rotateY: tiltY,
        flexShrink: 0,
      }}
    >
      {/* Ambient glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px', height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,155,196,0.2), transparent)',
          filter: 'blur(40px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Connection lines SVG */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'visible' }}
        viewBox="0 0 360 340"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#ea6890" />
            <stop offset="100%" stopColor="#a89bc4" />
          </linearGradient>
        </defs>
        {connectionLines.map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke="#a89bc4"
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: line.delay, ease: 'easeInOut' }}
          />
        ))}
      </svg>

      {/* Spending graph SVG */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
        }}
      >
        <svg width="300" height="200" viewBox="0 0 300 200" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="graphGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#ea6890" />
              <stop offset="100%" stopColor="#a89bc4" />
            </linearGradient>
          </defs>

          {/* Grid lines (subtle) */}
          {[50, 100, 150].map(y => (
            <line key={y} x1="0" y1={y} x2="300" y2={y}
              stroke="#a89bc4" strokeWidth="0.5" strokeOpacity="0.15" />
          ))}
          {[75, 150, 225].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="200"
              stroke="#a89bc4" strokeWidth="0.5" strokeOpacity="0.15" />
          ))}

          {/* The spending wave */}
          <motion.path
            d={spendingPath}
            fill="none"
            stroke="url(#graphGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1] }}
            transition={{ duration: 3, ease: 'easeOut' }}
          />
          {/* Infinite loop after draw */}
          <motion.path
            d={spendingPath}
            fill="none"
            stroke="url(#graphGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ opacity: 0 }}
            animate={{ pathLength: [0, 1, 0], opacity: [0, 0, 1, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 3, ease: 'easeInOut' }}
          />

          {/* Dot markers */}
          {dotPoints.map((pt, i) => (
            <motion.rect
              key={i}
              x={pt.cx - 5}
              y={pt.cy - 5}
              width="10"
              height="10"
              fill="#ea6890"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.7], scale: [0, 1.4, 1] }}
              transition={{ delay: 0.4 + i * 0.3, duration: 0.5 }}
            />
          ))}
        </svg>
      </motion.div>

      {/* Mini transaction cards */}
      <motion.div
        animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        style={{
          position: 'absolute',
          top: '8%', right: '2%',
          backgroundColor: '#1a1633',
          border: '1px solid rgba(168,155,196,0.4)',
          borderRadius: '4px',
          padding: '10px 14px',
          zIndex: 4,
          minWidth: '100px',
          transition: 'opacity 1s 0.5s',
        }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#efe3ff', margin: 0, fontWeight: 600 }}>₹450</p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#ea6890', margin: '5px 0 0' }}>⚡ Stressed</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        style={{
          position: 'absolute',
          bottom: '12%', left: '4%',
          backgroundColor: '#1a1633',
          border: '1px solid rgba(168,155,196,0.4)',
          borderRadius: '4px',
          padding: '10px 14px',
          zIndex: 4,
          minWidth: '100px',
          transition: 'opacity 1s 1s',
        }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#efe3ff', margin: 0, fontWeight: 600 }}>₹120</p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#a89bc4', margin: '5px 0 0' }}>★ Calm</p>
      </motion.div>

      {/* Mood pixel elements */}
      {moodElements.map((el, i) => (
        <motion.span
          key={i}
          animate={{
            y: [0, -12, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            delay: el.delay,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            top: el.top, left: el.left,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: el.size,
            color: el.color,
            zIndex: 5,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {el.char}
        </motion.span>
      ))}
    </motion.div>
  )
}

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0d0015',
      overflowX: 'hidden',
      backgroundImage: 'radial-gradient(circle, rgba(168,155,196,0.19) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    }}>

      {/* Nebula background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 70% 50% at 20% 30%, rgba(41,36,81,0.9)  0%, transparent 70%),
          radial-gradient(ellipse 50% 60% at 80% 70%, rgba(61,26,74,0.7)  0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 60% 20%, rgba(41,36,81,0.6)  0%, transparent 55%),
          radial-gradient(ellipse 60% 40% at 10% 80%, rgba(61,26,74,0.5)  0%, transparent 65%),
          #0d0015
        `,
        pointerEvents: 'none',
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '16px 32px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(13,0,21,0.4)',
        borderBottom: '1px solid rgba(168,155,196,0.2)',
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <NavButton label="Sign In" onClick={() => navigate('/login')} />
          <NavButton label="Sign Up" onClick={() => navigate('/signup')} />
        </div>
      </nav>

      {/* Hero — two-column */}
      <section style={{
        position: 'relative', zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 48px 60px',
        gap: '60px',
        flexWrap: 'wrap',
      }}>

        {/* Left column */}
        <div style={{
          flex: '1 1 340px',
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}>
          <h1 style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 'clamp(4rem, 10vw, 7rem)',
            background: 'linear-gradient(135deg, #ea6890 0%, #efe3ff 50%, #a89bc4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(4px 4px 0px #292451) drop-shadow(8px 8px 0px #1a1633)',
            lineHeight: 1.2,
            marginBottom: '1rem',
          }}>
            FINE
          </h1>

          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 300,
            color: '#a89bc4',
            fontSize: '13px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Finance Intelligent Ecosystem
          </p>

          <p style={{
            fontFamily: 'Inter, sans-serif',
            color: '#efe3ff',
            fontSize: '17px',
            fontStyle: 'italic',
            marginBottom: '48px',
            opacity: 0.7,
          }}>
            "Understand the why, not just the what."
          </p>

          {/* Feature cards */}
          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            marginBottom: '40px',
            width: '100%',
          }}>
            {cards.map((card) => (
              <div
                key={card.title}
                style={{
                  backgroundColor: '#1a1633',
                  border: '1px solid rgba(168,155,196,0.4)',
                  borderRadius: '8px',
                  padding: '24px',
                  flex: '1 1 140px',
                  minHeight: '140px',
                  textAlign: 'left',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#ea6890'
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(234,104,144,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(168,155,196,0.4)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <p className="font-pixel" style={{ color: '#ea6890', fontSize: '9px', marginBottom: '12px', lineHeight: 1.6 }}>
                  {card.title}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', color: '#efe3ff', fontSize: '15px', lineHeight: 1.6, margin: 0, opacity: 0.8 }}>
                  {card.body}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/login')}
            className="font-pixel"
            style={{
              background: 'linear-gradient(135deg, #ea6890 0%, #a89bc4 100%)',
              color: '#efe3ff',
              border: 'none',
              borderRadius: '6px',
              padding: '16px 32px',
              fontSize: '11px',
              letterSpacing: '2px',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 24px rgba(234,104,144,0.6), 0 0 48px rgba(168,155,196,0.4)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            GET STARTED →
          </button>
        </div>

        {/* Right column — hero visual */}
        <div style={{
          flex: '1 1 340px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <FINEHeroVisual />
        </div>
      </section>
    </div>
  )
}

// ─── NavButton ────────────────────────────────────────────────────────────────

function NavButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="font-pixel"
      style={{
        background: 'transparent',
        border: '1px solid rgba(168,155,196,0.4)',
        color: '#a89bc4',
        borderRadius: '4px',
        padding: '8px 14px',
        fontSize: '9px',
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = '#ea6890'
        e.currentTarget.style.borderColor = '#ea6890'
        e.currentTarget.style.boxShadow = '0 0 10px rgba(234,104,144,0.3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = '#a89bc4'
        e.currentTarget.style.borderColor = 'rgba(168,155,196,0.4)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {label}
    </button>
  )
}
