import './MapelGrid.css'

export default function MapelGrid({ mapelList, counts, onSelect, onDelete, onAdd }) {
  if (mapelList.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-emoji">🗂️</div>
        <h2>Belum ada mapel</h2>
        <p>Tambahkan mapel pertamamu untuk mulai mencatat tugas — satu folder untuk satu pelajaran.</p>
        <button className="btn btn-primary" onClick={onAdd}>
          + Tambah mapel
        </button>
      </div>
    )
  }

  return (
    <div className="mapel-grid">
      {mapelList.map((m) => {
        const c = counts[m.id] || { total: 0, belum: 0, overdue: 0 }
        return (
          <div
            key={m.id}
            className="mapel-card"
            style={{ '--accent': m.warna }}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(m)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(m)}
          >
            <span className="mapel-tab" />
            <button
              className="mapel-delete"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(m)
              }}
              aria-label={`Hapus mapel ${m.nama}`}
              title="Hapus mapel"
            >
              ✕
            </button>
            <h3 className="mapel-nama">{m.nama}</h3>
            <div className="mapel-meta">
              {c.total === 0 && <span className="mapel-meta-empty">Belum ada tugas</span>}
              {c.total > 0 && c.belum === 0 && <span className="mapel-meta-done">✓ Semua selesai</span>}
              {c.belum > 0 && (
                <span className={c.overdue > 0 ? 'mapel-meta-overdue' : 'mapel-meta-pending'}>
                  {c.belum} tugas belum selesai{c.overdue > 0 ? ` · ${c.overdue} telat` : ''}
                </span>
              )}
            </div>
          </div>
        )
      })}

      <button className="mapel-card mapel-card-add" onClick={onAdd}>
        <span className="mapel-add-plus">+</span>
        <span>Tambah mapel</span>
      </button>
    </div>
  )
}
