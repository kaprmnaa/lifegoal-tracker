import { useState } from 'react'

export default function TomorrowPlan({ habits, plans, onAdd, onToggle, onDelete }) {
  const [habitId, setHabitId] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      await onAdd(habitId || null, trimmed)
      setText('')
      setHabitId('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2>Rencana Besok</h2>
      </div>

      <form className="plan-form" onSubmit={handleAdd}>
        <select value={habitId} onChange={(e) => setHabitId(e.target.value)}>
          <option value="">Pilih Habit (opsional)</option>
          {habits.map((h) => (
            <option key={h.id} value={h.id}>
              {h.icon} {h.name}
            </option>
          ))}
        </select>
        <div className="plan-input-row">
          <input
            type="text"
            placeholder="Rencana untuk besok…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" disabled={busy} aria-label="Tambah rencana">+</button>
        </div>
      </form>

      <div className="plan-list">
        {plans.length === 0 && (
          <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Belum ada rencana untuk besok.</p>
        )}
        {plans.map((plan) => {
          const habit = habits.find((h) => h.id === plan.habit_id)
          return (
            <div key={plan.id} className={`plan-item${plan.completed ? ' done' : ''}`}>
              <button
                className={`todo-check${plan.completed ? ' done' : ''}`}
                onClick={() => onToggle(plan.id, plan.completed)}
                aria-label="Toggle rencana"
              >
                {plan.completed ? '✓' : ''}
              </button>
              <div className="plan-text-wrap">
                <div className="plan-text">{plan.plan}</div>
                {habit && <div className="plan-habit-tag">{habit.icon} {habit.name}</div>}
              </div>
              <button className="todo-del" onClick={() => onDelete(plan.id)} aria-label="Hapus rencana">✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
