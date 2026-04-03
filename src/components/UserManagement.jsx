import { useState, useEffect } from 'react'
import { Pencil, X, Shield, Eye, Edit3, AlertCircle, Users, ExternalLink, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { readAudit } from '../utils/api'
import useAuthStore from '../store/useAuthStore'

const ROLES      = ['admin', 'editor', 'viewer']
const ROLE_BADGE = { admin: 'badge-purple', editor: 'badge-blue', viewer: 'badge-gray' }
const ROLE_ICON  = { admin: Shield, editor: Edit3, viewer: Eye }

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        {footer && <div className="flex justify-end gap-3 p-6 border-t border-gray-100">{footer}</div>}
      </div>
    </div>
  )
}

const BLANK_EDIT = { role: '', display_name: '', is_active: true, must_change_pwd: false }

export default function UserManagement() {
  const currentUser = useAuthStore(s => s.user)
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [editUser, setEditUser]   = useState(null)
  const [editForm, setEditForm]   = useState(BLANK_EDIT)
  const [formErr, setFormErr]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [showAudit, setShowAudit] = useState(false)
  const [showInfo, setShowInfo]   = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error: e } = await supabase
        .from('profiles')
        .select('id, email, display_name, role, is_active, must_change_pwd, created_at')
        .order('created_at', { ascending: true })
      if (e) throw new Error(e.message)
      setUsers(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAudit = async () => {
    try {
      const data = await readAudit(200)
      setAuditLogs(data)
    } catch {}
  }

  useEffect(() => { loadUsers() }, [])
  useEffect(() => { if (showAudit) loadAudit() }, [showAudit])

  const openEdit = (u) => {
    setEditUser(u)
    setEditForm({ role: u.role, display_name: u.display_name || '', is_active: !!u.is_active, must_change_pwd: !!u.must_change_pwd })
    setFormErr('')
  }

  const handleSave = async () => {
    setFormErr('')
    setSaving(true)
    try {
      const { error: e } = await supabase
        .from('profiles')
        .update({
          role:            editForm.role,
          display_name:    editForm.display_name,
          is_active:       editForm.is_active,
          must_change_pwd: editForm.must_change_pwd,
        })
        .eq('id', editUser.id)
      if (e) throw new Error(e.message)
      await loadUsers()
      setEditUser(null)
    } catch (e) {
      setFormErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-2 border-sap-blue border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Edit modal */}
      {editUser && (
        <Modal
          title={`Edit: ${editUser.display_name || editUser.email}`}
          onClose={() => { setEditUser(null); setFormErr('') }}
          footer={<>
            <button onClick={() => { setEditUser(null); setFormErr('') }} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>}
        >
          {formErr && <div className="flex gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm"><AlertCircle size={14} />{formErr}</div>}

          <div>
            <label className="label">Display Name</label>
            <input className="input" value={editForm.display_name}
              onChange={e => setEditForm({ ...editForm, display_name: e.target.value })} />
          </div>

          <div>
            <label className="label">Role</label>
            <div className="grid grid-cols-3 gap-2 text-xs mt-1">
              {[
                { r: 'admin',  d: 'Full access + user management' },
                { r: 'editor', d: 'Add/edit all programme data'   },
                { r: 'viewer', d: 'Read-only dashboards'          },
              ].map(({ r, d }) => (
                <div key={r}
                  className={`p-2 rounded-lg text-center cursor-pointer border-2 transition-all ${
                    editForm.role === r ? 'border-sap-blue bg-sap-light' : 'border-transparent bg-gray-50'
                  } ${editUser.id === currentUser?.id ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => setEditForm({ ...editForm, role: r })}
                >
                  <div className="font-semibold capitalize">{r}</div>
                  <div className="text-gray-400 mt-0.5 leading-tight">{d}</div>
                </div>
              ))}
            </div>
            {editUser.id === currentUser?.id && (
              <p className="text-xs text-amber-600 mt-1">Cannot change your own role.</p>
            )}
          </div>

          <div>
            <label className="label">Account Status</label>
            <div className="flex gap-3">
              {[true, false].map(v => (
                <label key={String(v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer text-sm transition-all ${
                    editForm.is_active === v ? 'border-sap-blue bg-sap-light text-sap-blue' : 'border-gray-200 text-gray-500'
                  } ${editUser.id === currentUser?.id ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input type="radio" name="active" checked={editForm.is_active === v}
                    onChange={() => setEditForm({ ...editForm, is_active: v })} className="sr-only" />
                  {v ? 'Active' : 'Deactivated'}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editForm.must_change_pwd}
                onChange={e => setEditForm({ ...editForm, must_change_pwd: e.target.checked })} />
              <span className="text-sm font-medium text-gray-700">Require password change on next login</span>
            </label>
            <p className="text-xs text-gray-400 mt-1 ml-5">
              To reset the user's actual password, use the Supabase Dashboard → Authentication → Users.
            </p>
          </div>
        </Modal>
      )}

      {/* Add user info dialog */}
      {showInfo && (
        <Modal title="Adding New Users" onClose={() => setShowInfo(false)}>
          <div className="space-y-3 text-sm text-gray-600">
            <p>New users must be created through the <strong>Supabase Dashboard</strong> because only the service-role key (which must stay secret) can create Auth accounts programmatically.</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Go to your Supabase project → <strong>Authentication → Users</strong></li>
              <li>Click <strong>Invite user</strong> (or <em>Add user</em> → <em>Create new user</em>)</li>
              <li>Enter the user's email address and a temporary password</li>
              <li>Click <strong>Create user</strong> — their profile row is created automatically</li>
              <li>Come back here and click <strong>Edit</strong> on the new user to assign their role</li>
            </ol>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sap-blue hover:underline font-medium"
            >
              Open Supabase Dashboard <ExternalLink size={13} />
            </a>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={22} className="text-sap-blue" />User Management
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage who has access to the VRO Tool and their permissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAudit(v => !v)} className="btn-secondary text-xs">
            {showAudit ? 'Hide Audit Log' : 'Audit Log'}
          </button>
          <button onClick={() => setShowInfo(true)} className="btn-primary">
            How to add users
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role && u.is_active).length
          const Icon  = ROLE_ICON[role]
          const colors = { admin: 'bg-purple-50 text-purple-600', editor: 'bg-blue-50 text-sap-blue', viewer: 'bg-gray-50 text-gray-600' }
          return (
            <div key={role} className="stat-card text-center">
              <div className={`w-10 h-10 rounded-xl ${colors[role]} flex items-center justify-center mx-auto mb-2`}>
                <Icon size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-400 mt-0.5 capitalize">{role}s</div>
            </div>
          )
        })}
      </div>

      {/* Users table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="th">User</th>
              <th className="th">Role</th>
              <th className="th">Status</th>
              <th className="th">Joined</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isSelf = u.id === currentUser?.id
              const initials = (u.display_name || u.email || '?').charAt(0).toUpperCase()
              return (
                <tr key={u.id} className={`table-row ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sap-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {u.display_name || u.email}
                          {isSelf && <span className="ml-1.5 text-xs text-sap-blue">(you)</span>}
                        </div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <span className={`${ROLE_BADGE[u.role]} capitalize`}>{u.role}</span>
                  </td>
                  <td className="td">
                    {u.is_active
                      ? <span className="badge-green">Active</span>
                      : <span className="badge-red">Deactivated</span>}
                    {!!u.must_change_pwd && <span className="badge-amber ml-1">Pwd change req.</span>}
                  </td>
                  <td className="td text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="td">
                    <button onClick={() => openEdit(u)} className="btn-ghost py-1 px-2">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="td text-center text-gray-400 py-8">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Audit log */}
      {showAudit && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Audit Log (last 200 events)</h3>
            <button onClick={loadAudit} className="btn-ghost py-1 px-2 text-xs flex items-center gap-1">
              <RotateCcw size={12} /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-gray-100 sticky top-0 bg-white">
                <tr>
                  <th className="th">Timestamp</th>
                  <th className="th">Actor</th>
                  <th className="th">Action</th>
                  <th className="th">Target</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(l => (
                  <tr key={l.id} className="table-row">
                    <td className="td text-gray-400">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="td font-medium">{l.actor_email || l.actor_id}</td>
                    <td className="td"><span className="badge-gray">{l.action}</span></td>
                    <td className="td text-gray-400">{l.target_user || l.details || '—'}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={4} className="td text-center text-gray-400 py-4">No audit events found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
