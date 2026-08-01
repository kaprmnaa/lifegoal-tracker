// Turns a list of transactions into candlestick data.
//
// Design: each candle represents one time bucket (day / week / month).
//   open  = total spent in the PREVIOUS bucket
//   close = total spent in THIS bucket
//   high  = max(open, close)
//   low   = min(open, close)
//
// Candles behave exactly like a normal price chart: the candle is "up"
// (green) when close > open — you spent MORE than the previous period —
// and "down" (red) when close < open — you spent LESS than the previous
// period. Example: Rp200rb today, Rp250rb tomorrow -> tomorrow's candle is
// green (naik). Rp200rb today, Rp150rb tomorrow -> tomorrow's candle is red
// (turun). Same rule applies to weekly and monthly buckets.

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function startOfWeek(d) {
  const date = new Date(d)
  const day = date.getDay() === 0 ? 7 : date.getDay() // Mon=1 ... Sun=7
  date.setDate(date.getDate() - (day - 1))
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function bucketKey(dateObj, mode) {
  if (mode === 'daily') return toDateKey(dateObj)
  if (mode === 'weekly') return toDateKey(startOfWeek(dateObj))
  return toDateKey(startOfMonth(dateObj))
}

function nextBucketStart(dateObj, mode) {
  const d = new Date(dateObj)
  if (mode === 'daily') d.setDate(d.getDate() + 1)
  else if (mode === 'weekly') d.setDate(d.getDate() + 7)
  else d.setMonth(d.getMonth() + 1)
  return d
}

const BUCKET_LIMIT = { daily: 21, weekly: 12, monthly: 9 }

export function buildCandles(transactions, mode) {
  const totals = new Map() // bucketKey -> total spent
  let earliest = null

  for (const t of transactions) {
    const d = new Date(`${t.occurred_at}T00:00:00`)
    if (!earliest || d < earliest) earliest = d
    const key = bucketKey(d, mode)
    totals.set(key, (totals.get(key) || 0) + Number(t.amount))
  }

  const today = new Date()
  const rangeStart = earliest ? bucketKey(earliest, mode) : bucketKey(today, mode)

  // Walk bucket by bucket from the earliest transaction to today so the
  // chart has a continuous timeline (zero-spend periods included).
  const keysInOrder = []
  let cursor =
    mode === 'daily'
      ? new Date(`${rangeStart}T00:00:00`)
      : mode === 'weekly'
      ? startOfWeek(new Date(`${rangeStart}T00:00:00`))
      : startOfMonth(new Date(`${rangeStart}T00:00:00`))

  const end = mode === 'weekly' ? startOfWeek(today) : mode === 'monthly' ? startOfMonth(today) : today
  let safety = 0
  while (cursor <= end && safety < 400) {
    keysInOrder.push(toDateKey(cursor))
    cursor = nextBucketStart(cursor, mode)
    safety += 1
  }
  if (keysInOrder.length === 0) keysInOrder.push(rangeStart)

  const limited = keysInOrder.slice(-BUCKET_LIMIT[mode])

  const candles = []
  let prevTotal = 0
  // seed prevTotal with whatever came immediately before the visible window
  const firstVisibleIndex = keysInOrder.length - limited.length
  if (firstVisibleIndex > 0) {
    prevTotal = totals.get(keysInOrder[firstVisibleIndex - 1]) || 0
  }

  for (const key of limited) {
    const total = totals.get(key) || 0
    const open = prevTotal
    const close = total
    const high = Math.max(open, close)
    const low = Math.min(open, close)
    candles.push({
      time: key,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      spent: round2(total),
    })
    prevTotal = total
  }

  return candles
}

function round2(n) {
  return Math.round(n * 100) / 100
}

export function periodLabel(mode) {
  if (mode === 'daily') return 'Harian'
  if (mode === 'weekly') return 'Mingguan'
  return 'Bulanan'
}
