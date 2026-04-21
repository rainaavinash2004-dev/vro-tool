import { useState, useEffect } from 'react'
import {
  LayoutDashboard, TrendingUp, ClipboardList, BarChart3, Shield,
  Upload, ChevronRight, RefreshCw, Menu, X, Users, LogOut, User,
  KeyRound, ChevronDown, Eye
} from 'lucide-react'
import useAuthStore, { useCanEdit, useIsAdmin } from './store/useAuthStore'
import useStore from './store/useStore'
import Dashboard from './components/Dashboard'
import ValueCase from './components/ValueCase'
import ValueAssessment from './components/ValueAssessment'
import ValueMeasurement from './components/ValueMeasurement'
import ProgramGovernance from './components/ProgramGovernance'
import FileImport from './components/FileImport'
import UserManagement from './components/UserManagement'
import Login from './components/Login'

const PHASE_BADGE = {
  Prepare: 'bg-gray-100 text-gray-600', Explore: 'bg-blue-100 text-blue-700',
  Realize: 'bg-amber-100 text-amber-700', Deploy: 'bg-purple-100 text-purple-700',
  Run: 'bg-green-100 text-green-700',
}
const ROLE_COLOR = { admin: 'text-purple-600 bg-purple-50', editor: 'text-sap-blue bg-sap-light', viewer: 'text-gray-600 bg-gray-100' }

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'valuecase',   label: 'Value Case',         icon: TrendingUp },
  { id: 'assessment',  label: 'Value Assessment',   icon: ClipboardList },
  { id: 'measurement', label: 'Value Measurement',  icon: BarChart3 },
  { id: 'governance',  label: 'Program Governance', icon: Shield },
  { id: 'import',      label: 'Import Data',        icon: Upload, editorOnly: true },
  { id: 'users',       label: 'User Management',    icon: Users, adminOnly: true },
]

// ─── Change-password mini-form in user menu ────────────────────────────────────
function ChangePasswordInline({ onClose }) {
  const { changePassword } = useAuthStore()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (form.next.length < 8) { setErr('Min. 8 characters'); return }
    if (form.next !== form.confirm) { setErr('Passwords do not match'); return }
    setLoading(true)
    try { await changePassword(form.current, form.next); setOk(true) }
    catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  if (ok) return (
    <div className="p-4 text-center">
      <div className="text-green-600 font-medium text-sm mb-2">Password changed!</div>
      <button onClick={onClose} className="btn-secondary text-xs py-1">Close</button>
    </div>
  )

  return (
    <form onSubmit={submit} className="p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-600">Change Password</p>
      {['Current', 'New', 'Confirm new'].map((label, i) => {
        const key = ['current', 'next', 'confirm'][i]
        return (
          <div key={key}>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            <input type="password" className="input py-1.5 text-sm" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required />
          </div>
        )
      })}
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary py-1.5 text-xs flex-1">
          {loading ? 'Saving…' : 'Change'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary py-1.5 text-xs">Cancel</button>
      </div>
    </form>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading: authLoading, checkAuth, logout } = useAuthStore()
  const { project, resetToDefault, loadFromServer } = useStore()
  const canEdit = useCanEdit()
  const isAdmin = useIsAdmin()

  const [activeTab, setActiveTab]     = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [confirmReset, setConfirmReset] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showChangePw, setShowChangePw] = useState(false)

  // 1. Verify stored JWT on mount
  useEffect(() => { checkAuth() }, [])

  // 2. Load data from server once authenticated
  useEffect(() => {
    if (user) loadFromServer()
  }, [user?.id])

  // 3. Listen for session expiry
  useEffect(() => {
    const handler = () => { logout(); setActiveTab('dashboard') }
    window.addEventListener('vro:unauthorized', handler)
    return () => window.removeEventListener('vro:unauthorized', handler)
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-sap-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading VRO Tool…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  const visibleNav = NAV.filter(n => {
    if (n.adminOnly && !isAdmin) return false
    if (n.editorOnly && !canEdit) return false
    return true
  })

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':   return <Dashboard setActiveTab={setActiveTab} />
      case 'valuecase':   return <ValueCase />
      case 'assessment':  return <ValueAssessment />
      case 'measurement': return <ValueMeasurement />
      case 'governance':  return <ProgramGovernance />
      case 'import':      return canEdit ? <FileImport /> : null
      case 'users':       return isAdmin ? <UserManagement /> : null
      default:            return <Dashboard setActiveTab={setActiveTab} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className={`flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 ${!sidebarOpen ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-sap-blue flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">VRO</span>
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-sm font-bold text-gray-900 leading-tight">VRO Tool</div>
              <div className="text-xs text-gray-400">S/4HANA Transformation</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ id, label, icon: Icon, adminOnly }) => (
            <button key={id} onClick={() => setActiveTab(id)} title={!sidebarOpen ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${!sidebarOpen ? 'justify-center px-2' : ''}
                ${activeTab === id ? 'bg-sap-light text-sap-blue font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate flex-1 text-left">{label}</span>}
              {sidebarOpen && adminOnly && <span className="badge-purple text-xs py-0 px-1.5">Admin</span>}
              {sidebarOpen && activeTab === id && <ChevronRight size={14} className="ml-auto opacity-40" />}
            </button>
          ))}
        </nav>

        {/* Reset + version */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {canEdit && (
            confirmReset && sidebarOpen ? (
              <div className="text-center space-y-2 px-1">
                <p className="text-xs text-gray-500">Reset all data to demo?</p>
                <div className="flex gap-1.5">
                  <button onClick={() => { resetToDefault(); setConfirmReset(false) }}
                    className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium">Yes</button>
                  <button onClick={() => setConfirmReset(false)}
                    className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">No</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)} title="Reset demo data"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-all ${!sidebarOpen ? 'justify-center' : ''}`}>
                <RefreshCw size={15} className="flex-shrink-0" />
                {sidebarOpen && 'Reset Demo Data'}
              </button>
            )
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(o => !o)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-gray-900 leading-tight">{project.name}</h1>
              <p className="text-xs text-gray-400">Sponsor: {project.sponsor}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PHASE_BADGE[project.phase] || 'bg-gray-100 text-gray-600'}`}>
              {project.phase}
            </span>
            <div className="text-xs text-gray-400 hidden md:block">
              Go-Live: <span className="font-semibold text-gray-700">{project.goLiveDate}</span>
            </div>

            {/* User menu */}
            <div className="relative">
              <button onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">
                <div className="w-7 h-7 rounded-full bg-sap-blue flex items-center justify-center text-white text-xs font-bold">
                  {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-gray-800 leading-none">{user.displayName || user.username}</div>
                  <div className={`text-xs rounded px-1 mt-0.5 capitalize leading-none font-medium ${ROLE_COLOR[user.role] || 'text-gray-500'}`}>{user.role}</div>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800">{user.displayName || user.username}</p>
                    <p className="text-xs text-gray-400">@{user.username} · <span className="capitalize">{user.role}</span></p>
                  </div>
                  {showChangePw ? (
                    <ChangePasswordInline onClose={() => setShowChangePw(false)} />
                  ) : (
                    <div className="p-2 space-y-1">
                      <button onClick={() => setShowChangePw(true)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-all">
                        <KeyRound size={15} className="text-gray-400" /> Change Password
                      </button>
                      <button onClick={() => { logout(); setUserMenuOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-all">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
              {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
            </div>
          </div>
        </header>

        {/* Viewer banner */}
        {user.role === 'viewer' && (
          <div className="bg-amber-50 border-b border-amber-100 px-5 py-1.5 text-xs text-amber-700 flex items-center gap-1.5">
            <Eye size={13} /> You have <strong>Viewer</strong> access — data is read-only. Contact your programme administrator to request edit access.
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">VRO</span>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="text-gray-700 font-medium">
              {NAV.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </span>
          </div>
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
