import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, CheckCircle2, Clock, MessageSquare, Users } from 'lucide-react'
import useStore from '../store/useStore'

// ─── Constants ────────────────────────────────────────────────────────────────
const MILESTONE_STATUSES = ['Planned', 'In Progress', 'Complete', 'Delayed']
const RISK_CATEGORIES = ['Technical', 'People', 'Governance', 'Compliance', 'Financial', 'Schedule']
const RISK_STATUSES = ['Open', 'Mitigated', 'Closed']
const ISSUE_PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
const ISSUE_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed']
const PHASES = ['Prepare', 'Explore', 'Realize', 'Deploy', 'Run']

const MS_STYLE = {
  Complete: { dot: 'bg-green-500', badge: 'badge-green', line: 'bg-green-500' },
  'In Progress': { dot: 'bg-sap-blue animate-pulse', badge: 'badge-blue', line: 'bg-sap-blue' },
  Planned: { dot: 'bg-gray-300', badge: 'badge-gray', line: 'bg-gray-200' },
  Delayed: { dot: 'bg-red-500', badge: 'badge-red', line: 'bg-red-400' },
}

const RISK_SCORE_COLOR = (score) =>
  score >= 16 ? { bg: 'bg-red-100', text: 'text-red-700', badge: 'badge-red', label: 'Critical' }
    : score >= 9 ? { bg: 'bg-amber-100', text: 'text-amber-700', badge: 'badge-amber', label: 'High' }
    : score >= 4 ? { bg: 'bg-yellow-100', text: 'text-yellow-700', badge: 'badge-amber', label: 'Medium' }
    : { bg: 'bg-green-100', text: 'text-green-700', badge: 'badge-green', label: 'Low' }

const ENGAGEMENT_STYLE = {
  Champion: 'badge-green',
  Supportive: 'badge-blue',
  Neutral: 'badge-gray',
  Resistant: 'badge-red',
  Unaware: 'badge-gray',
}

// ─── Generic Modal wrapper ────────────────────────────────────────────────────
function Modal({ title, onClose, children, onSave }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onSave} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Milestones tab ───────────────────────────────────────────────────────────
function MilestonesTab() {
  const { programGovernance, addMilestone, updateMilestone, deleteMilestone } = useStore()
  const { milestones } = programGovernance
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})

  const BLANK = { name: '', plannedDate: '', actualDate: '', status: 'Planned', owner: '', phase: 'Realize' }
  const openAdd = () => { setForm(BLANK); setShowAdd(true) }
  const openEdit = (m) => { setForm({ ...m }); setEditId(m.id) }
  const saveAdd = () => { if (form.name) { addMilestone(form); setShowAdd(false) } }
  const saveEdit = () => { updateMilestone(editId, form); setEditId(null) }

  const byPhase = PHASES.reduce((acc, p) => {
    acc[p] = milestones.filter(m => m.phase === p)
    return acc
  }, {})

  const done = milestones.filter(m => m.status === 'Complete').length
  const pctDone = Math.round((done / milestones.length) * 100)

  const FormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="label">Milestone Name</label>
        <input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Phase</label>
        <select className="input" value={form.phase || 'Realize'} onChange={e => setForm({ ...form, phase: e.target.value })}>
          {PHASES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status || 'Planned'} onChange={e => setForm({ ...form, status: e.target.value })}>
          {MILESTONE_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Planned Date</label>
        <input type="date" className="input" value={form.plannedDate || ''} onChange={e => setForm({ ...form, plannedDate: e.target.value })} />
      </div>
      <div>
        <label className="label">Actual Date</label>
        <input type="date" className="input" value={form.actualDate || ''} onChange={e => setForm({ ...form, actualDate: e.target.value })} />
      </div>
      <div className="col-span-2">
        <label className="label">Owner</label>
        <input className="input" value={form.owner || ''} onChange={e => setForm({ ...form, owner: e.target.value })} />
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {showAdd && <Modal title="Add Milestone" onClose={() => setShowAdd(false)} onSave={saveAdd}><FormFields /></Modal>}
      {editId && <Modal title="Edit Milestone" onClose={() => setEditId(null)} onSave={saveEdit}><FormFields /></Modal>}

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="section-title">Programme Timeline</h3>
            <p className="text-xs text-gray-400 mt-0.5">{done}/{milestones.length} milestones complete · {pctDone}% overall</p>
          </div>
          <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add</button>
        </div>
        <div className="progress-bar mb-6">
          <div className="progress-fill bg-sap-blue" style={{ width: `${pctDone}%` }} />
        </div>

        {PHASES.map(phase => {
          const items = byPhase[phase]
          if (!items.length) return null
          return (
            <div key={phase} className="mb-5">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{phase}</h4>
              <div className="relative ml-4 pl-6 border-l-2 border-gray-100">
                {items.map((m, i) => {
                  const s = MS_STYLE[m.status] || MS_STYLE.Planned
                  return (
                    <div key={m.id} className="relative mb-4 last:mb-0">
                      <div className={`absolute -left-7 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${s.dot}`} />
                      <div className="flex items-start justify-between group">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{m.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Planned: <span className="font-medium">{m.plannedDate}</span>
                            {m.actualDate && <span className="ml-2">· Actual: <span className="font-medium">{m.actualDate}</span></span>}
                            <span className="ml-2">· {m.owner}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`${MS_STYLE[m.status]?.badge || 'badge-gray'} flex-shrink-0`}>{m.status}</span>
                          <div className="hidden group-hover:flex gap-1">
                            <button onClick={() => openEdit(m)} className="btn-ghost py-0.5 px-1.5"><Pencil size={12} /></button>
                            <button onClick={() => deleteMilestone(m.id)} className="btn-danger py-0.5 px-1.5"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Risks tab ────────────────────────────────────────────────────────────────
function RisksTab() {
  const { programGovernance, addRisk, updateRisk, deleteRisk } = useStore()
  const { risks } = programGovernance
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})
  const [filterStatus, setFilterStatus] = useState('All')

  const BLANK = { description: '', probability: 3, impact: 3, mitigation: '', owner: '', status: 'Open', category: 'Technical' }
  const openAdd = () => { setForm(BLANK); setShowAdd(true) }
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.id) }
  const saveAdd = () => { if (form.description) { addRisk(form); setShowAdd(false) } }
  const saveEdit = () => { updateRisk(editId, form); setEditId(null) }

  const filtered = filterStatus === 'All' ? risks : risks.filter(r => r.status === filterStatus)
  const sorted = [...filtered].sort((a, b) => b.probability * b.impact - a.probability * a.impact)

  const FormFields = () => (
    <div className="space-y-3">
      <div>
        <label className="label">Risk Description</label>
        <textarea className="input h-20 resize-none" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category || 'Technical'} onChange={e => setForm({ ...form, category: e.target.value })}>
            {RISK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status || 'Open'} onChange={e => setForm({ ...form, status: e.target.value })}>
            {RISK_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Probability (1-5)</label>
          <input type="range" min={1} max={5} value={form.probability || 3} onChange={e => setForm({ ...form, probability: Number(e.target.value) })} className="w-full" />
          <p className="text-xs text-center font-semibold text-gray-700">{form.probability || 3}</p>
        </div>
        <div>
          <label className="label">Impact (1-5)</label>
          <input type="range" min={1} max={5} value={form.impact || 3} onChange={e => setForm({ ...form, impact: Number(e.target.value) })} className="w-full" />
          <p className="text-xs text-center font-semibold text-gray-700">{form.impact || 3}</p>
        </div>
        <div className="col-span-2">
          <label className="label">Owner</label>
          <input className="input" value={form.owner || ''} onChange={e => setForm({ ...form, owner: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="label">Mitigation Plan</label>
          <textarea className="input h-20 resize-none" value={form.mitigation || ''} onChange={e => setForm({ ...form, mitigation: e.target.value })} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {showAdd && <Modal title="Add Risk" onClose={() => setShowAdd(false)} onSave={saveAdd}><FormFields /></Modal>}
      {editId && <Modal title="Edit Risk" onClose={() => setEditId(null)} onSave={saveEdit}><FormFields /></Modal>}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['All', ...RISK_STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-sap-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Risk</button>
      </div>

      <div className="space-y-3">
        {sorted.map(r => {
          const score = r.probability * r.impact
          const c = RISK_SCORE_COLOR(score)
          return (
            <div key={r.id} className={`p-4 rounded-xl border ${c.bg} border-opacity-50 group`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={c.badge}>{c.label} (Score: {score})</span>
                    <span className="badge-gray">{r.category}</span>
                    <span className={r.status === 'Open' ? 'badge-red' : r.status === 'Mitigated' ? 'badge-amber' : 'badge-green'}>{r.status}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{r.description}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>P:{r.probability} × I:{r.impact}</span>
                    <span>Owner: {r.owner}</span>
                  </div>
                  {r.mitigation && (
                    <p className="text-xs text-gray-500 mt-2 italic">Mitigation: {r.mitigation}</p>
                  )}
                </div>
                <div className="hidden group-hover:flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(r)} className="btn-ghost py-1 px-2"><Pencil size={14} /></button>
                  <button onClick={() => deleteRisk(r.id)} className="btn-danger py-1 px-2"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Issues tab ───────────────────────────────────────────────────────────────
function IssuesTab() {
  const { programGovernance, addIssue, updateIssue, deleteIssue } = useStore()
  const { issues } = programGovernance
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})
  const [filterStatus, setFilterStatus] = useState('All')

  const BLANK = { description: '', priority: 'Medium', owner: '', dueDate: '', status: 'Open', raisedDate: new Date().toISOString().slice(0, 10) }
  const openAdd = () => { setForm(BLANK); setShowAdd(true) }
  const openEdit = (i) => { setForm({ ...i }); setEditId(i.id) }
  const saveAdd = () => { if (form.description) { addIssue(form); setShowAdd(false) } }
  const saveEdit = () => { updateIssue(editId, form); setEditId(null) }

  const filtered = filterStatus === 'All' ? issues : issues.filter(i => i.status === filterStatus)
  const PRIORITY_BADGE = { Critical: 'badge-red', High: 'badge-amber', Medium: 'badge-blue', Low: 'badge-gray' }
  const STATUS_BADGE = { Open: 'badge-red', 'In Progress': 'badge-amber', Resolved: 'badge-green', Closed: 'badge-gray' }

  const FormFields = () => (
    <div className="space-y-3">
      <div>
        <label className="label">Issue Description</label>
        <textarea className="input h-24 resize-none" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority || 'Medium'} onChange={e => setForm({ ...form, priority: e.target.value })}>
            {ISSUE_PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status || 'Open'} onChange={e => setForm({ ...form, status: e.target.value })}>
            {ISSUE_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Owner</label>
          <input className="input" value={form.owner || ''} onChange={e => setForm({ ...form, owner: e.target.value })} />
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" value={form.dueDate || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div>
          <label className="label">Raised Date</label>
          <input type="date" className="input" value={form.raisedDate || ''} onChange={e => setForm({ ...form, raisedDate: e.target.value })} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {showAdd && <Modal title="Add Issue" onClose={() => setShowAdd(false)} onSave={saveAdd}><FormFields /></Modal>}
      {editId && <Modal title="Edit Issue" onClose={() => setEditId(null)} onSave={saveEdit}><FormFields /></Modal>}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {['All', ...ISSUE_STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-sap-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Issue</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="th">Description</th>
              <th className="th">Priority</th>
              <th className="th">Status</th>
              <th className="th">Owner</th>
              <th className="th">Raised</th>
              <th className="th">Due</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} className="table-row group">
                <td className="td font-medium text-gray-800 max-w-xs">{i.description}</td>
                <td className="td"><span className={PRIORITY_BADGE[i.priority] || 'badge-gray'}>{i.priority}</span></td>
                <td className="td"><span className={STATUS_BADGE[i.status] || 'badge-gray'}>{i.status}</span></td>
                <td className="td text-gray-500 text-xs">{i.owner}</td>
                <td className="td text-gray-400 text-xs">{i.raisedDate}</td>
                <td className="td text-gray-400 text-xs">{i.dueDate}</td>
                <td className="td">
                  <div className="hidden group-hover:flex gap-1">
                    <button onClick={() => openEdit(i)} className="btn-ghost py-1 px-2"><Pencil size={14} /></button>
                    <button onClick={() => deleteIssue(i.id)} className="btn-danger py-1 px-2"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Decisions tab ────────────────────────────────────────────────────────────
function DecisionsTab() {
  const { programGovernance, addDecision, updateDecision, deleteDecision } = useStore()
  const { decisions } = programGovernance
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})

  const BLANK = { description: '', date: new Date().toISOString().slice(0, 10), decidedBy: '', rationale: '', status: 'Approved' }
  const openAdd = () => { setForm(BLANK); setShowAdd(true) }
  const openEdit = (d) => { setForm({ ...d }); setEditId(d.id) }
  const saveAdd = () => { if (form.description) { addDecision(form); setShowAdd(false) } }
  const saveEdit = () => { updateDecision(editId, form); setEditId(null) }

  const FormFields = () => (
    <div className="space-y-3">
      <div>
        <label className="label">Decision</label>
        <textarea className="input h-20 resize-none" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status || 'Approved'} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option>Approved</option><option>Pending</option><option>Rejected</option><option>Deferred</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Decided By</label>
          <input className="input" value={form.decidedBy || ''} onChange={e => setForm({ ...form, decidedBy: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="label">Rationale</label>
          <textarea className="input h-20 resize-none" value={form.rationale || ''} onChange={e => setForm({ ...form, rationale: e.target.value })} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {showAdd && <Modal title="Add Decision" onClose={() => setShowAdd(false)} onSave={saveAdd}><FormFields /></Modal>}
      {editId && <Modal title="Edit Decision" onClose={() => setEditId(null)} onSave={saveEdit}><FormFields /></Modal>}

      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Log Decision</button>
      </div>

      <div className="space-y-3">
        {decisions.map(d => (
          <div key={d.id} className="card group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="badge-green">{d.status}</span>
                  <span className="text-xs text-gray-400">{d.date}</span>
                  <span className="text-xs text-gray-500">· {d.decidedBy}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{d.description}</p>
                {d.rationale && <p className="text-xs text-gray-500 mt-1 italic">{d.rationale}</p>}
              </div>
              <div className="hidden group-hover:flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(d)} className="btn-ghost py-1 px-2"><Pencil size={14} /></button>
                <button onClick={() => deleteDecision(d.id)} className="btn-danger py-1 px-2"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Stakeholders tab ─────────────────────────────────────────────────────────
function StakeholdersTab() {
  const { programGovernance } = useStore()
  const { stakeholders } = programGovernance

  return (
    <div className="space-y-6">
      {/* Stakeholder Map (Influence vs Interest) */}
      <div className="card">
        <h3 className="section-title mb-4">Stakeholder Influence vs Interest Map</h3>
        <div className="relative bg-gray-50 rounded-xl" style={{ height: 360 }}>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-gray-400">INFLUENCE</div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-400">INTEREST →</div>

          {/* Quadrant labels */}
          <div className="absolute top-3 left-10 text-xs text-gray-300 font-medium">Keep Satisfied</div>
          <div className="absolute top-3 right-4 text-xs text-gray-300 font-medium">Manage Closely</div>
          <div className="absolute bottom-6 left-10 text-xs text-gray-300 font-medium">Monitor</div>
          <div className="absolute bottom-6 right-4 text-xs text-gray-300 font-medium">Keep Informed</div>

          {/* Grid lines */}
          <div className="absolute inset-8 border border-gray-200 rounded">
            <div className="absolute top-1/2 w-full border-t border-dashed border-gray-200" />
            <div className="absolute left-1/2 h-full border-l border-dashed border-gray-200" />
          </div>

          {/* Stakeholder dots */}
          {stakeholders.map(s => {
            const x = ((s.interest - 1) / 4) * 100
            const y = (1 - (s.influence - 1) / 4) * 100
            const engColor = { Champion: '#22C55E', Supportive: '#0070F2', Neutral: '#9CA3AF', Resistant: '#EF4444', Unaware: '#D1D5DB' }
            return (
              <div key={s.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${8 + (x / 100) * 84}%`, top: `${8 + (y / 100) * 84}%` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer"
                  style={{ background: engColor[s.engagement] || '#9ca3af' }}
                  title={`${s.name} (${s.engagement})`}>
                  {s.name.charAt(0)}
                </div>
                <div className="hidden group-hover:block absolute z-20 top-10 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-44 text-xs whitespace-nowrap">
                  <p className="font-semibold text-gray-800">{s.name}</p>
                  <p className="text-gray-500">{s.role}</p>
                  <p className="text-gray-400">{s.department}</p>
                  <span className={`${ENGAGEMENT_STYLE[s.engagement] || 'badge-gray'} mt-1 inline-flex`}>{s.engagement}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stakeholder table */}
      <div className="card overflow-x-auto">
        <h3 className="section-title mb-4">Stakeholder Register</h3>
        <table className="w-full">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="th">Name</th>
              <th className="th">Role</th>
              <th className="th">Department</th>
              <th className="th">Influence</th>
              <th className="th">Interest</th>
              <th className="th">Engagement</th>
            </tr>
          </thead>
          <tbody>
            {stakeholders.map(s => (
              <tr key={s.id} className="table-row">
                <td className="td font-medium text-gray-800">{s.name}</td>
                <td className="td text-gray-600 text-xs">{s.role}</td>
                <td className="td text-gray-500 text-xs">{s.department}</td>
                <td className="td">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-4 h-1.5 rounded-full ${i <= s.influence ? 'bg-sap-blue' : 'bg-gray-200'}`} />)}
                  </div>
                </td>
                <td className="td">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-4 h-1.5 rounded-full ${i <= s.interest ? 'bg-amber-400' : 'bg-gray-200'}`} />)}
                  </div>
                </td>
                <td className="td"><span className={ENGAGEMENT_STYLE[s.engagement] || 'badge-gray'}>{s.engagement}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ProgramGovernance() {
  const [activeTab, setActiveTab] = useState('milestones')
  const { programGovernance } = useStore()
  const { milestones, risks, issues, decisions } = programGovernance

  const openRisks = risks.filter(r => r.status === 'Open').length
  const openIssues = issues.filter(i => i.status === 'Open' || i.status === 'In Progress').length

  const tabs = [
    { id: 'milestones', label: `Milestones (${milestones.length})` },
    { id: 'risks', label: `Risks (${openRisks} open)`, alert: openRisks > 3 },
    { id: 'issues', label: `Issues (${openIssues} open)`, alert: openIssues > 2 },
    { id: 'decisions', label: `Decisions (${decisions.length})` },
    { id: 'stakeholders', label: 'Stakeholders' },
  ]

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Milestones', value: `${milestones.filter(m => m.status === 'Complete').length}/${milestones.length}`, sub: 'Complete', color: 'green' },
          { label: 'Open Risks', value: openRisks, sub: `${risks.filter(r => r.probability * r.impact >= 16 && r.status === 'Open').length} critical`, color: openRisks > 3 ? 'red' : 'amber' },
          { label: 'Open Issues', value: openIssues, sub: `${issues.filter(i => i.priority === 'High' && i.status !== 'Resolved' && i.status !== 'Closed').length} high priority`, color: openIssues > 3 ? 'red' : 'amber' },
          { label: 'Decisions Logged', value: decisions.length, sub: `${decisions.filter(d => d.status === 'Approved').length} approved`, color: 'blue' },
          { label: 'Stakeholders', value: programGovernance.stakeholders.length, sub: `${programGovernance.stakeholders.filter(s => s.engagement === 'Champion').length} champions`, color: 'purple' },
        ].map(({ label, value, sub, color }) => {
          const text = { green: 'text-green-600', amber: 'text-amber-600', red: 'text-red-600', blue: 'text-sap-blue', purple: 'text-purple-600' }
          return (
            <div key={label} className="stat-card text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${text[color]}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            {t.alert && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
          </button>
        ))}
      </div>

      {activeTab === 'milestones' && <MilestonesTab />}
      {activeTab === 'risks' && <RisksTab />}
      {activeTab === 'issues' && <IssuesTab />}
      {activeTab === 'decisions' && <DecisionsTab />}
      {activeTab === 'stakeholders' && <StakeholdersTab />}
    </div>
  )
}
