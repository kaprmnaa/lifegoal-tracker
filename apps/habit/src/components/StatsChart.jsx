import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Dot } from 'recharts'
import { lastNDays, shortLabel } from '../utils/dateUtils.js'

function GlowDot(props) {
  const { cx, cy, index, dataLength } = props
  if (index !== dataLength - 1) return <Dot {...props} r={0} />
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill="var(--ember)" opacity={0.25} />
      <circle cx={cx} cy={cy} r={3.5} fill="var(--ember)" stroke="#0B0F14" strokeWidth={1.5} />
    </g>
  )
}

export default function StatsChart({ logs, days = 14, color = 'var(--ember)' }) {
  const range = lastNDays(days)
  const doneDates = new Set((logs || []).filter((l) => l.completed).map((l) => l.log_date))

  const data = range.map((iso, idx) => {
    // running 7-day completion rate ending at this day, for a smoother "pulse"
    let windowDone = 0
    let windowTotal = 0
    for (let i = Math.max(0, idx - 6); i <= idx; i++) {
      windowTotal++
      if (doneDates.has(range[i])) windowDone++
    }
    return {
      date: iso,
      label: shortLabel(iso),
      value: Math.round((windowDone / windowTotal) * 100),
      done: doneDates.has(iso) ? 1 : 0,
    }
  })

  return (
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 18, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-soft)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-faint)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={Math.ceil(days / 6)}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--text-faint)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            formatter={(value) => [`${value}%`, 'Konsistensi 7 hari']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={(props) => <GlowDot {...props} dataLength={data.length} />}
            activeDot={{ r: 5, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
