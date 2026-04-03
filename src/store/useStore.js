import { create } from 'zustand'
import { api } from '../utils/api'

// ─── Debounced save to server ─────────────────────────────────────────────────
const _saveTimers = {}
const debouncedSave = (module, data) => {
  clearTimeout(_saveTimers[module])
  _saveTimers[module] = setTimeout(() => {
    api.put(`/data/${module}`, data).catch(err =>
      console.warn(`[VRO] Auto-save failed for ${module}:`, err.message)
    )
  }, 600)
}

const initialState = {
  project: {
    name: 'S/4HANA Global Transformation',
    sponsor: 'Chief Financial Officer',
    projectManager: 'Program Director',
    startDate: '2024-01-15',
    goLiveDate: '2025-06-30',
    budget: 26500000,
    phase: 'Realize',
    description:
      'Global SAP S/4HANA implementation replacing legacy ERP across Finance, Procurement, SCM, and HR. Programme covers 18 countries and 12,000+ users.',
  },

  // ─── VALUE CASE ──────────────────────────────────────────────────────────────
  valueCase: {
    benefits: [
      { id: 1, category: 'Financial', name: 'Procurement Cost Savings', description: 'Supplier consolidation & e-procurement automation', year1: 0, year2: 1200000, year3: 2000000, year4: 2500000, year5: 2500000, status: 'Validated', owner: 'CPO' },
      { id: 2, category: 'Financial', name: 'Inventory Optimisation', description: 'Real-time stock visibility reducing excess inventory', year1: 0, year2: 800000, year3: 1500000, year4: 1800000, year5: 1800000, status: 'Validated', owner: 'SCM Director' },
      { id: 3, category: 'Financial', name: 'DSO Improvement', description: 'Automated AR dunning reducing days sales outstanding', year1: 0, year2: 600000, year3: 1000000, year4: 1200000, year5: 1200000, status: 'Validated', owner: 'CFO' },
      { id: 4, category: 'Operational', name: 'Finance Automation', description: 'Month-end close automation & journal processing', year1: 200000, year2: 800000, year3: 1200000, year4: 1500000, year5: 1500000, status: 'Validated', owner: 'Financial Controller' },
      { id: 5, category: 'Operational', name: 'Report & Analytics', description: 'Real-time embedded analytics replacing manual reports', year1: 100000, year2: 400000, year3: 600000, year4: 700000, year5: 700000, status: 'Indicative', owner: 'CIO' },
      { id: 6, category: 'Strategic', name: 'Compliance & Risk', description: 'Automated controls & audit trail reducing compliance cost', year1: 0, year2: 300000, year3: 500000, year4: 500000, year5: 500000, status: 'Indicative', owner: 'Chief Risk Officer' },
      { id: 7, category: 'Strategic', name: 'Revenue Enhancement', description: 'Faster order-to-cash & improved customer experience', year1: 0, year2: 500000, year3: 1000000, year4: 1200000, year5: 1200000, status: 'Aspirational', owner: 'CCO' },
      { id: 8, category: 'Operational', name: 'HR Process Efficiency', description: 'Integrated HR reducing manual admin workload', year1: 100000, year2: 300000, year3: 500000, year4: 500000, year5: 500000, status: 'Validated', owner: 'CHRO' },
    ],
    investments: [
      { id: 1, category: 'Software', name: 'SAP S/4HANA Licences', year1: 8000000, year2: 0, year3: 500000, year4: 500000, year5: 500000 },
      { id: 2, category: 'Services', name: 'Implementation Services', year1: 7000000, year2: 5000000, year3: 0, year4: 0, year5: 0 },
      { id: 3, category: 'Infrastructure', name: 'Cloud Infrastructure (BTP/Azure)', year1: 1500000, year2: 1000000, year3: 600000, year4: 600000, year5: 600000 },
      { id: 4, category: 'People', name: 'Training & Enablement', year1: 800000, year2: 500000, year3: 200000, year4: 100000, year5: 100000 },
      { id: 5, category: 'People', name: 'Change Management & OCM', year1: 700000, year2: 500000, year3: 200000, year4: 0, year5: 0 },
      { id: 6, category: 'Internal', name: 'Internal Resource Cost', year1: 1200000, year2: 800000, year3: 300000, year4: 200000, year5: 200000 },
    ],
    discountRate: 8,
  },

  // ─── VALUE ASSESSMENT ────────────────────────────────────────────────────────
  valueAssessment: {
    processAreas: [
      { id: 1, area: 'Finance & Controlling', currentScore: 2.5, targetScore: 4.5, priority: 'Critical', status: 'In Progress', opportunities: ['Automated period-end close', 'Real-time P&L', 'Integrated planning'], owner: 'CFO Office' },
      { id: 2, area: 'Procurement & SRM', currentScore: 2.0, targetScore: 4.0, priority: 'Critical', status: 'In Progress', opportunities: ['Guided buying', 'Supplier self-service', 'Contract compliance'], owner: 'CPO Office' },
      { id: 3, area: 'Supply Chain Management', currentScore: 2.5, targetScore: 4.0, priority: 'High', status: 'In Progress', opportunities: ['Demand-driven MRP', 'Supply chain control tower', 'Inventory optimisation'], owner: 'SCM Director' },
      { id: 4, area: 'Order-to-Cash', currentScore: 3.0, targetScore: 4.5, priority: 'High', status: 'Planned', opportunities: ['Order automation', 'Integrated credit management', 'Revenue recognition'], owner: 'Sales Ops' },
      { id: 5, area: 'Manufacturing', currentScore: 2.0, targetScore: 3.5, priority: 'Medium', status: 'Planned', opportunities: ['Production planning', 'Quality management', 'Plant maintenance'], owner: 'COO' },
      { id: 6, area: 'HR & Payroll', currentScore: 3.0, targetScore: 4.0, priority: 'Medium', status: 'In Progress', opportunities: ['Self-service HR', 'Payroll automation', 'Workforce analytics'], owner: 'CHRO' },
      { id: 7, area: 'Reporting & Analytics', currentScore: 1.5, targetScore: 4.5, priority: 'Critical', status: 'In Progress', opportunities: ['Embedded S/4 analytics', 'SAP Analytics Cloud', 'Live operational reporting'], owner: 'CIO' },
      { id: 8, area: 'Asset Management', currentScore: 2.0, targetScore: 3.5, priority: 'Low', status: 'Planned', opportunities: ['Unified asset register', 'Preventive maintenance', 'CAPEX tracking'], owner: 'Engineering Director' },
    ],
  },

  // ─── VALUE MEASUREMENT ───────────────────────────────────────────────────────
  valueMeasurement: {
    kpis: [
      { id: 1, name: 'Days Sales Outstanding (DSO)', category: 'Finance', baseline: 45, current: 41, target: 30, unit: 'Days', status: 'On Track', trend: 'improving', lastUpdated: '2025-03' },
      { id: 2, name: 'Inventory Turnover', category: 'Supply Chain', baseline: 4.1, current: 4.8, target: 7.0, unit: 'x', status: 'On Track', trend: 'improving', lastUpdated: '2025-03' },
      { id: 3, name: 'Purchase Order Cycle Time', category: 'Procurement', baseline: 7.0, current: 6.0, target: 2.0, unit: 'Days', status: 'At Risk', trend: 'stable', lastUpdated: '2025-03' },
      { id: 4, name: 'Financial Close Cycle', category: 'Finance', baseline: 10, current: 8, target: 5, unit: 'Days', status: 'On Track', trend: 'improving', lastUpdated: '2025-03' },
      { id: 5, name: 'Purchase Price Variance', category: 'Procurement', baseline: 3.2, current: 2.8, target: 1.5, unit: '%', status: 'On Track', trend: 'improving', lastUpdated: '2025-03' },
      { id: 6, name: 'Report Automation Rate', category: 'Analytics', baseline: 32, current: 55, target: 85, unit: '%', status: 'On Track', trend: 'improving', lastUpdated: '2025-03' },
      { id: 7, name: 'HR Self-Service Adoption', category: 'HR', baseline: 20, current: 45, target: 80, unit: '%', status: 'At Risk', trend: 'stable', lastUpdated: '2025-03' },
      { id: 8, name: 'Supplier On-Time Delivery', category: 'Procurement', baseline: 78, current: 81, target: 92, unit: '%', status: 'Behind', trend: 'declining', lastUpdated: '2025-03' },
      { id: 9, name: 'System Availability', category: 'IT', baseline: 97.2, current: 99.1, target: 99.9, unit: '%', status: 'On Track', trend: 'improving', lastUpdated: '2025-03' },
    ],
    realizationData: [
      { quarter: 'Q1 2024', planned: 0, actual: 0, cumPlanned: 0, cumActual: 0 },
      { quarter: 'Q2 2024', planned: 150000, actual: 100000, cumPlanned: 150000, cumActual: 100000 },
      { quarter: 'Q3 2024', planned: 250000, actual: 200000, cumPlanned: 400000, cumActual: 300000 },
      { quarter: 'Q4 2024', planned: 400000, actual: 350000, cumPlanned: 800000, cumActual: 650000 },
      { quarter: 'Q1 2025', planned: 700000, actual: 620000, cumPlanned: 1500000, cumActual: 1270000 },
      { quarter: 'Q2 2025', planned: 1100000, actual: null, cumPlanned: 2600000, cumActual: null },
      { quarter: 'Q3 2025', planned: 1400000, actual: null, cumPlanned: 4000000, cumActual: null },
      { quarter: 'Q4 2025', planned: 1600000, actual: null, cumPlanned: 5600000, cumActual: null },
    ],
  },

  // ─── PROGRAM GOVERNANCE ──────────────────────────────────────────────────────
  programGovernance: {
    milestones: [
      { id: 1, name: 'Project Initiation & Mobilisation', plannedDate: '2024-01-31', actualDate: '2024-01-29', status: 'Complete', owner: 'Program Director', phase: 'Prepare' },
      { id: 2, name: 'Discovery & Current-State Assessment', plannedDate: '2024-03-15', actualDate: '2024-03-18', status: 'Complete', owner: 'Solution Architect', phase: 'Explore' },
      { id: 3, name: 'Solution Design Sign-off', plannedDate: '2024-05-30', actualDate: '2024-06-05', status: 'Complete', owner: 'CFO / CPO', phase: 'Explore' },
      { id: 4, name: 'Development & Configuration Complete', plannedDate: '2024-09-30', actualDate: '2024-10-10', status: 'Complete', owner: 'Tech Lead', phase: 'Realize' },
      { id: 5, name: 'SIT Sign-off', plannedDate: '2024-12-15', actualDate: '2024-12-20', status: 'Complete', owner: 'QA Lead', phase: 'Realize' },
      { id: 6, name: 'UAT Sign-off', plannedDate: '2025-02-28', actualDate: null, status: 'In Progress', owner: 'Business Sponsors', phase: 'Realize' },
      { id: 7, name: 'Cutover Readiness Review', plannedDate: '2025-05-31', actualDate: null, status: 'Planned', owner: 'Program Director', phase: 'Deploy' },
      { id: 8, name: 'Go-Live', plannedDate: '2025-06-30', actualDate: null, status: 'Planned', owner: 'Steering Committee', phase: 'Deploy' },
      { id: 9, name: 'Hypercare End & Stabilisation', plannedDate: '2025-09-30', actualDate: null, status: 'Planned', owner: 'Support Lead', phase: 'Run' },
    ],
    risks: [
      { id: 1, description: 'Data migration complexity – poor data quality in legacy systems', probability: 4, impact: 5, mitigation: 'Data quality sprint underway; dedicated data cleanse team assigned', owner: 'Data Lead', status: 'Open', category: 'Technical' },
      { id: 2, description: 'Organisational change resistance – low adoption by end users', probability: 4, impact: 4, mitigation: 'Comprehensive OCM programme; change champions network established', owner: 'OCM Lead', status: 'Mitigated', category: 'People' },
      { id: 3, description: 'Third-party integration delays (logistics & banking)', probability: 3, impact: 4, mitigation: 'Integration factory approach; parallel testing tracks', owner: 'Integration Lead', status: 'Open', category: 'Technical' },
      { id: 4, description: 'Key resource attrition during critical delivery phases', probability: 3, impact: 3, mitigation: 'Knowledge transfer protocols; retention bonuses in place', owner: 'HR Director', status: 'Open', category: 'People' },
      { id: 5, description: 'Scope creep from business enhancement requests', probability: 4, impact: 3, mitigation: 'Strict change control board process; MoSCoW prioritisation', owner: 'Program Director', status: 'Open', category: 'Governance' },
      { id: 6, description: 'Regulatory compliance gaps in certain jurisdictions', probability: 2, impact: 5, mitigation: 'Dedicated country compliance review; legal sign-off per country', owner: 'Chief Risk Officer', status: 'Mitigated', category: 'Compliance' },
      { id: 7, description: 'Performance degradation post go-live under full load', probability: 2, impact: 4, mitigation: 'Performance testing at 150% projected load completed', owner: 'Tech Lead', status: 'Mitigated', category: 'Technical' },
    ],
    issues: [
      { id: 1, description: 'Legacy GL data quality below acceptable threshold in 3 entities', priority: 'High', owner: 'Data Lead', dueDate: '2025-02-28', status: 'Open', raisedDate: '2025-01-10' },
      { id: 2, description: 'Payment gateway integration – vendor API not yet certified', priority: 'High', owner: 'Integration Lead', dueDate: '2025-03-15', status: 'In Progress', raisedDate: '2025-01-20' },
      { id: 3, description: 'Training environments not available for UAT wave 2', priority: 'Medium', owner: 'IT Infrastructure', dueDate: '2025-02-15', status: 'Resolved', raisedDate: '2025-01-05' },
      { id: 4, description: 'Business sign-off delay on chart of accounts redesign', priority: 'High', owner: 'Financial Controller', dueDate: '2025-02-10', status: 'Resolved', raisedDate: '2024-12-20' },
      { id: 5, description: 'Cutover weekend resource availability conflicts', priority: 'Medium', owner: 'Program Director', dueDate: '2025-04-30', status: 'Open', raisedDate: '2025-02-01' },
    ],
    decisions: [
      { id: 1, description: 'Deploy on SAP BTP (Cloud) rather than on-premise', date: '2024-02-10', decidedBy: 'CIO / CFO', rationale: 'Lower TCO, faster upgrades, cloud-first strategy alignment', status: 'Approved' },
      { id: 2, description: 'Adopt SAP Best Practices / Clean Core – no custom modifications', date: '2024-03-20', decidedBy: 'Steering Committee', rationale: 'Reduces upgrade risk and long-term maintenance cost', status: 'Approved' },
      { id: 3, description: 'Phased rollout: Finance & Procurement first, SCM wave 2', date: '2024-04-15', decidedBy: 'Steering Committee', rationale: 'Reduces risk; allows learnings to inform subsequent waves', status: 'Approved' },
      { id: 4, description: 'SAP Analytics Cloud (SAC) as strategic BI & planning platform', date: '2024-05-01', decidedBy: 'CIO / CFO', rationale: 'Replaces 4 legacy BI tools; integrated with S/4HANA', status: 'Approved' },
      { id: 5, description: 'Extend UAT by 3 weeks due to data quality issues', date: '2025-01-15', decidedBy: 'Program Director', rationale: 'Ensure data quality meets go-live threshold before cutover', status: 'Approved' },
    ],
    stakeholders: [
      { id: 1, name: 'CFO', role: 'Executive Sponsor', influence: 5, interest: 5, engagement: 'Champion', department: 'Finance' },
      { id: 2, name: 'CIO', role: 'Technology Sponsor', influence: 5, interest: 5, engagement: 'Champion', department: 'IT' },
      { id: 3, name: 'CPO', role: 'Business Sponsor', influence: 4, interest: 4, engagement: 'Supportive', department: 'Procurement' },
      { id: 4, name: 'COO', role: 'Business Sponsor', influence: 4, interest: 3, engagement: 'Supportive', department: 'Operations' },
      { id: 5, name: 'CHRO', role: 'Business Sponsor', influence: 3, interest: 3, engagement: 'Neutral', department: 'HR' },
      { id: 6, name: 'Financial Controllers', role: 'Key User Group', influence: 3, interest: 5, engagement: 'Champion', department: 'Finance' },
      { id: 7, name: 'Procurement Team', role: 'Key User Group', influence: 2, interest: 4, engagement: 'Supportive', department: 'Procurement' },
      { id: 8, name: 'IT Operations', role: 'Technical Owner', influence: 3, interest: 4, engagement: 'Supportive', department: 'IT' },
      { id: 9, name: 'External Auditors', role: 'Regulator / Compliance', influence: 4, interest: 2, engagement: 'Neutral', department: 'External' },
      { id: 10, name: 'End Users (General)', role: 'Impacted Group', influence: 2, interest: 3, engagement: 'Resistant', department: 'Various' },
    ],
  },
}

const useStore = create(
    (set, get) => ({
      ...initialState,
      _serverLoaded: false,

      // Project
      updateProject: (data) => set((s) => ({ project: { ...s.project, ...data } })),

      // Value Case
      addBenefit: (benefit) =>
        set((s) => ({
          valueCase: {
            ...s.valueCase,
            benefits: [...s.valueCase.benefits, { ...benefit, id: Date.now() }],
          },
        })),
      updateBenefit: (id, data) =>
        set((s) => ({
          valueCase: {
            ...s.valueCase,
            benefits: s.valueCase.benefits.map((b) => (b.id === id ? { ...b, ...data } : b)),
          },
        })),
      deleteBenefit: (id) =>
        set((s) => ({
          valueCase: { ...s.valueCase, benefits: s.valueCase.benefits.filter((b) => b.id !== id) },
        })),
      addInvestment: (inv) =>
        set((s) => ({
          valueCase: {
            ...s.valueCase,
            investments: [...s.valueCase.investments, { ...inv, id: Date.now() }],
          },
        })),
      updateInvestment: (id, data) =>
        set((s) => ({
          valueCase: {
            ...s.valueCase,
            investments: s.valueCase.investments.map((i) => (i.id === id ? { ...i, ...data } : i)),
          },
        })),
      deleteInvestment: (id) =>
        set((s) => ({
          valueCase: {
            ...s.valueCase,
            investments: s.valueCase.investments.filter((i) => i.id !== id),
          },
        })),
      updateDiscountRate: (rate) =>
        set((s) => ({ valueCase: { ...s.valueCase, discountRate: rate } })),

      // Value Assessment
      updateProcessArea: (id, data) =>
        set((s) => ({
          valueAssessment: {
            ...s.valueAssessment,
            processAreas: s.valueAssessment.processAreas.map((p) =>
              p.id === id ? { ...p, ...data } : p
            ),
          },
        })),
      addProcessArea: (area) =>
        set((s) => ({
          valueAssessment: {
            ...s.valueAssessment,
            processAreas: [...s.valueAssessment.processAreas, { ...area, id: Date.now() }],
          },
        })),
      deleteProcessArea: (id) =>
        set((s) => ({
          valueAssessment: {
            ...s.valueAssessment,
            processAreas: s.valueAssessment.processAreas.filter((p) => p.id !== id),
          },
        })),

      // Value Measurement
      addKpi: (kpi) =>
        set((s) => ({
          valueMeasurement: {
            ...s.valueMeasurement,
            kpis: [...s.valueMeasurement.kpis, { ...kpi, id: Date.now() }],
          },
        })),
      updateKpi: (id, data) =>
        set((s) => ({
          valueMeasurement: {
            ...s.valueMeasurement,
            kpis: s.valueMeasurement.kpis.map((k) => (k.id === id ? { ...k, ...data } : k)),
          },
        })),
      deleteKpi: (id) =>
        set((s) => ({
          valueMeasurement: {
            ...s.valueMeasurement,
            kpis: s.valueMeasurement.kpis.filter((k) => k.id !== id),
          },
        })),
      updateRealizationData: (data) =>
        set((s) => ({ valueMeasurement: { ...s.valueMeasurement, realizationData: data } })),

      // Program Governance – Milestones
      addMilestone: (m) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            milestones: [...s.programGovernance.milestones, { ...m, id: Date.now() }],
          },
        })),
      updateMilestone: (id, data) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            milestones: s.programGovernance.milestones.map((m) =>
              m.id === id ? { ...m, ...data } : m
            ),
          },
        })),
      deleteMilestone: (id) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            milestones: s.programGovernance.milestones.filter((m) => m.id !== id),
          },
        })),

      // Program Governance – Risks
      addRisk: (r) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            risks: [...s.programGovernance.risks, { ...r, id: Date.now() }],
          },
        })),
      updateRisk: (id, data) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            risks: s.programGovernance.risks.map((r) => (r.id === id ? { ...r, ...data } : r)),
          },
        })),
      deleteRisk: (id) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            risks: s.programGovernance.risks.filter((r) => r.id !== id),
          },
        })),

      // Program Governance – Issues
      addIssue: (i) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            issues: [...s.programGovernance.issues, { ...i, id: Date.now() }],
          },
        })),
      updateIssue: (id, data) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            issues: s.programGovernance.issues.map((i) => (i.id === id ? { ...i, ...data } : i)),
          },
        })),
      deleteIssue: (id) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            issues: s.programGovernance.issues.filter((i) => i.id !== id),
          },
        })),

      // Program Governance – Decisions
      addDecision: (d) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            decisions: [...s.programGovernance.decisions, { ...d, id: Date.now() }],
          },
        })),
      updateDecision: (id, data) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            decisions: s.programGovernance.decisions.map((d) =>
              d.id === id ? { ...d, ...data } : d
            ),
          },
        })),
      deleteDecision: (id) =>
        set((s) => ({
          programGovernance: {
            ...s.programGovernance,
            decisions: s.programGovernance.decisions.filter((d) => d.id !== id),
          },
        })),

      // Bulk import (from file parser)
      importData: (module, data) =>
        set((s) => {
          if (module === 'benefits') return { valueCase: { ...s.valueCase, benefits: data } }
          if (module === 'investments') return { valueCase: { ...s.valueCase, investments: data } }
          if (module === 'kpis') return { valueMeasurement: { ...s.valueMeasurement, kpis: data } }
          if (module === 'milestones') return { programGovernance: { ...s.programGovernance, milestones: data } }
          if (module === 'risks') return { programGovernance: { ...s.programGovernance, risks: data } }
          if (module === 'processAreas') return { valueAssessment: { ...s.valueAssessment, processAreas: data } }
          return s
        }),

      // ── Server sync ────────────────────────────────────────────────────────
      // Called after login – replaces local state with server data
      loadFromServer: async () => {
        try {
          const data = await api.get('/data')
          set({ ...data, _serverLoaded: true })
        } catch (err) {
          console.warn('[VRO] Could not load server data, using defaults:', err.message)
          set({ _serverLoaded: true })
        }
      },

      resetToDefault: () => {
        set(initialState)
        // Reset on server too
        const mods = ['project', 'valueCase', 'valueAssessment', 'valueMeasurement', 'programGovernance']
        mods.forEach(m => api.put(`/data/${m}`, initialState[m]).catch(() => {}))
      },
    })
  )

// ── Auto-save to server when state changes ─────────────────────────────────────
useStore.subscribe((state, prevState) => {
  if (!state._serverLoaded) return
  const mods = ['project', 'valueCase', 'valueAssessment', 'valueMeasurement', 'programGovernance']
  mods.forEach(m => {
    if (state[m] !== prevState?.[m]) debouncedSave(m, state[m])
  })
})

export default useStore
