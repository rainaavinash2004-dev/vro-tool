import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, AlertCircle, KeyRound, Check } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'

// ─── Change-password form (shown when mustChangePassword === true) ─────────────
function ChangePasswordForm({ displayName, onDone }) {
  const { changePassword } = useAuthStore()
  const [form, setForm]   = useState({ next: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    if (form.next.length < 8)      { setError('New password must be at least 8 characters'); return }
    if (form.next !== form.confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await changePassword(null, form.next)
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-sap-blue px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <KeyRound size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Change Password Required</h1>
              <p className="text-blue-100 text-xs">Hello {displayName} — please set a new password to continue</p>
            </div>
          </div>
        </div>

        <form onSubmit={handle} className="p-8 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            Your account requires a password change before you can access the tool.
          </div>

          {[['next', 'New Password'], ['confirm', 'Confirm New Password']].map(([field, label]) => (
            <div key={field}>
              <label className="label">{label}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  value={form[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  required
                />
                {field === 'next' && (
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <ul className="text-xs text-gray-400 space-y-1">
            <li className={`flex items-center gap-1.5 ${form.next.length >= 8 ? 'text-green-600' : ''}`}>
              <Check size={11} /> At least 8 characters
            </li>
            <li className={`flex items-center gap-1.5 ${form.next && form.next === form.confirm ? 'text-green-600' : ''}`}>
              <Check size={11} /> Passwords match
            </li>
          </ul>

          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center py-2.5 disabled:opacity-50">
            {loading ? 'Saving…' : 'Set New Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main login page ──────────────────────────────────────────────────────────
export default function Login() {
  const { login } = useAuthStore()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [mustChange, setMustChange] = useState(null) // displayName string when change required

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Please enter email and password'); return }
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      if (user.mustChangePassword) setMustChange(user.displayName || user.email)
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  if (mustChange) {
    return <ChangePasswordForm displayName={mustChange} onDone={() => setMustChange(null)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-sap-blue px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-white font-black text-lg">VRO</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">VRO Tool</h1>
                <p className="text-blue-200 text-xs">S/4HANA Transformation Portal</p>
              </div>
            </div>
            <p className="text-blue-100 text-sm">Sign in to access the Value Realisation Office dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handle} className="p-8 space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="input pl-9"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm font-semibold disabled:opacity-50">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in…</span>
                : 'Sign In'}
            </button>

            {/* Role info */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Access Levels</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  { role: 'Admin',  desc: 'Full access + user management',  color: 'bg-purple-100 text-purple-700' },
                  { role: 'Editor', desc: 'Add and edit all programme data', color: 'bg-blue-100 text-blue-700'   },
                  { role: 'Viewer', desc: 'Read-only dashboards',            color: 'bg-gray-100 text-gray-600'   },
                ].map(r => (
                  <div key={r.role} className={`px-2 py-1.5 rounded-lg ${r.color}`}>
                    <div className="font-semibold">{r.role}</div>
                    <div className="text-xs opacity-75 mt-0.5 leading-tight hidden sm:block">{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        <p className="text-center text-blue-300 text-xs mt-4 opacity-60">
          Contact your programme administrator for access
        </p>
      </div>
    </div>
  )
}
