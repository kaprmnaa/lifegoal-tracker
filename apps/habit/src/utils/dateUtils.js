export function todayISO() {
  return toISO(new Date())
}

export function toISO(date) {
  const d = new Date(date)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function daysAgoISO(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toISO(d)
}

export function lastNDays(n) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    out.push(daysAgoISO(i))
  }
  return out
}

export function addDaysToISO(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function shortLabel(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

export function weekdayLabel(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'short' })
}
