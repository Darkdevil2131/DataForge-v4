import { useState, useEffect } from 'react'
import { ChevronRight, ArrowRight, Database, Zap, Shield, BarChart2, Sparkles, CheckCircle, Upload, Download, Brain } from 'lucide-react'

function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const step = target / (duration / 16)
    let cur = 0
    const timer = setInterval(() => {
      cur = Math.min(cur + step, target)
      setCount(Math.floor(cur))
      if (cur >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return <span>{count.toLocaleString()}{suffix}</span>
}

function ParticleOrb({ x, y, size, color, delay }) {
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      width: size, height: size, borderRadius: '50%',
      background: color, filter: 'blur(60px)',
      opacity: 0.12, animation: `float ${4 + delay}s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none',
    }} />
  )
}

const FEATURES = [
  { icon: Brain, color: '#818cf8', title: 'Intent Understanding', desc: 'Type your goal in plain English. Our NLP model understands fraud detection, forecasting, analytics — and picks the exact right cleaning strategy.' },
  { icon: Shield, color: '#34d399', title: 'Context-Aware Cleaning', desc: 'Fraud data? Outliers are kept — they are signals. Regression? Outliers are clipped. Every action has a confidence score. Nothing blindly changed.' },
  { icon: Zap, color: '#fbbf24', title: 'Anomaly Detection', desc: 'IsolationForest + LOF ensemble trained on real credit card fraud data. AUC 1.00. Detects unusual rows that other systems miss.' },
  { icon: BarChart2, color: '#f472b6', title: 'Feature Engineering', desc: 'Automatic one-hot encoding, frequency encoding, standard scaling, datetime decomposition, lag features for time series — all context-aware.' },
  { icon: Sparkles, color: '#a78bfa', title: 'Dataset Recommendations', desc: 'Search Kaggle, HuggingFace, and curated sources. Get the right dataset for your exact task with difficulty ratings and model suggestions.' },
  { icon: Download, color: '#38bdf8', title: 'Download Anywhere', desc: 'Export cleaned data as CSV, Excel, or Parquet. Production-ready, with full transformation log, quality score, and risk assessment.' },
]

const STEPS = [
  { n: '01', icon: Upload, title: 'Upload Your Dataset', desc: 'Drop any CSV, Excel, JSON, or Parquet file. Up to 100K rows supported.' },
  { n: '02', icon: Brain, title: 'Describe Your Goal', desc: 'One sentence. "Prepare for fraud detection." The AI handles everything else.' },
  { n: '03', icon: Zap, title: '6-Stage Pipeline Runs', desc: 'Schema → Cleaning → Anomaly Detection → Feature Engineering → Report.' },
  { n: '04', icon: Download, title: 'Download & Deploy', desc: 'Production-ready file + transformation log + model recommendations.' },
]

export function LandingPage({ setPage }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])

  return (
    <div style={{ paddingTop: 60 }}>
      {/* ── Hero ── */}
      <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Background orbs */}
        <ParticleOrb x={15} y={20} size={400} color="#6366f1" delay={0} />
        <ParticleOrb x={75} y={10} size={300} color="#8b5cf6" delay={1} />
        <ParticleOrb x={60} y={70} size={350} color="#6366f1" delay={2} />
        <ParticleOrb x={5}  y={65} size={250} color="#818cf8" delay={1.5} />

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to bottom,transparent,#02040a)' }} />

        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '60px 24px', width: '100%', textAlign: 'center' }}>
          
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 40, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.07)', marginBottom: 40, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', animation: 'pulseDot 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, color: '#818cf8', fontFamily: 'DM Sans', letterSpacing: '0.04em', fontWeight: 500 }}>6 ML Models Trained · Real Datasets · Zero API Cost</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 'clamp(40px,7vw,80px)', lineHeight: 1.02, letterSpacing: '-0.04em', color: '#f1f5f9', marginBottom: 32, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s' }}>
            Raw data to
            <br />
            <span style={{ background: 'linear-gradient(135deg,#818cf8 0%,#c4b5fd 40%,#818cf8 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200%', animation: 'gradientShift 5s linear infinite' }}>
              production-ready
            </span>
            <br />
            in one prompt.
          </h1>

          <p style={{ fontSize: 'clamp(16px,2.5vw,20px)', color: '#475569', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 52px', fontFamily: 'DM Sans', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s' }}>
            Upload any messy dataset. Describe your ML goal. DataForge AI automatically cleans, engineers features, detects anomalies, and delivers production-ready data with a full audit trail.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s' }}>
            <button onClick={() => setPage('process')} className="btn-primary" style={{ padding: '15px 32px', fontSize: 16, gap: 10 }}>
              <Database size={18} /> Start Processing <ChevronRight size={16} />
            </button>
            <button onClick={() => setPage('explore')} className="btn-secondary" style={{ padding: '15px 28px', fontSize: 16 }}>
              <Sparkles size={16} /> Explore Datasets
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 72, opacity: visible ? 1 : 0, transition: 'opacity 1s ease 0.5s' }}>
            {[
              { value: 92, suffix: '.9%', label: 'Intent Accuracy' },
              { value: 100, suffix: '%', label: 'Fraud AUC' },
              { value: 6, suffix: '', label: 'ML Models' },
              { value: 10000, suffix: '+', label: 'Training Rows' },
              { value: 5, suffix: '', label: 'Real Datasets' },
            ].map(s => (
              <div key={s.label} style={{ padding: '14px 24px', borderRadius: 12, border: '1px solid rgba(148,163,184,0.07)', background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)', minWidth: 120, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 22, color: '#818cf8', lineHeight: 1 }}>
                  {visible ? <AnimatedCounter target={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
                </div>
                <div style={{ fontSize: 11, color: '#334155', fontFamily: 'DM Sans', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p className="section-label" style={{ marginBottom: 14 }}>Capabilities</p>
          <h2 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 'clamp(28px,4vw,48px)', color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 16 }}>
            Everything your data needs
          </h2>
          <p style={{ fontSize: 17, color: '#475569', fontFamily: 'DM Sans', maxWidth: 520, margin: '0 auto' }}>
            Six specialized engines working together — each doing exactly what it does best.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card-3d" style={{ padding: '28px 32px', cursor: 'default' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.color}18`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ fontFamily: 'Syne,system-ui', fontWeight: 700, fontSize: 17, color: '#e2e8f0', marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, fontFamily: 'DM Sans' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ background: 'rgba(15,23,42,0.4)', borderTop: '1px solid rgba(148,163,184,0.05)', borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p className="section-label" style={{ marginBottom: 14 }}>Pipeline</p>
            <h2 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 'clamp(28px,4vw,48px)', color: '#f1f5f9', letterSpacing: '-0.03em' }}>
              Four steps. One result.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 0, position: 'relative' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ padding: '40px 32px', position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div className="hide-mobile" style={{ position: 'absolute', top: 48, right: -8, zIndex: 10 }}>
                    <ArrowRight size={16} color="#1e293b" />
                  </div>
                )}
                <div style={{ fontSize: 48, fontFamily: 'Syne,system-ui', fontWeight: 800, color: 'rgba(99,102,241,0.1)', lineHeight: 1, marginBottom: 20 }}>{s.n}</div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <s.icon size={20} color="#818cf8" />
                </div>
                <h3 style={{ fontFamily: 'Syne,system-ui', fontWeight: 700, fontSize: 16, color: '#e2e8f0', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, fontFamily: 'DM Sans' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 40, alignItems: 'center' }}>
          <div>
            <p className="section-label" style={{ marginBottom: 16 }}>Results</p>
            <h2 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,42px)', color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 20, lineHeight: 1.1 }}>
              Not just clean data.<br />A complete audit.
            </h2>
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, fontFamily: 'DM Sans', marginBottom: 32 }}>
              Every transformation is logged with confidence scores. You know exactly what changed, why it changed, and what was left for you to review.
            </p>
            {[
              'Quality score before & after',
              'Transformation log with confidence %',
              'Anomaly detection report',
              'Feature importance ranking',
              'Model recommendations for your task',
              'Risk assessment & warnings',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <CheckCircle size={15} color="#10b981" />
                <span style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'DM Sans' }}>{item}</span>
              </div>
            ))}
            <button onClick={() => setPage('process')} className="btn-primary" style={{ marginTop: 32, padding: '13px 28px', fontSize: 15 }}>
              Try it now <ArrowRight size={16} />
            </button>
          </div>
          {/* Mock result card */}
          <div className="glass" style={{ padding: 24, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: '#334155', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quality Score</span>
              <span className="badge-green">Improved</span>
            </div>
            {[['Before', 73, '#f59e0b'], ['After', 98, '#10b981']].map(([label, pct, color]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#475569', fontFamily: 'DM Sans' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'Syne,system-ui' }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(30,41,59,0.8)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '27 duplicates removed', status: 'auto_applied', color: '#10b981' },
                { label: '142 missing values imputed', status: 'auto_applied', color: '#10b981' },
                { label: 'Outlier clipping suggested', status: 'suggested', color: '#f59e0b' },
                { label: '8 anomalous rows flagged', status: 'flagged', color: '#f43f5e' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(15,23,42,0.6)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'DM Sans' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 120px' }}>
        <div style={{ borderRadius: 24, background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)', padding: '80px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 200, background: 'radial-gradient(ellipse,rgba(99,102,241,0.2),transparent 70%)', filter: 'blur(30px)' }} />
          <h2 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 'clamp(28px,4vw,52px)', color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 16, position: 'relative' }}>
            Ready to clean your data?
          </h2>
          <p style={{ fontSize: 17, color: '#64748b', fontFamily: 'DM Sans', marginBottom: 40, position: 'relative' }}>
            Upload your first dataset in under 60 seconds. No setup required.
          </p>
          <button onClick={() => setPage('process')} className="btn-primary" style={{ padding: '16px 40px', fontSize: 17, position: 'relative' }}>
            Start for free <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <style>{`
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
      `}</style>
    </div>
  )
}
