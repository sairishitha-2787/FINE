import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Food & Dining', 'Groceries', 'Shopping', 'Transport',
  'Bills & Utilities', 'EMI & Loans', 'Health', 'Education',
  'Entertainment', 'Travel', 'Personal Care', 'Gifts', 'Other',
]

const MOODS = [
  'Happy', 'Stressed', 'Anxious', 'Bored', 'Sad',
  'Excited', 'Angry', 'Calm', 'Tired', 'Celebratory',
]

// ─── Shared styles ────────────────────────────────────────────────────────────

const selectStyle = {
  width: '100%',
  padding: '8px 12px',
  backgroundColor: '#0d0015',
  border: '1px solid rgba(168,155,196,0.25)',
  borderRadius: '4px',
  color: '#efe3ff',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
}

function FilterLabel({ text }) {
  return (
    <p style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      color: '#a89bc4',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      margin: '0 0 5px',
    }}>{text}</p>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ tx, onClose }) {
  const formatted = new Date(tx.date_time).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            backgroundColor: 'rgba(13,0,21,0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />

        {/* Modal card */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 50,
            width: '90%', maxWidth: '400px',
            backgroundColor: '#1a1633',
            border: '1px solid rgba(168,155,196,0.25)',
            borderRadius: '8px',
            padding: '32px',
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '20px',
              background: 'none', border: 'none',
              fontFamily: 'Inter, sans-serif', fontSize: '16px',
              color: '#a89bc4', cursor: 'pointer',
            }}
          >✕</button>

          {/* Category */}
          <p style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '10px', color: '#ea6890',
            margin: '0 0 10px', lineHeight: 1.6,
          }}>{tx.category}</p>

          {/* Amount */}
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '32px', fontWeight: 700,
            color: '#efe3ff', margin: '0 0 24px',
          }}>₹{tx.amount}</p>

          {/* Detail rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <DetailRow label="MOOD"      value={tx.mood} />
            <DetailRow label="DATE & TIME" value={formatted} />
            {tx.note && <DetailRow label="NOTE" value={tx.note} italic />}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(168,155,196,0.13)', marginBottom: '14px' }} />

          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px', color: 'rgba(168,155,196,0.25)',
            margin: 0,
          }}>ID: {String(tx.id).slice(0, 8)}...</p>
        </motion.div>
      </>
    </AnimatePresence>
  )
}

function DetailRow({ label, value, italic }) {
  return (
    <div>
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '8px', color: '#a89bc4',
        margin: '0 0 4px',
      }}>{label}</p>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px', color: '#efe3ff',
        margin: 0,
        fontStyle: italic ? 'italic' : 'normal',
      }}>{value}</p>
    </div>
  )
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ tx, index, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: hovered ? 'rgba(168,155,196,0.03)' : 'transparent',
        borderBottom: '1px solid rgba(168,155,196,0.08)',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
      }}
    >
      {/* Left */}
      <div>
        <p style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '8px', color: '#ea6890',
          margin: '0 0 5px', lineHeight: 1.4,
        }}>{tx.category}</p>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px', color: '#a89bc4',
          margin: 0,
        }}>{tx.mood}</p>
      </div>

      {/* Right */}
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px', fontWeight: 600,
        color: '#efe3ff', margin: 0,
        flexShrink: 0,
      }}>₹{tx.amount}</p>
    </motion.div>
  )
}

// ─── TransactionsScreen ───────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const navigate = useNavigate()

  const [transactions, setTransactions]           = useState([])
  const [loading, setLoading]                     = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [filterCategory, setFilterCategory]       = useState('All')
  const [filterMood, setFilterMood]               = useState('All')
  const [minAmount, setMinAmount]                 = useState(0)
  const [maxAmount, setMaxAmount]                 = useState(0)
  const [amountRange, setAmountRange]             = useState([0, 0])

  useEffect(() => {
    api.getTransactions()
      .then(data => {
        const list = data?.transactions
        if (!Array.isArray(list)) return
        setTransactions(list)
        if (list.length > 0) {
          const amounts = list.map(t => t.amount)
          const lo = Math.floor(Math.min(...amounts))
          const hi = Math.ceil(Math.max(...amounts))
          setMinAmount(lo)
          setMaxAmount(hi)
          setAmountRange([lo, hi])
        }
      })

      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => transactions
    .filter(t => filterCategory === 'All' || t.category === filterCategory)
    .filter(t => filterMood === 'All' || t.mood === filterMood)
    .filter(t => t.amount >= amountRange[0] && t.amount <= amountRange[1]),
    [transactions, filterCategory, filterMood, amountRange]
  )

  const handleMinRange = (e) => {
    const val = Math.min(Number(e.target.value), amountRange[1])
    setAmountRange([val, amountRange[1]])
  }

  const handleMaxRange = (e) => {
    const val = Math.max(Number(e.target.value), amountRange[0])
    setAmountRange([amountRange[0], val])
  }

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

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '28px',
        }}>
          <span
            onClick={() => navigate('/dashboard')}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#a89bc4', cursor: 'pointer' }}
          >←</span>

          <p style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '10px',
            background: 'linear-gradient(135deg, #ea6890, #efe3ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
          }}>PAST TRANSACTIONS</p>

          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '8px', color: '#ea6890',
            backgroundColor: 'rgba(234,104,144,0.13)',
            border: '1px solid rgba(234,104,144,0.38)',
            borderRadius: '20px',
            padding: '4px 10px',
          }}>{transactions.length}</span>
        </div>

        {/* Filter bar */}
        {transactions.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#1a1633',
            border: '1px solid rgba(168,155,196,0.13)',
            borderRadius: '8px',
          }}>
            {/* Category */}
            <div>
              <FilterLabel text="Category" />
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selectStyle}>
                <option value="All">All</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Mood */}
            <div>
              <FilterLabel text="Mood" />
              <select value={filterMood} onChange={e => setFilterMood(e.target.value)} style={selectStyle}>
                <option value="All">All</option>
                {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Amount range */}
            <div>
              <FilterLabel text={`Amount: ₹${amountRange[0]} — ₹${amountRange[1]}`} />
              <div style={{ position: 'relative', height: '28px', marginTop: '6px' }}>
                <input
                  type="range"
                  min={minAmount} max={maxAmount}
                  value={amountRange[0]}
                  onChange={handleMinRange}
                  style={{
                    position: 'absolute', width: '100%',
                    appearance: 'none', WebkitAppearance: 'none',
                    background: 'transparent', outline: 'none',
                    accentColor: '#ea6890', zIndex: 2,
                  }}
                />
                <input
                  type="range"
                  min={minAmount} max={maxAmount}
                  value={amountRange[1]}
                  onChange={handleMaxRange}
                  style={{
                    position: 'absolute', width: '100%',
                    appearance: 'none', WebkitAppearance: 'none',
                    background: 'transparent', outline: 'none',
                    accentColor: '#ea6890', zIndex: 1,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: '80px' }}>
            <p style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px', color: '#a89bc4', letterSpacing: '0.1em',
            }}>LOADING...</p>
          </div>
        ) : transactions.length === 0 || filtered.length === 0 ? (
          <EmptyState hasTransactions={transactions.length > 0} navigate={navigate} />
        ) : (
          <div style={{
            backgroundColor: '#1a1633',
            border: '1px solid rgba(168,155,196,0.13)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            {filtered.map((tx, i) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                index={i}
                onClick={() => setSelectedTransaction(tx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedTransaction && (
        <DetailModal
          tx={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasTransactions, navigate }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '10px', color: '#a89bc4', margin: 0,
      }}>
        {hasTransactions ? 'NO MATCHES' : 'NO TRANSACTIONS YET'}
      </p>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px', color: 'rgba(168,155,196,0.44)', margin: 0,
      }}>
        {hasTransactions
          ? 'Try adjusting your filters.'
          : 'Your spending history will appear here.'}
      </p>
      {!hasTransactions && (
        <span
          onClick={() => navigate('/log')}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px', color: '#ea6890', cursor: 'pointer',
          }}
        >
          Log your first transaction →
        </span>
      )}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          marginTop: '8px',
          background: 'transparent',
          border: '1px solid rgba(168,155,196,0.25)',
          borderRadius: '4px',
          padding: '10px 20px',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '8px',
          color: '#a89bc4',
          cursor: 'pointer',
        }}
      >← Back to Dashboard</button>
    </div>
  )
}
