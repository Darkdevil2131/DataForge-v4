import { useState, useEffect } from 'react'
import { Search, Filter, ExternalLink, Database, Layers, Star, ChevronDown } from 'lucide-react'
import { useRecommend } from '../hooks/useDataForge.js'
import { RecommendPanel } from '../components/UploadPanel.jsx'

const DOMAINS = ['All', 'Finance', 'Medical', 'NLP', 'Ecommerce', 'Time Series', 'Classification', 'Regression']
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced']

const FEATURED = [
  { id:'cc_fraud', name:'Credit Card Fraud Detection', source:'Kaggle', url:'https://www.kaggle.com/mlg-ulb/creditcardfraud', description:'284K transactions with 0.17% fraud rate. Industry benchmark for imbalanced classification and anomaly detection.', tags:['fraud','finance','anomaly','imbalanced'], difficulty:'intermediate', rows:284807, features:31, task:'Classification', models:['XGBoost','IsolationForest','LightGBM'] },
  { id:'titanic', name:'Titanic Survival Prediction', source:'Kaggle', url:'https://www.kaggle.com/c/titanic', description:'Classic beginner dataset. Predict passenger survival with feature engineering on age, cabin, and family relationships.', tags:['classification','beginner','historical'], difficulty:'beginner', rows:891, features:12, task:'Classification', models:['RandomForest','LogisticRegression','XGBoost'] },
  { id:'house', name:'House Prices: Advanced Regression', source:'Kaggle', url:'https://www.kaggle.com/c/house-prices-advanced-regression-techniques', description:'79 features describing residential homes in Iowa. Master feature engineering and regression techniques.', tags:['regression','real estate','feature engineering'], difficulty:'intermediate', rows:1460, features:81, task:'Regression', models:['XGBoost','LightGBM','Ridge'] },
  { id:'churn', name:'Telco Customer Churn', source:'Kaggle', url:'https://www.kaggle.com/blastchar/telco-customer-churn', description:'Predict churn for 7K telecom customers. Real business use case with mixed categorical/numerical features.', tags:['classification','churn','business','telecom'], difficulty:'beginner', rows:7043, features:21, task:'Classification', models:['RandomForest','XGBoost','LogisticRegression'] },
  { id:'sales', name:'E-Commerce Sales Dataset', source:'Kaggle', url:'https://www.kaggle.com/carrie1/ecommerce-data', description:'541K online retail transactions from UK. Perfect for RFM analysis, sales forecasting, and customer segmentation.', tags:['ecommerce','time series','analytics','forecasting'], difficulty:'intermediate', rows:541909, features:8, task:'Forecasting / Analytics', models:['Prophet','ARIMA','XGBoost'] },
  { id:'heart', name:'Heart Disease UCI', source:'UCI', url:'https://archive.ics.uci.edu/ml/datasets/Heart+Disease', description:'303 patient records with 14 clinical features. Binary classification for heart disease presence. Sensitive domain.', tags:['medical','classification','clinical'], difficulty:'beginner', rows:303, features:14, task:'Classification', models:['SVM','RandomForest','LogisticRegression'] },
  { id:'mnist', name:'MNIST Handwritten Digits', source:'Kaggle', url:'https://www.kaggle.com/c/digit-recognizer', description:'70K images of handwritten digits. Classic deep learning benchmark. Use for CNN and image classification intro.', tags:['image','classification','deep learning','beginner'], difficulty:'beginner', rows:70000, features:784, task:'Classification', models:['CNN','RandomForest','SVM'] },
  { id:'nlp_tweets', name:'Twitter US Airline Sentiment', source:'Kaggle', url:'https://www.kaggle.com/crowdflower/twitter-airline-sentiment', description:'14K tweets classified as positive/negative/neutral. Great for NLP preprocessing and sentiment analysis.', tags:['nlp','sentiment','text','classification'], difficulty:'intermediate', rows:14640, features:15, task:'NLP / Sentiment', models:['BERT','TF-IDF+LR','LSTM'] },
  { id:'diabetes', name:'Pima Indians Diabetes', source:'UCI', url:'https://www.kaggle.com/uciml/pima-indians-diabetes-database', description:'768 female patients. Predict diabetes using 8 diagnostic measurements. Hidden missing values encoded as zeros.', tags:['medical','classification','beginner'], difficulty:'beginner', rows:768, features:9, task:'Classification', models:['LogisticRegression','RandomForest','XGBoost'] },
  { id:'stock', name:'S&P 500 Stock Prices', source:'Kaggle', url:'https://www.kaggle.com/camnugent/sandp500', description:'619K rows of historical stock data for 500 companies. For LSTM, ARIMA, and financial time-series prediction.', tags:['finance','time series','forecasting','stocks'], difficulty:'intermediate', rows:619040, features:7, task:'Forecasting', models:['LSTM','Prophet','ARIMA'] },
  { id:'movielens', name:'MovieLens 1M Dataset', source:'GroupLens', url:'https://grouplens.org/datasets/movielens/1m/', description:'1M movie ratings from 6K users on 4K movies. The standard collaborative filtering benchmark.', tags:['recommendation','movies','collaborative filtering'], difficulty:'intermediate', rows:1000209, features:4, task:'Recommendation', models:['SVD','ALS','NeuralCF'] },
  { id:'adult', name:'Adult Income (Census)', source:'UCI', url:'https://archive.ics.uci.edu/ml/datasets/adult', description:'48K census records. Predict if income > $50K. Classic fairness/bias benchmark with mixed feature types.', tags:['classification','economics','fairness','demographics'], difficulty:'beginner', rows:48842, features:15, task:'Classification', models:['GradientBoosting','RandomForest','LogisticRegression'] },
]

const DIFF_STYLE = {
  beginner:     { cls: 'badge-green',  label: 'Beginner' },
  intermediate: { cls: 'badge-amber',  label: 'Intermediate' },
  advanced:     { cls: 'badge-rose',   label: 'Advanced' },
}

function DatasetCard({ ds }) {
  const diff = DIFF_STYLE[ds.difficulty] || DIFF_STYLE.intermediate
  return (
    <div className="card-3d" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 22px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <h3 style={{ fontFamily: 'Syne,system-ui', fontWeight: 700, fontSize: 14, color: '#e2e8f0', lineHeight: 1.3, margin: 0 }}>{ds.name}</h3>
          <span className={diff.cls} style={{ fontSize: 9, whiteSpace: 'nowrap' }}>{diff.label}</span>
        </div>
        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.55, marginBottom: 14, fontFamily: 'DM Sans' }}>
          {ds.description.slice(0, 120)}{ds.description.length > 120 ? '…' : ''}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {ds.tags.slice(0, 4).map(t => <span key={t} className="badge-slate" style={{ fontSize: 9 }}>{t}</span>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Rows', value: Number(ds.rows).toLocaleString() },
            { label: 'Features', value: ds.features },
            { label: 'Task', value: ds.task.split(' / ')[0] },
          ].map(s => (
            <div key={s.label} style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(15,23,42,0.6)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', fontFamily: 'DM Sans' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#334155', fontFamily: 'DM Sans', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {ds.models.map(m => <span key={m} style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', padding: '2px 7px', borderRadius: 5, background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}>{m}</span>)}
        </div>
      </div>
      <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(148,163,184,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#334155', fontFamily: 'DM Sans' }}>{ds.source}</span>
        <a href={ds.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#818cf8', textDecoration: 'none', fontFamily: 'DM Sans', fontWeight: 500 }}>
          View <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}

export function ExplorePage() {
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState('All')
  const [diff, setDiff] = useState('All')
  const [tab, setTab] = useState('browse')
  const recommend = useRecommend()

  const filtered = FEATURED.filter(ds => {
    const matchSearch = !search || ds.name.toLowerCase().includes(search.toLowerCase()) || ds.tags.some(t => t.includes(search.toLowerCase()))
    const matchDiff = diff === 'All' || ds.difficulty === diff.toLowerCase()
    const matchDomain = domain === 'All' || ds.tags.some(t => t.toLowerCase().includes(domain.toLowerCase()))
    return matchSearch && matchDiff && matchDomain
  })

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 'clamp(24px,3vw,36px)', color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 8 }}>Explore Datasets</h1>
          <p style={{ color: '#475569', fontFamily: 'DM Sans', fontSize: 15 }}>Browse curated datasets or search Kaggle and HuggingFace for your exact task.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.8)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 28 }}>
          {[{ id:'browse', label:'Browse Curated' }, { id:'search', label:'AI Search' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans', fontWeight: 500, transition: 'all 0.15s', background: tab === t.id ? 'rgba(51,65,85,0.9)' : 'transparent', color: tab === t.id ? '#e2e8f0' : '#475569' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'browse' ? (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 280px' }}>
                <Search size={14} color="#334155" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search datasets…" className="input-base" style={{ paddingLeft: 38 }} />
              </div>
              <select value={domain} onChange={e => setDomain(e.target.value)} className="input-base" style={{ flex: '0 0 160px', cursor: 'pointer' }}>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={diff} onChange={e => setDiff(e.target.value)} className="input-base" style={{ flex: '0 0 160px', cursor: 'pointer' }}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <span style={{ fontSize: 12, color: '#334155', fontFamily: 'DM Sans', whiteSpace: 'nowrap' }}>{filtered.length} datasets</span>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {filtered.map(ds => <DatasetCard key={ds.id} ds={ds} />)}
            </div>
            {filtered.length === 0 && (
              <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
                <p style={{ color: '#334155', fontFamily: 'DM Sans', fontSize: 14 }}>No datasets match your filters. Try changing the search or filters.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#475569', fontFamily: 'DM Sans', marginBottom: 16 }}>
                Describe your ML goal in plain English. DataForge searches curated sources and Kaggle to find the best match.
              </p>
              <RecommendPanel onSearch={recommend.search} loading={recommend.loading} />
            </div>
            {recommend.error && <div className="glass" style={{ padding: 16, color: '#fb7185', fontSize: 13 }}>{recommend.error}</div>}
            {recommend.loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 16 }} />)}</div>}
            {recommend.result?.recommendations?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                {recommend.result.recommendations.map((ds, i) => <DatasetCard key={i} ds={{ ...ds, id: i, task: (ds.task_type || ['ML'])[0], models: ds.recommended_models || [] }} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
