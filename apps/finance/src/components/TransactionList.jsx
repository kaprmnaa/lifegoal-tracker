import { formatIDR, formatDate, shortHash } from '../utils/format'

export default function TransactionList({ transactions, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <svg width="72" height="72" viewBox="0 0 72 72" className="empty-illustration">
          <g fill="none" stroke="var(--border-strong)" strokeWidth="1.5">
            <rect x="14" y="14" width="18" height="18" rx="4" className="drift-a" />
            <rect x="40" y="14" width="18" height="18" rx="4" className="drift-b" />
            <rect x="27" y="40" width="18" height="18" rx="4" className="drift-c" />
            <line x1="32" y1="23" x2="40" y2="23" strokeDasharray="3 3" />
            <line x1="23" y1="32" x2="34" y2="43" strokeDasharray="3 3" />
            <line x1="49" y1="32" x2="40" y2="43" strokeDasharray="3 3" />
          </g>
          <circle cx="23" cy="23" r="2.5" fill="var(--mint)" className="node-pulse" />
          <circle cx="49" cy="23" r="2.5" fill="var(--cyan)" className="node-pulse" style={{ animationDelay: '0.5s' }} />
          <circle cx="36" cy="49" r="2.5" fill="var(--down)" className="node-pulse" style={{ animationDelay: '1s' }} />
        </svg>
        <div style={{ marginTop: 10 }}>Belum ada blok tercatat. Tambahkan pengeluaran pertamamu.</div>
      </div>
    )
  }

  const sorted = [...transactions].sort((a, b) => {
    if (a.occurred_at !== b.occurred_at) return b.occurred_at.localeCompare(a.occurred_at)
    return b.created_at.localeCompare(a.created_at)
  })

  return (
    <div className="ledger-list">
      {sorted.map((t, i) => (
        <div className="block-row slide-in" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }} key={t.id}>
          <div className="block-node expense">−</div>
          <div className="block-main">
            <div className="desc">{t.description || t.category}</div>
            <div className="meta">
              <span className="hash">{shortHash(t.id)}</span> · {t.category} · {formatDate(t.occurred_at)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="block-amount expense">−{formatIDR(t.amount)}</div>
            <button
              onClick={() => onDelete(t.id)}
              title="Hapus"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-faint)',
                cursor: 'pointer',
                fontSize: 15,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
