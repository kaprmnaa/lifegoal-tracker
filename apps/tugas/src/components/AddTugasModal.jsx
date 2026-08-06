import { useState } from 'react'
import Modal from './Modal.jsx'

export default function AddTugasModal({ mapelNama, onClose, onSubmit }) {
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!judul.trim()) {
      setError('Judul tugas tidak boleh kosong.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit({ judul: judul.trim(), deskripsi: deskripsi.trim(), deadline: deadline || null })
    } catch (err) {
      setError(err.message || 'Gagal menyimpan tugas.')
      setSaving(false)
    }
  }

  return (
    <Modal title={`Tugas baru — ${mapelNama}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="judul-tugas">Judul tugas</label>
          <input
            id="judul-tugas"
            type="text"
            placeholder="Misalnya: Kerjakan LKS halaman 24"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="deskripsi-tugas">Catatan (opsional)</label>
          <textarea
            id="deskripsi-tugas"
            placeholder="Detail tambahan, misalnya bab yang dibahas atau instruksi guru"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="deadline-tugas">Deadline (opsional)</label>
          <input id="deadline-tugas" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Tempel tugas'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
