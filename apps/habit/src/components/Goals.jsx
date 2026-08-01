import { useState } from 'react'
import { addDaysToISO, shortLabel, todayISO } from '../utils/dateUtils.js'

export default function Goals({
  goals,
  tasksByGoal,
  checkinsByTask,
  onAddGoal,
  onDeleteGoal,
  onSetGoalStatus,
  onAddTask,
  onDeleteTask,
  onResetTask,
  onToggleCheckin,
}) {
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDesc, setGoalDesc] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleAddGoal(e) {
    e.preventDefault()
    const title = goalTitle.trim()
    if (!title) return
    setBusy(true)
    try {
      await onAddGoal({ title, description: goalDesc.trim() || null, status: 'active' })
      setGoalTitle('')
      setGoalDesc('')
      setShowAddGoal(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2>Goals</h2>
        <button className="text-link-btn" onClick={() => setShowAddGoal((v) => !v)}>
          {showAddGoal ? 'Batal' : '+ Goal Baru'}
        </button>
      </div>

      {showAddGoal && (
        <form className="goal-add-form" onSubmit={handleAddGoal}>
          <input
            type="text"
            placeholder="Judul goal, cth: Badan Ideal 2026"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            autoFocus
          />
          <textarea
            placeholder="Deskripsi (opsional)"
            value={goalDesc}
            onChange={(e) => setGoalDesc(e.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Buat Goal'}
          </button>
        </form>
      )}

      {goals.length === 0 && !showAddGoal && (
        <div className="empty-state" style={{ padding: '32px 16px' }}>
          <div className="glyph">🎯</div>
          <h3>Belum ada goal</h3>
          <p>Buat goal besar, lalu pecah jadi tantangan harian bertarget.</p>
        </div>
      )}

      <div className="goal-list">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            tasks={tasksByGoal[goal.id] || []}
            checkinsByTask={checkinsByTask}
            onDeleteGoal={onDeleteGoal}
            onSetGoalStatus={onSetGoalStatus}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onResetTask={onResetTask}
            onToggleCheckin={onToggleCheckin}
          />
        ))}
      </div>
    </div>
  )
}

function GoalCard({
  goal,
  tasks,
  checkinsByTask,
  onDeleteGoal,
  onSetGoalStatus,
  onAddTask,
  onDeleteTask,
  onResetTask,
  onToggleCheckin,
}) {
  const [expanded, setExpanded] = useState(true)
  const [showAddTask, setShowAddTask] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const totalDone = tasks.reduce((sum, t) => sum + (checkinsByTask[t.id]?.length || 0), 0)
  const totalTarget = tasks.reduce((sum, t) => sum + t.duration_days, 0)
  const overallPercent = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await onDeleteGoal(goal.id)
  }

  return (
    <div className="goal-card">
      <div className="goal-card-header" onClick={() => setExpanded((v) => !v)}>
        <div>
          <div className="goal-title-row">
            <span className="goal-title">{goal.title}</span>
            {goal.status === 'completed' && <span className="goal-status-badge">Selesai</span>}
          </div>
          {goal.description && <div className="goal-desc">{goal.description}</div>}
        </div>
        <span className="goal-expand-icon">{expanded ? '▾' : '▸'}</span>
      </div>

      {tasks.length > 0 && (
        <div className="goal-progress-bar">
          <div className="goal-progress-fill" style={{ width: `${overallPercent}%` }} />
        </div>
      )}

      {expanded && (
        <div className="goal-body">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              goalId={goal.id}
              task={task}
              checkins={checkinsByTask[task.id] || []}
              onDelete={onDeleteTask}
              onReset={onResetTask}
              onToggleCheckin={onToggleCheckin}
            />
          ))}

          {showAddTask ? (
            <AddTaskForm
              goalId={goal.id}
              onAddTask={onAddTask}
              onDone={() => setShowAddTask(false)}
            />
          ) : (
            <button className="btn-secondary" onClick={() => setShowAddTask(true)}>
              + Tambah Tantangan
            </button>
          )}

          <div className="goal-footer-actions">
            {goal.status !== 'completed' ? (
              <button className="text-link-btn" onClick={() => onSetGoalStatus(goal.id, 'completed')}>
                Tandai goal selesai
              </button>
            ) : (
              <button className="text-link-btn" onClick={() => onSetGoalStatus(goal.id, 'active')}>
                Buka kembali
              </button>
            )}
            <button className="text-link-btn danger" onClick={handleDelete}>
              {confirmDelete ? 'Yakin hapus goal?' : 'Hapus goal'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddTaskForm({ goalId, onAddTask, onDone }) {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    setBusy(true)
    try {
      await onAddTask(goalId, {
        title: t,
        duration_days: Math.max(1, Number(duration) || 1),
        start_date: todayISO(),
        status: 'active',
      })
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="task-add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nama tantangan, cth: Lari pagi"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <div className="task-add-row">
        <label>Durasi (hari)</label>
        <input
          type="number"
          min="1"
          max="365"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>
      <button className="btn-primary" type="submit" disabled={busy}>
        {busy ? 'Menyimpan…' : 'Tambah Tantangan'}
      </button>
    </form>
  )
}

function TaskRow({ goalId, task, checkins, onDelete, onReset, onToggleCheckin }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const doneDates = new Set(checkins.map((c) => c.check_date))
  const completedDays = checkins.length
  const percent = Math.round((completedDays / task.duration_days) * 100)
  const today = todayISO()

  const days = Array.from({ length: task.duration_days }, (_, i) => addDaysToISO(task.start_date, i))

  async function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    await onReset(goalId, task.id)
    setConfirmReset(false)
  }

  return (
    <div className="task-row">
      <div className="task-row-header">
        <div>
          <span className="task-title">{task.title}</span>
          {task.status === 'completed' && <span className="goal-status-badge">Tuntas</span>}
        </div>
        <span className="task-progress-text">{completedDays}/{task.duration_days} hari · {percent}%</span>
      </div>

      <div className="goal-progress-bar small">
        <div className="goal-progress-fill" style={{ width: `${Math.min(100, percent)}%` }} />
      </div>

      <div className="day-dot-row">
        {days.map((d, idx) => {
          const isDone = doneDates.has(d)
          const isFuture = d > today
          return (
            <button
              key={d}
              type="button"
              className={`day-dot${isDone ? ' done' : ''}${isFuture ? ' future' : ''}`}
              title={`${shortLabel(d)}${isDone ? ' · selesai' : ''}`}
              onClick={() => !isFuture && onToggleCheckin(goalId, task, d)}
              disabled={isFuture}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>

      <div className="task-row-actions">
        <button className="text-link-btn" onClick={handleReset}>
          {confirmReset ? 'Yakin reset?' : 'Reset'}
        </button>
        <button className="text-link-btn danger" onClick={() => onDelete(goalId, task.id)}>
          Hapus
        </button>
      </div>
    </div>
  )
}
