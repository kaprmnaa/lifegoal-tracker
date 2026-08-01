import { daysAgoISO, todayISO } from './dateUtils.js'
import { isScheduledOn } from './schedule.js'

// logs: array of { log_date, completed }
// Menghitung persentase konsistensi dari window hari terakhir, tapi hanya
// menghitung hari-hari yang memang dijadwalkan untuk habit ini (daily/weekly/monthly).
export function computeConsistency(habit, logs, createdAt, windowDays = 30) {
  const doneDates = new Set(
    logs.filter((l) => l.completed).map((l) => l.log_date)
  )

  const createdISO = createdAt ? createdAt.slice(0, 10) : daysAgoISO(windowDays)
  const daysSinceCreated = Math.min(
    windowDays,
    Math.max(1, dayDiff(createdISO, todayISO()) + 1)
  )

  let doneCount = 0
  let scheduledCount = 0
  for (let i = 0; i < daysSinceCreated; i++) {
    const day = daysAgoISO(i)
    if (!isScheduledOn(habit, day)) continue
    scheduledCount++
    if (doneDates.has(day)) doneCount++
  }

  const percent = scheduledCount > 0 ? Math.round((doneCount / scheduledCount) * 100) : 0
  return {
    percent,
    doneCount,
    totalDays: scheduledCount,
    ...consistencyLevel(percent),
  }
}

export function consistencyLevel(percent) {
  if (percent >= 80) {
    return { label: 'Sangat Disiplin', tone: 'mint' }
  }
  if (percent >= 50) {
    return { label: 'Cukup Konsisten', tone: 'gold' }
  }
  if (percent >= 20) {
    return { label: 'Perlu Ditingkatkan', tone: 'ember' }
  }
  return { label: 'Belum Konsisten', tone: 'danger' }
}

// Streak = jumlah hari terjadwal berturut-turut yang sudah dicentang,
// mundur dari hari ini (hari yang tidak dijadwalkan dilewati, tidak memutus streak).
export function computeStreak(habit, logs) {
  const doneDates = new Set(
    logs.filter((l) => l.completed).map((l) => l.log_date)
  )
  let streak = 0
  let cursor = todayISO()

  // Kalau hari ini terjadwal tapi belum dicentang, mulai hitung dari kemarin.
  if (isScheduledOn(habit, cursor) && !doneDates.has(cursor)) {
    cursor = daysAgoISO(1)
  }

  for (let i = 0; i < 3650; i++) {
    if (isScheduledOn(habit, cursor)) {
      if (doneDates.has(cursor)) {
        streak++
      } else {
        break
      }
    }
    const d = new Date(cursor + 'T00:00:00')
    d.setDate(d.getDate() - 1)
    cursor = toISOLocal(d)
  }
  return streak
}

function toISOLocal(d) {
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

function dayDiff(fromISO, toISOStr) {
  const a = new Date(fromISO + 'T00:00:00')
  const b = new Date(toISOStr + 'T00:00:00')
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}
