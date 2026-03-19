import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import { api } from '../api/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#ea6890', '#a89bc4', '#c4b5fd', '#f9a8d4', '#818cf8', '#e879f9', '#fb7185', '#a78bfa']

const MOOD_SYMBOLS = {
  Stressed: '⚡', Happy: '★', Calm: '☽', Anxious: '!',
  Sad: '▼', default: '◆',
}

const DISCRETIONARY = ['Food & Dining', 'Shopping', 'Entertainment', 'Personal Care', 'Gifts', 'Other', 'Groceries']
const EMOTIONAL_MOODS = ['Stressed', 'Anxious', 'Angry', 'Sad']

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: '#1a1633',
      border: '1px solid #ea6890',
      borderRadius: '6px',
      padding: '10px 14px',
    }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#a89bc4', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#efe3ff', margin: 0 }}>
        ₹{payload[0].value}
      </p>
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

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
        position: 'relative',
        overflow: 'hidden',
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

// ─── Data hook ────────────────────────────────────────────────────────────────

function usePatternData(transactions) {
  return useMemo(() => {
    if (!transactions.length) return null

    const spendingByMood = Object.entries(
      transactions.reduce((acc, t) => { acc[t.mood] = (acc[t.mood] || 0) + t.amount; return acc }, {})
    ).map(([mood, amount]) => ({ mood, amount })).sort((a, b) => b.amount - a.amount)

    const frequencyByMood = Object.entries(
      transactions.reduce((acc, t) => { acc[t.mood] = (acc[t.mood] || 0) + 1; return acc }, {})
    ).map(([mood, count]) => ({ mood, count })).sort((a, b) => b.count - a.count)

    const spendingByCategory = Object.entries(
      transactions.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})
    ).map(([category, amount]) => ({ category, amount, name: category })).sort((a, b) => b.amount - a.amount)

    const moodCategoryPairs = transactions.reduce((acc, t) => {
      const key = `${t.mood}|${t.category}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    const sortedPairs = Object.entries(moodCategoryPairs).sort((a, b) => b[1] - a[1])
    const [topMood, topCategory] = sortedPairs[0] ? sortedPairs[0][0].split('|') : ['', '']
    const [secondMood, secondCategory] = sortedPairs[1] ? sortedPairs[1][0].split('|') : ['', '']

    const timeline = Object.entries(
      transactions.reduce((acc, t) => {
        const date = new Date(t.date_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        acc[date] = (acc[date] || 0) + t.amount
        return acc
      }, {})
    ).map(([date, amount]) => ({ date, amount }))

    const discretionaryTotal = transactions.filter(t => DISCRETIONARY.includes(t.category)).reduce((s, t) => s + t.amount, 0)
    const necessaryTotal     = transactions.filter(t => !DISCRETIONARY.includes(t.category)).reduce((s, t) => s + t.amount, 0)
    const totalSpend         = discretionaryTotal + necessaryTotal

    const emotionalTotal = transactions.filter(t => EMOTIONAL_MOODS.includes(t.mood)).reduce((s, t) => s + t.amount, 0)
    const calmTotal      = transactions.filter(t => !EMOTIONAL_MOODS.includes(t.mood)).reduce((s, t) => s + t.amount, 0)

    return {
      spendingByMood, frequencyByMood, spendingByCategory,
      topMood, topCategory, secondMood, secondCategory,
      timeline,
      discretionaryTotal, necessaryTotal, totalSpend,
      emotionalTotal, calmTotal,
      mostTriggering: frequencyByMood[0],
      mostExpensive:  spendingByMood[0],
    }
  }, [transactions])
}

// ─── Card 1 — Emotional Spending Map ─────────────────────────────────────────

function EmotionalSpendingMap({ data, showCharts }) {
  return (
    <Card colSpan={3} accentColor="#ea6890" delay={0.05}>
      <CardLabel text="Emotional Spending Map" />
      {showCharts ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.spendingByMood} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea6890" />
                <stop offset="100%" stopColor="#a89bc4" />
              </linearGradient>
            </defs>
            <XAxis dataKey="mood" tick={{ fill: '#a89bc4', fontFamily: 'Inter', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#a89bc4', fontFamily: 'Inter', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '₹' + v} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="url(#barGradient)" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="amount"
                content={(props) => {
                  if (props.index !== 0) return null
                  return (
                    <text x={props.x + props.width / 2} y={props.y - 6} textAnchor="middle"
                      fill="#ea6890" fontFamily="'Press Start 2P', monospace" fontSize={6}>
                      TOP TRIGGER
                    </text>
                  )
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {data.spendingByMood.slice(0, 3).map(({ mood, amount }) => (
            <div key={mood} style={{
              backgroundColor: 'rgba(234,104,144,0.08)',
              border: '1px solid rgba(234,104,144,0.25)',
              borderRadius: '8px', padding: '12px 20px',
            }}>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#ea6890', margin: '0 0 8px' }}>{mood}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 700, color: '#efe3ff', margin: 0 }}>₹{amount.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Card 2 — Most Triggering Emotion ────────────────────────────────────────

function MostTriggeringCard({ data }) {
  const { mostTriggering, frequencyByMood } = data
  const symbol = MOOD_SYMBOLS[mostTriggering?.mood] ?? MOOD_SYMBOLS.default
  const pct = mostTriggering ? ((mostTriggering.count / frequencyByMood.reduce((s, m) => s + m.count, 0)) * 100).toFixed(0) : 0

  return (
    <Card colSpan={1} accentColor="#a89bc4" delay={0.1}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,104,144,0.13), transparent)', filter: 'blur(30px)', pointerEvents: 'none' }} />
      <CardLabel text="Most Triggering Emotion" />
      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '24px', color: '#ea6890', margin: '0 0 10px' }}>{symbol}</p>
      <p style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: '12px',
        background: 'linear-gradient(135deg, #ea6890, #efe3ff)', WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        margin: '0 0 12px', lineHeight: 1.6,
      }}>{mostTriggering?.mood}</p>
      <p style={{ margin: 0 }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '36px', fontWeight: 700, color: '#efe3ff' }}>{mostTriggering?.count}</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#a89bc4', marginLeft: '6px' }}>times</span>
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(168,155,196,0.44)', margin: '6px 0 0' }}>{pct}% of your transactions</p>
    </Card>
  )
}

// ─── Card 3 — Most Expensive Emotion ─────────────────────────────────────────

function MostExpensiveCard({ data }) {
  const { mostExpensive, totalSpend } = data
  const symbol = MOOD_SYMBOLS[mostExpensive?.mood] ?? MOOD_SYMBOLS.default
  const pct = mostExpensive && totalSpend ? ((mostExpensive.amount / totalSpend) * 100).toFixed(0) : 0

  return (
    <Card colSpan={1} accentColor="#ea6890" delay={0.15}>
      <CardLabel text="Most Expensive Emotion" />
      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '24px', color: '#ea6890', margin: '0 0 10px' }}>{symbol}</p>
      <p style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: '10px',
        background: 'linear-gradient(135deg, #ea6890, #efe3ff)', WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        margin: '0 0 12px', lineHeight: 1.6,
      }}>{mostExpensive?.mood}</p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '32px', fontWeight: 700, color: '#efe3ff', margin: '0 0 6px' }}>
        ₹{mostExpensive?.amount?.toFixed(0)}
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(168,155,196,0.44)', margin: 0 }}>{pct}% of total spending</p>
    </Card>
  )
}

// ─── Card 4 — Pattern Story ───────────────────────────────────────────────────

function PatternStoryCard({ data }) {
  const { topMood, topCategory, secondMood, secondCategory } = data
  return (
    <Card colSpan={1} accentColor="#c4b5fd" delay={0.2}>
      <CardLabel text="Your Pattern Story" />
      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '48px', color: '#ea6890', opacity: 0.4, lineHeight: 1, margin: '0 0 12px' }}>"</p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#efe3ff', lineHeight: 1.8, margin: '0 0 16px' }}>
        When you feel <span style={{ color: '#ea6890', fontWeight: 600 }}>{topMood}</span>, you mostly spend on <span style={{ color: '#a89bc4', fontWeight: 600 }}>{topCategory}</span>.
      </p>
      {secondMood && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(168,155,196,0.13)', marginBottom: '14px' }} />
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(239,227,255,0.7)', lineHeight: 1.8, margin: 0 }}>
            Your second pattern: <span style={{ color: '#a89bc4' }}>{secondMood}</span> → <span style={{ color: '#c4b5fd' }}>{secondCategory}</span>
          </p>
        </>
      )}
    </Card>
  )
}

// ─── Card 5 — Spending by Category ───────────────────────────────────────────

function SpendingByCategoryCard({ data, showCharts }) {
  const { spendingByCategory, totalSpend } = data
  return (
    <Card colSpan={2} accentColor="#a89bc4" delay={0.25}>
      <CardLabel text="Spending by Category" />
      {showCharts ? (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <ResponsiveContainer width="55%" height={220}>
            <PieChart>
              <Pie
                data={spendingByCategory}
                dataKey="amount"
                nameKey="name"
                innerRadius={60} outerRadius={90}
                paddingAngle={2}
              >
                {spendingByCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label overlay */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#efe3ff', margin: '0 0 2px' }}>₹{totalSpend.toFixed(0)}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#a89bc4', margin: 0 }}>total</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {spendingByCategory.slice(0, 5).map(({ category, amount }, i) => (
                <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#a89bc4', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#efe3ff', flexShrink: 0 }}>₹{amount.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {spendingByCategory.slice(0, 5).map(({ category, amount }, i) => (
            <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ea6890', width: '16px', flexShrink: 0 }}>0{i + 1}</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#efe3ff', flex: 1 }}>{category}</span>
              <div style={{ width: '80px', height: '4px', backgroundColor: 'rgba(168,155,196,0.13)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(amount / spendingByCategory[0].amount) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length], borderRadius: '2px' }} />
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#efe3ff', fontWeight: 600, width: '56px', textAlign: 'right', flexShrink: 0 }}>₹{amount.toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Card 6 — Spending Timeline ───────────────────────────────────────────────

function SpendingTimelineCard({ data, showCharts }) {
  const { timeline } = data
  const weeklySlice = (start, end) => timeline.slice(start, end).reduce((s, d) => s + d.amount, 0)
  const thisWeek = weeklySlice(0, 7)
  const lastWeek = weeklySlice(7, 14)
  const diff = thisWeek - lastWeek

  return (
    <Card colSpan={3} accentColor="#ea6890" delay={0.3}>
      <CardLabel text="Spending Timeline" />
      {showCharts ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ea6890" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ea6890" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#a89bc4', fontFamily: 'Inter', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#a89bc4', fontFamily: 'Inter', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '₹' + v} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" stroke="#ea6890" strokeWidth={2} fill="url(#areaGradient)" dot={{ fill: '#ea6890', r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ display: 'flex', gap: '40px' }}>
          {[
            { label: 'This Week', value: thisWeek },
            { label: 'Last Week', value: lastWeek },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#a89bc4', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: 700, color: '#efe3ff', margin: 0 }}>₹{value.toFixed(0)}</p>
            </div>
          ))}
          <div style={{ alignSelf: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: diff > 0 ? '#ea6890' : '#a89bc4' }}>
              {diff > 0 ? '↑' : '↓'} ₹{Math.abs(diff).toFixed(0)}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Card 7 — Calm vs Emotional ──────────────────────────────────────────────

function CalmVsEmotionalCard({ data }) {
  const { calmTotal, emotionalTotal, totalSpend } = data
  const calmPct   = totalSpend ? (calmTotal / totalSpend) * 100 : 50
  return (
    <Card colSpan={1} accentColor="#c4b5fd" delay={0.35}>
      <CardLabel text="Calm vs Emotional" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 700, color: '#c4b5fd', margin: '0 0 4px' }}>₹{calmTotal.toFixed(0)}</p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#a89bc4', margin: 0 }}>calm</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 700, color: '#ea6890', margin: '0 0 4px' }}>₹{emotionalTotal.toFixed(0)}</p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#a89bc4', margin: 0 }}>emotional</p>
        </div>
      </div>
      <div style={{ width: '100%', height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${calmPct}%`, backgroundColor: '#c4b5fd', transition: 'width 0.6s ease' }} />
        <div style={{ flex: 1, backgroundColor: '#ea6890' }} />
      </div>
    </Card>
  )
}

// ─── Card 8 — Discretionary vs Necessary ─────────────────────────────────────

function DiscretionaryCard({ data }) {
  const { discretionaryTotal, necessaryTotal, totalSpend } = data
  const discPct = totalSpend ? ((discretionaryTotal / totalSpend) * 100).toFixed(0) : 0
  const necPct  = totalSpend ? ((necessaryTotal / totalSpend) * 100).toFixed(0) : 0

  return (
    <Card colSpan={2} accentColor="#a89bc4" delay={0.4}>
      <CardLabel text="Discretionary vs Necessary" />
      <div style={{ display: 'flex', gap: '40px', marginBottom: '16px' }}>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '36px', fontWeight: 700, color: '#ea6890', margin: '0 0 4px' }}>{discPct}%</p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#a89bc4', margin: 0 }}>discretionary</p>
        </div>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '36px', fontWeight: 700, color: '#a89bc4', margin: '0 0 4px' }}>{necPct}%</p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#a89bc4', margin: 0 }}>necessary</p>
        </div>
      </div>
      <div style={{ width: '100%', height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex', marginBottom: '12px' }}>
        <div style={{ width: `${discPct}%`, backgroundColor: '#ea6890', transition: 'width 0.6s ease' }} />
        <div style={{ flex: 1, backgroundColor: '#a89bc4' }} />
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(168,155,196,0.25)', fontStyle: 'italic', margin: 0 }}>
        Nudges apply to discretionary spending only
      </p>
    </Card>
  )
}

// ─── PatternsScreen ───────────────────────────────────────────────────────────

export default function PatternsScreen() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)

  const user               = JSON.parse(localStorage.getItem('user') || '{}')
  const communicationStyle = user?.communication_style || 'Brief'
  const showCharts         = communicationStyle.includes('Visual')
  const showDetail         = communicationStyle === 'Detailed' || communicationStyle === 'Visual + Detailed'  // eslint-disable-line no-unused-vars

  useEffect(() => {
    api.getTransactions()
      .then(data => { setTransactions(data?.transactions || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const patternData = usePatternData(transactions)

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

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1080px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <span onClick={() => navigate('/dashboard')} style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#a89bc4', cursor: 'pointer' }}>←</span>
          <p style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: '10px',
            background: 'linear-gradient(135deg, #ea6890, #efe3ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            margin: 0,
          }}>MY PATTERNS</p>
          <span style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#ea6890',
            backgroundColor: 'rgba(234,104,144,0.13)',
            border: '1px solid rgba(234,104,144,0.38)',
            borderRadius: '20px', padding: '4px 10px',
          }}>{transactions.length}</span>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', paddingTop: '80px' }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#a89bc4', letterSpacing: '0.1em' }}>LOADING...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !patternData && (
          <div style={{ textAlign: 'center', paddingTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#a89bc4', margin: 0 }}>NO PATTERNS YET</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'rgba(168,155,196,0.44)', margin: 0 }}>Log some transactions to see your patterns.</p>
            <span onClick={() => navigate('/log')} style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ea6890', cursor: 'pointer' }}>
              Log your first transaction →
            </span>
          </div>
        )}

        {/* Bento grid */}
        {!loading && patternData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}>
            <EmotionalSpendingMap   data={patternData} showCharts={showCharts} />
            <MostTriggeringCard     data={patternData} />
            <MostExpensiveCard      data={patternData} />
            <PatternStoryCard       data={patternData} />
            <SpendingByCategoryCard data={patternData} showCharts={showCharts} />
            <SpendingTimelineCard   data={patternData} showCharts={showCharts} />
            <CalmVsEmotionalCard    data={patternData} />
            <DiscretionaryCard      data={patternData} />
          </div>
        )}
      </div>
    </div>
  )
}
