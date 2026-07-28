import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Holdings from './pages/Holdings'
import Watchlist from './pages/Watchlist'
import Alerts from './pages/Alerts'

// NOTE ON REACT ROUTER: this uses Declarative Mode (<BrowserRouter> + <Routes>),
// deliberately. Two high-severity advisories currently show up if you run
// `npm audit` on react-router — both are scoped to Framework Mode / RSC
// Server Actions (SSR-specific features), which this app does not use.
// GitHub's own advisory for GHSA-h5cw-625j-3rxh states plainly: "This does
// not impact your application if you are using Declarative Mode
// (<BrowserRouter>)." Confirmed against the current advisory text — not
// guessed — before deciding to proceed on the latest version.

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted text-sm">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/holdings" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/" element={<Navigate to="/holdings" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
