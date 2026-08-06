import { useState } from 'react'
import Modal from './Modal.jsx'

export const MAPEL_COLORS = ['#FF6B5F', '#FFC93C', '#16A394', '#8B5CF6', '#3D8BFD', '#FF5DA2', '#FF8C42', '#2E9E5B']

export default function AddMapelModal({ onClose, onSubmit }) {
  const [nama, setNama] = useState('')
  const [warna, setWarna] = useState(MAPEL_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nama.trim()) {
      setError('Nama mapel tidak boleh kosong.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit({ nama: nama.trim(), warna })
    } catch (err) {
      setError(err.message || 'Gagal menyimpan mapel.')
      setSaving(false)
    }
  }

  return (
    <Modal title="Tambah mapel" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="nama-mapel">Nama mapel</label>
          <input
            id="nama-mapel"
            type="text"
            placeholder="Misalnya: Matematika Wajib"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label>Warna label</label>
          <div className="color-swatches">
            {MAPEL_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-swatch${warna === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => setWarna(c)}
                aria-label={`Pilih warna ${c}`}
              />
            ))}
          </div>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan mapel'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
