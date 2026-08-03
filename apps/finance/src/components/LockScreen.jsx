import { useEffect, useState } from 'react'

const PIN_LENGTH = 6
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back']

export default function LockScreen({ lock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [bioBusy, setBioBusy] = useState(false)

  useEffect(() => {
    if (lock.hasBiometric) attemptBiometric()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function attemptBiometric() {
    setBioBusy(true)
    setError('')
    try {
      await lock.unlockWithBiometric()
    } catch {
      // dibatalkan / gagal - biarkan user pakai PIN
    } finally {
      setBioBusy(false)
    }
  }

  async function handleKey(key) {
    if (key === '') return
    if (key === 'back') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (pin.length >= PIN_LENGTH) return
    const next = pin + key
    setPin(next)
    if (next.length === PIN_LENGTH) {
      const ok = await lock.unlockWithPin(next)
      if (!ok) {
        setError('PIN salah, coba lagi.')
        setShake(true)
        setTimeout(() => setShake(false), 400)
        setPin('')
      }
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-header">
        <div className="lock-icon">🔗</div>
        <h2>FinanceTrack Terkunci</h2>
        <p>{lock.hasBiometric ? 'Gunakan Face ID / Touch ID atau masukkan PIN' : 'Masukkan PIN untuk melanjutkan'}</p>
      </div>

      {lock.hasPin && (
        <>
          <div className={`pin-dots${shake ? ' shake' : ''}`}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <span key={i} className={`pin-dot${i < pin.length ? ' filled' : ''}`} />
            ))}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="pin-pad">
            {KEYS.map((k, i) =>
              k === '' ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  className={`pin-key${k === 'back' ? ' pin-key-back' : ''}`}
                  onClick={() => handleKey(k)}
                >
                  {k === 'back' ? '⌫' : k}
                </button>
              )
            )}
          </div>
        </>
      )}

      {lock.hasBiometric && (
        <button className="btn lock-bio-btn" onClick={attemptBiometric} disabled={bioBusy}>
          {bioBusy ? 'Menunggu…' : '🔓 Buka dengan Face ID / Touch ID'}
        </button>
      )}
    </div>
  )
}
