import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'
import { Plus, Pencil, Trash2, X, Check, DollarSign, TrendingUp, Calculator } from 'lucide-react'
import useStore from '../store/useStore'

const CATEGORIES = ['Financial', 'Operational', 'Strategic']
const INV_CATEGORIES = ['Software', 'Services', 'Infrastructure', 'People', 'Internal']
const STATUSES = ['Validated', 'Indicative', 'Aspirational']
const COLORS = ['#0070F2', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316']
const CAT_COLOR = { Financial: '#0070F2', Operational: '#22C55E', Strategic: '#8B5CF6' }

const fmt = (n) => n == null ? '—' : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`
const pct = (n) => `${n.toFixed(1)}%`
const yr = (obj, y) => obj[`year${y}`] ?? 0
const yrs = [1, 2, 3, 4, 5]

function calcFinancials(benefits, investments, rate = 8) {
  const r = rate / 100
  const benByYr = yrs.map((y) => benefits.reduce((s, b) => s + yr(b, y), 0))
  const invByYr = yrs.map((y) => investments.reduce((s, i) => s + yr(i, y), 0))
  const netByYr = yrs.map((y) => benByYr[y - 1] - invByYr[y - 1])
  const totalBen = benByYr.reduce((s, v) => s + v, 0)
  const totalInv = invByYr.reduce((s, v) => s + v, 0)

  let npv = 0
  netByYr.forEach((n, i) => { npv += n / Math.pow(1 + r, i + 1) })

  // IRR (binary search)
  let lo = -0.99, hi = 10
  let irr = 0
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const npvMid = netByYr.reduce((s, n, idx) => s + n / Math.pow(1 + mid, idx + 1), 0)
    if (npvMid > 0) lo = mid; else hi = mid
    irr = mid
    if (Math.abs(hi - lo) < 0.0001) break
  }

  let cum = 0, payback = null
  netByYr.forEach((n, i) => {
    cum += n
    if (payback === null && cum >= 0) payback = i + 1
  })

  const roi = totalInv > 0 ? ((totalBen - totalInv) / totalInv) * 100 : 0
  return { benByYr, invByYr, netByYr, totalBen, totalInv, npv, irr: irr * 100, roi, payback }
}

// ─── Inline editable row ───────────────────────────────────────────────────────
function BenefitRow({ benefit, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(benefit)

  const save = () => { onUpdate(benefit.id, form); setEditing(false) }
  const cancel = () => { setForm(benefit); setEditing(false) }
  const total = yrs.reduce((s, y) => s + (form[`year${y}`] || 0), 0)

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="td"><select className="input py-1" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></td>
        <td className="td"><input className="input py-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></td>
        {yrs.map(y => (
          <td key={y} className="td">
            <input type="number" className="input py-1 w-24" value={form[`year${y}`] || 0}
              onChange={e => setForm({ ...form, [`year${y}`]: Number(e.target.value) })} />
          </td>
        ))}
        <td className="td font-semibold text-sap-blue">{fmt(total)}</td>
        <td className="td"><select className="input py-1" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}</select></td>
        <td className="td"><input className="input py-1" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></td>
        <td className="td">
          <div className="flex gap-1">
            <button onClick={save} className="btn-primary py-1 px-2"><Check size={14} /></button>
            <button onClick={cancel} className="btn-secondary py-1 px-2"><X size={14} /></button>
          </div>
        </td>
      </tr>
    )
  }

  const statusBadge = { Validated: 'badge-green', Indicative: 'badge-amber', Aspirational: 'badge-blue' }
  return (
    <tr className="table-row">
      <td className="td">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          style={{ background: `${CAT_COLOR[benefit.category]}20`, color: CAT_COLOR[benefit.category] }}>
          {benefit.category}
        </span>
      </td>
      <td className="td font-medium text-gray-800">{benefit.name}</td>
      {yrs.map(y => <td key={y} className="td text-gray-500">{fmt(yr(benefit, y))}</td>)}
      <td className="td font-semibold text-sap-blue">{fmt(yrs.reduce((s, y) => s + yr(benefit, y), 0))}</td>
      <td className="td"><span className={statusBadge[benefit.status] || 'badge-gray'}>{benefit.status}</span></td>
      <td className="td text-gray-500">{benefit.owner}</td>
      <td className="td">
        <div className="flex gap-1">
          <button onClick={() => setEditing(true)} className="btn-ghost py-1 px-2"><Pencil size={14} /></button>
          <button onClick={() => onDelete(benefit.id)} className="btn-danger py-1 px-2"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  )
}

function InvestmentRow({ investment, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(investment)

  const save = () => { onUpdate(investment.id, form); setEditing(false) }
  const cancel = () => { setForm(investment); setEditing(false) }

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="td"><select className="input py-1" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          {INV_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></td>
        <td className="td"><input className="input py-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></td>
        {yrs.map(y => (
          <td key={y} className="td">
            <input type="number" className="input py-1 w-24" value={form[`year${y}`] || 0}
              onChange={e => setForm({ ...form, [`year${y}`]: Number(e.target.value) })} />
          </td>
        ))}
        <td className="td font-semibold text-orange-600">{fmt(yrs.reduce((s, y) => s + (form[`year${y}`] || 0), 0))}</td>
        <td className="td">
          <div className="flex gap-1">
            <button onClick={save} className="btn-primary py-1 px-2"><Check size={14} /></button>
            <button onClick={cancel} className="btn-secondary py-1 px-2"><X size={14} /></button>
          </div>
        </td>
      </tr>
    )
  }
  return (
    <tr className="table-row">
      <td className="td"><span className="badge-gray">{investment.category}</span></td>
      <td className="td font-medium text-gray-800">{investment.name}</td>
      {yrs.map(y => <td key={y} className="td text-gray-500">{fmt(yr(investment, y))}</td>)}
      <td className="td font-semibold text-orange-600">{fmt(yrs.reduce((s, y) => s + yr(investment, y), 0))}</td>
      <td className="td">
        <div className="flex gap-1">
          <button onClick={() => setEditing(true)} className="btn-ghost py-1 px-2"><Pencil size={14} /></button>
          <button onClick={() => onDelete(investment.id)} className="btn-danger py-1 px-2"><Trash2 size={14} /></button>
        </div>
      </td>
    </tr>
  )
}

// ─── New benefit form ─────────────────────────────────────────────────────────
const BLANK_BEN = { category: 'Financial', name: '', description: '', year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, status: 'Indicative', owner: '' }
const BLANK_INV = { category: 'Services', name: '', year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 }

function AddBenefitModal({ onAdd, onClose }) {
  const [form, setForm] = useState(BLANK_BEN)
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold">Add Benefit</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Benefit Name</label>
            <input className="input" placeholder="e.g. Procurement Cost Savings" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Description</label>
            <input className="input" placeholder="Brief description of how value is created" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Owner</label>
            <input className="input" placeholder="e.g. CFO" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
          </div>
          <div />
          {yrs.map(y => (
            <div key={y}>
              <label className="label">Year {y} Benefit ($)</label>
              <input type="number" className="input" value={form[`year${y}`]} onChange={e => setForm({ ...form, [`year${y}`]: Number(e.target.value) })} />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { if (form.name) { onAdd(form); onClose() } }} className="btn-primary">Add Benefit</button>
        </div>
      </div>
    </div>
  )
}

function AddInvestmentModal({ onAdd, onClose }) {
  const [form, setForm] = useState(BLANK_INV)
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold">Add Investment Item</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {INV_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Investment Item Name</label>
            <input className="input" placeholder="e.g. SAP Licences" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          {yrs.map(y => (
            <div key={y}>
              <label className="label">Year {y} ($)</label>
              <input type="number" className="input" value={form[`year${y}`]} onChange={e => setForm({ ...form, [`year${y}`]: Number(e.target.value) })} />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { if (form.name) { onAdd(form); onClose() } }} className="btn-primary">Add Investment</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function ValueCase() {
  const { valueCase, addBenefit, updateBenefit, deleteBenefit, addInvestment, updateInvestment, deleteInvestment, updateDiscountRate } = useStore()
  const { benefits, investments, discountRate } = valueCase
  const [activeSection, setActiveSection] = useState('overview')
  const [showAddBenefit, setShowAddBenefit] = useState(false)
  const [showAddInvestment, setShowAddInvestment] = useState(false)

  const fin = calcFinancials(benefits, investments, discountRate)

  const waterfall = yrs.map((y) => ({
    year: `Year ${y}`,
    Benefits: fin.benByYr[y - 1],
    Investment: fin.invByYr[y - 1],
    'Net Cash Flow': fin.netByYr[y - 1],
  }))

  const catData = CATEGORIES.map((c) => ({
    name: c,
    value: benefits.filter((b) => b.category === c).reduce((s, b) => s + yrs.reduce((t, y) => t + yr(b, y), 0), 0),
  })).filter((d) => d.value > 0)

  const cumData = yrs.map((y, i) => ({
    year: `Yr ${y}`,
    'Cum Benefits': fin.benByYr.slice(0, i + 1).reduce((s, v) => s + v, 0),
    'Cum Investment': fin.invByYr.slice(0, i + 1).reduce((s, v) => s + v, 0),
    'Cum Net': fin.netByYr.slice(0, i + 1).reduce((s, v) => s + v, 0),
  }))

  const tabs = [
    { id: 'overview', label: 'Overview & Financials' },
    { id: 'benefits', label: `Benefits (${benefits.length})` },
    { id: 'investments', label: `Investments (${investments.length})` },
  ]

  return (
    <div className="space-y-6">
      {showAddBenefit && <AddBenefitModal onAdd={addBenefit} onClose={() => setShowAddBenefit(false)} />}
      {showAddInvestment && <AddInvestmentModal onAdd={addInvestment} onClose={() => setShowAddInvestment(false)} />}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveSection(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeSection === 'overview' && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '5-Yr Gross Benefits', value: `$${(fin.totalBen / 1e6).toFixed(1)}M`, sub: 'Total benefit pool', icon: TrendingUp, color: 'blue' },
              { label: '5-Yr Total Investment', value: `$${(fin.totalInv / 1e6).toFixed(1)}M`, sub: '5-year TCO', icon: DollarSign, color: 'purple' },
              { label: '5-Yr NPV', value: `$${(fin.npv / 1e6).toFixed(1)}M`, sub: `Discount rate: ${discountRate}%`, icon: Calculator, color: fin.npv >= 0 ? 'green' : 'red' },
              { label: 'ROI / IRR', value: `${fin.roi.toFixed(0)}% / ${fin.irr.toFixed(0)}%`, sub: `Payback: Year ${fin.payback ?? '>5'}`, icon: TrendingUp, color: 'amber' },
            ].map(({ label, value, sub, icon: Icon, color }) => {
              const bg = { blue: 'bg-blue-50', green: 'bg-green-50', amber: 'bg-amber-50', red: 'bg-red-50', purple: 'bg-purple-50' }
              const ic = { blue: 'text-sap-blue', green: 'text-green-600', amber: 'text-amber-600', red: 'text-red-600', purple: 'text-purple-600' }
              return (
                <div key={label} className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
                      <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-xl ${bg[color]} flex items-center justify-center`}>
                      <Icon size={18} className={ic[color]} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Discount rate */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500">Discount Rate</label>
            <input type="range" min={1} max={20} value={discountRate} onChange={e => updateDiscountRate(Number(e.target.value))} className="w-32" />
            <span className="text-sm font-semibold text-gray-700">{discountRate}%</span>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="section-title mb-4">Annual Benefits vs Investment</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={waterfall} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={50} />
                  <Tooltip formatter={(v, n) => [v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${v?.toLocaleString()}`, n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Benefits" fill="#0070F2" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Investment" fill="#F97316" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Net Cash Flow" fill="#22C55E" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="section-title mb-4">Cumulative Cashflow</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={cumData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={50} />
                  <Tooltip formatter={(v, n) => [`$${(v / 1e6).toFixed(2)}M`, n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Cum Benefits" stroke="#0070F2" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Cum Investment" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Cum Net" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="section-title mb-4">Benefits by Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>
                    {catData.map((e) => (
                      <Cell key={e.name} fill={CAT_COLOR[e.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => [`$${(v / 1e6).toFixed(2)}M`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="section-title mb-2">Benefit Status Breakdown</h3>
              <p className="text-xs text-gray-400 mb-4">Confidence level of each benefit</p>
              <div className="space-y-3">
                {STATUSES.map((s) => {
                  const items = benefits.filter(b => b.status === s)
                  const total = items.reduce((sum, b) => sum + yrs.reduce((t, y) => t + yr(b, y), 0), 0)
                  const pctOf = fin.totalBen > 0 ? (total / fin.totalBen) * 100 : 0
                  const color = { Validated: 'bg-green-500', Indicative: 'bg-amber-400', Aspirational: 'bg-blue-400' }
                  return (
                    <div key={s}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{s}</span>
                        <span className="text-xs text-gray-500">{items.length} items · ${(total / 1e6).toFixed(1)}M ({pctOf.toFixed(0)}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div className={`progress-fill ${color[s]}`} style={{ width: `${pctOf}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'benefits' && (
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Benefits Register</h3>
            <button onClick={() => setShowAddBenefit(true)} className="btn-primary"><Plus size={16} /> Add Benefit</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="th">Category</th>
                  <th className="th">Benefit</th>
                  {yrs.map(y => <th key={y} className="th">Yr {y}</th>)}
                  <th className="th">5-Yr Total</th>
                  <th className="th">Status</th>
                  <th className="th">Owner</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {benefits.map((b) => (
                  <BenefitRow key={b.id} benefit={b} onUpdate={updateBenefit} onDelete={deleteBenefit} />
                ))}
                <tr className="bg-blue-50 border-t-2 border-sap-blue">
                  <td className="td font-semibold text-gray-800" colSpan={2}>Total Benefits</td>
                  {yrs.map(y => <td key={y} className="td font-semibold text-sap-blue">{`$${(fin.benByYr[y - 1] / 1e6).toFixed(2)}M`}</td>)}
                  <td className="td font-bold text-sap-blue">{`$${(fin.totalBen / 1e6).toFixed(2)}M`}</td>
                  <td className="td" colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'investments' && (
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Investment Register</h3>
            <button onClick={() => setShowAddInvestment(true)} className="btn-primary"><Plus size={16} /> Add Investment</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="th">Category</th>
                  <th className="th">Investment Item</th>
                  {yrs.map(y => <th key={y} className="th">Yr {y}</th>)}
                  <th className="th">5-Yr Total</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {investments.map((i) => (
                  <InvestmentRow key={i.id} investment={i} onUpdate={updateInvestment} onDelete={deleteInvestment} />
                ))}
                <tr className="bg-orange-50 border-t-2 border-orange-400">
                  <td className="td font-semibold text-gray-800" colSpan={2}>Total Investment</td>
                  {yrs.map(y => <td key={y} className="td font-semibold text-orange-600">{`$${(fin.invByYr[y - 1] / 1e6).toFixed(2)}M`}</td>)}
                  <td className="td font-bold text-orange-600">{`$${(fin.totalInv / 1e6).toFixed(2)}M`}</td>
                  <td className="td" />
                </tr>
                <tr className="bg-green-50">
                  <td className="td font-semibold text-gray-800" colSpan={2}>Net Cash Flow</td>
                  {yrs.map(y => {
                    const net = fin.netByYr[y - 1]
                    return <td key={y} className={`td font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-500'}`}>{`$${(net / 1e6).toFixed(2)}M`}</td>
                  })}
                  <td className={`td font-bold ${fin.totalBen - fin.totalInv >= 0 ? 'text-green-600' : 'text-red-500'}`}>{`$${((fin.totalBen - fin.totalInv) / 1e6).toFixed(2)}M`}</td>
                  <td className="td" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
