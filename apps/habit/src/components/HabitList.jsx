import HabitCard from './HabitCard.jsx'

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
    <div className="habit-list">
      {habits.map((h) => (
        <HabitCard
          key={h.id}
          habit={h}
          logs={logsByHabit[h.id] || []}
          onOpen={onOpen}
          onToggleToday={onToggleToday}
        />
      ))}
    </div>
  )
}
