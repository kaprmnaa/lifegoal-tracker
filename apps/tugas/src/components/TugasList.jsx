import { urgencyOf, formatDeadline } from '../lib/date.js'
import './TugasList.css'

const URGENCY_LABEL = {
  overdue: 'Telat',
  today: 'Hari ini',
  soon: 'Segera',
  later: null,
  none: null,
  done: null,
}

// Rotasi kecil supaya sticky note terasa "ditempel", tapi tetap konsisten per item (bukan acak tiap render)
function rotationFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000
  return (hash % 5) - 2 // -2..2 deg
}

export default function TugasList({ mapel, tugasList, onBack, onAdd, onToggle, onDelete }) {
  const belum = tugasList.filter((t) => !t.selesai)
  const selesai = tugasList.filter((t) => t.selesai)

  return (
    <div className="tugas-view">
      <div className="tugas-header">
        <button className="back-btn" onClick={onBack}>
          ← Semua mapel
        </button>
        <div className="tugas-header-title" style={{ '--accent': mapel.warna }}>
          <span className="tugas-header-dot" />
          <h2>{mapel.nama}</h2>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          + Tambah tugas
        </button>
      </div>

      {tugasList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">📌</div>
          <h2>Belum ada tugas</h2>
          <p>Tempel tugas pertama untuk {mapel.nama} di sini.</p>
          <button className="btn btn-primary" onClick={onAdd}>
            + Tambah tugas
          </button>
        </div>
      ) : (
        <>
          {belum.length > 0 && (
            <div className="tugas-board">
              {belum.map((t) => (
                <TugasCard key={t.id} tugas={t} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </div>
          )}

          {selesai.length > 0 && (
            <details className="tugas-done-section" open={belum.length === 0}>
              <summary>Selesai ({selesai.length})</summary>
              <div className="tugas-board">
                {selesai.map((t) => (
                  <TugasCard key={t.id} tugas={t} onToggle={onToggle} onDelete={onDelete} />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  )
}

function TugasCard({ tugas, onToggle, onDelete }) {
  const urgency = urgencyOf(tugas.deadline, tugas.selesai)
  const label = URGENCY_LABEL[urgency]
  const rotation = rotationFor(tugas.id)

  return (
    <div
      className={`sticky-note urgency-${urgency}${tugas.selesai ? ' is-done' : ''}`}
      style={{ '--rot': `${rotation}deg` }}
    >
      <button className="sticky-delete" onClick={() => onDelete(tugas)} aria-label="Hapus tugas">
        ✕
      </button>
      <label className="sticky-check">
        <input type="checkbox" checked={tugas.selesai} onChange={(e) => onToggle(tugas, e.target.checked)} />
        <span className="sticky-judul">{tugas.judul}</span>
      </label>
      {tugas.deskripsi && <p className="sticky-desc">{tugas.deskripsi}</p>}
      <div className="sticky-footer">
        {label && <span className={`sticky-badge badge-${urgency}`}>{label}</span>}
        <span className="sticky-deadline">{formatDeadline(tugas.deadline)}</span>
      </div>
    </div>
  )
}
