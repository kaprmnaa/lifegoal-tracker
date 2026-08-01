import { ConsistencyRing } from './ConsistencyBadge.jsx'
import { computeConsistency, computeStreak } from '../utils/consistency.js'
import { todayISO } from '../utils/dateUtils.js'
import { isScheduledOn, periodShortLabel, periodIcon, periodDetailLabel } from '../utils/schedule.js'

export default function HabitCard({ habit, logs, onOpen, onToggleToday }) {
  const consistency = computeConsistency(habit, logs, habit.created_at)
  const streak = computeStreak(habit, logs)
  const today = todayISO()
  const doneToday = logs.some((l) => l.log_date === today && l.completed)
  const scheduledToday = isScheduledOn(habit, today)
  const period = habit.period || 'daily'

  return (
    <div className="habit-card">
      <div
        className="icon-wrap"
        style={{ background: `${habit.color}22`, color: habit.color }}
      >
        {habit.icon}
      </div>

      <div className="body" onClick={() => onOpen(habit)}>
        <div className="name-row">
          <span className="name">{habit.name}</span>
          {habit.goal && <span className="goal-badge">{habit.goal}</span>}
        </div>
        <div className="meta-row">
          {streak > 0 && <span className="streak-flame">🔥 {streak} hari</span>}
          {streak > 0 && <span>·</span>}
          <span className="period-tag">{periodIcon(period)} {periodShortLabel(period)}</span>
          {habit.reference && <span>·</span>}
          {habit.reference && <span>{habit.reference}</span>}
        </div>
        {period !== 'daily' && (
          <div className="meta-row schedule-row">{periodDetailLabel(habit)}</div>
        )}
      </div>

      <ConsistencyRing percent={consistency.percent} tone={consistency.tone} />

      <button
        className={`check-btn${doneToday ? ' done' : ''}`}
        onClick={() => scheduledToday && onToggleToday(habit.id)}
        disabled={!scheduledToday}
        title={scheduledToday ? (doneToday ? 'Batalkan checklist hari ini' : 'Tandai selesai hari ini') : 'Tidak dijadwalkan hari ini'}
        aria-label={doneToday ? 'Batalkan checklist hari ini' : 'Tandai selesai hari ini'}
      >
        {doneToday ? '✓' : ''}
      </button>
    </div>
  )
}
