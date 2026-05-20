import { useState } from 'react'
import { CheckCircle, Circle, Loader2, AlertTriangle, Upload, Brain, Zap, BarChart2, Download, Sparkles } from 'lucide-react'
import { UploadPanel } from '../components/UploadPanel.jsx'
import { ResultsDashboard } from '../components/ResultsDashboard.jsx'
import { useProcessing } from '../hooks/useDataForge.js'

const PIPELINE_STEPS = [
  { id: 'intent',   label: 'Intent Analysis',     icon: Brain,    desc: 'Understanding your goal' },
  { id: 'schema',   label: 'Schema Inference',     icon: Sparkles, desc: 'Scanning column types & roles' },
  { id: 'clean',    label: 'Intelligent Cleaning', icon: Zap,      desc: 'Removing noise, fixing formats' },
  { id: 'anomaly',  label: 'Anomaly Detection',    icon: AlertTriangle, desc: 'IsolationForest + LOF ensemble' },
  { id: 'features', label: 'Feature Engineering',  icon: BarChart2, desc: 'Encoding, scaling, lag features' },
  { id: 'report',   label: 'Report Generation',    icon: CheckCircle, desc: 'Quality score & audit log' },
]

function PipelineProgress({ active, done }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {PIPELINE_STEPS.map((step, i) => {
        const isDone = done > i
        const isActive = active === i
        return (
          <div key={step.id} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: i < PIPELINE_STEPS.length - 1 ? 0 : 0 }}>
            {/* Line */}
            {i < PIPELINE_STEPS.length - 1 && (
              <div style={{ position: 'absolute', left: 19, top: 40, width: 2, height: '100%', minHeight: 28, background: isDone ? 'rgba(99,102,241,0.4)' : 'rgba(30,41,59,0.8)' }} />
            )}
            {/* Icon */}
            <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${isDone ? '#6366f1' : isActive ? '#6366f1' : '#1e293b'}`, background: isDone ? 'rgba(99,102,241,0.2)' : isActive ? 'rgba(99,102,241,0.1)' : 'rgba(15,23,42,0.8)', transition: 'all 0.4s ease', position: 'relative', zIndex: 1 }}>
              {isActive
                ? <Loader2 size={16} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
                : isDone ? <CheckCircle size={16} color="#818cf8" />
                : <step.icon size={16} color="#334155" />
              }
            </div>
            {/* Label */}
            <div style={{ paddingBottom: 24, paddingTop: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: isDone || isActive ? '#e2e8f0' : '#334155', fontFamily: 'DM Sans', margin: 0, transition: 'color 0.3s' }}>{step.label}</p>
              {(isActive || isDone) && <p style={{ fontSize: 11, color: '#475569', fontFamily: 'DM Sans', margin: '2px 0 0' }}>{step.desc}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ProcessPage() {
  const processing = useProcessing()
  const [dlLoading, setDlLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [doneSteps, setDoneSteps] = useState(0)

  const handleRun = async (file, prompt, options) => {
    // Animate pipeline steps
    setActiveStep(0); setDoneSteps(0)
    const timing = [600, 500, 700, 800, 600, 400]
    let delay = 0
    timing.forEach((t, i) => {
      delay += t
      setTimeout(() => { setActiveStep(i + 1); setDoneSteps(i + 1) }, delay)
    })
    await processing.run(file, prompt, options)
    setActiveStep(-1)
  }

  const handleDownload = async (format) => {
    setDlLoading(true)
    await processing.download(format)
    setDlLoading(false)
  }

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 'clamp(24px,3vw,36px)', color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Process Dataset
          </h1>
          <p style={{ color: '#475569', fontFamily: 'DM Sans', fontSize: 15 }}>
            Upload raw data, describe your goal — the full 6-stage pipeline runs automatically.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, alignItems: 'start' }}>
          
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Upload panel */}
            <div className="glass" style={{ padding: 24 }}>
              <UploadPanel onSubmit={handleRun} loading={processing.loading} />
            </div>

            {/* Pipeline progress */}
            {processing.loading && (
              <div className="glass" style={{ padding: 24, animation: 'fadeIn 0.3s ease' }}>
                <p className="section-label" style={{ marginBottom: 16 }}>Pipeline Running</p>
                <PipelineProgress active={activeStep} done={doneSteps} />
              </div>
            )}

            {/* Quick tips */}
            {!processing.loading && !processing.result && (
              <div className="glass" style={{ padding: 20 }}>
                <p className="section-label" style={{ marginBottom: 12 }}>Example Prompts</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'Prepare for a fraud detection model',
                    'Clean for customer churn prediction',
                    'Optimize for time-series forecasting',
                    'Prepare for a BI analytics dashboard',
                    'Make ready for medical classification',
                  ].map(p => (
                    <div key={p} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.06)' }}>
                      <span style={{ fontSize: 12, color: '#475569', fontFamily: 'DM Sans', fontStyle: 'italic' }}>"{p}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — results */}
          <div style={{ gridColumn: 'span 2' }}>
            {processing.error && (
              <div className="glass" style={{ padding: 20, marginBottom: 16, border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.04)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <AlertTriangle size={16} color="#f43f5e" style={{ marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <p style={{ color: '#fb7185', fontWeight: 600, fontSize: 13, margin: '0 0 4px', fontFamily: 'DM Sans' }}>Processing failed</p>
                    <p style={{ color: 'rgba(251,113,133,0.7)', fontSize: 12, margin: '0 0 6px', fontFamily: 'DM Sans' }}>{processing.error}</p>
                    <p style={{ color: '#334155', fontSize: 11, margin: 0, fontFamily: 'DM Sans' }}>
                      Make sure the backend is running: <code style={{ fontFamily: 'JetBrains Mono,monospace', color: '#818cf8' }}>cd backend && python main.py</code>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {processing.loading && !processing.result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[280, 200, 160].map((h, i) => (
                  <div key={i} className="shimmer" style={{ height: h, borderRadius: 16 }} />
                ))}
              </div>
            )}

            {processing.result && (
              <ResultsDashboard
                result={processing.result}
                onDownload={handleDownload}
                downloadLoading={dlLoading}
              />
            )}

            {!processing.result && !processing.loading && !processing.error && (
              <div className="glass" style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 400 }}>
                <div style={{ width: 80, height: 80, borderRadius: 22, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, animation: 'float 4s ease-in-out infinite' }}>
                  <Upload size={36} color="#1e293b" />
                </div>
                <p style={{ color: '#334155', fontWeight: 600, fontSize: 15, fontFamily: 'DM Sans', margin: '0 0 8px' }}>Upload a dataset to begin</p>
                <p style={{ color: '#1e293b', fontSize: 13, fontFamily: 'DM Sans', margin: 0, maxWidth: 320 }}>
                  Supports CSV, Excel (.xlsx), JSON, and Parquet files up to 100K rows
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  )
}
