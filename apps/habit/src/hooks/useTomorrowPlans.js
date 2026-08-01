import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import { daysAgoISO } from '../utils/dateUtils.js'

function tomorrowISO() {
  return daysAgoISO(-1)
}

export function useTomorrowPlans() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPlans = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('hbits_tomorrow_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', tomorrowISO())
        .order('created_at', { ascending: true })
      if (err) throw err
      setPlans(data || [])
    } catch (err) {
      setError(err.message || 'Gagal memuat rencana besok.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const addPlan = useCallback(async (habitId, planText) => {
    const { data, error: err } = await supabase
      .from('hbits_tomorrow_plans')
      .insert({
        user_id: user.id,
        habit_id: habitId || null,
        plan: planText,
        plan_date: tomorrowISO(),
      })
      .select()
      .single()
    if (err) throw err
    setPlans((prev) => [...prev, data])
    return data
  }, [user])

  const togglePlan = useCallback(async (planId, completed) => {
    const { data, error: err } = await supabase
      .from('hbits_tomorrow_plans')
      .update({ completed: !completed })
      .eq('id', planId)
      .select()
      .single()
    if (err) throw err
    setPlans((prev) => prev.map((p) => (p.id === planId ? data : p)))
  }, [])

  const deletePlan = useCallback(async (planId) => {
    const { error: err } = await supabase.from('hbits_tomorrow_plans').delete().eq('id', planId)
    if (err) throw err
    setPlans((prev) => prev.filter((p) => p.id !== planId))
  }, [])

  return { plans, loading, error, addPlan, togglePlan, deletePlan }
}
