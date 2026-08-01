import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ChainBackground from '../components/ChainBackground'

export default function Register() {
  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    setBusy(true)
    try {
      await signUp(username, password)
      // Supabase returns a session immediately when email confirmation is
      // disabled (recommended for this app, since there's no real email).
      try {
        await signIn(username, password)
      } catch {
        // If email confirmation is enabled on the Supabase project, the
        // user will need to confirm before they can sign in.
      }
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
        <div className="auth-title">Buat node baru</div>
        <div className="auth-sub">Cukup username &amp; password — tidak perlu email.</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3-20 karakter: huruf, angka, _"
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
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="field">
            <label>Konfirmasi Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi password"
              autoComplete="new-password"
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Membuat node…' : 'Daftar'}
          </button>
        </form>

        <div className="auth-switch">
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </div>
      </div>
    </div>
  )
}
