import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { IntroScreen, useIntro } from './components/IntroScreen.jsx'
import { Navbar } from './components/Navbar.jsx'
import { AuthPage } from './components/AuthPage.jsx'
import { Chatbot } from './components/Chatbot.jsx'
import { LandingPage } from './pages/Landing.jsx'
import { ProcessPage } from './pages/Process.jsx'
import { ExplorePage } from './pages/Explore.jsx'
import { LabPage } from './pages/Lab.jsx'
import { ProfilePage } from './pages/Profile.jsx'

function AppShell() {
  const { user, loading } = useAuth()
  const { show: showIntro, done: introDone } = useIntro()
  const [page, setPage] = useState('home')

  const goTo = (p) => { setPage(p); window.scrollTo({top:0,behavior:'smooth'}) }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#04070f'}}>
      <div style={{width:32,height:32,border:'2px solid rgba(99,102,241,0.2)',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#04070f'}}>
      {showIntro && <IntroScreen onDone={introDone}/>}
      <Navbar page={page} setPage={goTo}/>
      {page==='home'    && <LandingPage setPage={goTo}/>}
      {page==='auth'    && !user && <AuthPage/>}
      {page==='auth'    && user  && (() => { goTo('process'); return null })()}
      {page==='process' && <ProcessPage/>}
      {page==='explore' && <ExplorePage/>}
      {page==='lab'     && <LabPage/>}
      {page==='profile' && <ProfilePage setPage={goTo}/>}
      <Chatbot/>
    </div>
  )
}

export default function App() {
  return <AuthProvider><AppShell/></AuthProvider>
}
