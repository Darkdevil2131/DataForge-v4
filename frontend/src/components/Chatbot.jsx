import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, ExternalLink, Sparkles } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

async function sendMessage(message) {
  const form = new FormData()
  form.append('message', message)
  const r = await fetch(`${API}/api/chat`, { method: 'POST', body: form })
  const d = await r.json()
  return d.response
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '12px 16px', alignItems: 'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569', animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const response = msg.response

  const renderText = (text) => {
    if (!text) return null
    return text
      .split('\n')
      .map((line, i) => {
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#818cf8;text-decoration:underline">$1</a>')
        return <p key={i} style={{ margin: '2px 0', lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: formatted }} />
      })
  }

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14, animation: 'fadeSlideUp 0.3s ease' }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 4 }}>
          <Sparkles size={13} color="white" />
        </div>
      )}
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          padding: '10px 14px', borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
          background: isUser
            ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
            : 'rgba(30,41,59,0.8)',
          border: isUser ? 'none' : '1px solid rgba(148,163,184,0.08)',
          fontSize: 13, color: isUser ? '#fff' : '#94a3b8', fontFamily: 'DM Sans',
        }}>
          {isUser ? <p style={{ margin: 0 }}>{msg.text}</p> : renderText(response?.text || msg.text)}
        </div>

        {/* Dataset cards from response */}
        {response?.datasets?.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {response.datasets.slice(0, 3).map((ds, i) => (
              <a key={i} href={ds.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc', fontFamily: 'DM Sans', margin: '0 0 2px' }}>{ds.name}</p>
                  <p style={{ fontSize: 10, color: '#334155', fontFamily: 'DM Sans', margin: 0 }}>{ds.source || 'Kaggle'} · {ds.difficulty || 'intermediate'}</p>
                </div>
                <ExternalLink size={11} color="#6366f1" />
              </a>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {response?.suggestions?.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {response.suggestions.map((s, i) => (
              <button key={i} onClick={() => {}}
                style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', cursor: 'pointer', fontFamily: 'DM Sans' }}
                data-suggestion={s}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const INITIAL_MESSAGE = {
  role: 'assistant',
  response: {
    text: "👋 Hi! I'm **DataForge Assistant**.\n\nI can help you:\n• **Find datasets** from Kaggle & HuggingFace\n• **Model advice** for your ML task\n• **Cleaning tips** for messy data\n\nWhat are you working on?",
    datasets: [],
    suggestions: ["Find dataset for fraud detection", "Best models for classification", "How to handle missing values"],
    type: "greeting",
  }
}

export function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100) }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const response = await sendMessage(msg)
      setMessages(m => [...m, { role: 'assistant', response }])
      if (!open) setUnread(u => u + 1)
    } catch {
      setMessages(m => [...m, { role: 'assistant', response: { text: "Sorry, I couldn't connect to the backend. Make sure it's running.", datasets: [], suggestions: [], type: 'error' } }])
    }
    setLoading(false)
  }

  // Handle suggestion clicks via event delegation
  const handleChatClick = (e) => {
    const btn = e.target.closest('[data-suggestion]')
    if (btn) handleSend(btn.dataset.suggestion)
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 500,
        width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 24px rgba(99,102,241,0.5), 0 0 0 8px rgba(99,102,241,0.1)',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: open ? 'scale(0.9)' : 'scale(1)',
      }}>
        {open ? <X size={22} color="white" /> : <MessageCircle size={22} color="white" />}
        {unread > 0 && !open && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#f43f5e', fontSize: 10, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans' }}>
            {unread}
          </div>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 500,
          width: 'min(380px, calc(100vw - 32px))',
          height: 'min(560px, calc(100vh - 120px))',
          background: 'rgba(8,12,22,0.97)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1)',
          animation: 'chatOpen 0.3s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(148,163,184,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="white" />
            </div>
            <div>
              <p style={{ fontFamily: 'Syne,system-ui', fontWeight: 700, fontSize: 14, color: '#f1f5f9', margin: 0 }}>DataForge Assistant</p>
              <p style={{ fontSize: 10, color: '#10b981', fontFamily: 'DM Sans', margin: '2px 0 0' }}>● Online — finds datasets, gives ML advice</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#334155', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div onClick={handleChatClick} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={13} color="white" />
                </div>
                <div style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: '4px 16px 16px 16px' }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(148,163,184,0.07)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about datasets, models, cleaning…"
                style={{ flex: 1, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, padding: '10px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: 'DM Sans', outline: 'none', resize: 'none' }}
              />
              <button onClick={() => handleSend()} disabled={!input.trim() || loading} style={{ width: 40, height: 40, borderRadius: 12, background: input.trim() && !loading ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(30,41,59,0.8)', border: `1px solid ${input.trim() && !loading ? 'transparent' : 'rgba(148,163,184,0.1)'}`, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {loading ? <Loader2 size={16} color="#475569" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} color={input.trim() ? 'white' : '#334155'} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatOpen { from { opacity:0; transform:scale(0.9) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </>
  )
}
