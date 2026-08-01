import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ChainBackground from '../components/ChainBackground'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <ChainBackground />
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: 18 }}>
          <span className="glyph">FT</span>
          FinanceTrack
        </div>
        <div className="auth-title">Masuk ke node kamu</div>
        <div className="auth-sub">Lacak keluar-masuk uang seperti melacak transaksi di chain.</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cth. budi_santoso"
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Menghubungkan…' : 'Masuk'}
          </button>
        </form>

        <div className="auth-switch">
          Belum punya wallet? <Link to="/register">Daftar</Link>
        </div>
      </div>
    </div>
  )
}
