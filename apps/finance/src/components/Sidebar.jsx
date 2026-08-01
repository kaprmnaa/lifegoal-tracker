import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { profile, user, signOut } = useAuth()

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="glyph">FT</span>
        FinanceTrack
      </div>

      <nav className="nav-group">
        <button className="nav-item active">
          ◆ Dashboard
        </button>
      </nav>

      <div className="wallet-chip">
        <div className="label">Signed in as</div>
        <div className="value">@{profile?.username || '...'}</div>
        <button className="logout-btn" onClick={signOut}>Logout</button>
      </div>
    </aside>
  )
}
