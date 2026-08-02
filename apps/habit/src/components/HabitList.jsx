import HabitCard from './HabitCard.jsx'

const GROUPS = [
  { key: 'daily', label: 'Harian' },
  { key: 'weekly', label: 'Mingguan' },
  { key: 'monthly', label: 'Bulanan' },
]

export default function HabitList({ habits, logsByHabit, onOpen, onToggleToday }) {
  if (!habits.length) {
    return (
      <div className="empty-state">
        <div className="glyph">🌱</div>
        <h3>Belum ada habit</h3>
        <p>Mulai bangun ritme harianmu.<br />Tekan tombol + untuk menambah habit pertama.</p>
      </div>
    )
  }

  return (
    <div className="habit-groups">
      {GROUPS.map((group) => {
        const items = habits.filter((h) => (h.period || 'daily') === group.key)
        if (items.length === 0) return null
        return (
          <div className="habit-group" key={group.key}>
            <div className="habit-group-label">{group.label}</div>
            <div className="habit-list">
              {items.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  logs={logsByHabit[h.id] || []}
                  onOpen={onOpen}
                  onToggleToday={onToggleToday}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
