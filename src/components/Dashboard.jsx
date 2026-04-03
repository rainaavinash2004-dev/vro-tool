import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, DollarSign, Target, AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import useStore from '../store/useStore'

const fmt = (n) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`
const pct = (n) => `${n.toFixed(1)}%`
const COLORS = ['#0070F2', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316']

// ─── Financial helpers ────────────────────────────────────────────────────────
function calcSummary(benefits, investments, discountRate) {
  const yrs = [1, 2, 3, 4, 5]
  const yr = (obj, y) => obj[`year${y}`] ?? 0
  const totalBenefits5 = benefits.reduce((s, b) => s + yrs.reduce((t, y) => t + yr(b, y), 0), 0)
  const totalInvest5 = investments.reduce((s, i) => s + yrs.reduce((t, y) => t + yr(i, y), 0), 0)
  const rate = (discountRate || 8) / 100

  let npv = 0, cumNet = 0, payback = null
  yrs.forEach((y) => {
    const benY = benefits.reduce((s, b) => s + yr(b, y), 0)
    const invY = investments.reduce((s, i) => s + yr(i, y), 0)
    npv += (benY - invY) / Math.pow(1 + rate, y)
    cumNet += benY - invY
    if (payback === null && cumNet >= 0) payback = y
  })
  const roi = totalInvest5 > 0 ? ((totalBenefits5 - totalInvest5) / totalInvest5) * 100 : 0
  return { totalBenefits5, totalInvest5, npv, roi, payback: payback ?? '>5' }
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'blue', icon: Icon, trend }) {
  const bg = { blue: 'bg-blue-50', green: 'bg-green-50', amber: 'bg-amber-50', red: 'bg-red-50', purple: 'bg-purple-50' }
  const ic = { blue: 'text-sap-blue', green: 'text-green-600', amber: 'text-amber-600', red: 'text-red-600', purple: 'text-purple-600' }
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${bg[color]} flex items-center justify-center`}>
          <Icon size={20} className={ic[color]} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {trend >= 0 ? '+' : ''}{trend.toFixed(0)}% vs plan
        </div>
      )}
    </div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CurrencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">{p.value != null ? fmt(p.value) : 'N/A'}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Risk Matrix ──────────────────────────────────────────────────────────────
function RiskMatrix({ risks }) {
  const LEVELS = [1, 2, 3, 4, 5]
  const COLOR = (p, i) => {
    const score = p * i
    if (score >= 16) return 'bg-red-500'
    if (score >= 9) return 'bg-amber-400'
    if (score >= 4) return 'bg-yellow-300'
    return 'bg-green-300'
  }
  const cellRisks = (p, i) => risks.filter((r) => r.probability === p && r.impact === i && r.status !== 'Closed')
  return (
    <div className="overflow-auto">
      <div className="flex gap-0.5 mb-1 ml-8">
        {LEVELS.map((i) => (
          <div key={i} className="w-12 text-center text-xs text-gray-400 font-medium">I{i}</div>
        ))}
      </div>
      {[...LEVELS].reverse().map((p) => (
        <div key={p} className="flex items-center gap-0.5 mb-0.5">
          <div className="w-7 text-center text-xs text-gray-400 font-medium">P{p}</div>
          {LEVELS.map((i) => {
            const items = cellRisks(p, i)
            return (
              <div
                key={i}
                className={`w-12 h-12 rounded flex flex-col items-center justify-center ${COLOR(p, i)} bg-opacity-40 border border-white relative group`}
                title={items.map((r) => r.description).join('\n') || ''}
              >
                {items.length > 0 && (
                  <span className="text-xs font-bold text-gray-700">{items.length}</span>
                )}
                {items.length > 0 && (
                  <div className="hidden group-hover:block absolute z-20 left-14 top-0 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-56 text-xs">
                    {items.map((r) => (
                      <div key={r.id} className="mb-1 pb-1 border-b border-gray-100 last:border-0">
                        <p className="font-medium text-gray-700">{r.description}</p>
                        <p className="text-gray-400 mt-0.5">{r.owner} · {r.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 ml-8">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 bg-opacity-40" />Critical</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 bg-opacity-40" />High</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-300 bg-opacity-40" />Medium</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-300 bg-opacity-40" />Low</span>
      </div>
    </div>
  )
}

// ─── Milestone timeline ───────────────────────────────────────────────────────
function MilestoneTimeline({ milestones }) {
  const STATUS_STYLE = {
    Complete: { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
    'In Progress': { dot: 'bg-sap-blue', text: 'text-sap-blue', bg: 'bg-blue-50' },
    Planned: { dot: 'bg-gray-300', text: 'text-gray-500', bg: 'bg-gray-50' },
    Delayed: { dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
  }
  const done = milestones.filter((m) => m.status === 'Complete').length
  const pct = Math.round((done / milestones.length) * 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">{done}/{milestones.length} milestones complete</span>
        <span className="text-xs font-semibold text-sap-blue">{pct}%</span>
      </div>
      <div className="progress-bar mb-4">
        <div className="progress-fill bg-sap-blue" style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {milestones.map((m) => {
          const s = STATUS_STYLE[m.status] || STATUS_STYLE.Planned
          return (
            <div key={m.id} className={`flex items-start gap-3 p-2.5 rounded-lg ${s.bg}`}>
              <div className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${s.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{m.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {m.actualDate || m.plannedDate} · {m.owner}
                </p>
              </div>
              <span className={`text-xs font-medium flex-shrink-0 ${s.text}`}>{m.status}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard({ setActiveTab }) {
  const { valueCase, valueMeasurement, programGovernance, valueAssessment } = useStore()
  const { benefits, investments, discountRate } = valueCase
  const { kpis, realizationData } = valueMeasurement
  const { milestones, risks } = programGovernance
  const { processAreas } = valueAssessment

  const { totalBenefits5, totalInvest5, npv, roi, payback } = calcSummary(benefits, investments, discountRate)

  // KPI status counts
  const kpiStatus = kpis.reduce((acc, k) => { acc[k.status] = (acc[k.status] || 0) + 1; return acc }, {})
  const kpiPieData = Object.entries(kpiStatus).map(([name, value]) => ({ name, value }))
  const KPI_COLORS = { 'On Track': '#22C55E', 'At Risk': '#F59E0B', 'Behind': '#EF4444' }

  // Benefits by category (5yr total)
  const catMap = benefits.reduce((acc, b) => {
    const total = (b.year1 || 0) + (b.year2 || 0) + (b.year3 || 0) + (b.year4 || 0) + (b.year5 || 0)
    acc[b.category] = (acc[b.category] || 0) + total
    return acc
  }, {})
  const catBarData = Object.entries(catMap).map(([name, value]) => ({ name, value }))

  // Year-by-year waterfall data
  const waterfall = [1, 2, 3, 4, 5].map((y) => ({
    year: `Yr ${y}`,
    Benefits: benefits.reduce((s, b) => s + (b[`year${y}`] || 0), 0),
    Investment: investments.reduce((s, i) => s + (i[`year${y}`] || 0), 0),
  }))

  // Process maturity radar
  const radarData = processAreas.slice(0, 7).map((p) => ({
    subject: p.area.split(' ')[0],
    Current: p.currentScore,
    Target: p.targetScore,
  }))

  // Realization – strip nulls for "actual" line
  const realData = realizationData.map((d) => ({ ...d, actual: d.actual ?? undefined }))

  // Programme health score
  const openRisksHigh = risks.filter((r) => r.probability * r.impact >= 12 && r.status === 'Open').length
  const milestonesOnTime = milestones.filter((m) => m.status === 'Complete' || m.status === 'In Progress').length
  const healthScore = Math.max(0, 100 - openRisksHigh * 8 - (milestones.length - milestonesOnTime) * 4)

  const healthColor = healthScore >= 75 ? 'text-green-600' : healthScore >= 50 ? 'text-amber-600' : 'text-red-600'
  const healthLabel = healthScore >= 75 ? 'Good' : healthScore >= 50 ? 'At Risk' : 'Needs Attention'

  return (
    <div className="space-y-6">
      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="5-Yr Gross Benefits" value={fmt(totalBenefits5)} sub="Gross benefit pool" color="blue" icon={TrendingUp} />
        <StatCard label="Total Investment" value={fmt(totalInvest5)} sub="5-yr TCO" color="purple" icon={DollarSign} />
        <StatCard label="5-Yr NPV" value={fmt(npv)} sub={`ROI: ${pct(roi)} · Payback Yr ${payback}`} color={npv >= 0 ? 'green' : 'red'} icon={Target} />
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Programme Health</p>
              <p className={`text-2xl font-bold mt-1 ${healthColor}`}>{healthScore}</p>
              <p className={`text-xs mt-1 font-medium ${healthColor}`}>{healthLabel}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
          </div>
          <div className="progress-bar mt-3">
            <div className={`progress-fill ${healthScore >= 75 ? 'bg-green-500' : healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${healthScore}%` }} />
          </div>
        </div>
      </div>

      {/* ── Row 2: Realization + KPI Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="card lg:col-span-3">
          <div className="section-header">
            <div>
              <h3 className="section-title">Benefits Realization</h3>
              <p className="text-xs text-gray-400 mt-0.5">Planned vs Actual quarterly benefits ($)</p>
            </div>
            <button onClick={() => setActiveTab('measurement')} className="btn-ghost text-xs gap-1">
              Detail <ArrowRight size={13} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={realData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gPlanned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0070F2" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0070F2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={55} />
              <Tooltip content={<CurrencyTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="planned" name="Planned" stroke="#0070F2" strokeWidth={2} fill="url(#gPlanned)" connectNulls />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#22C55E" strokeWidth={2} fill="url(#gActual)" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card lg:col-span-2">
          <div className="section-header">
            <div>
              <h3 className="section-title">KPI Status</h3>
              <p className="text-xs text-gray-400 mt-0.5">{kpis.length} tracked KPIs</p>
            </div>
            <button onClick={() => setActiveTab('measurement')} className="btn-ghost text-xs gap-1">
              Detail <ArrowRight size={13} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={kpiPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                {kpiPieData.map((entry) => (
                  <Cell key={entry.name} fill={KPI_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} KPIs`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {kpiPieData.map((e) => (
              <div key={e.name} className="text-center">
                <div className="text-lg font-bold" style={{ color: KPI_COLORS[e.name] }}>{e.value}</div>
                <div className="text-xs text-gray-400 leading-tight">{e.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Yr-by-yr + Benefits category + Risk ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Benefits vs Investment</h3>
            <button onClick={() => setActiveTab('valuecase')} className="btn-ghost text-xs gap-1">Detail <ArrowRight size={13} /></button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={waterfall} margin={{ top: 0, right: 5, left: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={45} />
              <Tooltip content={<CurrencyTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Benefits" fill="#0070F2" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Investment" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Benefits by Category</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catBarData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={80} />
              <Tooltip content={<CurrencyTooltip />} />
              <Bar dataKey="value" name="5-yr Total" radius={[0, 3, 3, 0]}>
                {catBarData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Risk Matrix</h3>
            <span className="text-xs text-gray-400">{risks.filter(r => r.status === 'Open').length} open risks</span>
          </div>
          <RiskMatrix risks={risks} />
        </div>
      </div>

      {/* ── Row 4: Milestones + Process Maturity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Milestone Tracker</h3>
            <button onClick={() => setActiveTab('governance')} className="btn-ghost text-xs gap-1">Detail <ArrowRight size={13} /></button>
          </div>
          <MilestoneTimeline milestones={milestones} />
        </div>

        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Process Maturity</h3>
            <button onClick={() => setActiveTab('assessment')} className="btn-ghost text-xs gap-1">Detail <ArrowRight size={13} /></button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Radar name="Current" dataKey="Current" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} strokeWidth={1.5} />
              <Radar name="Target" dataKey="Target" stroke="#0070F2" fill="#0070F2" fillOpacity={0.15} strokeWidth={2} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 5: Top risks + Recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Top Open Risks</h3>
            <button onClick={() => setActiveTab('governance')} className="btn-ghost text-xs gap-1">View all <ArrowRight size={13} /></button>
          </div>
          <div className="space-y-2">
            {risks
              .filter((r) => r.status === 'Open')
              .sort((a, b) => b.probability * b.impact - a.probability * a.impact)
              .slice(0, 4)
              .map((r) => {
                const score = r.probability * r.impact
                const badge = score >= 16 ? 'badge-red' : score >= 9 ? 'badge-amber' : 'badge-blue'
                const label = score >= 16 ? 'Critical' : score >= 9 ? 'High' : 'Medium'
                return (
                  <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <AlertTriangle size={15} className={score >= 16 ? 'text-red-500' : 'text-amber-500'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800">{r.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.owner} · {r.category}</p>
                    </div>
                    <span className={badge}>{label} ({score})</span>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <h3 className="section-title">KPI Performance</h3>
            <button onClick={() => setActiveTab('measurement')} className="btn-ghost text-xs gap-1">View all <ArrowRight size={13} /></button>
          </div>
          <div className="space-y-3">
            {kpis.slice(0, 5).map((k) => {
              const range = k.target - k.baseline
              const prog = range !== 0 ? Math.min(100, Math.max(0, ((k.current - k.baseline) / range) * 100)) : 0
              const statusColor = k.status === 'On Track' ? 'bg-green-500' : k.status === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'
              return (
                <div key={k.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate flex-1 mr-2">{k.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{k.current}{k.unit} / {k.target}{k.unit}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${statusColor}`} style={{ width: `${prog}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
