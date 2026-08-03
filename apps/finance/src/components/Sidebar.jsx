import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAppLock } from '../context/AppLockContext.jsx'
import SecurityModal from './SecurityModal.jsx'

export default function Sidebar() {
  const { profile, user, signOut } = useAuth()
  const lock = useAppLock()
  const [securityOpen, setSecurityOpen] = useState(false)

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
        <button className="nav-item" onClick={() => setSecurityOpen(true)}>
          🔒 Keamanan
        </button>
      </nav>

      <div className="wallet-chip">
        <div className="label">Signed in as</div>
        <div className="value">@{profile?.username || '...'}</div>
        <button className="logout-btn" onClick={signOut}>Logout</button>
      </div>

      {securityOpen && <SecurityModal lock={lock} onClose={() => setSecurityOpen(false)} />}
    </aside>
  )
}
