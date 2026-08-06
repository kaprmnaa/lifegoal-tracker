const DAY = 24 * 60 * 60 * 1000

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// Mengembalikan status urgensi tugas berdasarkan deadline: 'overdue' | 'today' | 'soon' | 'later' | 'none'
export function urgencyOf(deadline, selesai) {
  if (selesai) return 'done'
  if (!deadline) return 'none'
  const today = startOfDay(new Date())
  const due = startOfDay(deadline)
  const diffDays = Math.round((due - today) / DAY)
  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays <= 2) return 'soon'
  return 'later'
}

export function formatDeadline(deadline) {
  if (!deadline) return 'Tanpa deadline'
  const due = startOfDay(deadline)
  const today = startOfDay(new Date())
  const diffDays = Math.round((due - today) / DAY)
  const label = due.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  if (diffDays === 0) return `Hari ini • ${label}`
  if (diffDays === 1) return `Besok • ${label}`
  if (diffDays === -1) return `Kemarin • ${label}`
  if (diffDays < 0) return `Telat ${Math.abs(diffDays)} hari • ${label}`
  if (diffDays > 0 && diffDays <= 7) return `${diffDays} hari lagi • ${label}`
  return label
}
