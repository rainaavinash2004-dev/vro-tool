import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { Plus, Pencil, Trash2, X, Check, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react'
import useStore from '../store/useStore'

const CATEGORIES = ['Finance', 'Procurement', 'Supply Chain', 'HR', 'Analytics', 'IT', 'Operations']
const STATUSES = ['On Track', 'At Risk', 'Behind']
const STATUS_STYLE = {
  'On Track': { badge: 'badge-green', bar: 'bg-green-500', dot: 'bg-green-500' },
  'At Risk': { badge: 'badge-amber', bar: 'bg-amber-400', dot: 'bg-amber-400' },
  'Behind': { badge: 'badge-red', bar: 'bg-red-500', dot: 'bg-red-500' },
}
const STATUS_PIE_COLORS = { 'On Track': '#22C55E', 'At Risk': '#F59E0B', 'Behind': '#EF4444' }

const TREND_ICON = {
  improving: <TrendingUp size={13} className="text-green-500" />,
  declining: <TrendingDown size={13} className="text-red-500" />,
  stable: <Minus size={13} className="text-gray-400" />,
}

function progressPct(baseline, current, target) {
  const range = target - baseline
  if (range === 0) return 100
  return Math.min(100, Math.max(0, ((current - baseline) / range) * 100))
}

function KpiRow({ kpi, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(kpi)
  const save = () => { onUpdate(kpi.id, form); setEditing(false) }
  const cancel = () => { setForm(kpi); setEditing(false) }
  const prog = progressPct(kpi.baseline, kpi.current, kpi.target)
  const s = STATUS_STYLE[kpi.status] || STATUS_STYLE['On Track']

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="td" colSpan={10}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
            <div className="col-span-2">
              <label className="label">KPI Name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" placeholder="Days, %, x, $" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div>
              <label className="label">Baseline</label>
              <input type="number" step="any" className="input" value={form.baseline} onChange={e => setForm({ ...form, baseline: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Current</label>
              <input type="number" step="any" className="input" value={form.current} onChange={e => setForm({ ...form, current: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Target</label>
              <input type="number" step="any" className="input" value={form.target} onChange={e => setForm({ ...form, target: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Trend</label>
              <select className="input" value={form.trend} onChange={e => setForm({ ...form, trend: e.target.value })}>
                <option value="improving">Improving</option>
                <option value="stable">Stable</option>
                <option value="declining">Declining</option>
              </select>
            </div>
            <div>
              <label className="label">Last Updated</label>
              <input className="input" placeholder="YYYY-MM" value={form.lastUpdated} onChange={e => setForm({ ...form, lastUpdated: e.target.value })} />
            </div>
            <div className="col-span-2 md:col-span-4 flex gap-2">
              <button onClick={save} className="btn-primary"><Check size={14} /> Save</button>
              <button onClick={cancel} className="btn-secondary"><X size={14} /> Cancel</button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="table-row">
      <td className="td font-medium text-gray-800 max-w-xs">{kpi.name}</td>
      <td className="td"><span className="badge-gray text-xs">{kpi.category}</span></td>
      <td className="td text-gray-500">{kpi.baseline}{kpi.unit}</td>
      <td className="td font-semibold text-gray-800">{kpi.current}{kpi.unit}</td>
      <td className="td text-sap-blue font-medium">{kpi.target}{kpi.unit}</td>
      <td className="td w-36">
        <div className="flex items-center gap-2">
          <div className="progress-bar flex-1">
            <div className={`progress-fill ${s.bar}`} style={{ width: `${prog}%` }} />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right">{prog.toFixed(0)}%</span>
        </div>
      </td>
      <td className="td">{TREND_ICON[kpi.trend]}</td>
      <td className="td"><span className={s.badge}>{kpi.status}</span></td>
      <td className="td text-xs text-gray-400">{kpi.lastUpdated}</td>
      <td className="td">
        <div className="flex gap-1">
          <button onClick={() => setEditing(true)} className="btn-ghost py-1 px-2"><Pencil size={14} /></button>
          <button onClick={() => onDelete(kpi.id)} className="btn-danger py-1 px-2"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  )
}

const BLANK_KPI = { name: '', category: 'Finance', baseline: 0, current: 0, target: 0, unit: '', status: 'On Track', trend: 'stable', lastUpdated: '' }

function AddKpiModal({ onAdd, onClose }) {
  const [form, setForm] = useState(BLANK_KPI)
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold">Add KPI</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">KPI Name</label>
            <input className="input" placeholder="e.g. Days Sales Outstanding" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Unit (Days, %, x, $M)</label>
            <input className="input" placeholder="Days" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="label">Baseline</label>
            <input type="number" step="any" className="input" value={form.baseline} onChange={e => setForm({ ...form, baseline: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Current</label>
            <input type="number" step="any" className="input" value={form.current} onChange={e => setForm({ ...form, current: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Target</label>
            <input type="number" step="any" className="input" value={form.target} onChange={e => setForm({ ...form, target: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Trend</label>
            <select className="input" value={form.trend} onChange={e => setForm({ ...form, trend: e.target.value })}>
              <option value="improving">Improving</option>
              <option value="stable">Stable</option>
              <option value="declining">Declining</option>
            </select>
          </div>
          <div>
            <label className="label">Last Updated (YYYY-MM)</label>
            <input className="input" placeholder="2025-03" value={form.lastUpdated} onChange={e => setForm({ ...form, lastUpdated: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { if (form.name) { onAdd(form); onClose() } }} className="btn-primary">Add KPI</button>
        </div>
      </div>
    </div>
  )
}

export default function ValueMeasurement() {
  const { valueMeasurement, addKpi, updateKpi, deleteKpi } = useStore()
  const { kpis, realizationData } = valueMeasurement
  const [showAdd, setShowAdd] = useState(false)
  const [activeSection, setActiveSection] = useState('kpis')
  const [filterCat, setFilterCat] = useState('All')

  const filtered = filterCat === 'All' ? kpis : kpis.filter(k => k.category === filterCat)

  // Status counts
  const statusCounts = kpis.reduce((acc, k) => { acc[k.status] = (acc[k.status] || 0) + 1; return acc }, {})
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Category performance
  const catPerf = CATEGORIES.map(cat => {
    const items = kpis.filter(k => k.category === cat)
    if (!items.length) return null
    const avgProg = items.reduce((s, k) => s + progressPct(k.baseline, k.current, k.target), 0) / items.length
    return { category: cat, progress: Math.round(avgProg), count: items.length }
  }).filter(Boolean)

  // Realization
  const realData = realizationData.map(d => ({ ...d, actual: d.actual ?? undefined }))

  const tabs = [
    { id: 'kpis', label: `KPI Tracker (${kpis.length})` },
    { id: 'realization', label: 'Benefits Realization' },
    { id: 'summary', label: 'Performance Summary' },
  ]

  return (
    <div className="space-y-6">
      {showAdd && <AddKpiModal onAdd={addKpi} onClose={() => setShowAdd(false)} />}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveSection(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeSection === 'kpis' && (
        <>
          {/* Status cards */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
            {['On Track', 'At Risk', 'Behind'].map(s => {
              const count = statusCounts[s] || 0
              const pct = kpis.length > 0 ? Math.round((count / kpis.length) * 100) : 0
              const style = STATUS_STYLE[s]
              return (
                <div key={s} className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                      <p className="text-xs text-gray-400 mt-1">{pct}% of KPIs</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 ${style.dot}`} />
                  </div>
                  <div className="progress-bar mt-3">
                    <div className={`progress-fill ${style.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Table */}
          <div className="card">
            <div className="section-header">
              <h3 className="section-title">KPI Register</h3>
              <div className="flex items-center gap-3">
                <select className="input py-1.5 w-40 text-xs" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16} /> Add KPI</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="th">KPI</th>
                    <th className="th">Category</th>
                    <th className="th">Baseline</th>
                    <th className="th">Current</th>
                    <th className="th">Target</th>
                    <th className="th w-40">Progress to Target</th>
                    <th className="th">Trend</th>
                    <th className="th">Status</th>
                    <th className="th">Updated</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(k => (
                    <KpiRow key={k.id} kpi={k} onUpdate={updateKpi} onDelete={deleteKpi} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeSection === 'realization' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="section-title mb-1">Benefits Realization – Quarterly</h3>
              <p className="text-xs text-gray-400 mb-4">Planned vs Actual realised benefits ($)</p>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={realData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0070F2" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0070F2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={55} />
                  <Tooltip formatter={(v, n) => [v != null ? `$${(v / 1e6).toFixed(2)}M` : 'N/A', n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="planned" name="Planned" stroke="#0070F2" strokeWidth={2} fill="url(#gP)" connectNulls />
                  <Area type="monotone" dataKey="actual" name="Actual" stroke="#22C55E" strokeWidth={2} fill="url(#gA)" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="section-title mb-1">Cumulative Benefits Realization</h3>
              <p className="text-xs text-gray-400 mb-4">Running total of planned vs actual ($)</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={realData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={55} />
                  <Tooltip formatter={(v, n) => [v != null ? `$${(v / 1e6).toFixed(2)}M` : 'N/A', n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="cumPlanned" name="Cum. Planned" stroke="#0070F2" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="cumActual" name="Cum. Actual" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Realization table */}
          <div className="card">
            <h3 className="section-title mb-4">Realization Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="th">Quarter</th>
                    <th className="th">Planned ($)</th>
                    <th className="th">Actual ($)</th>
                    <th className="th">Variance ($)</th>
                    <th className="th">Cum. Planned ($)</th>
                    <th className="th">Cum. Actual ($)</th>
                    <th className="th">Realisation %</th>
                  </tr>
                </thead>
                <tbody>
                  {realizationData.map((d) => {
                    const variance = d.actual != null ? d.actual - d.planned : null
                    const realizPct = d.planned > 0 && d.actual != null ? (d.actual / d.planned) * 100 : null
                    const fmt = v => v != null ? `$${(v / 1e6).toFixed(2)}M` : '—'
                    return (
                      <tr key={d.quarter} className="table-row">
                        <td className="td font-medium text-gray-800">{d.quarter}</td>
                        <td className="td text-gray-500">{fmt(d.planned)}</td>
                        <td className="td text-gray-700">{fmt(d.actual)}</td>
                        <td className={`td font-medium ${variance == null ? 'text-gray-300' : variance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {variance != null ? `${variance >= 0 ? '+' : ''}${fmt(variance)}` : '—'}
                        </td>
                        <td className="td text-sap-blue font-medium">{fmt(d.cumPlanned)}</td>
                        <td className="td text-green-600 font-medium">{fmt(d.cumActual)}</td>
                        <td className="td">
                          {realizPct != null ? (
                            <span className={`font-semibold ${realizPct >= 90 ? 'text-green-600' : realizPct >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                              {realizPct.toFixed(0)}%
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeSection === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="section-title mb-4">KPI Status Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map(e => <Cell key={e.name} fill={STATUS_PIE_COLORS[e.name] || '#94a3b8'} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="section-title mb-4">Progress to Target by Category</h3>
            <div className="space-y-3">
              {catPerf.map(c => (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{c.category}</span>
                    <span className="text-xs text-gray-400">{c.count} KPIs · {c.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${c.progress >= 70 ? 'bg-green-500' : c.progress >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h3 className="section-title mb-4">KPI Waterfall – Baseline to Current to Target</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={kpis.map(k => ({ name: k.name.split(' ').slice(0, 3).join(' '), Baseline: k.baseline, Improvement: Math.abs(k.current - k.baseline), Remaining: Math.abs(k.target - k.current) }))}
                layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Baseline" stackId="a" fill="#94a3b8" />
                <Bar dataKey="Improvement" stackId="a" fill="#22C55E" />
                <Bar dataKey="Remaining" stackId="a" fill="#e5e7eb" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
