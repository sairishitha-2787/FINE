import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_BG = {
  'Brief':            '#ea6890',
  'Detailed':         '#a89bc4',
  'Visual':           'linear-gradient(135deg, #ea6890, #a89bc4)',
  'Visual + Brief':   '#d4547a',
  'Visual + Detailed':'#7b5ea7',
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ─── PixelAvatar ──────────────────────────────────────────────────────────────

function PixelAvatar({ user, size = 40 }) {
  const bg     = AVATAR_BG[user?.communication_style] ?? '#a89bc4'
  const isGrad = bg.startsWith('linear')
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg,
      backgroundImage: isGrad ? bg : undefined,
      backgroundColor: isGrad ? undefined : bg,
      border: '2px solid rgba(234,104,144,0.38)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: size * 0.25,
        color: '#fff',
        lineHeight: 1,
      }}>{getInitials(user?.name)}</span>
    </div>
  )
}

// ─── HamburgerIcon ────────────────────────────────────────────────────────────

function HamburgerIcon() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: '18px', height: '2px', backgroundColor: '#efe3ff', borderRadius: '1px' }} />
      ))}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ open, onClose, user, navigate }) {
  const navItems = [
    { label: 'Past Transactions', icon: '◈', path: '/transactions' },
    { label: 'My Patterns',       icon: '◎', path: '/patterns'     },
    { label: 'Weekly Report',     icon: '◻', path: '/report'       },
  ]

  const handleSignOut = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              backgroundColor: 'rgba(13,0,21,0.7)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              width: '280px', zIndex: 50,
              backgroundColor: '#1a1633',
              borderRight: '1px solid rgba(168,155,196,0.19)',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Profile section */}
            <div style={{ padding: '28px 24px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <PixelAvatar user={user} size={60} />
              <div>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  fontSize: '16px', color: '#efe3ff', margin: '0 0 4px',
                }}>{user?.name || '—'}</p>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '12px',
                  color: '#a89bc4', margin: '0 0 10px',
                }}>{user?.email || '—'}</p>
                {user?.communication_style && (
                  <span style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '9px', color: '#ea6890',
                    border: '1px solid rgba(234,104,144,0.38)',
                    borderRadius: '20px', padding: '4px 8px',
                  }}>{user.communication_style}</span>
                )}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(168,155,196,0.13)', margin: '0 24px' }} />

            {/* Nav items */}
            <nav style={{ padding: '8px 0', flex: 1 }}>
              {navItems.map(item => (
                <SidebarItem key={item.path} icon={item.icon} label={item.label}
                  onClick={() => { onClose(); navigate(item.path) }} />
              ))}
            </nav>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(168,155,196,0.13)', margin: '0 24px' }} />

            {/* Bottom actions */}
            <div style={{ padding: '8px 0 24px' }}>
              <SidebarItem icon="⚙" label="Settings"
                onClick={() => { onClose(); navigate('/settings') }} />
              <SidebarItem icon="⏻" label="Sign Out"
                onClick={handleSignOut} accent />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function SidebarItem({ icon, label, onClick, accent }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 24px',
        cursor: 'pointer',
        backgroundColor: hovered ? 'rgba(168,155,196,0.06)' : 'transparent',
        borderLeft: hovered ? '3px solid #ea6890' : '3px solid transparent',
        transition: 'background-color 0.15s, border-color 0.15s',
      }}
    >
      <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', opacity: 0.8 }}>{icon}</span>
      <span style={{
        fontFamily: 'Inter, sans-serif', fontSize: '14px',
        color: accent
          ? (hovered ? '#ea6890' : 'rgba(234,104,144,0.5)')
          : (hovered ? '#ea6890' : '#efe3ff'),
        transition: 'color 0.15s',
      }}>{label}</span>
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ onMenuClick, user }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      height: '60px',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      backgroundColor: 'rgba(13,0,21,0.5)',
      borderBottom: '1px solid rgba(168,155,196,0.13)',
    }}>
      <button onClick={onMenuClick} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}>
        <HamburgerIcon />
      </button>

      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '20px',
        background: 'linear-gradient(135deg, #ea6890, #efe3ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
      }}>FINE</span>

      <PixelAvatar user={user} size={38} />
    </nav>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const STEPS_COPY = [
  { num: '01', title: 'LOG A TRANSACTION', body: 'Record what you spent and how you were feeling' },
  { num: '02', title: 'TAG YOUR MOOD',     body: 'Tell FINE your emotional state when you spent'  },
  { num: '03', title: 'SEE YOUR PATTERNS', body: 'Discover which emotions drive your spending'    },
]

function EmptyState({ user, navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '0 24px',
      }}
    >
      {/* Welcome */}
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '10px', color: '#a89bc4',
        letterSpacing: '0.1em', margin: '0 0 8px',
      }}>WELCOME,</p>

      <h1 style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        background: 'linear-gradient(135deg, #ea6890, #efe3ff, #a89bc4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1.3, margin: '0 0 20px',
      }}>{user?.name?.split(' ')[0]?.toUpperCase() || 'THERE'}</h1>

      <p style={{
        fontFamily: 'Inter, sans-serif', fontSize: '16px',
        color: '#a89bc4', fontStyle: 'italic',
        margin: '0 0 40px',
      }}>Let's understand your spending.</p>

      {/* Walkthrough steps */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginBottom: '40px' }}>
        {/* Dashed connector line */}
        <div style={{
          position: 'absolute',
          left: '19px', top: '28px',
          bottom: '28px',
          borderLeft: '2px dashed rgba(168,155,196,0.19)',
          zIndex: 0,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {STEPS_COPY.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.3, duration: 0.4 }}
              style={{
                position: 'relative', zIndex: 1,
                backgroundColor: '#1a1633',
                border: '1px solid rgba(168,155,196,0.19)',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'left',
                display: 'flex', gap: '16px', alignItems: 'flex-start',
              }}
            >
              <span style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '16px', color: '#ea6890', flexShrink: 0, lineHeight: 1,
              }}>{s.num}</span>
              <div>
                <p style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '9px', color: '#efe3ff',
                  margin: '0 0 8px', lineHeight: 1.6,
                }}>{s.title}</p>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px', color: '#a89bc4',
                  margin: 0, lineHeight: 1.6,
                }}>{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.button
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        onClick={() => navigate('/log')}
        style={{
          background: 'linear-gradient(135deg, #ea6890, #a89bc4)',
          border: 'none', borderRadius: '4px',
          padding: '16px 28px',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '9px', color: '#fff',
          cursor: 'pointer', letterSpacing: '0.05em',
        }}
      >
        LOG YOUR FIRST TRANSACTION →
      </motion.button>
    </motion.div>
  )
}

// ─── Loaded State ─────────────────────────────────────────────────────────────

const NAV_CARDS = [
  { title: 'PAST TRANSACTIONS', body: 'View your spending history',      path: '/transactions' },
  { title: 'MY PATTERNS',       body: 'See your emotional spending',     path: '/patterns'     },
  { title: 'WEEKLY REPORT',     body: "This week's summary",             path: '/report'       },
  { title: 'LOG TRANSACTION',   body: 'Record a new spend',              path: '/log'          },
]

function LoadedState({ user, navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ width: '100%', maxWidth: '600px', padding: '0 24px' }}
    >
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '9px', color: '#a89bc4',
        letterSpacing: '0.1em', margin: '0 0 8px',
      }}>WELCOME BACK,</p>

      <h1 style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
        background: 'linear-gradient(135deg, #ea6890, #efe3ff, #a89bc4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1.3, margin: '0 0 32px',
      }}>{user?.name?.split(' ')[0]?.toUpperCase() || 'THERE'}</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '16px',
      }}>
        {NAV_CARDS.map((card, i) => (
          <NavCard key={card.path} card={card} delay={i * 0.08} navigate={navigate} />
        ))}
      </div>
    </motion.div>
  )
}

function NavCard({ card, delay, navigate }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={() => navigate(card.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? 'rgba(234,104,144,0.03)' : '#1a1633',
        border: `1px solid ${hovered ? '#ea6890' : 'rgba(168,155,196,0.19)'}`,
        borderTop: `3px solid #ea6890`,
        borderRadius: '8px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
    >
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '9px', color: '#efe3ff',
        margin: '0 0 10px', lineHeight: 1.6,
      }}>{card.title}</p>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px', color: '#a89bc4',
        margin: 0, lineHeight: 1.5,
      }}>{card.body}</p>
    </motion.div>
  )
}

// ─── DashboardScreen ──────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const navigate = useNavigate()
  const [user, setUser]                   = useState(null)
  const [hasTransactions, setHasTransactions] = useState(false)
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))

    api.getTransactions()
      .then(data => {
        const list = data?.transactions
        if (Array.isArray(list) && list.length > 0) setHasTransactions(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0d0015',
      backgroundImage: 'radial-gradient(circle, rgba(168,155,196,0.19) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      position: 'relative',
    }}>
      {/* Nebula glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 70% 50% at 20% 30%, rgba(41,36,81,0.9)  0%, transparent 70%),
          radial-gradient(ellipse 50% 60% at 80% 70%, rgba(61,26,74,0.7)  0%, transparent 60%),
          #0d0015
        `,
      }} />

      <Navbar onMenuClick={() => setSidebarOpen(true)} user={user} />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        navigate={navigate}
      />

      {/* Page content */}
      <main style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '80px',
        paddingBottom: '40px',
      }}>
        {loading ? (
          <p style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '9px', color: '#a89bc4', letterSpacing: '0.1em',
          }}>LOADING...</p>
        ) : hasTransactions ? (
          <LoadedState user={user} navigate={navigate} />
        ) : (
          <EmptyState user={user} navigate={navigate} />
        )}
      </main>
    </div>
  )
}
