import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function SecurityModal({ lock, onClose }) {
  const [step, setStep] = useState('idle') // idle | setPin1 | setPin2
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')

  function startSetPin() {
    setStep('setPin1')
    setPin1('')
    setPin2('')
    setError('')
  }

  function handleDigit(value, target) {
    if (target === 1) {
      if (value.length <= 6) setPin1(value)
    } else {
      if (value.length <= 6) setPin2(value)
    }
  }

  async function confirmPin() {
    if (pin1.length !== 6) {
      setError('PIN harus 6 digit.')
      return
    }
    if (step === 'setPin1') {
      setStep('setPin2')
      setError('')
      return
    }
    if (pin2 !== pin1) {
      setError('Konfirmasi PIN tidak cocok.')
      setPin2('')
      return
    }
    setBusy(true)
    try {
      await lock.setPin(pin1)
      setStep('idle')
      setInfo('PIN berhasil diaktifkan.')
    } catch (err) {
      setError(err.message || 'Gagal menyimpan PIN.')
    } finally {
      setBusy(false)
    }
  }

  async function handleEnableBiometric() {
    setBusy(true)
    setError('')
    try {
      await lock.enableBiometric()
      setInfo('Face ID / Touch ID berhasil diaktifkan.')
    } catch (err) {
      setError('Gagal mengaktifkan Face ID / Touch ID. Pastikan perangkat mendukung dan izin diberikan.')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Keamanan Aplikasi</div>
        <div className="modal-sub">
          PIN & Face ID/Touch ID tersimpan hanya di perangkat ini, tidak dikirim ke server.
        </div>

        {info && <div className="lock-info">{info}</div>}
        {error && <div className="auth-error">{error}</div>}

        <div className="security-row">
          <div>
            <div className="security-row-title">PIN 6 digit</div>
            <div className="security-row-sub">{lock.hasPin ? 'Aktif' : 'Belum diaktifkan'}</div>
          </div>
          {lock.hasPin ? (
            <button className="btn" onClick={lock.removePin}>Nonaktifkan</button>
          ) : (
            <button className="btn" onClick={startSetPin}>Aktifkan</button>
          )}
        </div>

        {(step === 'setPin1' || step === 'setPin2') && (
          <div className="pin-setup-block">
            <label>{step === 'setPin1' ? 'Masukkan PIN baru (6 digit)' : 'Ulangi PIN untuk konfirmasi'}</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={step === 'setPin1' ? pin1 : pin2}
              onChange={(e) => handleDigit(e.target.value.replace(/\D/g, ''), step === 'setPin1' ? 1 : 2)}
              autoFocus
            />
            <button className="btn btn-primary" onClick={confirmPin} disabled={busy}>
              {step === 'setPin1' ? 'Lanjut' : busy ? 'Menyimpan…' : 'Simpan PIN'}
            </button>
          </div>
        )}

        <div className="security-row">
          <div>
            <div className="security-row-title">Face ID / Touch ID</div>
            <div className="security-row-sub">
              {!lock.biometricAvailable
                ? 'Tidak tersedia di perangkat ini'
                : lock.hasBiometric
                  ? 'Aktif'
                  : 'Belum diaktifkan'}
            </div>
          </div>
          {lock.biometricAvailable && (
            lock.hasBiometric ? (
              <button className="btn" onClick={lock.removeBiometric}>Nonaktifkan</button>
            ) : (
              <button className="btn" onClick={handleEnableBiometric} disabled={busy}>
                {busy ? 'Menunggu…' : 'Aktifkan'}
              </button>
            )
          )}
        </div>

        <div className="modal-actions">
          {lock.lockEnabled && (
            <button className="btn" onClick={() => { lock.lockNow(); onClose() }}>
              Kunci Sekarang
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>Selesai</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
