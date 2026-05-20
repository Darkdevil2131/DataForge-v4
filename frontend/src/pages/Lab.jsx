import { useState, useEffect } from 'react'
import { Brain, Zap, Shield, BarChart2, Activity, CheckCircle, ExternalLink } from 'lucide-react'

const MODELS = [
  { name: 'Intent Classifier', algo: 'TF-IDF + Logistic Regression', dataset: '210 labeled prompts', score: '92.9% CV Accuracy', classes: ['fraud_detection','classification','regression','forecasting','analytics','recommendation','nlp','general_ml'], color: '#818cf8', icon: Brain, desc: 'Reads your prompt and classifies your ML goal into 8 categories. Drives the entire cleaning strategy.' },
  { name: 'Fraud Detector', algo: 'GradientBoosting + SMOTE', dataset: 'Credit Card Fraud (10K rows)', score: 'AUC 1.00 · F1 0.99', color: '#f472b6', icon: Shield, desc: 'Trained on real credit card fraud data. SMOTE balances the 3% fraud / 97% legit ratio. Used for anomaly scoring.' },
  { name: 'Anomaly Detector', algo: 'IsolationForest + LOF Ensemble', dataset: 'Credit Card Fraud (10K rows)', score: 'AUC 1.00 Ensemble', color: '#34d399', icon: Activity, desc: 'Unsupervised ensemble. IsolationForest detects global outliers, LOF finds local density anomalies. Combined for 2× accuracy.' },
  { name: 'Churn Classifier', algo: 'RandomForest + SMOTE', dataset: 'Telco Customer Churn (7K rows)', score: 'Accuracy 71.7% · AUC 0.58', color: '#fbbf24', icon: Zap, desc: 'Predicts customer churn from telecom data. Demonstrates classification pipeline on imbalanced data.' },
  { name: 'House Price Regressor', algo: 'GradientBoosting (log target)', dataset: 'House Prices (1,500 rows)', score: 'R² 0.92 · MAE $25K', color: '#38bdf8', icon: BarChart2, desc: 'Log-transforms skewed price targets before training. GradientBoosting on mixed numeric/categorical features.' },
  { name: 'Cancer Classifier', algo: 'RandomForest + SVM Soft Ensemble', dataset: 'Breast Cancer UCI (569 samples)', score: 'AUC 0.997 · F1 0.976', color: '#a78bfa', icon: CheckCircle, desc: 'Soft-voting ensemble of RF and SVM. Medical domain — demonstrates high-stakes classification.' },
]

const PIPELINE = [
  { step: '01', title: 'BrainEngine', desc: 'Central orchestrator. Analyzes dataset structure, resolves ambiguous prompts, selects domain-specific cleaning strategy.', color: '#818cf8' },
  { step: '02', title: 'SchemaEngine', desc: 'Infers column types, semantic roles (money, datetime, identifier, target), detects data leakage risks.', color: '#34d399' },
  { step: '03', title: 'NoiseEngine', desc: 'Replaces invalid tokens (ERROR/NULL/N/A), auto-converts string numbers, imputes missing values, removes duplicates.', color: '#fbbf24' },
  { step: '04', title: 'AnomalyEngine', desc: 'IsolationForest + LOF ensemble. Policy-aware: fraud data anomalies preserved, regression data anomalies clipped.', color: '#f472b6' },
  { step: '05', title: 'FeatureEngine', desc: 'One-hot encoding, frequency encoding, StandardScaler, datetime decomposition, lag features for time-series.', color: '#38bdf8' },
  { step: '06', title: 'ExplanationEngine', desc: 'Generates human-readable AI decisions explaining what was found, what was changed, and why.', color: '#a78bfa' },
]

export function LabPage() {
  const [selected, setSelected] = useState(0)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/model-stats')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats) })
      .catch(() => {})
  }, [])

  const m = MODELS[selected]

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Intelligence Layer</p>
          <h1 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 'clamp(28px,4vw,48px)', color: '#f1f5f9', letterSpacing: '-0.03em', marginBottom: 12 }}>
            AI Lab — How It Works
          </h1>
          <p style={{ color: '#475569', fontFamily: 'DM Sans', fontSize: 16, maxWidth: 560 }}>
            Six engines, nine ML models, working as one unified system. Every decision explained.
          </p>
        </div>

        {/* Pipeline diagram */}
        <div style={{ marginBottom: 64 }}>
          <p className="section-label" style={{ marginBottom: 20 }}>Processing Pipeline</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            {PIPELINE.map((p, i) => (
              <div key={i} className="glass" style={{ padding: '20px 18px', borderTop: `3px solid ${p.color}`, position: 'relative' }}>
                <div style={{ fontSize: 36, fontFamily: 'Syne,system-ui', fontWeight: 800, color: 'rgba(148,163,184,0.06)', lineHeight: 1, marginBottom: 10 }}>{p.step}</div>
                <h3 style={{ fontFamily: 'Syne,system-ui', fontWeight: 700, fontSize: 13, color: p.color, marginBottom: 6 }}>{p.title}</h3>
                <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, fontFamily: 'DM Sans' }}>{p.desc}</p>
                {i < PIPELINE.length - 1 && (
                  <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#1e293b', zIndex: 10 }} className="hide-mobile">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Model explorer */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Left: model list */}
          <div className="glass" style={{ padding: 8 }}>
            {MODELS.map((model, i) => (
              <button key={i} onClick={() => setSelected(i)} style={{
                width: '100%', padding: '14px 16px', borderRadius: 10,
                background: selected === i ? `${model.color}12` : 'transparent',
                border: `1px solid ${selected === i ? model.color + '30' : 'transparent'}`,
                cursor: 'pointer', textAlign: 'left', marginBottom: 4, transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${model.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <model.icon size={15} color={model.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: selected === i ? '#e2e8f0' : '#64748b', fontFamily: 'DM Sans', margin: 0 }}>{model.name}</p>
                    <p style={{ fontSize: 10, color: selected === i ? model.color : '#334155', fontFamily: 'JetBrains Mono,monospace', margin: '2px 0 0' }}>{model.score.split('·')[0].trim()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: model detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass" style={{ padding: 32, borderTop: `3px solid ${m.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <m.icon size={24} color={m.color} />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 22, color: '#f1f5f9', margin: 0 }}>{m.name}</h2>
                  <p style={{ fontSize: 12, color: m.color, fontFamily: 'JetBrains Mono,monospace', margin: '4px 0 0' }}>{m.score}</p>
                </div>
              </div>

              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, fontFamily: 'DM Sans', marginBottom: 24 }}>{m.desc}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Algorithm', value: m.algo },
                  { label: 'Training Data', value: m.dataset },
                  { label: 'Performance', value: m.score },
                  { label: 'Status', value: 'Active — loaded at startup' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.06)' }}>
                    <p style={{ fontSize: 10, color: '#334155', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', fontFamily: label === 'Algorithm' ? 'JetBrains Mono,monospace' : 'DM Sans', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {m.classes && (
                <div>
                  <p style={{ fontSize: 10, color: '#334155', fontFamily: 'DM Sans', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Output Classes</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {m.classes.map(c => (
                      <span key={c} style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', padding: '3px 10px', borderRadius: 6, background: `${m.color}10`, color: m.color, border: `1px solid ${m.color}25` }}>
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Retrain instruction */}
            <div className="glass" style={{ padding: 20 }}>
              <p className="section-label" style={{ marginBottom: 8 }}>Retrain Models</p>
              <p style={{ fontSize: 12, color: '#475569', fontFamily: 'DM Sans', marginBottom: 12 }}>
                All 6 models trained on real datasets. Retrain anytime:
              </p>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#0d1117', border: '1px solid rgba(99,102,241,0.2)' }}>
                <code style={{ fontSize: 12, color: '#a5f3fc', fontFamily: 'JetBrains Mono,monospace' }}>cd ml && python train_all_models.py</code>
              </div>
              <p style={{ fontSize: 11, color: '#334155', fontFamily: 'DM Sans', marginTop: 8 }}>~2 minutes on CPU. Saves to ml/saved_models/ and backend/models/</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
