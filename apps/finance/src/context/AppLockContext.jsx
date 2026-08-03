import { createContext, useContext } from 'react'
import { useAppLock as useAppLockState } from '../hooks/useAppLock.js'

const AppLockContext = createContext(null)

export function AppLockProvider({ children }) {
  const lock = useAppLockState()
  return <AppLockContext.Provider value={lock}>{children}</AppLockContext.Provider>
}

export function useAppLock() {
  const ctx = useContext(AppLockContext)
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider')
  return ctx
}
