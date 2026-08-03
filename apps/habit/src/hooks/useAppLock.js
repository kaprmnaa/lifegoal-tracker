import { useCallback, useEffect, useState } from 'react'

// Semua data lock (hash PIN, credential id biometrik) disimpan HANYA di
// localStorage perangkat ini — tidak dikirim ke Supabase / server manapun.
const PIN_KEY = 'pulse-lock-pin'
const BIOMETRIC_KEY = 'pulse-lock-biometric'

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer
}

const REAUTH_AFTER_HIDDEN_MS = 5 * 60 * 1000 // re-lock kalau app disembunyikan >5 menit

export function useAppLock() {
  const [pinHash, setPinHash] = useState(() => localStorage.getItem(PIN_KEY))
  const [biometricId, setBiometricId] = useState(() => localStorage.getItem(BIOMETRIC_KEY))
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const lockEnabled = Boolean(pinHash || biometricId)
  const [isLocked, setIsLocked] = useState(lockEnabled)

  useEffect(() => {
    if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setBiometricAvailable)
        .catch(() => setBiometricAvailable(false))
    }
  }, [])

  useEffect(() => {
    if (!lockEnabled) return
    let hiddenAt = null
    function onVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now()
      } else if (hiddenAt && Date.now() - hiddenAt > REAUTH_AFTER_HIDDEN_MS) {
        setIsLocked(true)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [lockEnabled])

  const setPin = useCallback(async (pin) => {
    const hash = await sha256Hex(pin)
    localStorage.setItem(PIN_KEY, hash)
    setPinHash(hash)
  }, [])

  const removePin = useCallback(() => {
    localStorage.removeItem(PIN_KEY)
    setPinHash(null)
  }, [])

  const verifyPin = useCallback(async (pin) => {
    const hash = await sha256Hex(pin)
    return hash === localStorage.getItem(PIN_KEY)
  }, [])

  const unlockWithPin = useCallback(async (pin) => {
    const ok = await verifyPin(pin)
    if (ok) setIsLocked(false)
    return ok
  }, [verifyPin])

  const enableBiometric = useCallback(async () => {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Pulse' },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'pulse-app-lock',
          displayName: 'Pulse App Lock',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000,
        attestation: 'none',
      },
    })
    const id = bufToBase64(credential.rawId)
    localStorage.setItem(BIOMETRIC_KEY, id)
    setBiometricId(id)
  }, [])

  const removeBiometric = useCallback(() => {
    localStorage.removeItem(BIOMETRIC_KEY)
    setBiometricId(null)
  }, [])

  const unlockWithBiometric = useCallback(async () => {
    const id = localStorage.getItem(BIOMETRIC_KEY)
    if (!id) return false
    await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: base64ToBuf(id), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    setIsLocked(false)
    return true
  }, [])

  const lockNow = useCallback(() => {
    if (lockEnabled) setIsLocked(true)
  }, [lockEnabled])

  return {
    lockEnabled,
    hasPin: Boolean(pinHash),
    hasBiometric: Boolean(biometricId),
    biometricAvailable,
    isLocked: lockEnabled && isLocked,
    setPin,
    removePin,
    unlockWithPin,
    enableBiometric,
    removeBiometric,
    unlockWithBiometric,
    lockNow,
  }
}
