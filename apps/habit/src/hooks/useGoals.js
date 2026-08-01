import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import { todayISO } from '../utils/dateUtils.js'

export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [tasksByGoal, setTasksByGoal] = useState({})
  const [checkinsByTask, setCheckinsByTask] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data: goalsData, error: goalsErr } = await supabase
        .from('hbits_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (goalsErr) throw goalsErr

      const goalIds = (goalsData || []).map((g) => g.id)
      let tasksData = []
      let checkinsData = []

      if (goalIds.length) {
        const { data: t, error: tErr } = await supabase
          .from('hbits_goal_tasks')
          .select('*')
          .in('goal_id', goalIds)
          .order('created_at', { ascending: true })
        if (tErr) throw tErr
        tasksData = t || []

        const taskIds = tasksData.map((t) => t.id)
        if (taskIds.length) {
          const { data: c, error: cErr } = await supabase
            .from('hbits_goal_checkins')
            .select('*')
            .in('task_id', taskIds)
          if (cErr) throw cErr
          checkinsData = c || []
        }
      }

      const tasksMap = {}
      for (const t of tasksData) {
        ;(tasksMap[t.goal_id] ||= []).push(t)
      }
      const checkinsMap = {}
      for (const c of checkinsData) {
        ;(checkinsMap[c.task_id] ||= []).push(c)
      }

      setGoals(goalsData || [])
      setTasksByGoal(tasksMap)
      setCheckinsByTask(checkinsMap)
    } catch (err) {
      setError(err.message || 'Gagal memuat goals.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const addGoal = useCallback(async (payload) => {
    const { data, error: err } = await supabase
      .from('hbits_goals')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()
    if (err) throw err
    setGoals((prev) => [data, ...prev])
    return data
  }, [user])

  const deleteGoal = useCallback(async (goalId) => {
    const { error: err } = await supabase.from('hbits_goals').delete().eq('id', goalId)
    if (err) throw err
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
    setTasksByGoal((prev) => {
      const next = { ...prev }
      delete next[goalId]
      return next
    })
  }, [])

  const setGoalStatus = useCallback(async (goalId, status) => {
    const { data, error: err } = await supabase
      .from('hbits_goals')
      .update({ status })
      .eq('id', goalId)
      .select()
      .single()
    if (err) throw err
    setGoals((prev) => prev.map((g) => (g.id === goalId ? data : g)))
  }, [])

  const addTask = useCallback(async (goalId, payload) => {
    const { data, error: err } = await supabase
      .from('hbits_goal_tasks')
      .insert({ ...payload, goal_id: goalId, user_id: user.id })
      .select()
      .single()
    if (err) throw err
    setTasksByGoal((prev) => ({
      ...prev,
      [goalId]: [...(prev[goalId] || []), data],
    }))
    return data
  }, [user])

  const deleteTask = useCallback(async (goalId, taskId) => {
    const { error: err } = await supabase.from('hbits_goal_tasks').delete().eq('id', taskId)
    if (err) throw err
    setTasksByGoal((prev) => ({
      ...prev,
      [goalId]: (prev[goalId] || []).filter((t) => t.id !== taskId),
    }))
    setCheckinsByTask((prev) => {
      const next = { ...prev }
      delete next[taskId]
      return next
    })
  }, [])

  const resetTask = useCallback(async (goalId, taskId) => {
    const { error: delErr } = await supabase.from('hbits_goal_checkins').delete().eq('task_id', taskId)
    if (delErr) throw delErr
    const { data, error: err } = await supabase
      .from('hbits_goal_tasks')
      .update({ status: 'active' })
      .eq('id', taskId)
      .select()
      .single()
    if (err) throw err
    setCheckinsByTask((prev) => ({ ...prev, [taskId]: [] }))
    setTasksByGoal((prev) => ({
      ...prev,
      [goalId]: (prev[goalId] || []).map((t) => (t.id === taskId ? data : t)),
    }))
  }, [])

  const toggleCheckin = useCallback(async (goalId, task, dateISO) => {
    const existing = (checkinsByTask[task.id] || []).find((c) => c.check_date === dateISO)

    if (existing) {
      const { error: err } = await supabase.from('hbits_goal_checkins').delete().eq('id', existing.id)
      if (err) throw err
      setCheckinsByTask((prev) => ({
        ...prev,
        [task.id]: (prev[task.id] || []).filter((c) => c.id !== existing.id),
      }))
      if (task.status === 'completed') {
        const { data, error: uErr } = await supabase
          .from('hbits_goal_tasks')
          .update({ status: 'active' })
          .eq('id', task.id)
          .select()
          .single()
        if (!uErr) {
          setTasksByGoal((prev) => ({
            ...prev,
            [goalId]: (prev[goalId] || []).map((t) => (t.id === task.id ? data : t)),
          }))
        }
      }
    } else {
      const { data, error: err } = await supabase
        .from('hbits_goal_checkins')
        .insert({ task_id: task.id, user_id: user.id, check_date: dateISO })
        .select()
        .single()
      if (err) throw err
      const nextCheckins = [...(checkinsByTask[task.id] || []), data]
      setCheckinsByTask((prev) => ({ ...prev, [task.id]: nextCheckins }))

      if (nextCheckins.length >= task.duration_days && task.status !== 'completed') {
        const { data: updated, error: uErr } = await supabase
          .from('hbits_goal_tasks')
          .update({ status: 'completed' })
          .eq('id', task.id)
          .select()
          .single()
        if (!uErr) {
          setTasksByGoal((prev) => ({
            ...prev,
            [goalId]: (prev[goalId] || []).map((t) => (t.id === task.id ? updated : t)),
          }))
        }
      }
    }
  }, [checkinsByTask, user])

  return {
    goals,
    tasksByGoal,
    checkinsByTask,
    loading,
    error,
    addGoal,
    deleteGoal,
    setGoalStatus,
    addTask,
    deleteTask,
    resetTask,
    toggleCheckin,
    today: todayISO(),
  }
}
