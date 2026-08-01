import { useState } from 'react'
import { WEEKDAY_NAMES } from '../utils/schedule.js'

const ICONS = ['🔥', '💪', '📚', '🧘', '🏃', '💧', '🎯', '🛌', '🥗', '✍️', '🎸', '💼']
const COLORS = ['#FF5A36', '#3ECF8E', '#F5B700', '#6C8EFF', '#FF5C7C', '#B084F7']
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export default function HabitFormModal({ initial, onClose, onSubmit }) {
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name || '')
  const [goal, setGoal] = useState(initial?.goal || '')
  const [reference, setReference] = useState(initial?.reference || '')
  const [icon, setIcon] = useState(initial?.icon || ICONS[0])
  const [color, setColor] = useState(initial?.color || COLORS[0])
  const [period, setPeriod] = useState(initial?.period || 'daily')
  const [selectedDays, setSelectedDays] = useState(initial?.selected_days || [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function changePeriod(newPeriod) {
    setPeriod(newPeriod)
    if (newPeriod === 'daily') {
      setSelectedDays([])
    } else if (selectedDays.length === 0) {
      setSelectedDays(newPeriod === 'weekly' ? [0] : [1])
    }
  }

  function toggleDay(day) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nama habit wajib diisi.')
      return
    }
    if (period !== 'daily' && selectedDays.length === 0) {
      setError(period === 'weekly' ? 'Pilih minimal 1 hari.' : 'Pilih minimal 1 tanggal.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await onSubmit({
        name: name.trim(),
        goal: goal.trim() || null,
        reference: reference.trim() || null,
        icon,
        color,
        period,
        selected_days: period === 'daily' ? [] : selectedDays,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan habit.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Habit' : 'Habit Baru'}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">✕</button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nama Habit</label>
            <input
              type="text"
              placeholder="cth: Gym"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Tujuan (opsional)</label>
            <input
              type="text"
              placeholder="cth: Push Day"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Kategori / Merujuk ke (opsional)</label>
            <input
              type="text"
              placeholder="cth: Kesehatan, Karier, Fisik"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Jadwal</label>
            <div className="period-tabs">
              <button
                type="button"
                className={period === 'daily' ? 'active' : ''}
                onClick={() => changePeriod('daily')}
              >
                Harian
              </button>
              <button
                type="button"
                className={period === 'weekly' ? 'active' : ''}
                onClick={() => changePeriod('weekly')}
              >
                Mingguan
              </button>
              <button
                type="button"
                className={period === 'monthly' ? 'active' : ''}
                onClick={() => changePeriod('monthly')}
              >
                Bulanan
              </button>
            </div>

            {period === 'weekly' && (
              <div className="day-chip-grid">
                {WEEKDAY_NAMES.map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    className={`day-chip${selectedDays.includes(idx) ? ' active' : ''}`}
                    onClick={() => toggleDay(idx)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {period === 'monthly' && (
              <div className="month-grid">
                {MONTH_DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`month-cell${selectedDays.includes(d) ? ' active' : ''}`}
                    onClick={() => toggleDay(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="field">
            <label>Ikon</label>
            <div className="icon-picker">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={ic === icon ? 'active' : ''}
                  onClick={() => setIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Warna</label>
            <div className="color-picker">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={c === color ? 'active' : ''}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Habit'}
          </button>
        </form>
      </div>
    </div>
  )
}
