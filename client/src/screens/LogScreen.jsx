import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'

const CATEGORIES = [
  'Food & Dining', 'Groceries', 'Shopping', 'Transport',
  'Bills & Utilities', 'EMI & Loans', 'Health', 'Education',
  'Entertainment', 'Travel', 'Personal Care', 'Gifts', 'Other',
]

const MOODS = [
  'Happy', 'Stressed', 'Anxious', 'Bored', 'Sad',
  'Excited', 'Angry', 'Calm', 'Tired', 'Celebratory',
]

// ─── Shared field styles ──────────────────────────────────────────────────────

function fieldStyle(focused) {
  return {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#0d0015',
    border: `1px solid ${focused ? '#ea6890' : 'rgba(168,155,196,0.25)'}`,
    borderRadius: '4px',
    color: '#efe3ff',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    outline: 'none',
    boxShadow: focused ? '0 0 0 2px rgba(234,104,144,0.19)' : 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
}

function Label({ text }) {
  return (
    <label style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#a89bc4',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      display: 'block',
      marginBottom: '6px',
    }}>{text}</label>
  )
}

// ─── Field components ─────────────────────────────────────────────────────────

function InputField({ label, type = 'text', value, onChange, placeholder, min, step }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <Label text={label} />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={fieldStyle(focused)}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <Label text={label} />
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...fieldStyle(focused), appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <Label text={label} />
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...fieldStyle(focused), resize: 'none', lineHeight: 1.6 }}
      />
    </div>
  )
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState({ navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}
    >
      {/* Checkmark circle */}
      <div style={{
        width: '60px', height: '60px', borderRadius: '50%',
        backgroundColor: 'rgba(234,104,144,0.13)',
        border: '2px solid #ea6890',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', color: '#ea6890' }}>✓</span>
      </div>

      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '10px', color: '#ea6890',
        margin: 0, lineHeight: 1.6,
      }}>TRANSACTION LOGGED!</p>

      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px', color: '#a89bc4', margin: 0,
      }}>Successfully recorded your spend.</p>

      {/* Pointer card */}
      <div style={{
        backgroundColor: '#1a1633',
        border: '1px solid rgba(234,104,144,0.25)',
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '300px',
        width: '100%',
      }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#efe3ff', margin: '0 0 6px' }}>
          View your transaction
        </p>
        <span
          onClick={() => navigate('/transactions')}
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ea6890', cursor: 'pointer' }}
        >
          → Check Past Transactions
        </span>
      </div>

      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px', color: 'rgba(168,155,196,0.44)',
        fontStyle: 'italic', margin: 0,
      }}>Redirecting to dashboard in 3 seconds...</p>
    </motion.div>
  )
}

// ─── LogScreen ────────────────────────────────────────────────────────────────

export default function LogScreen() {
  const navigate = useNavigate()
  const [amount,    setAmount]    = useState('')
  const [category,  setCategory]  = useState('')
  const [mood,      setMood]      = useState('')
  const [note,      setNote]      = useState('')
  const [dateTime,  setDateTime]  = useState(new Date().toISOString().slice(0, 16))
  const [loading,   setLoading]   = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error,     setError]     = useState('')
  const [showNudge,  setShowNudge]  = useState(false)
  const [nudgeData,  setNudgeData]  = useState(null)

  const canSubmit = amount !== '' && category !== '' && mood !== ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const transactionData = {
        amount:    parseFloat(amount),
        category,
        mood,
        date_time: new Date(dateTime).toISOString(),
        ...(note ? { note } : {}),
      }

      const user = JSON.parse(localStorage.getItem('user'))
      const nudgePref = user?.nudge_preference
      if (nudgePref === 'Nudge me in the moment') {
        const nudgeResult = await api.checkNudge(mood, category)
        if (nudgeResult?.should_nudge) {
          setNudgeData(nudgeResult)
          setShowNudge(true)
          setLoading(false)
          return
        }
      }

      const res = await api.logTransaction(transactionData)
      if (res?.message === 'Transaction logged') {
        setShowSuccess(true)
        setTimeout(() => navigate('/dashboard'), 3000)
      } else {
        setError(res?.detail || 'Could not log transaction.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleProceedAnyway = async () => {
    setShowNudge(false)
    setLoading(true)
    try {
      const result = await api.logTransaction({
        amount: parseFloat(amount),
        category,
        mood,
        note: note || undefined,
        date_time: new Date(dateTime).toISOString()
      })
      if (result?.message === 'Transaction logged') {
        setShowSuccess(true)
        setTimeout(() => navigate('/dashboard'), 3000)
      }
    } catch (e) {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  const handleReconsider = () => {
    setShowNudge(false)
    setNudgeData(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0d0015',
      backgroundImage: 'radial-gradient(circle, rgba(168,155,196,0.19) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
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

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#1a1633',
        border: '1px solid rgba(168,155,196,0.19)',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 0 40px #292451',
      }}>
        {/* Brand */}
        <p style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '28px',
          background: 'linear-gradient(135deg, #ea6890, #efe3ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textAlign: 'center',
          margin: '0 0 10px',
        }}>FINE</p>

        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 300,
          fontSize: '10px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: '#a89bc4',
          textAlign: 'center',
          margin: '0 0 24px',
        }}>Finance Intelligent Ecosystem</p>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(168,155,196,0.13)', marginBottom: '24px' }} />

        <p style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '10px',
          color: '#a89bc4',
          textAlign: 'center',
          margin: '0 0 24px',
        }}>LOG TRANSACTION</p>

        {showSuccess ? (
          <SuccessState navigate={navigate} />
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <InputField
              label="Amount (₹)"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            <SelectField
              label="Category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              options={CATEGORIES}
              placeholder="Select a category"
            />
            <SelectField
              label="Mood When You Spent"
              value={mood}
              onChange={e => setMood(e.target.value)}
              options={MOODS}
              placeholder="How were you feeling?"
            />
            <InputField
              label="Date & Time"
              type="datetime-local"
              value={dateTime}
              onChange={e => setDateTime(e.target.value)}
            />
            <TextareaField
              label="Note (Optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What triggered this spend? (optional)"
            />

            {error && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ea6890', margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #ea6890, #a89bc4)',
                border: 'none',
                borderRadius: '4px',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '9px',
                color: '#fff',
                cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                opacity: canSubmit && !loading ? 1 : 0.45,
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? 'LOGGING...' : 'LOG TRANSACTION →'}
            </button>

            <p
              onClick={() => navigate('/dashboard')}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#a89bc4',
                textAlign: 'center',
                margin: 0,
                cursor: 'pointer',
              }}
            >
              ← Back to Dashboard
            </p>
          </form>
        )}
      </div>

      <AnimatePresence>
        {showNudge && nudgeData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(13, 0, 21, 0.8)',
                backdropFilter: 'blur(4px)',
                zIndex: 40
              }}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '40%' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                height: '65%',
                background: '#1a1633',
                borderTop: '1px solid #a89bc440',
                borderRadius: '24px 24px 0 0',
                zIndex: 50,
                padding: '0 32px 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{
                width: 40, height: 4,
                background: '#a89bc440',
                borderRadius: 2,
                margin: '16px auto 24px'
              }} />

              <p style={{
                fontFamily: "'Press Start 2P'",
                fontSize: 8,
                color: '#ea6890',
                letterSpacing: '0.1em',
                marginBottom: 16
              }}>SPENDING PATTERN DETECTED</p>

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  fontSize: 40,
                  fontFamily: "'Press Start 2P'",
                  color: '#ea6890',
                  marginBottom: 16,
                  filter: 'drop-shadow(0 0 12px #ea689080)'
                }}
              >
                {nudgeData.mood === 'Stressed' ? '⚡' :
                 nudgeData.mood === 'Happy' ? '★' :
                 nudgeData.mood === 'Calm' ? '☽' :
                 nudgeData.mood === 'Anxious' ? '!' :
                 nudgeData.mood === 'Sad' ? '▼' : '◆'}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontFamily: 'Inter',
                  fontSize: 16,
                  color: '#efe3ff',
                  textAlign: 'center',
                  lineHeight: 1.8,
                  marginBottom: 8,
                  maxWidth: 400
                }}
              >
                The last <span style={{ color: '#ea6890', fontWeight: 600 }}>{nudgeData.count} times</span> you felt{' '}
                <span style={{ color: '#ea6890', fontWeight: 600 }}>{nudgeData.mood}</span>, you spent on{' '}
                <span style={{ color: '#a89bc4', fontWeight: 600 }}>{nudgeData.category}</span> — averaging{' '}
                <span style={{ color: '#ea6890', fontWeight: 600 }}>₹{nudgeData.average_amount}</span> per transaction.
              </motion.p>

              <p style={{
                fontFamily: 'Inter',
                fontSize: 13,
                color: '#a89bc470',
                fontStyle: 'italic',
                textAlign: 'center',
                marginBottom: 32
              }}>
                Just something to reflect on. 🌙
              </p>

              <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 400 }}>
                <button
                  onClick={handleReconsider}
                  style={{
                    flex: 1, padding: '14px',
                    background: 'transparent',
                    border: '1px solid #a89bc440',
                    borderRadius: 4,
                    color: '#a89bc4',
                    fontFamily: "'Press Start 2P'",
                    fontSize: 8,
                    cursor: 'pointer'
                  }}
                >
                  ← RECONSIDER
                </button>
                <button
                  onClick={handleProceedAnyway}
                  style={{
                    flex: 1, padding: '14px',
                    background: 'linear-gradient(135deg, #ea6890, #a89bc4)',
                    border: 'none',
                    borderRadius: 4,
                    color: 'white',
                    fontFamily: "'Press Start 2P'",
                    fontSize: 8,
                    cursor: 'pointer'
                  }}
                >
                  LOG ANYWAY →
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
