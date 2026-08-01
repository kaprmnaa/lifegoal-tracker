import { useState } from 'react'
import StatsChart from './StatsChart.jsx'
import { ConsistencyTag } from './ConsistencyBadge.jsx'
import { computeConsistency, computeStreak } from '../utils/consistency.js'
import { todayISO } from '../utils/dateUtils.js'
import { isScheduledOn, periodShortLabel, periodIcon, periodDetailLabel } from '../utils/schedule.js'

export default function HabitDetailModal({
  habit,
  logs,
  todos,
  onClose,
  onEdit,
  onDelete,
  onToggleToday,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}) {
  const [newTodo, setNewTodo] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busyTodo, setBusyTodo] = useState(false)

  const consistency = computeConsistency(habit, logs, habit.created_at)
  const streak = computeStreak(habit, logs)
  const today = todayISO()
  const doneToday = logs.some((l) => l.log_date === today && l.completed)
  const doneTodoCount = todos.filter((t) => t.is_done).length
  const scheduledToday = isScheduledOn(habit, today)
  const period = habit.period || 'daily'

  async function handleAddTodo(e) {
    e.preventDefault()
    const text = newTodo.trim()
    if (!text) return
    setBusyTodo(true)
    try {
      await onAddTodo(habit.id, text)
      setNewTodo('')
    } finally {
      setBusyTodo(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await onDelete(habit.id)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3>Detail Habit</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">✕</button>
        </div>

        <div className="detail-hero">
          <div className="icon-wrap" style={{ background: `${habit.color}22`, color: habit.color }}>
            {habit.icon}
          </div>
          <div>
            <h3>{habit.name}</h3>
            {habit.goal && <div className="goal">Tujuan: {habit.goal}</div>}
            <div className="reference">
              {periodIcon(period)} {periodShortLabel(period)}
              {period !== 'daily' ? ` · ${periodDetailLabel(habit)}` : ''}
              {habit.reference ? ` · ${habit.reference}` : ''}
            </div>
          </div>
        </div>

        <div className="stat-row">
          <div className="stat">
            <div className="n">{streak}</div>
            <div className="l">Streak (hari)</div>
          </div>
          <div className="stat">
            <div className="n">{consistency.doneCount}/{consistency.totalDays}</div>
            <div className="l">Hari tercapai</div>
          </div>
          <div className="stat">
            <div className="n">{doneTodoCount}/{todos.length || 0}</div>
            <div className="l">Checklist</div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <ConsistencyTag percent={consistency.percent} label={consistency.label} tone={consistency.tone} />
        </div>

        <div className="chart-card">
          <div className="chart-title">Tren konsistensi 14 hari terakhir</div>
          <StatsChart logs={logs} days={14} color={habit.color} />
        </div>

        <button
          className="btn-primary"
          style={doneToday ? { background: 'linear-gradient(135deg, var(--mint), #34b87c)', color: '#06251A' } : undefined}
          onClick={() => scheduledToday && onToggleToday(habit.id)}
          disabled={!scheduledToday}
        >
          {!scheduledToday
            ? 'Tidak dijadwalkan hari ini'
            : doneToday
              ? '✓ Selesai hari ini'
              : 'Tandai selesai hari ini'}
        </button>

        <div className="section-header" style={{ marginTop: 24 }}>
          <h2>Checklist / To-do</h2>
        </div>

        <form className="add-todo-row" onSubmit={handleAddTodo}>
          <input
            type="text"
            placeholder="cth: Bench press 4x8"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <button type="submit" disabled={busyTodo} aria-label="Tambah checklist">+</button>
        </form>

        <div className="todo-list">
          {todos.length === 0 && (
            <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Belum ada item checklist untuk habit ini.</p>
          )}
          {todos.map((t) => (
            <div key={t.id} className={`todo-item${t.is_done ? ' done' : ''}`}>
              <button
                className={`todo-check${t.is_done ? ' done' : ''}`}
                onClick={() => onToggleTodo(habit.id, t.id, t.is_done)}
                aria-label="Toggle checklist"
              >
                {t.is_done ? '✓' : ''}
              </button>
              <span className="todo-text">{t.text}</span>
              <button className="todo-del" onClick={() => onDeleteTodo(habit.id, t.id)} aria-label="Hapus item">
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="detail-actions">
          <button className="btn-secondary" onClick={() => onEdit(habit)}>Edit</button>
          <button className="btn-danger-ghost" onClick={handleDelete}>
            {confirmDelete ? 'Yakin hapus?' : 'Hapus Habit'}
          </button>
        </div>
      </div>
    </div>
  )
}
