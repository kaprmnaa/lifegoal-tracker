import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { todayISO, daysAgoISO } from '../utils/dateUtils.js'
import { useAuth } from '../context/AuthContext.jsx'

const LOG_WINDOW_DAYS = 30

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])
  const [todosByHabit, setTodosByHabit] = useState({})
  const [logsByHabit, setLogsByHabit] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data: habitsData, error: habitsErr } = await supabase
        .from('hbits_habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (habitsErr) throw habitsErr

      const habitIds = (habitsData || []).map((h) => h.id)

      let todosData = []
      let logsData = []

      if (habitIds.length) {
        const [{ data: t, error: tErr }, { data: l, error: lErr }] = await Promise.all([
          supabase.from('hbits_habit_todos').select('*').in('habit_id', habitIds).order('created_at', { ascending: true }),
          supabase
            .from('hbits_habit_logs')
            .select('*')
            .in('habit_id', habitIds)
            .gte('log_date', daysAgoISO(LOG_WINDOW_DAYS)),
        ])
        if (tErr) throw tErr
        if (lErr) throw lErr
        todosData = t || []
        logsData = l || []
      }

      const todosMap = {}
      for (const t of todosData) {
        ;(todosMap[t.habit_id] ||= []).push(t)
      }

      const logsMap = {}
      for (const l of logsData) {
        ;(logsMap[l.habit_id] ||= []).push(l)
      }

      setHabits(habitsData || [])
      setTodosByHabit(todosMap)
      setLogsByHabit(logsMap)
    } catch (err) {
      setError(err.message || 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const addHabit = useCallback(async (payload) => {
    const { data, error: err } = await supabase
      .from('hbits_habits')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()
    if (err) throw err
    setHabits((prev) => [data, ...prev])
    return data
  }, [user])

  const updateHabit = useCallback(async (id, payload) => {
    const { data, error: err } = await supabase
      .from('hbits_habits')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setHabits((prev) => prev.map((h) => (h.id === id ? data : h)))
    return data
  }, [])

  const deleteHabit = useCallback(async (id) => {
    const { error: err } = await supabase.from('hbits_habits').delete().eq('id', id)
    if (err) throw err
    setHabits((prev) => prev.filter((h) => h.id !== id))
    setTodosByHabit((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setLogsByHabit((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const toggleToday = useCallback(async (habitId) => {
    const day = todayISO()
    const existing = (logsByHabit[habitId] || []).find((l) => l.log_date === day)

    if (existing) {
      const { error: err } = await supabase.from('hbits_habit_logs').delete().eq('id', existing.id)
      if (err) throw err
      setLogsByHabit((prev) => ({
        ...prev,
        [habitId]: (prev[habitId] || []).filter((l) => l.id !== existing.id),
      }))
    } else {
      const { data, error: err } = await supabase
        .from('hbits_habit_logs')
        .insert({ habit_id: habitId, log_date: day, completed: true })
        .select()
        .single()
      if (err) throw err
      setLogsByHabit((prev) => ({
        ...prev,
        [habitId]: [...(prev[habitId] || []), data],
      }))
    }
  }, [logsByHabit])

  const addTodo = useCallback(async (habitId, text) => {
    const { data, error: err } = await supabase
      .from('hbits_habit_todos')
      .insert({ habit_id: habitId, text })
      .select()
      .single()
    if (err) throw err
    setTodosByHabit((prev) => ({
      ...prev,
      [habitId]: [...(prev[habitId] || []), data],
    }))
    return data
  }, [])

  const toggleTodo = useCallback(async (habitId, todoId, isDone) => {
    const { data, error: err } = await supabase
      .from('hbits_habit_todos')
      .update({ is_done: !isDone })
      .eq('id', todoId)
      .select()
      .single()
    if (err) throw err
    setTodosByHabit((prev) => ({
      ...prev,
      [habitId]: (prev[habitId] || []).map((t) => (t.id === todoId ? data : t)),
    }))
  }, [])

  const deleteTodo = useCallback(async (habitId, todoId) => {
    const { error: err } = await supabase.from('hbits_habit_todos').delete().eq('id', todoId)
    if (err) throw err
    setTodosByHabit((prev) => ({
      ...prev,
      [habitId]: (prev[habitId] || []).filter((t) => t.id !== todoId),
    }))
  }, [])

  return {
    habits,
    todosByHabit,
    logsByHabit,
    loading,
    error,
    refresh: fetchAll,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleToday,
    addTodo,
    toggleTodo,
    deleteTodo,
  }
}
