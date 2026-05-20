import { useState } from 'react'
import { Database, Menu, X, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const NAV = [
  { id: 'home',    label: 'Home' },
  { id: 'process', label: 'Process' },
  { id: 'explore', label: 'Explore' },
  { id: 'lab',     label: 'AI Lab' },
  { id: 'profile', label: 'Dashboard' },
]

export function Navbar({ page, setPage }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  const go = (id) => { setPage(id); setOpen(false) }

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 60,
        background: 'rgba(2,4,10,0.8)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(148,163,184,0.06)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo */}
          <button onClick={() => go('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
              <Database size={15} color="white" />
            </div>
            <span style={{ fontFamily: 'Syne,system-ui', fontWeight: 800, fontSize: 17, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              DataForge<span style={{ color: '#818cf8' }}> AI</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }} className="hide-mobile">
            {NAV.map(n => (
              <button key={n.id} onClick={() => go(n.id)} style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, fontFamily: 'DM Sans,system-ui',
                transition: 'all 0.15s',
                background: page === n.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: page === n.id ? '#818cf8' : '#475569',
              }}>{n.label}</button>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user ? (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setUserMenu(o => !o)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px 6px 8px', borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.1)',
                  background: 'rgba(30,41,59,0.6)',
                  cursor: 'pointer',
                }}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={12} color="#818cf8" /></div>
                  }
                  <span className="hide-mobile" style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'DM Sans' }}>
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown size={12} color="#475569" />
                </button>
                {userMenu && (
                  <div style={{ position: 'absolute', top: '110%', right: 0, width: 180, background: '#0f172a', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 300 }}>
                    <button onClick={() => { go('profile'); setUserMenu(false) }} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, fontFamily: 'DM Sans', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <User size={13} /> Dashboard
                    </button>
                    <button onClick={() => { logout(); setUserMenu(false) }} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#f43f5e', fontSize: 13, fontFamily: 'DM Sans', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => go('auth')} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
                Sign In
              </button>
            )}
            <button className="hide-desktop" onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="hide-desktop" style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 190, background: '#020408', borderBottom: '1px solid rgba(148,163,184,0.06)', padding: '8px 0 16px' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => go(n.id)} style={{ display: 'block', width: '100%', padding: '14px 24px', background: page === n.id ? 'rgba(99,102,241,0.08)' : 'none', border: 'none', color: page === n.id ? '#818cf8' : '#64748b', fontSize: 15, fontFamily: 'DM Sans', cursor: 'pointer', textAlign: 'left' }}>
              {n.label}
            </button>
          ))}
          {!user && <button onClick={() => go('auth')} style={{ display: 'block', width: 'calc(100% - 48px)', margin: '8px 24px 0', padding: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans', cursor: 'pointer' }}>Sign In</button>}
        </div>
      )}

      {/* Click outside to close */}
      {(open || userMenu) && <div onClick={() => { setOpen(false); setUserMenu(false) }} style={{ position: 'fixed', inset: 0, zIndex: 180 }} />}
    </>
  )
}
