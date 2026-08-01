import { useState } from 'react'

const CATEGORIES = ['Makanan', 'Transportasi', 'Tagihan', 'Belanja', 'Hiburan', 'Kesehatan', 'Lainnya']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function TransactionForm({ onClose, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [occurredAt, setOccurredAt] = useState(todayStr())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      setError('Masukkan nominal yang valid.')
      return
    }
    setBusy(true)
    try {
      await onSubmit({
        amount: numAmount,
        category,
        description: description.trim() || null,
        occurred_at: occurredAt,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan transaksi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <svg className="modal-glyph" viewBox="0 0 40 40" width="36" height="36">
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--down)" strokeOpacity="0.4" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--down)" strokeWidth="1.5"
            strokeDasharray="20 88" strokeLinecap="round" className="spin-ring" />
          <text x="20" y="25" textAnchor="middle" fontSize="16" fontFamily="var(--font-mono)" fill="var(--down)">−</text>
        </svg>
        <div className="modal-title">Blok pengeluaran baru</div>
        <div className="modal-sub">Catat satu entri uang keluar ke ledger kamu.</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nominal (Rp)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label>Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tanggal</label>
            <input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} required />
          </div>
          <div className="field">
            <label>Catatan (opsional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="cth. Makan siang tim"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
