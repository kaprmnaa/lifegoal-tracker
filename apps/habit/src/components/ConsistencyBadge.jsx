const TONE_VARS = {
  mint: 'var(--mint)',
  gold: 'var(--gold)',
  ember: 'var(--ember)',
  danger: 'var(--danger)',
}
const TONE_SOFT = {
  mint: 'var(--mint-soft)',
  gold: 'var(--gold-soft)',
  ember: 'var(--ember-soft)',
  danger: 'var(--danger-soft)',
}

export function ConsistencyTag({ percent, label, tone }) {
  return (
    <span
      className="consistency-tag"
      style={{ color: TONE_VARS[tone], background: TONE_SOFT[tone] }}
    >
      {label} · {percent}%
    </span>
  )
}

export function ConsistencyRing({ percent, tone, size = 40 }) {
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c

  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE_VARS[tone]}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .4s ease' }}
        />
      </svg>
      <div className="ring-label" style={{ color: TONE_VARS[tone] }}>
        {percent}
      </div>
    </div>
  )
}
