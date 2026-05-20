import { useAuth } from '../context/AuthContext.jsx'
import { User, LogOut, Database, Clock, Download, Star, ChevronRight } from 'lucide-react'

export function ProfilePage({ setPage }) {
  const { user, logout } = useAuth()

  if (!user) {
    return (
      <div style={{ paddingTop: 80, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <User size={36} color="#334155" />
          </div>
          <h2 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 24, color: '#f1f5f9', marginBottom: 8 }}>Not signed in</h2>
          <p style={{ color: '#475569', fontFamily: 'DM Sans', marginBottom: 28 }}>Sign in to access your dashboard</p>
          <button onClick={() => setPage('auth')} className="btn-primary" style={{ padding: '12px 28px' }}>
            Sign In <ChevronRight size={15} />
          </button>
        </div>
      </div>
    )
  }

  const quickActions = [
    { icon: Database, label: 'Process Dataset', desc: 'Upload and clean a new file', action: () => setPage('process'), color: '#818cf8' },
    { icon: Star, label: 'Explore Datasets', desc: 'Browse 12+ curated datasets', action: () => setPage('explore'), color: '#34d399' },
    { icon: Download, label: 'AI Lab', desc: 'See how the models work', action: () => setPage('lab'), color: '#fbbf24' },
  ]

  const capabilities = [
    { label: 'Intent Classification', value: '92.9% Accuracy', note: '8 ML task types' },
    { label: 'Fraud Detection', value: 'AUC 1.00', note: 'GradientBoosting + SMOTE' },
    { label: 'Anomaly Detection', value: 'AUC 1.00', note: 'IsolationForest + LOF' },
    { label: 'Cancer Classification', value: 'AUC 0.997', note: 'RF + SVM Ensemble' },
    { label: 'Price Prediction', value: 'R² 0.92', note: 'GradientBoosting' },
    { label: 'Churn Prediction', value: '71.7% Acc', note: 'RandomForest + SMOTE' },
  ]

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>

        {/* Profile header */}
        <div className="glass" style={{ padding: '32px 36px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, borderTop: '3px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.3)' }} />
              : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={32} color="white" />
                </div>
            }
            <div>
              <h1 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 28, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                {user.displayName || user.email?.split('@')[0] || 'DataForge User'}
              </h1>
              <p style={{ color: '#475569', fontFamily: 'DM Sans', fontSize: 14, margin: 0 }}>{user.email}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span className="badge-indigo" style={{ fontSize: 10 }}>✓ Authenticated</span>
                <span className="badge-green" style={{ fontSize: 10 }}>Free Plan</span>
              </div>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary" style={{ fontSize: 13 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>

          {/* Quick actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="section-label">Quick Actions</p>
            {quickActions.map((a, i) => (
              <button key={i} onClick={a.action} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 14, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.07)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,0.8)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,23,42,0.6)'}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${a.color}15`, border: `1px solid ${a.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <a.icon size={20} color={a.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Syne,system-ui', fontWeight: 700, fontSize: 14, color: '#e2e8f0', margin: '0 0 2px' }}>{a.label}</p>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#475569', margin: 0 }}>{a.desc}</p>
                </div>
                <ChevronRight size={16} color="#334155" />
              </button>
            ))}
          </div>

          {/* System capabilities */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="section-label">AI System Capabilities</p>
            <div className="glass" style={{ padding: 20 }}>
              {capabilities.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < capabilities.length - 1 ? '1px solid rgba(148,163,184,0.06)' : 'none' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', fontFamily: 'DM Sans', margin: '0 0 2px' }}>{c.label}</p>
                    <p style={{ fontSize: 10, color: '#334155', fontFamily: 'DM Sans', margin: 0 }}>{c.note}</p>
                  </div>
                  <span className="badge-green" style={{ fontSize: 10 }}>{c.value}</span>
                </div>
              ))}
            </div>

            {/* What you can do */}
            <div className="glass" style={{ padding: 20 }}>
              <p className="section-label" style={{ marginBottom: 12 }}>What You Can Process</p>
              {[
                'CSV, Excel (.xlsx), JSON, Parquet',
                'Up to 100,000 rows per file',
                'Mixed data types (numeric, text, dates)',
                'Messy data with nulls, duplicates, errors',
                'Any ML/DL task type',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#10b981', fontSize: 12 }}>✓</span>
                  <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'DM Sans' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
