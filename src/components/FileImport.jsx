import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, FileText, Download, Check, X, AlertCircle, ChevronRight } from 'lucide-react'
import { parseExcelFile, parseTextFile, SHEET_MAPPERS, generateTemplate } from '../utils/fileParser'
import useStore from '../store/useStore'

const SUPPORTED_MODULES = [
  { key: 'benefits', label: 'Value Case – Benefits', sheet: 'Benefits', description: 'Benefit categories, names, 5-year projections, status and owner' },
  { key: 'investments', label: 'Value Case – Investments', sheet: 'Investments', description: 'Investment line items, categories and 5-year spend profile' },
  { key: 'kpis', label: 'Value Measurement – KPIs', sheet: 'KPIs', description: 'KPI names, baseline, current, target values and status' },
  { key: 'milestones', label: 'Program Governance – Milestones', sheet: 'Milestones', description: 'Programme milestones, dates, owners and status' },
  { key: 'risks', label: 'Program Governance – Risks', sheet: 'Risks', description: 'Risk register with probability, impact, mitigation and owner' },
  { key: 'processAreas', label: 'Value Assessment – Process Areas', sheet: 'Process Areas', description: 'Process maturity current and target scores' },
]

function FileDropZone({ onFiles }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = [...e.dataTransfer.files]
    if (files.length) onFiles(files)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
        ${dragOver ? 'border-sap-blue bg-sap-light' : 'border-gray-200 hover:border-sap-blue hover:bg-gray-50'}`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept=".xlsx,.xls,.csv,.txt,.tsv"
        onChange={(e) => onFiles([...e.target.files])}
      />
      <Upload size={40} className={`mx-auto mb-4 ${dragOver ? 'text-sap-blue' : 'text-gray-300'}`} />
      <p className="text-base font-semibold text-gray-700">Drop files here or click to browse</p>
      <p className="text-sm text-gray-400 mt-1">Supports Excel (.xlsx, .xls) and text files (.csv, .txt, .tsv)</p>
    </div>
  )
}

function ImportPreview({ file, data, onImport, onDismiss }) {
  const [selectedModules, setSelectedModules] = useState({})
  const [importResults, setImportResults] = useState(null)
  const importData = useStore(s => s.importData)

  // Detect what's in the file
  const availableSheets = Object.keys(data)
  const matchedModules = availableSheets
    .map(sheet => SHEET_MAPPERS[sheet])
    .filter(Boolean)

  const isTextFile = !availableSheets.some(s => s !== 'data')
  // Text file only has one sheet
  const textRows = data.data || data[availableSheets[0]] || []

  const toggleModule = (key) => setSelectedModules(prev => ({ ...prev, [key]: !prev[key] }))

  const handleImport = () => {
    const results = []
    if (isTextFile) {
      // For text files, user selects target module
      Object.entries(selectedModules).forEach(([mod, selected]) => {
        if (!selected) return
        const mapper = SHEET_MAPPERS[Object.keys(SHEET_MAPPERS).find(k => SHEET_MAPPERS[k].module === mod)]
        if (mapper) {
          const mapped = mapper.mapper(textRows)
          importData(mod, mapped)
          results.push({ label: mapper.label, count: mapped.length, ok: true })
        }
      })
    } else {
      matchedModules.forEach(m => {
        if (!selectedModules[m.module] && selectedModules[m.module] !== false && matchedModules.length > 0) {
          // Auto-select all by default if none manually toggled
        }
        const sheetName = Object.keys(SHEET_MAPPERS).find(k => SHEET_MAPPERS[k].module === m.module)
        const rows = data[sheetName] || []
        const mapped = m.mapper(rows)
        importData(m.module, mapped)
        results.push({ label: m.label, count: mapped.length, ok: true })
      })
    }
    setImportResults(results)
    if (results.length > 0) onImport()
  }

  if (importResults) {
    return (
      <div className="card border-green-200 bg-green-50">
        <div className="flex items-center gap-3 mb-4">
          <Check size={20} className="text-green-600" />
          <h3 className="font-semibold text-green-800">Import Complete</h3>
        </div>
        <div className="space-y-2">
          {importResults.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-green-700">
              <Check size={14} className="text-green-500" />
              {r.label}: {r.count} records imported
            </div>
          ))}
        </div>
        <button onClick={onDismiss} className="btn-secondary mt-4">Import Another File</button>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            {file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.tsv')
              ? <FileText size={20} className="text-sap-blue" />
              : <FileSpreadsheet size={20} className="text-green-600" />}
            <h3 className="font-semibold text-gray-800">{file.name}</h3>
            <span className="badge-gray">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isTextFile
              ? `${textRows.length} rows detected`
              : `${availableSheets.length} sheet(s): ${availableSheets.join(', ')}`}
          </p>
        </div>
        <button onClick={onDismiss} className="btn-ghost p-1"><X size={16} /></button>
      </div>

      {matchedModules.length === 0 && !isTextFile && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl mb-4">
          <AlertCircle size={16} className="text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">No recognised sheet names found</p>
            <p className="text-xs text-amber-600 mt-1">
              Expected sheets: {Object.keys(SHEET_MAPPERS).join(', ')}. Found: {availableSheets.join(', ')}
            </p>
          </div>
        </div>
      )}

      {!isTextFile && matchedModules.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">
            {matchedModules.length} module(s) will be updated:
          </p>
          <div className="space-y-2 mb-4">
            {matchedModules.map(m => {
              const sheetName = Object.keys(SHEET_MAPPERS).find(k => SHEET_MAPPERS[k].module === m.module)
              const rows = data[sheetName] || []
              return (
                <div key={m.module} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Check size={16} className="text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{m.label}</p>
                    <p className="text-xs text-gray-400">{rows.length} rows to import</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {isTextFile && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Select the module to import this CSV/text data into:
          </p>
          <div className="space-y-2 mb-4">
            {SUPPORTED_MODULES.map(m => (
              <label key={m.key} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${selectedModules[m.key] ? 'border-sap-blue bg-sap-light' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                <input type="radio" name="module" checked={!!selectedModules[m.key]}
                  onChange={() => {
                    const reset = {}
                    SUPPORTED_MODULES.forEach(mod => { reset[mod.key] = false })
                    setSelectedModules({ ...reset, [m.key]: true })
                  }} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.description}</p>
                </div>
              </label>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleImport}
          disabled={isTextFile && !Object.values(selectedModules).some(Boolean)}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Import Data
        </button>
        <button onClick={onDismiss} className="btn-secondary">Cancel</button>
        <p className="text-xs text-amber-600 flex items-center gap-1 ml-auto">
          <AlertCircle size={12} /> This will replace existing data in the selected modules
        </p>
      </div>
    </div>
  )
}

export default function FileImport() {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null) // { file, data }
  const [history, setHistory] = useState([])

  const handleFiles = async (files) => {
    setError(null)
    const file = files[0]
    if (!file) return

    setProcessing(true)
    try {
      let data
      const isExcel = file.name.match(/\.xlsx?$/i)
      if (isExcel) {
        data = await parseExcelFile(file)
      } else {
        const result = await parseTextFile(file)
        // Wrap text result in a structure that looks like sheets
        data = { data: result.data, _headers: result.headers }
      }
      setPreview({ file, data })
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleImportSuccess = () => {
    setHistory(h => [{ file: preview.file.name, date: new Date().toLocaleString(), ok: true }, ...h.slice(0, 9)])
  }

  const handleDismiss = () => setPreview(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Import Data</h2>
        <p className="text-sm text-gray-400 mt-1">Upload Excel workbooks or CSV/text files to populate the tool with your programme data</p>
      </div>

      {/* Download template */}
      <div className="card bg-gradient-to-r from-sap-light to-blue-50 border-sap-blue border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Excel Import Template</h3>
            <p className="text-sm text-gray-500 mt-1">Download the pre-formatted template with all required sheets and column headers.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.values(SHEET_MAPPERS).map(m => (
                <span key={m.module} className="badge-blue text-xs">{m.label.split(' – ')[1]}</span>
              ))}
            </div>
          </div>
          <button onClick={generateTemplate} className="btn-primary flex-shrink-0 ml-4">
            <Download size={16} /> Download Template
          </button>
        </div>
      </div>

      {/* Drop zone */}
      {!preview && !processing && (
        <FileDropZone onFiles={handleFiles} />
      )}

      {processing && (
        <div className="card text-center py-12">
          <div className="w-10 h-10 border-2 border-sap-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600">Processing file…</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={18} className="text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Import failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto btn-ghost p-1"><X size={16} /></button>
        </div>
      )}

      {preview && (
        <ImportPreview
          file={preview.file}
          data={preview.data}
          onImport={handleImportSuccess}
          onDismiss={handleDismiss}
        />
      )}

      {/* Supported formats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-green-600" /> Excel (.xlsx / .xls)
          </h3>
          <ul className="space-y-2">
            {Object.values(SHEET_MAPPERS).map(m => (
              <li key={m.module} className="flex items-start gap-2 text-sm text-gray-600">
                <ChevronRight size={14} className="text-gray-300 mt-0.5 flex-shrink-0" />
                <span><span className="font-medium">Sheet: "{m.label.split(' – ')[1]}"</span> → {m.label}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-3">A single workbook can contain multiple sheets to import all modules at once.</p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileText size={18} className="text-sap-blue" /> CSV / Text (.csv, .txt, .tsv)
          </h3>
          <p className="text-sm text-gray-600 mb-3">Auto-detects comma, tab, or semicolon delimiters. First row must be headers.</p>
          <div className="space-y-2">
            {SUPPORTED_MODULES.map(m => (
              <div key={m.key} className="text-xs text-gray-500 flex items-start gap-2">
                <ChevronRight size={12} className="text-gray-300 mt-0.5 flex-shrink-0" />
                <span><span className="font-medium text-gray-700">{m.label}:</span> {m.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import history */}
      {history.length > 0 && (
        <div className="card">
          <h3 className="section-title mb-3">Import History (this session)</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Check size={14} className="text-green-500" />
                <span className="text-gray-700">{h.file}</span>
                <span className="text-gray-400 text-xs ml-auto">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
