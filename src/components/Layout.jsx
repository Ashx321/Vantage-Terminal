import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { user, signOut } = useAuth()

  const tabClass = ({ isActive }) =>
    `px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
      isActive ? 'text-accent-bright border-accent' : 'text-muted border-transparent hover:text-text'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 py-5 border-b border-border bg-gradient-to-br from-[#151821] to-bg flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-xl font-bold tracking-tight">
          Vantage <span className="text-muted font-normal text-base">Terminal</span>
        </h1>
        <div className="flex items-center gap-4 text-xs text-muted font-num">
          <span>{user?.email}</span>
          <button onClick={signOut} className="border border-border rounded px-3 py-1.5 hover:bg-card2">
            Sign out
          </button>
        </div>
      </header>

      <nav className="flex bg-card border-b border-border overflow-x-auto">
        <NavLink to="/holdings" className={tabClass}>Holdings</NavLink>
        <NavLink to="/watchlist" className={tabClass}>Watchlist</NavLink>
        <NavLink to="/alerts" className={tabClass}>Alerts</NavLink>
      </nav>

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
