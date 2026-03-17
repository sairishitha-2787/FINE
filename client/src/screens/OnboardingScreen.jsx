import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'

// ─── Questions ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    key: 'communication_style',
    label: 'QUESTION 1 OF 3',
    question: 'How do you like your insights?',
    options: ['Brief', 'Detailed', 'Visual', 'Visual + Brief', 'Visual + Detailed'],
  },
  {
    key: 'financial_situation',
    label: 'QUESTION 2 OF 3',
    question: 'Which best describes you?',
    options: [
      'Student with tight budget',
      'Student with moderate spending',
      'Working / earning regularly',
    ],
  },
  {
    key: 'nudge_preference',
    label: 'QUESTION 3 OF 3',
    question: 'When should FINE speak up?',
    options: [
      'Only when I ask',
      'Gentle weekly summaries',
      'Nudge me in the moment',
    ],
  },
]

// ─── StepDots ─────────────────────────────────────────────────────────────────

function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
      {STEPS.map((_, i) => {
        const completed = i < current
        const active    = i === current
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <motion.div
              animate={{
                backgroundColor: completed || active ? '#ea6890' : 'rgba(168,155,196,0.25)',
                boxShadow: active
                  ? '0 0 8px #ea6890'
                  : completed
                  ? '0 0 6px rgba(234,104,144,0.5)'
                  : 'none',
              }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={{ width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0 }}
            />
            {i < STEPS.length - 1 && (
              <motion.div
                animate={{
                  backgroundColor: completed
                    ? '#ea6890'
                    : 'rgba(168,155,196,0.13)',
                  boxShadow: completed ? '0 0 6px rgba(234,104,144,0.5)' : 'none',
                }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                style={{ width: '60px', height: '2px', flexShrink: 0 }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── PixelCheckbox ────────────────────────────────────────────────────────────

function PixelCheckbox({ selected }) {
  return (
    <div style={{
      width: '16px', height: '16px', flexShrink: 0,
      border: `2px solid ${selected ? '#ea6890' : '#a89bc4'}`,
      backgroundColor: selected ? '#ea6890' : 'transparent',
      borderRadius: '2px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      transition: 'background-color 0.15s, border-color 0.15s',
    }}>
      {selected && (
        <>
          {/* Pixel checkmark — vertical bar of L */}
          <div style={{
            position: 'absolute',
            width: '2px', height: '6px',
            backgroundColor: '#fff',
            bottom: '2px', left: '3px',
            transform: 'rotate(-45deg)',
            transformOrigin: 'bottom left',
          }} />
          {/* Horizontal bar of L */}
          <div style={{
            position: 'absolute',
            width: '8px', height: '2px',
            backgroundColor: '#fff',
            bottom: '2px', left: '3px',
            transform: 'rotate(-45deg)',
            transformOrigin: 'bottom left',
          }} />
        </>
      )}
    </div>
  )
}

// ─── OptionRow ────────────────────────────────────────────────────────────────

function OptionRow({ label, selected, onSelect }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px',
        backgroundColor: selected ? 'rgba(234,104,144,0.06)' : hovered ? 'rgba(168,155,196,0.06)' : '#0d0015',
        border: `1px solid ${selected ? '#ea6890' : hovered ? '#a89bc4' : 'rgba(168,155,196,0.19)'}`,
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.15s, border-color 0.15s',
        userSelect: 'none',
      }}
    >
      <PixelCheckbox selected={selected} />
      <span style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#efe3ff',
      }}>{label}</span>
    </motion.div>
  )
}

// ─── OnboardingScreen ─────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection]     = useState(1)   // 1 = forward, -1 = back
  const [answers, setAnswers]         = useState({
    communication_style: null,
    financial_situation: null,
    nudge_preference: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const step       = STEPS[currentStep]
  const selected   = answers[step.key]
  const canAdvance = selected !== null

  const selectOption = (option) => {
    setAnswers(prev => ({ ...prev, [step.key]: option }))
  }

  const goNext = () => {
    if (!canAdvance) return
    setDirection(1)
    setCurrentStep(s => s + 1)
  }

  const goBack = () => {
    setDirection(-1)
    setCurrentStep(s => s - 1)
  }

  const handleFinish = async () => {
    if (!canAdvance) return
    setLoading(true)
    setError('')
    try {
      const res = await api.completeOnboarding({
        communication_style: answers.communication_style,
        financial_situation: answers.financial_situation,
        nudge_preference:    answers.nudge_preference,
      })
      if (res && !res.detail) {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...user, onboarding_complete: true }))
        navigate('/dashboard')
      } else {
        setError(res?.detail || 'Something went wrong.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const slideVariants = {
    enter:  (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
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
        maxWidth: '520px',
        backgroundColor: '#1a1633',
        border: '1px solid rgba(168,155,196,0.19)',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 0 40px #292451',
        overflow: 'hidden',
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
          margin: '0 0 28px',
        }}>Finance Intelligent Ecosystem</p>

        <StepDots current={currentStep} />

        {/* Animated question + options */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {/* Question label */}
            <p style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '9px',
              color: '#a89bc4',
              textTransform: 'uppercase',
              marginBottom: '8px',
              letterSpacing: '0.05em',
            }}>{step.label}</p>

            {/* Question text */}
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              fontWeight: 500,
              color: '#efe3ff',
              marginBottom: '24px',
            }}>{step.question}</p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
              {step.options.map(opt => (
                <OptionRow
                  key={opt}
                  label={opt}
                  selected={selected === opt}
                  onSelect={() => selectOption(opt)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#ea6890',
            marginBottom: '16px',
          }}>{error}</p>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Back — hidden on step 0 */}
          <div style={{ width: '100px' }}>
            {currentStep > 0 && (
              <button
                onClick={goBack}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(168,155,196,0.25)',
                  borderRadius: '4px',
                  padding: '10px 16px',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '8px',
                  color: '#a89bc4',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ← BACK
              </button>
            )}
          </div>

          {/* Next / Finish */}
          <button
            onClick={currentStep < STEPS.length - 1 ? goNext : handleFinish}
            disabled={!canAdvance || loading}
            style={{
              background: 'linear-gradient(135deg, #ea6890, #a89bc4)',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 20px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '8px',
              color: '#fff',
              cursor: canAdvance && !loading ? 'pointer' : 'not-allowed',
              opacity: canAdvance && !loading ? 1 : 0.45,
              whiteSpace: 'nowrap',
              transition: 'opacity 0.15s',
            }}
          >
            {loading
              ? 'loading...'
              : currentStep < STEPS.length - 1
              ? 'NEXT →'
              : 'FINISH →'}
          </button>
        </div>
      </div>
    </div>
  )
}
