import { useMemo, useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import { useHabits } from './hooks/useHabits.js'
import { useTomorrowPlans } from './hooks/useTomorrowPlans.js'
import { useGoals } from './hooks/useGoals.js'
import Topbar from './components/Layout.jsx'
import HabitList from './components/HabitList.jsx'
import HabitFormModal from './components/HabitFormModal.jsx'
import HabitDetailModal from './components/HabitDetailModal.jsx'
import TomorrowPlan from './components/TomorrowPlan.jsx'
import Goals from './components/Goals.jsx'
import Login from './components/Login.jsx'
import { computeConsistency } from './utils/consistency.js'
import { todayISO } from './utils/dateUtils.js'

export default function App() {
  const { user, profile, loading: authLoading, signOut } = useAuth()

  if (authLoading) {
    return <div className="center-loading">Memuat<span className="loading-dot" style={{ marginLeft: 6 }} /></div>
  }

  if (!user) {
    return (
      <div className="app-shell">
        <Login />
      </div>
    )
  }

  return <Dashboard username={profile?.username} onLogout={signOut} />
}

function Dashboard({ username, onLogout }) {
  const {
    habits,
    todosByHabit,
    logsByHabit,
    loading,
    error,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleToday,
    addTodo,
    toggleTodo,
    deleteTodo,
  } = useHabits()

  const {
    plans: tomorrowPlans,
    addPlan: addTomorrowPlan,
    togglePlan: toggleTomorrowPlan,
    deletePlan: deleteTomorrowPlan,
  } = useTomorrowPlans()

  const {
    goals,
    tasksByGoal,
    checkinsByTask,
    addGoal,
    deleteGoal,
    setGoalStatus,
    addTask,
    deleteTask,
    resetTask,
    toggleCheckin,
  } = useGoals()

  const [formOpen, setFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [activeHabitId, setActiveHabitId] = useState(null)

  const activeHabit = habits.find((h) => h.id === activeHabitId) || null

  const overview = useMemo(() => {
    if (!habits.length) return { total: 0, doneToday: 0, avg: 0 }
    const today = todayISO()
    let doneToday = 0
    let sum = 0
    for (const h of habits) {
      const logs = logsByHabit[h.id] || []
      if (logs.some((l) => l.log_date === today && l.completed)) doneToday++
      sum += computeConsistency(h, logs, h.created_at).percent
    }
    return {
      total: habits.length,
      doneToday,
      avg: Math.round(sum / habits.length),
    }
  }, [habits, logsByHabit])

  function openCreate() {
    setEditingHabit(null)
    setFormOpen(true)
  }

  function openEdit(habit) {
    setEditingHabit(habit)
    setFormOpen(true)
    setActiveHabitId(null)
  }

  async function handleFormSubmit(payload) {
    if (editingHabit) {
      await updateHabit(editingHabit.id, payload)
    } else {
      await addHabit(payload)
    }
  }

  return (
    <div className="app-shell">
      <Topbar username={username} onLogout={onLogout} />

      <div className="content">
        <div className="overview">
          <div className="overview-cell">
            <div className="val">{overview.total}</div>
            <div className="label">Total Habit</div>
          </div>
          <div className="overview-cell">
            <div className="val">{overview.doneToday}/{overview.total || 0}</div>
            <div className="label">Selesai Hari Ini</div>
          </div>
          <div className="overview-cell">
            <div className="val">{overview.avg}%</div>
            <div className="label">Rata-rata Konsisten</div>
          </div>
        </div>

        <div className="section-header">
          <h2>Habit Kamu</h2>
        </div>

        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div className="empty-state">
            <div className="glyph">⏳</div>
            <p>Memuat habit…</p>
          </div>
        ) : (
          <HabitList
            habits={habits}
            logsByHabit={logsByHabit}
            onOpen={(h) => setActiveHabitId(h.id)}
            onToggleToday={toggleToday}
          />
        )}

        <div className="section-divider" />

        <TomorrowPlan
          habits={habits}
          plans={tomorrowPlans}
          onAdd={addTomorrowPlan}
          onToggle={toggleTomorrowPlan}
          onDelete={deleteTomorrowPlan}
        />

        <div className="section-divider" />

        <Goals
          goals={goals}
          tasksByGoal={tasksByGoal}
          checkinsByTask={checkinsByTask}
          onAddGoal={addGoal}
          onDeleteGoal={deleteGoal}
          onSetGoalStatus={setGoalStatus}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onResetTask={resetTask}
          onToggleCheckin={toggleCheckin}
        />
      </div>

      <div className="fab">
        <button onClick={openCreate} aria-label="Tambah habit">+</button>
      </div>

      {formOpen && (
        <HabitFormModal
          initial={editingHabit}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {activeHabit && (
        <HabitDetailModal
          habit={activeHabit}
          logs={logsByHabit[activeHabit.id] || []}
          todos={todosByHabit[activeHabit.id] || []}
          onClose={() => setActiveHabitId(null)}
          onEdit={openEdit}
          onDelete={deleteHabit}
          onToggleToday={toggleToday}
          onAddTodo={addTodo}
          onToggleTodo={toggleTodo}
          onDeleteTodo={deleteTodo}
        />
      )}
    </div>
  )
}
