export default function Topbar({ username, onLogout, onOpenSecurity }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">🔥</div>
        <span className="brand-name">Pulse</span>
      </div>
      <div className="user-chip">
        <button className="icon-btn" onClick={onOpenSecurity} aria-label="Keamanan aplikasi" title="Keamanan aplikasi">
          🔒
        </button>
        <div className="avatar">{username ? username.slice(0, 2) : '--'}</div>
        <span>{username}</span>
        <button className="logout-btn" onClick={onLogout}>Keluar</button>
      </div>
    </div>
  )
}
