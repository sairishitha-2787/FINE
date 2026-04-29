import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import { api } from '../api/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#ea6890', '#a89bc4', '#c4b5fd', '#f9a8d4', '#818cf8']

const MOOD_SYMBOLS = {
  Stressed: '⚡', Happy: '★', Calm: '☽', Anxious: '!',
  Sad: '▼', default: '◆',
}

const TABS = ['OVERVIEW', 'EMOTIONS', 'CATEGORIES', 'IMPROVEMENTS']

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function getLastWeekRange() {
  const { monday } = getWeekRange()
  const lastMonday = new Date(monday)
  lastMonday.setDate(monday.getDate() - 7)
  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  lastSunday.setHours(23, 59, 59, 999)
  return { monday: lastMonday, sunday: lastSunday }
}

function fmtDate(d) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: '#1a1633', border: '1px solid #ea6890',
      borderRadius: '6px', padding: '10px 14px',
    }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#a89bc4', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#efe3ff', margin: 0 }}>
        ₹{Number(payload[0].value).toFixed(0)}
      </p>
    </div>
  )
}

function Card({ children, colSpan = 1, accentColor = '#ea6890', delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{
        gridColumn: `span ${colSpan}`,
        backgroundColor: '#1a1633',
        border: '1px solid rgba(168,155,196,0.19)',
        borderTop: `3px solid ${accentColor}`,
        borderRadius: '12px',
        padding: '24px',
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

function CardLabel({ text }) {
  return (
    <p style={{
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '7px', color: '#a89bc4',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      margin: '0 0 16px',
    }}>{text}</p>
  )
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function HeroCard({ thisWeekTotal, lastWeekTotal, weekChange, isImprovement, topEmotion, thisWeekTx, detailed }) {
  const gradientText = {
    background: 'linear-gradient(135deg, #ea6890, #efe3ff)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        backgroundColor: '#1a1633',
        border: '1px solid rgba(168,155,196,0.19)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#a89bc4', margin: '0 0 8px' }}>
        This week you spent
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '48px', fontWeight: 700, margin: '0 0 12px', lineHeight: 1, ...gradientText }}>
        ₹{thisWeekTotal.toFixed(0)}
      </p>

      {weekChange !== null && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: isImprovement ? '#4ade80' : '#ea6890', margin: '0 0 8px' }}>
          {isImprovement ? '↓' : '↑'} {Math.abs(weekChange)}% {isImprovement ? 'less' : 'more'} than last week
        </p>
      )}

      {topEmotion && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(168,155,196,0.44)', margin: 0 }}>
          Top trigger: {topEmotion[0]}
        </p>
      )}

      {detailed && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(168,155,196,0.13)', margin: '16px 0' }} />
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#a89bc4', margin: '0 0 6px' }}>THIS WEEK</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 700, color: '#efe3ff', margin: 0 }}>
                ₹{thisWeekTotal.toFixed(0)}
              </p>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(168,155,196,0.13)' }} />
            <div>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#a89bc4', margin: '0 0 6px' }}>LAST WEEK</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 700, color: '#efe3ff', margin: 0 }}>
                ₹{lastWeekTotal.toFixed(0)}
              </p>
            </div>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(168,155,196,0.44)', margin: '12px 0 0' }}>
            {thisWeekTx.length} transaction{thisWeekTx.length !== 1 ? 's' : ''} this week
          </p>
        </>
      )}
    </motion.div>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ topEmotion, topCategory, emotionTotals, categoryTotals, thisWeekTx }) {
  const timeline = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const byDay = thisWeekTx.reduce((acc, t) => {
      const idx = (new Date(t.date_time).getDay() + 6) % 7
      acc[idx] = (acc[idx] || 0) + t.amount
      return acc
    }, {})
    return days.map((day, i) => ({ day, amount: byDay[i] || 0 }))
  }, [thisWeekTx])

  const topEmotionCount = thisWeekTx.filter(t => t.mood === topEmotion?.[0]).length
  const topCategoryCount = thisWeekTx.filter(t => t.category === topCategory?.[0]).length
  const topEmotionAvg = topEmotionCount > 0 ? (topEmotion[1] / topEmotionCount) : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <Card accentColor="#ea6890" delay={0.05}>
        <CardLabel text="Top Emotion" />
        {topEmotion ? (
          <>
            <p style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: '14px',
              background: 'linear-gradient(135deg, #ea6890, #efe3ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              margin: '0 0 8px', lineHeight: 1.6,
            }}>{topEmotion[0]}</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: 700, color: '#efe3ff', margin: '0 0 4px' }}>
              ₹{topEmotion[1].toFixed(0)}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#a89bc4', margin: 0 }}>
              ₹{topEmotionAvg.toFixed(0)} avg per transaction
            </p>
          </>
        ) : (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(168,155,196,0.44)' }}>No data</p>
        )}
      </Card>

      <Card accentColor="#a89bc4" delay={0.1}>
        <CardLabel text="Top Category" />
        {topCategory ? (
          <>
            <p style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#a89bc4',
              margin: '0 0 12px', lineHeight: 1.8,
            }}>{topCategory[0]}</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: 700, color: '#efe3ff', margin: '0 0 4px' }}>
              ₹{topCategory[1].toFixed(0)}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#a89bc4', margin: 0 }}>
              {topCategoryCount} transaction{topCategoryCount !== 1 ? 's' : ''}
            </p>
          </>
        ) : (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(168,155,196,0.44)' }}>No data</p>
        )}
      </Card>

      <Card colSpan={2} accentColor="#ea6890" delay={0.15}>
        <CardLabel text="This Week's Spending" />
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={timeline} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="weekAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea6890" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ea6890" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: '#a89bc4', fontFamily: 'Inter', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#a89bc4', fontFamily: 'Inter', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '₹' + v} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" stroke="#ea6890" strokeWidth={2} fill="url(#weekAreaGradient)" dot={{ fill: '#ea6890', r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

// ─── Tab: Emotions ────────────────────────────────────────────────────────────

function EmotionsTab({ emotionTotals, thisWeekTx }) {
  const data = Object.entries(emotionTotals)
    .map(([mood, amount]) => ({ mood, amount }))
    .sort((a, b) => b.amount - a.amount)

  const countByMood = thisWeekTx.reduce((acc, t) => {
    acc[t.mood] = (acc[t.mood] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card colSpan={1} accentColor="#ea6890" delay={0.05} style={{ gridColumn: 'unset' }}>
        <CardLabel text="Spending by Emotion" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="emotionBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea6890" />
                <stop offset="100%" stopColor="#a89bc4" />
              </linearGradient>
            </defs>
            <XAxis dataKey="mood" tick={{ fill: '#a89bc4', fontFamily: 'Inter', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#a89bc4', fontFamily: 'Inter', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '₹' + v} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="url(#emotionBarGrad)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map(({ mood, amount }, i) => (
          <motion.div
            key={mood}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              backgroundColor: '#1a1633',
              border: '1px solid rgba(168,155,196,0.13)',
              borderRadius: '8px', padding: '12px 16px',
            }}
          >
            <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>
              {MOOD_SYMBOLS[mood] ?? MOOD_SYMBOLS.default}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#efe3ff', flex: 1 }}>{mood}</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#a89bc4' }}>
              {countByMood[mood] || 0}×
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#ea6890', width: '72px', textAlign: 'right' }}>
              ₹{amount.toFixed(0)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Categories ──────────────────────────────────────────────────────────

function CategoriesTab({ categoryTotals, thisWeekTx }) {
  const data = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount, name: category }))
    .sort((a, b) => b.amount - a.amount)

  const countByCat = thisWeekTx.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1
    return acc
  }, {})

  const total = data.reduce((s, d) => s + d.amount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card accentColor="#a89bc4" delay={0.05} style={{ gridColumn: 'unset' }}>
        <CardLabel text="Spending by Category" />
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie data={data} dataKey="amount" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ marginBottom: '4px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#efe3ff', margin: '0 0 2px' }}>₹{total.toFixed(0)}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#a89bc4', margin: 0 }}>total</p>
            </div>
            {data.slice(0, 5).map(({ category, amount }, i) => (
              <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#a89bc4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#efe3ff', flexShrink: 0 }}>₹{amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map(({ category, amount }, i) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              backgroundColor: '#1a1633',
              border: '1px solid rgba(168,155,196,0.13)',
              borderRadius: '8px', padding: '12px 16px',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#efe3ff', flex: 1 }}>{category}</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#a89bc4' }}>
              {countByCat[category] || 0}×
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#ea6890', width: '72px', textAlign: 'right' }}>
              ₹{amount.toFixed(0)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Improvements ───────────────────────────────────────────────────────

function ImprovementsTab({ improvements }) {
  if (improvements.length === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#a89bc4', margin: 0 }}>NO COMPARISON DATA YET</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(168,155,196,0.44)', margin: 0 }}>
          Keep logging transactions to see weekly improvements.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#4ade80',
        margin: '0 0 8px', letterSpacing: '0.08em',
      }}>🎉 YOU MADE PROGRESS THIS WEEK</p>

      {improvements.map(({ category, thisWeek, lastWeek, saved }, i) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          style={{
            backgroundColor: '#1a1633',
            border: '1px solid rgba(74,222,128,0.2)',
            borderTop: '3px solid #4ade80',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#ea6890', margin: '0 0 12px', lineHeight: 1.8 }}>
                {category}
              </p>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#a89bc4', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>This week</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#efe3ff', margin: 0 }}>₹{thisWeek.toFixed(0)}</p>
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#a89bc4', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last week</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: 'rgba(239,227,255,0.4)', margin: 0, textDecoration: 'line-through' }}>₹{lastWeek.toFixed(0)}</p>
                </div>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#4ade80', margin: 0 }}>
                You saved ₹{saved.toFixed(0)}
              </p>
            </div>

            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '24px', marginLeft: '16px', color: '#4ade80' }}
            >
              ↓
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── WeeklyReportScreen ───────────────────────────────────────────────────────

export default function WeeklyReportScreen() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState('overview')

  const user               = JSON.parse(localStorage.getItem('user') || '{}')
  const communicationStyle = user?.communication_style || 'Brief'
  const isDetailed         = ['Detailed', 'Visual + Detailed', 'Visual'].includes(communicationStyle)

  useEffect(() => {
    api.getTransactions()
      .then(data => setTransactions(data?.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ─── Computed data ───────────────────────────────────────────────────────────

  const { monday, sunday }             = getWeekRange()
  const { monday: lastMonday, sunday: lastSunday } = getLastWeekRange()

  const thisWeekTx = transactions.filter(t => {
    const d = new Date(t.date_time)
    return d >= monday && d <= sunday
  })

  const lastWeekTx = transactions.filter(t => {
    const d = new Date(t.date_time)
    return d >= lastMonday && d <= lastSunday
  })

  const thisWeekTotal = thisWeekTx.reduce((sum, t) => sum + t.amount, 0)
  const lastWeekTotal = lastWeekTx.reduce((sum, t) => sum + t.amount, 0)
  const weekChange    = lastWeekTotal > 0
    ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100).toFixed(1)
    : null
  const isImprovement = thisWeekTotal < lastWeekTotal

  const emotionTotals = thisWeekTx.reduce((acc, t) => {
    acc[t.mood] = (acc[t.mood] || 0) + t.amount
    return acc
  }, {})
  const topEmotion = Object.entries(emotionTotals).sort((a, b) => b[1] - a[1])[0]

  const categoryTotals = thisWeekTx.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount
    return acc
  }, {})
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]

  const lastWeekCategoryTotals = lastWeekTx.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount
    return acc
  }, {})
  const improvements = Object.entries(categoryTotals)
    .filter(([cat, amt]) => lastWeekCategoryTotals[cat] && amt < lastWeekCategoryTotals[cat])
    .map(([cat, amt]) => ({
      category: cat,
      thisWeek: amt,
      lastWeek: lastWeekCategoryTotals[cat],
      saved: lastWeekCategoryTotals[cat] - amt,
    }))

  const weekBadge = `${fmtDate(monday)} — ${fmtDate(sunday)}`

  const tabKey = activeTab.toLowerCase()

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

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span
            onClick={() => navigate('/dashboard')}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', color: '#a89bc4', cursor: 'pointer', lineHeight: 1 }}
          >←</span>
          <p style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: '10px',
            background: 'linear-gradient(135deg, #ea6890, #efe3ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            margin: 0,
          }}>WEEKLY REPORT</p>
          <div />
        </div>

        {/* Week badge */}
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#a89bc4',
          textAlign: 'center', margin: '0 0 24px', letterSpacing: '0.05em',
        }}>{weekBadge}</p>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', paddingTop: '80px' }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#a89bc4', letterSpacing: '0.1em' }}>
              LOADING...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && thisWeekTx.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#a89bc4', margin: 0 }}>
              NO TRANSACTIONS THIS WEEK
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(168,155,196,0.44)', margin: 0 }}>
              Start logging to see your weekly report.
            </p>
            <span
              onClick={() => navigate('/log')}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ea6890', cursor: 'pointer' }}
            >
              Log a transaction →
            </span>
          </div>
        )}

        {/* Main content */}
        {!loading && thisWeekTx.length > 0 && (
          <>
            <HeroCard
              thisWeekTotal={thisWeekTotal}
              lastWeekTotal={lastWeekTotal}
              weekChange={weekChange}
              isImprovement={isImprovement}
              topEmotion={topEmotion}
              thisWeekTx={thisWeekTx}
              detailed={isDetailed}
            />

            {/* Tab navigation */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid rgba(168,155,196,0.13)',
              marginBottom: '24px',
              overflowX: 'auto',
            }}>
              {TABS.map(tab => {
                const key = tab.toLowerCase()
                const active = activeTab === key
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(key)}
                    style={{
                      background: 'none', border: 'none',
                      borderBottom: active ? '2px solid #ea6890' : '2px solid transparent',
                      padding: '10px 16px',
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '7px',
                      color: active ? '#ea6890' : 'rgba(168,155,196,0.44)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      marginBottom: '-1px',
                      transition: 'color 0.15s',
                    }}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {tabKey === 'overview' && (
                  <OverviewTab
                    topEmotion={topEmotion}
                    topCategory={topCategory}
                    emotionTotals={emotionTotals}
                    categoryTotals={categoryTotals}
                    thisWeekTx={thisWeekTx}
                  />
                )}
                {tabKey === 'emotions' && (
                  <EmotionsTab emotionTotals={emotionTotals} thisWeekTx={thisWeekTx} />
                )}
                {tabKey === 'categories' && (
                  <CategoriesTab categoryTotals={categoryTotals} thisWeekTx={thisWeekTx} />
                )}
                {tabKey === 'improvements' && (
                  <ImprovementsTab improvements={improvements} />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
