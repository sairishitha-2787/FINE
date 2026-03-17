import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export default function LoginScreen() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.login(email, password)
      if (res.access_token) {
        localStorage.setItem('token', res.access_token)
        localStorage.setItem('user', JSON.stringify(res.user))
        navigate(res.user.onboarding_complete ? '/dashboard' : '/onboarding')
      } else {
        setError(res.detail || 'Invalid email or password.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
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
        maxWidth: '420px',
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

        <hr style={{ border: 'none', borderTop: '1px solid rgba(168,155,196,0.13)', marginBottom: '28px' }} />

        <p style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '11px',
          color: '#efe3ff',
          textAlign: 'center',
          margin: '0 0 28px',
        }}>SIGN IN</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Field
            label="Email"
            type="email"
            value={email}
            placeholder="your@email.com"
            onChange={e => setEmail(e.target.value)}
          />
          <Field
            label="Password"
            type="password"
            value={password}
            placeholder="••••••••"
            onChange={e => setPassword(e.target.value)}
          />

          {error && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ea6890', margin: 0 }}>
              {error}
            </p>
          )}

          <SubmitButton loading={loading} label="SIGN IN →" />
        </form>

        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          color: '#a89bc4',
          textAlign: 'center',
          marginTop: '24px',
          marginBottom: 0,
        }}>
          Don't have an account?{' '}
          <span
            onClick={() => navigate('/signup')}
            style={{ color: '#ea6890', cursor: 'pointer' }}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  )
}

function Field({ label, type, value, placeholder, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#a89bc4',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required
        style={{
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
        }}
      />
    </div>
  )
}

function SubmitButton({ loading, label }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        padding: '14px',
        background: 'linear-gradient(135deg, #ea6890, #a89bc4)',
        border: 'none',
        borderRadius: '4px',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '10px',
        color: '#fff',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        filter: hovered && !loading ? 'brightness(1.1)' : 'none',
        transform: hovered && !loading ? 'scale(1.02)' : 'scale(1)',
        transition: 'filter 0.15s, transform 0.15s',
      }}
    >
      {loading ? 'loading...' : label}
    </button>
  )
}
