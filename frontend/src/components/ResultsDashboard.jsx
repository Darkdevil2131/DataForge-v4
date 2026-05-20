import { useState } from 'react'
import {
  BarChart2, ShieldCheck, Zap, AlertTriangle,
  Download, ChevronDown, ChevronRight, Table2,
  CheckCircle2, Clock, AlertCircle, Info,
  TrendingUp, Database, Layers, FileText
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { Badge, QualityScore, SectionLabel, StatusDot, ConfidenceBar, IntentBadge } from './UI.jsx'

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ color: '#64748b', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 600 }}>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>)}
    </div>
  )
}

// ── Transformation log entry ──────────────────────────────────────────────────
function LogEntry({ entry }) {
  const [open, setOpen] = useState(false)
  const statusColor = { auto_applied: '#10b981', suggested: '#f59e0b', flagged: '#f43f5e' }
  const col = statusColor[entry.status] || '#64748b'
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 6 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, color: '#cbd5e1', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.action}</span>
        <span style={{ fontSize: 11, color: '#334155', fontFamily: 'JetBrains Mono', marginRight: 8 }}>{entry.column}</span>
        <ConfidenceBar value={entry.confidence} />
        <span style={{ color: '#334155', marginLeft: 6 }}>{open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
      </button>
      {open && (
        <div style={{ padding: '8px 14px 12px', background: 'rgba(15,23,42,0.6)', borderTop: '1px solid rgba(148,163,184,0.05)' }}>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{entry.details || entry.reason}</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontSize: 10, color: '#334155' }}>Rows affected: <span style={{ color: '#94a3b8' }}>{entry.rows_affected}</span></span>
            <span style={{ fontSize: 10, color: '#334155' }}>Reason: <span style={{ color: '#94a3b8' }}>{entry.reason}</span></span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Data preview table ────────────────────────────────────────────────────────
function DataTable({ rows, label }) {
  if (!rows?.length) return null
  const cols = Object.keys(rows[0])
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#334155', marginBottom: 8, fontFamily: 'DM Sans' }}>{label}</p>
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(148,163,184,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
          <thead>
            <tr style={{ background: 'rgba(30,41,59,0.8)' }}>
              {cols.map(c => (
                <th key={c} style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(148,163,184,0.07)' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(15,23,42,0.6)' : 'rgba(15,23,42,0.3)' }}>
                {cols.map(c => {
                  const val = row[c]
                  const isNull = val === null || val === undefined
                  const isNum = typeof val === 'number'
                  return (
                    <td key={c} style={{ padding: '7px 12px', color: isNull ? '#334155' : isNum ? '#a5f3fc' : '#e2e8f0', borderBottom: '1px solid rgba(148,163,184,0.04)', whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isNull ? <span style={{ color: '#334155', fontStyle: 'italic' }}>null</span> : isNum ? Number(val).toLocaleString() : String(val).slice(0, 40)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Dataset recommendation card ───────────────────────────────────────────────
function DatasetCard({ ds }) {
  const diffColor = { beginner: 'badge-green', intermediate: 'badge-amber', advanced: 'badge-rose' }
  return (
    <a href={ds.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card-3d" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', fontFamily: 'DM Sans', margin: 0, lineHeight: 1.3 }}>{ds.name}</p>
          <span className={diffColor[ds.difficulty] || 'badge-slate'} style={{ fontSize: 9, whiteSpace: 'nowrap' }}>{ds.difficulty}</span>
        </div>
        <p style={{ fontSize: 11, color: '#475569', marginBottom: 10, fontFamily: 'DM Sans', lineHeight: 1.5 }}>{String(ds.description || '').slice(0, 120)}{(ds.description?.length > 120) ? '…' : ''}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {ds.tags?.slice(0, 4).map(t => <span key={t} className="badge-slate" style={{ fontSize: 9 }}>{t}</span>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#334155' }}>
          {ds.rows && <span>{Number(ds.rows).toLocaleString()} rows</span>}
          {ds.features && <span>· {ds.features} features</span>}
          <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: 10 }}>{ds.source}</span>
        </div>
      </div>
    </a>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function ResultsDashboard({ result, onDownload, downloadLoading }) {
  const [activeTab, setActiveTab] = useState('overview')
  if (!result) return null

  const { quality_scores, report, schema, anomaly_detection, feature_importance, recommendations, preview } = result
  const transforms = report?.transformations || {}
  const allLogs = [
    ...(transforms.auto_applied || []),
    ...(transforms.suggested || []),
    ...(transforms.flagged || []),
  ]

  const TABS = [
    { id: 'overview',    label: 'Overview',                               icon: BarChart2 },
    { id: 'preview',     label: 'Data Preview',                           icon: Table2 },
    { id: 'transforms',  label: `Transforms (${allLogs.length})`,         icon: Zap },
    { id: 'anomalies',   label: `Anomalies (${anomaly_detection?.anomaly_count || 0})`, icon: ShieldCheck },
    { id: 'features',    label: 'Features',                               icon: Layers },
    { id: 'datasets',    label: 'Datasets',                               icon: Database },
    { id: 'report',      label: 'Report',                                 icon: FileText },
  ]

  const missingData = Object.entries(schema?.columns || {})
    .filter(([, v]) => v.null_pct > 0)
    .sort((a, b) => b[1].null_pct - a[1].null_pct)
    .slice(0, 10)
    .map(([col, v]) => ({ col: col.slice(0, 14), pct: v.null_pct }))

  const featureData = (feature_importance || [])
    .slice(0, 10)
    .map(f => ({ name: String(f.feature).slice(0, 14), score: Math.abs(f.importance_score) }))

  const inputStyle = {
    display: 'flex', flexDirection: 'column', gap: 16,
    animation: 'fadeIn 0.3s ease forwards',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header: intent + download ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <IntentBadge intent={result.intent?.intent} />
          <span style={{ fontSize: 12, color: '#334155', fontFamily: 'DM Sans' }}>
            Confidence: <span style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>{Math.round((result.intent?.confidence || 0) * 100)}%</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['csv', 'excel', 'parquet'].map(fmt => (
            <button key={fmt} onClick={() => onDownload(fmt)} disabled={downloadLoading}
              className="btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }}>
              <Download size={13} /> {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Quality score cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div className="glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <QualityScore score={quality_scores?.before || 0} label="Before" />
          <span style={{ color: '#334155', fontSize: 20 }}>→</span>
          <QualityScore score={quality_scores?.after || 0} label="After" size="lg" />
        </div>
        {[
          { label: 'Shape', value: `${result.shape?.original?.[0]?.toLocaleString()} × ${result.shape?.original?.[1]}`, sub: `→ ${result.shape?.engineered?.[0]?.toLocaleString()} × ${result.shape?.engineered?.[1]}` },
          { label: 'Auto-Fixed', value: String(transforms.auto_applied?.length || 0), sub: 'actions applied', color: '#10b981' },
          { label: 'Anomalies', value: String(anomaly_detection?.anomaly_count || 0), sub: 'detected', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#334155', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'DM Sans', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color || '#818cf8', fontFamily: 'Syne, system-ui', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#334155', marginTop: 4, fontFamily: 'DM Sans' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Policy note ── */}
      {result.policy?.description && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <Info size={14} color="#818cf8" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#a5b4fc', fontFamily: 'DM Sans', lineHeight: 1.5 }}>{result.policy.description}</p>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.8)', borderRadius: 12, padding: 4, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
            borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
            whiteSpace: 'nowrap', fontFamily: 'DM Sans', transition: 'all 0.15s',
            background: activeTab === tab.id ? 'rgba(51,65,85,0.9)' : 'transparent',
            color: activeTab === tab.id ? '#e2e8f0' : '#475569',
          }}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={inputStyle}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {missingData.length > 0 && (
              <div className="glass" style={{ padding: 20 }}>
                <SectionLabel>Missing Values by Column</SectionLabel>
                <div style={{ marginTop: 12 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={missingData} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <XAxis type="number" tick={{ fill: '#334155', fontSize: 9 }} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="col" tick={{ fill: '#64748b', fontSize: 9 }} width={90} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="pct" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="glass" style={{ padding: 20 }}>
              <SectionLabel>Column Roles</SectionLabel>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {Object.entries(schema?.columns || {}).map(([col, info]) => (
                  <div key={col} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{col}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className={info.role === 'identifier' ? 'badge-rose' : info.role === 'potential_target' ? 'badge-green' : 'badge-slate'} style={{ fontSize: 9 }}>{info.role}</span>
                      <span style={{ fontSize: 9, color: '#334155', fontFamily: 'JetBrains Mono' }}>{info.inferred_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DATA PREVIEW */}
        {activeTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {preview?.original?.length > 0 && <DataTable rows={preview.original} label={`Original Data (first ${preview.original.length} rows)`} />}
            {preview?.cleaned?.length > 0 && <DataTable rows={preview.cleaned} label={`After Cleaning (first ${preview.cleaned.length} rows)`} />}
            {preview?.engineered?.length > 0 && <DataTable rows={preview.engineered} label={`After Feature Engineering (first ${preview.engineered.length} rows — more columns)`} />}
            {!preview?.original?.length && (
              <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: '#334155', fontFamily: 'DM Sans', fontSize: 13 }}>No preview data available.</p>
              </div>
            )}
          </div>
        )}

        {/* TRANSFORMS */}
        {activeTab === 'transforms' && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12, fontFamily: 'DM Sans', flexWrap: 'wrap' }}>
              {[
                { status: 'auto_applied', count: transforms.auto_applied?.length || 0, label: 'Auto-applied', color: '#10b981' },
                { status: 'suggested',   count: transforms.suggested?.length || 0,   label: 'Suggested',    color: '#f59e0b' },
                { status: 'flagged',     count: transforms.flagged?.length || 0,     label: 'Flagged',      color: '#f43f5e' },
              ].map(s => (
                <span key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                  <b style={{ color: s.color }}>{s.count}</b> {s.label}
                </span>
              ))}
            </div>
            {allLogs.length === 0
              ? <div className="glass" style={{ padding: 32, textAlign: 'center' }}><p style={{ color: '#334155', fontSize: 13, fontFamily: 'DM Sans' }}>Dataset was already clean — no transformations needed.</p></div>
              : allLogs.map((entry, i) => <LogEntry key={i} entry={entry} />)
            }
          </div>
        )}

        {/* ANOMALIES */}
        {activeTab === 'anomalies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="glass" style={{ padding: '12px 16px', borderColor: anomaly_detection?.preserved ? 'rgba(245,158,11,0.2)' : 'rgba(148,163,184,0.07)', background: anomaly_detection?.preserved ? 'rgba(245,158,11,0.05)' : undefined }}>
              <p style={{ fontSize: 12, color: '#e2e8f0', fontFamily: 'DM Sans' }}>{anomaly_detection?.note || 'No anomaly information.'}</p>
            </div>
            {(anomaly_detection?.anomaly_details || []).slice(0, 8).map((a, i) => (
              <div key={i} className="glass" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono' }}>Row #{a.row_index}</span>
                  <span className="badge-rose" style={{ fontSize: 10 }}>Score: {a.anomaly_score}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {Object.entries(a.data || {}).slice(0, 6).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 11 }}>
                      <span style={{ color: '#334155' }}>{k}: </span>
                      <span style={{ color: '#a5f3fc', fontFamily: 'JetBrains Mono' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!anomaly_detection?.anomaly_details?.length && (
              <div className="glass" style={{ padding: 32, textAlign: 'center' }}><p style={{ color: '#334155', fontSize: 13, fontFamily: 'DM Sans' }}>No anomaly row details available.</p></div>
            )}
          </div>
        )}

        {/* FEATURES */}
        {activeTab === 'features' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {featureData.length > 0 && (
              <div className="glass" style={{ padding: 20 }}>
                <SectionLabel>Top Feature Importance</SectionLabel>
                <div style={{ marginTop: 12 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={featureData} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <XAxis type="number" tick={{ fill: '#334155', fontSize: 9 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} width={100} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="glass" style={{ padding: 20 }}>
              <SectionLabel>Engineering Log</SectionLabel>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                {(report?.feature_engineering?.details || []).map((f, i) => (
                  <div key={i} style={{ border: '1px solid rgba(148,163,184,0.07)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="badge-indigo" style={{ fontSize: 9 }}>{f.action}</span>
                      <span style={{ fontSize: 10, color: '#334155', fontFamily: 'JetBrains Mono' }}>{f.source_column}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0, fontFamily: 'DM Sans' }}>{f.reason}</p>
                  </div>
                ))}
                {!report?.feature_engineering?.details?.length && (
                  <p style={{ fontSize: 12, color: '#334155', fontFamily: 'DM Sans' }}>No features engineered.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DATASETS */}
        {activeTab === 'datasets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionLabel>Recommended Datasets for Your Goal</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {(recommendations || []).map((ds, i) => <DatasetCard key={ds.id || i} ds={ds} />)}
            </div>
            {report?.model_recommendations?.length > 0 && (
              <div className="glass" style={{ padding: 20 }}>
                <SectionLabel>Recommended Models</SectionLabel>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {report.model_recommendations.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#818cf8', fontWeight: 700, flexShrink: 0 }}>{m.priority}</span>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', fontFamily: 'DM Sans' }}>{m.model}</span>
                        <span style={{ fontSize: 11, color: '#475569', marginLeft: 8, fontFamily: 'DM Sans' }}>{m.why}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REPORT */}
        {activeTab === 'report' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(report?.risks || []).length > 0 && (
              <div className="glass" style={{ padding: 20 }}>
                <SectionLabel>Risk Assessment</SectionLabel>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {report.risks.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, background: r.severity === 'high' ? 'rgba(244,63,94,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${r.severity === 'high' ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                      <AlertTriangle size={14} color={r.severity === 'high' ? '#f43f5e' : '#f59e0b'} style={{ marginTop: 1, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 12, color: '#e2e8f0', margin: '0 0 4px', fontFamily: 'DM Sans' }}>{r.message}</p>
                        <p style={{ fontSize: 11, color: '#475569', margin: 0, fontFamily: 'DM Sans' }}>{r.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="glass" style={{ padding: 20 }}>
              <SectionLabel>Next Steps</SectionLabel>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(report?.next_steps || []).map((step, i) => (
                  <p key={i} style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'DM Sans', lineHeight: 1.5, margin: 0 }}>{step}</p>
                ))}
              </div>
            </div>
            {(report?.policy_notes || []).length > 0 && (
              <div className="glass" style={{ padding: 20 }}>
                <SectionLabel>Policy Notes</SectionLabel>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {report.policy_notes.map((note, i) => (
                    <p key={i} style={{ fontSize: 12, color: '#fbbf24', fontFamily: 'DM Sans', lineHeight: 1.5, margin: 0 }}>⚠ {note}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
