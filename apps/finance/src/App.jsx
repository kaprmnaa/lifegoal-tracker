import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppLockProvider, useAppLock } from './context/AppLockContext.jsx'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Loader from './components/Loader'
import LockScreen from './components/LockScreen.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const lock = useAppLock()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  if (lock.isLocked) return <LockScreen lock={lock} />
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (user) return <Navigate to="/" replace />
  return children
}

function Routed() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/finance">
      <AuthProvider>
        <AppLockProvider>
          <Routed />
        </AppLockProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
