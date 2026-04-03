import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts'
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import useStore from '../store/useStore'

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
const STATUSES = ['Planned', 'In Progress', 'Complete']
const PRIORITY_BADGE = { Critical: 'badge-red', High: 'badge-amber', Medium: 'badge-blue', Low: 'badge-gray' }
const STATUS_BADGE = { Planned: 'badge-gray', 'In Progress': 'badge-blue', Complete: 'badge-green' }
const GAP_COLOR = (gap) => gap >= 2 ? '#EF4444' : gap >= 1 ? '#F59E0B' : '#22C55E'

const MATURITY_LABELS = { 1: 'Initial', 2: 'Developing', 3: 'Defined', 4: 'Managed', 5: 'Optimising' }

function ScoreBar({ current, target }) {
  const pctCurrent = (current / 5) * 100
  const pctTarget = (target / 5) * 100
  return (
    <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
      <div className="absolute top-0 left-0 h-full bg-sap-blue rounded-full transition-all" style={{ width: `${pctCurrent}%`, opacity: 0.7 }} />
      <div className="absolute top-0 left-0 h-full rounded-full border-r-2 border-dashed border-sap-blue opacity-40" style={{ width: `${pctTarget}%` }} />
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <span className="text-xs font-semibold text-white drop-shadow">{current.toFixed(1)}</span>
        <span className="text-xs font-medium text-gray-500">→ {target.toFixed(1)}</span>
      </div>
    </div>
  )
}

function ProcessAreaRow({ area, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState({ ...area, opportunitiesStr: (area.opportunities || []).join('\n') })

  const save = () => {
    onUpdate(area.id, {
      ...form,
      opportunities: form.opportunitiesStr.split('\n').map(s => s.trim()).filter(Boolean)
    })
    setEditing(false)
  }
  const cancel = () => { setForm({ ...area, opportunitiesStr: (area.opportunities || []).join('\n') }); setEditing(false) }
  const gap = (area.targetScore - area.currentScore).toFixed(1)

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="td" colSpan={8}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 py-2">
            <div>
              <label className="label">Process Area</label>
              <input className="input" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
            </div>
            <div>
              <label className="label">Owner</label>
              <input className="input" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Current Maturity Score (1-5)</label>
              <input type="number" min={1} max={5} step={0.5} className="input" value={form.currentScore} onChange={e => setForm({ ...form, currentScore: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Target Maturity Score (1-5)</label>
              <input type="number" min={1} max={5} step={0.5} className="input" value={form.targetScore} onChange={e => setForm({ ...form, targetScore: Number(e.target.value) })} />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="label">Opportunities (one per line)</label>
              <textarea className="input h-20 resize-none" value={form.opportunitiesStr}
                onChange={e => setForm({ ...form, opportunitiesStr: e.target.value })} />
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-2">
              <button onClick={save} className="btn-primary"><Check size={14} /> Save</button>
              <button onClick={cancel} className="btn-secondary"><X size={14} /> Cancel</button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      <tr className="table-row cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="td font-medium text-gray-800">{area.area}</td>
        <td className="td">
          <div className="w-40">
            <ScoreBar current={area.currentScore} target={area.targetScore} />
          </div>
        </td>
        <td className="td text-center">
          <span className="font-semibold text-sm" style={{ color: GAP_COLOR(Number(gap)) }}>{gap}</span>
        </td>
        <td className="td"><span className={PRIORITY_BADGE[area.priority] || 'badge-gray'}>{area.priority}</span></td>
        <td className="td"><span className={STATUS_BADGE[area.status] || 'badge-gray'}>{area.status}</span></td>
        <td className="td text-gray-500 text-xs">{area.owner}</td>
        <td className="td text-gray-400 text-xs">{(area.opportunities || []).length} items</td>
        <td className="td" onClick={e => e.stopPropagation()}>
          <div className="flex gap-1 items-center">
            {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            <button onClick={(e) => { e.stopPropagation(); setEditing(true) }} className="btn-ghost py-1 px-2"><Pencil size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(area.id) }} className="btn-danger py-1 px-2"><Trash2 size={14} /></button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50">
          <td colSpan={8} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Current: {area.currentScore} – {MATURITY_LABELS[Math.round(area.currentScore)]}</p>
                <p className="text-xs font-semibold text-sap-blue mb-1">Target: {area.targetScore} – {MATURITY_LABELS[Math.round(area.targetScore)]}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Identified Opportunities:</p>
                <ul className="space-y-1">
                  {(area.opportunities || []).map((o, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span className="text-sap-blue mt-0.5">•</span>{o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

const BLANK = { area: '', currentScore: 2, targetScore: 4, priority: 'Medium', status: 'Planned', owner: '', opportunities: [] }

function AddModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ ...BLANK, opportunitiesStr: '' })
  const submit = () => {
    if (!form.area) return
    onAdd({ ...form, opportunities: form.opportunitiesStr.split('\n').map(s => s.trim()).filter(Boolean) })
    onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold">Add Process Area</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Process Area</label>
            <input className="input" placeholder="e.g. Finance & Controlling" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
          </div>
          <div>
            <label className="label">Owner</label>
            <input className="input" placeholder="e.g. CFO Office" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Current Score (1-5)</label>
            <input type="number" min={1} max={5} step={0.5} className="input" value={form.currentScore} onChange={e => setForm({ ...form, currentScore: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Target Score (1-5)</label>
            <input type="number" min={1} max={5} step={0.5} className="input" value={form.targetScore} onChange={e => setForm({ ...form, targetScore: Number(e.target.value) })} />
          </div>
          <div className="col-span-2">
            <label className="label">Opportunities (one per line)</label>
            <textarea className="input h-20 resize-none" value={form.opportunitiesStr}
              onChange={e => setForm({ ...form, opportunitiesStr: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} className="btn-primary">Add Process Area</button>
        </div>
      </div>
    </div>
  )
}

export default function ValueAssessment() {
  const { valueAssessment, updateProcessArea, addProcessArea, deleteProcessArea } = useStore()
  const { processAreas } = valueAssessment
  const [showAdd, setShowAdd] = useState(false)
  const [filterPriority, setFilterPriority] = useState('All')

  const filtered = filterPriority === 'All' ? processAreas : processAreas.filter(p => p.priority === filterPriority)

  // Radar data
  const radarData = processAreas.map(p => ({
    subject: p.area.split(' ')[0],
    Current: p.currentScore,
    Target: p.targetScore,
  }))

  // Gap bar chart
  const gapData = processAreas.map(p => ({
    name: p.area.split('&')[0].trim(),
    'Current Score': p.currentScore,
    Gap: Number((p.targetScore - p.currentScore).toFixed(1)),
  })).sort((a, b) => b.Gap - a.Gap)

  // Summary
  const avgCurrent = processAreas.reduce((s, p) => s + p.currentScore, 0) / processAreas.length
  const avgTarget = processAreas.reduce((s, p) => s + p.targetScore, 0) / processAreas.length
  const totalOpps = processAreas.reduce((s, p) => s + (p.opportunities || []).length, 0)
  const critical = processAreas.filter(p => p.priority === 'Critical').length

  return (
    <div className="space-y-6">
      {showAdd && <AddModal onAdd={addProcessArea} onClose={() => setShowAdd(false)} />}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Process Areas', value: processAreas.length, sub: 'In scope', color: 'blue' },
          { label: 'Avg Current Maturity', value: avgCurrent.toFixed(1), sub: MATURITY_LABELS[Math.round(avgCurrent)], color: 'amber' },
          { label: 'Avg Target Maturity', value: avgTarget.toFixed(1), sub: MATURITY_LABELS[Math.round(avgTarget)], color: 'green' },
          { label: 'Opportunities Identified', value: totalOpps, sub: `${critical} critical areas`, color: 'purple' },
        ].map(({ label, value, sub, color }) => {
          const bg = { blue: 'bg-blue-50 text-sap-blue', green: 'bg-green-50 text-green-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600' }
          return (
            <div key={label} className="stat-card">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${bg[color].split(' ')[1]}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title mb-4">Maturity Radar</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Radar name="Current" dataKey="Current" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.25} strokeWidth={1.5} />
              <Radar name="Target" dataKey="Target" stroke="#0070F2" fill="#0070F2" fillOpacity={0.15} strokeWidth={2} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title mb-4">Gap Analysis by Process Area</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={gapData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={80} />
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Current Score" stackId="a" fill="#0070F2" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Gap" stackId="a" radius={[0, 3, 3, 0]}>
                {gapData.map((d) => (
                  <Cell key={d.name} fill={GAP_COLOR(d.Gap)} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 ml-20">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 bg-opacity-70" />Gap ≥2</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 bg-opacity-70" />Gap 1-2</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 bg-opacity-70" />Gap &lt;1</span>
          </div>
        </div>
      </div>

      {/* Process areas table */}
      <div className="card">
        <div className="section-header">
          <h3 className="section-title">Process Area Assessment</h3>
          <div className="flex items-center gap-3">
            <select className="input py-1.5 w-40 text-xs" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="All">All Priorities</option>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16} /> Add Area</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="th">Process Area</th>
                <th className="th">Maturity Score (Current → Target)</th>
                <th className="th text-center">Gap</th>
                <th className="th">Priority</th>
                <th className="th">Status</th>
                <th className="th">Owner</th>
                <th className="th">Opportunities</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <ProcessAreaRow key={a.id} area={a} onUpdate={updateProcessArea} onDelete={deleteProcessArea} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Maturity legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
          {Object.entries(MATURITY_LABELS).map(([score, label]) => (
            <div key={score} className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded bg-sap-blue flex items-center justify-center" style={{ opacity: Number(score) * 0.18 + 0.1 }}>
                <span className="text-xs font-bold text-white">{score}</span>
              </div>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
