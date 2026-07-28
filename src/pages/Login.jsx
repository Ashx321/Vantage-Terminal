import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signIn') // 'signIn' | 'signUp'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'signIn') {
        const { error: signInError } = await signIn(email, password)
        if (signInError) throw signInError
      } else {
        const { error: signUpError } = await signUp(email, password)
        if (signUpError) throw signUpError
        setInfo('Account created — check your email to confirm, then sign in.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card border border-border rounded-xl p-8">
        <h1 className="text-xl font-bold mb-1">
          Vantage <span className="text-muted font-normal">Terminal</span>
        </h1>
        <p className="text-sm text-muted mb-6">
          {mode === 'signIn' ? 'Sign in to your account' : 'Create your account'}
        </p>

        <label className="block text-xs text-muted mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 bg-card2 border border-border rounded-lg px-3 py-2 text-sm"
        />

        <label className="block text-xs text-muted mb-1">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-5 bg-card2 border border-border rounded-lg px-3 py-2 text-sm"
        />

        {error && <div className="mb-4 text-xs text-red bg-red/10 border border-red/30 rounded-lg p-2.5">{error}</div>}
        {info && <div className="mb-4 text-xs text-green bg-green/10 border border-green/30 rounded-lg p-2.5">{info}</div>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-gradient-to-r from-accent-bright to-accent text-[#171307] font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'signIn' ? 'Sign In' : 'Sign Up'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          className="w-full mt-3 text-xs text-muted hover:text-text"
        >
          {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
