import * as XLSX from 'xlsx'

// ─── Excel Parser ─────────────────────────────────────────────────────────────
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const result = {}
        workbook.SheetNames.forEach((name) => {
          const sheet = workbook.Sheets[name]
          result[name] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        })
        resolve(result)
      } catch (err) {
        reject(new Error('Failed to parse Excel file: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

// ─── CSV / Text Parser ────────────────────────────────────────────────────────
export const parseTextFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split(/\r?\n/).filter((l) => l.trim())
        if (lines.length < 2) throw new Error('File must have a header row and at least one data row')

        // Auto-detect delimiter
        const first = lines[0]
        const delimiter = first.includes('\t') ? '\t' : first.includes(';') ? ';' : ','

        const parseRow = (line) =>
          line.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ''))

        const headers = parseRow(lines[0])
        const rows = lines.slice(1).map((line) => {
          const values = parseRow(line)
          const obj = {}
          headers.forEach((h, i) => {
            obj[h] = values[i] ?? ''
          })
          return obj
        })
        resolve({ headers, data: rows })
      } catch (err) {
        reject(new Error('Failed to parse text file: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// ─── Schema mappers (Excel sheet → store shape) ───────────────────────────────

export const mapBenefits = (rows) =>
  rows.map((r, i) => ({
    id: i + 1,
    category: r['Category'] || r['category'] || 'Financial',
    name: r['Benefit Name'] || r['name'] || r['Name'] || '',
    description: r['Description'] || r['description'] || '',
    year1: toNum(r['Year 1'] ?? r['year1'] ?? 0),
    year2: toNum(r['Year 2'] ?? r['year2'] ?? 0),
    year3: toNum(r['Year 3'] ?? r['year3'] ?? 0),
    year4: toNum(r['Year 4'] ?? r['year4'] ?? 0),
    year5: toNum(r['Year 5'] ?? r['year5'] ?? 0),
    status: r['Status'] || r['status'] || 'Indicative',
    owner: r['Owner'] || r['owner'] || '',
  }))

export const mapInvestments = (rows) =>
  rows.map((r, i) => ({
    id: i + 1,
    category: r['Category'] || r['category'] || 'Services',
    name: r['Investment Item'] || r['name'] || r['Name'] || '',
    year1: toNum(r['Year 1'] ?? r['year1'] ?? 0),
    year2: toNum(r['Year 2'] ?? r['year2'] ?? 0),
    year3: toNum(r['Year 3'] ?? r['year3'] ?? 0),
    year4: toNum(r['Year 4'] ?? r['year4'] ?? 0),
    year5: toNum(r['Year 5'] ?? r['year5'] ?? 0),
  }))

export const mapKpis = (rows) =>
  rows.map((r, i) => ({
    id: i + 1,
    name: r['KPI Name'] || r['name'] || r['Name'] || '',
    category: r['Category'] || r['category'] || 'General',
    baseline: toNum(r['Baseline'] || r['baseline'] || 0),
    current: toNum(r['Current'] || r['current'] || 0),
    target: toNum(r['Target'] || r['target'] || 0),
    unit: r['Unit'] || r['unit'] || '',
    status: r['Status'] || r['status'] || 'On Track',
    trend: r['Trend'] || r['trend'] || 'stable',
    lastUpdated: r['Last Updated'] || r['lastUpdated'] || '',
  }))

export const mapMilestones = (rows) =>
  rows.map((r, i) => ({
    id: i + 1,
    name: r['Milestone'] || r['name'] || r['Name'] || '',
    plannedDate: r['Planned Date'] || r['plannedDate'] || '',
    actualDate: r['Actual Date'] || r['actualDate'] || null,
    status: r['Status'] || r['status'] || 'Planned',
    owner: r['Owner'] || r['owner'] || '',
    phase: r['Phase'] || r['phase'] || '',
  }))

export const mapRisks = (rows) =>
  rows.map((r, i) => ({
    id: i + 1,
    description: r['Risk Description'] || r['description'] || '',
    probability: toNum(r['Probability'] || r['probability'] || 3),
    impact: toNum(r['Impact'] || r['impact'] || 3),
    mitigation: r['Mitigation'] || r['mitigation'] || '',
    owner: r['Owner'] || r['owner'] || '',
    status: r['Status'] || r['status'] || 'Open',
    category: r['Category'] || r['category'] || 'General',
  }))

export const mapProcessAreas = (rows) =>
  rows.map((r, i) => ({
    id: i + 1,
    area: r['Process Area'] || r['area'] || r['Area'] || '',
    currentScore: toNum(r['Current Score'] || r['currentScore'] || 1),
    targetScore: toNum(r['Target Score'] || r['targetScore'] || 4),
    priority: r['Priority'] || r['priority'] || 'Medium',
    status: r['Status'] || r['status'] || 'Planned',
    opportunities: [],
    owner: r['Owner'] || r['owner'] || '',
  }))

const toNum = (v) => {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''))
  return isNaN(n) ? 0 : n
}

// ─── Sheet-name → mapper lookup ───────────────────────────────────────────────
export const SHEET_MAPPERS = {
  Benefits: { mapper: mapBenefits, module: 'benefits', label: 'Value Case – Benefits' },
  Investments: { mapper: mapInvestments, module: 'investments', label: 'Value Case – Investments' },
  KPIs: { mapper: mapKpis, module: 'kpis', label: 'Value Measurement – KPIs' },
  Milestones: { mapper: mapMilestones, module: 'milestones', label: 'Program Governance – Milestones' },
  Risks: { mapper: mapRisks, module: 'risks', label: 'Program Governance – Risks' },
  'Process Areas': { mapper: mapProcessAreas, module: 'processAreas', label: 'Value Assessment – Process Areas' },
}

// ─── Generate template workbook for download ──────────────────────────────────
export const generateTemplate = () => {
  const wb = XLSX.utils.book_new()

  const addSheet = (name, headers, sample) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample])
    XLSX.utils.book_append_sheet(wb, ws, name)
  }

  addSheet(
    'Benefits',
    ['Category', 'Benefit Name', 'Description', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Status', 'Owner'],
    [['Financial', 'Procurement Savings', 'Supplier consolidation', 0, 1200000, 2000000, 2500000, 2500000, 'Validated', 'CPO']]
  )
  addSheet(
    'Investments',
    ['Category', 'Investment Item', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    [['Software', 'SAP S/4HANA Licences', 8000000, 0, 500000, 500000, 500000]]
  )
  addSheet(
    'KPIs',
    ['KPI Name', 'Category', 'Baseline', 'Current', 'Target', 'Unit', 'Status', 'Trend', 'Last Updated'],
    [['Days Sales Outstanding', 'Finance', 45, 41, 30, 'Days', 'On Track', 'improving', '2025-03']]
  )
  addSheet(
    'Milestones',
    ['Milestone', 'Planned Date', 'Actual Date', 'Status', 'Owner', 'Phase'],
    [['Project Kickoff', '2024-01-31', '2024-01-29', 'Complete', 'Program Director', 'Prepare']]
  )
  addSheet(
    'Risks',
    ['Risk Description', 'Probability', 'Impact', 'Mitigation', 'Owner', 'Status', 'Category'],
    [['Data migration complexity', 4, 5, 'Dedicated data cleanse team', 'Data Lead', 'Open', 'Technical']]
  )
  addSheet(
    'Process Areas',
    ['Process Area', 'Current Score', 'Target Score', 'Priority', 'Status', 'Owner'],
    [['Finance & Controlling', 2.5, 4.5, 'Critical', 'In Progress', 'CFO Office']]
  )

  XLSX.writeFile(wb, 'VRO_Import_Template.xlsx')
}
