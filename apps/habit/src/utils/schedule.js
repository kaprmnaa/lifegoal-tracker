export const WEEKDAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
export const WEEKDAY_NAMES_FULL = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

// JS Date.getDay() = 0 (Sun) .. 6 (Sat). Kita pakai format 0 (Sen) .. 6 (Min).
function toOurDayFormat(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1
}

// Apakah habit ini dijadwalkan pada tanggal (ISO) tertentu?
export function isScheduledOn(habit, iso) {
  const period = habit.period || 'daily'
  const selectedDays = habit.selected_days || []
  const date = new Date(iso + 'T00:00:00')

  if (period === 'daily') return true
  if (period === 'weekly') return selectedDays.includes(toOurDayFormat(date.getDay()))
  if (period === 'monthly') return selectedDays.includes(date.getDate())
  return true
}

export function periodShortLabel(period) {
  if (period === 'weekly') return 'Mingguan'
  if (period === 'monthly') return 'Bulanan'
  return 'Harian'
}

export function periodIcon(period) {
  if (period === 'weekly') return '🔁'
  if (period === 'monthly') return '📅'
  return '⏱️'
}

export function periodDetailLabel(habit) {
  const period = habit.period || 'daily'
  const selectedDays = habit.selected_days || []
  if (period === 'daily') return 'Setiap hari'
  if (period === 'weekly') {
    return selectedDays.length
      ? selectedDays.map((d) => WEEKDAY_NAMES[d]).join(', ')
      : 'Belum pilih hari'
  }
  if (period === 'monthly') {
    return selectedDays.length ? `Tanggal ${selectedDays.join(', ')}` : 'Belum pilih tanggal'
  }
  return ''
}
