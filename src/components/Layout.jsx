import {
  LayoutDashboard, TrendingUp, ClipboardList, BarChart3,
  Shield, Upload, Settings, ChevronRight, RefreshCw, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import useStore from '../store/useStore'

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',           icon: LayoutDashboard },
  { id: 'valuecase',   label: 'Value Case',           icon: TrendingUp },
  { id: 'assessment',  label: 'Value Assessment',     icon: ClipboardList },
  { id: 'measurement', label: 'Value Measurement',    icon: BarChart3 },
  { id: 'governance',  label: 'Program Governance',   icon: Shield },
  { id: 'import',      label: 'Import Data',          icon: Upload },
]

const PHASE_COLORS = {
  Prepare: 'badge-gray',
  Explore: 'badge-blue',
  Realize: 'badge-amber',
  Deploy: 'badge-purple',
  Run: 'badge-green',
}

export default function Layout({ activeTab, setActiveTab }) {
  const { project, resetToDefault } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-sap-blue flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">VRO</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-gray-900 leading-none">VRO Tool</div>
              <div className="text-xs text-gray-400 mt-0.5">S/4HANA Transformation</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full ${activeTab === id ? 'nav-item-active' : 'nav-item'} ${!sidebarOpen ? 'justify-center px-2' : ''}`}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {sidebarOpen && activeTab === id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {confirmReset ? (
            sidebarOpen && (
              <div className="text-xs text-center space-y-1 px-1">
                <p className="text-gray-600">Reset all data?</p>
                <div className="flex gap-1">
                  <button onClick={() => { resetToDefault(); setConfirmReset(false) }} className="flex-1 py-1 bg-red-500 text-white rounded text-xs">Yes</button>
                  <button onClick={() => setConfirmReset(false)} className="flex-1 py-1 bg-gray-100 text-gray-700 rounded text-xs">No</button>
                </div>
              </div>
            )
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className={`nav-item w-full text-red-400 hover:text-red-600 hover:bg-red-50 ${!sidebarOpen ? 'justify-center px-2' : ''}`}
              title="Reset to default data"
            >
              <RefreshCw size={16} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-xs">Reset Demo Data</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 shadow-sm px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="btn-ghost p-1.5"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-none">{project.name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Sponsor: {project.sponsor}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${PHASE_COLORS[project.phase] || 'badge-gray'}`}>
              Phase: {project.phase}
            </span>
            <div className="text-xs text-gray-400">
              Go-Live: <span className="font-medium text-gray-700">{project.goLiveDate}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* breadcrumb */}
          <div className="text-xs text-gray-400 mb-4 flex items-center gap-1">
            <span>VRO</span>
            <ChevronRight size={12} />
            <span className="text-gray-600 font-medium capitalize">
              {NAV.find((n) => n.id === activeTab)?.label || activeTab}
            </span>
          </div>
          {/* routed content injected by App */}
          <div id="main-content" />
        </main>
      </div>
    </div>
  )
}
