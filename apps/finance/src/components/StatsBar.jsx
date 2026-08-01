import { formatIDR } from '../utils/format'

function rangeSum(transactions, from, to) {
  return transactions
    .filter((t) => t.occurred_at >= from && t.occurred_at < to)
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

function toKey(d) {
  return d.toISOString().slice(0, 10)
}

function deltaPct(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

export default function StatsBar({ transactions }) {
  const totalSpent = transactions.reduce((s, t) => s + Number(t.amount), 0)

  const today = new Date()
  const todayKey = toKey(today)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const spentToday = rangeSum(transactions, todayKey, toKey(new Date(today.getTime() + 86400000)))
  const spentYesterday = rangeSum(transactions, toKey(yesterday), todayKey)

  const startOfThisWeek = new Date(today)
  const dow = startOfThisWeek.getDay() === 0 ? 7 : startOfThisWeek.getDay()
  startOfThisWeek.setDate(startOfThisWeek.getDate() - (dow - 1))
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

  const spentThisWeek = rangeSum(transactions, toKey(startOfThisWeek), toKey(new Date(today.getTime() + 86400000)))
  const spentLastWeek = rangeSum(transactions, toKey(startOfLastWeek), toKey(startOfThisWeek))

  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  const spentThisMonth = rangeSum(transactions, toKey(startOfThisMonth), toKey(new Date(today.getTime() + 86400000)))
  const spentLastMonth = rangeSum(transactions, toKey(startOfLastMonth), toKey(startOfThisMonth))

  const cards = [
    { label: 'Total Keluar', value: totalSpent, delta: null },
    { label: 'Keluar Hari Ini', value: spentToday, delta: deltaPct(spentToday, spentYesterday) },
    { label: 'Keluar Minggu Ini', value: spentThisWeek, delta: deltaPct(spentThisWeek, spentLastWeek) },
    { label: 'Keluar Bulan Ini', value: spentThisMonth, delta: deltaPct(spentThisMonth, spentLastMonth) },
  ]

  return (
    <div className="stat-grid">
      {cards.map((c, i) => (
        <div className="stat-card pulse-in" style={{ animationDelay: `${i * 70}ms` }} key={c.label}>
          <div className="label">{c.label}</div>
          <div className="value">{formatIDR(c.value)}</div>
          {c.delta !== null && (
            <div className={`delta ${c.delta > 0 ? 'up' : 'down'}`}>
              {c.delta > 0 ? '▲' : '▼'} {Math.abs(c.delta).toFixed(1)}% vs periode lalu
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
