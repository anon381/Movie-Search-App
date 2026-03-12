import { useMemo, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { evaluatePassword, isAcceptable } from '../utils/passwordStrength'

export default function SignUpPage() {
  const { signUpPassword, signInPassword, pwSending, authError } = useAuth()
  const [pwMode, setPwMode] = useState('signup') // 'signup' | 'signin'
  const [pwEmail, setPwEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [infoMsg, setInfoMsg] = useState('')

  const pwStrength = useMemo(()=>evaluatePassword(pw), [pw])
  const pwMismatch = pwMode==='signup' && pwConfirm && pw !== pwConfirm
  const signupDisabled = pwMode==='signup' && (!isAcceptable(pwStrength.score) || pwMismatch)
  const locked = Date.now() < lockedUntil

  const submitPassword = async (e) => {
    e.preventDefault()
    if (!pwEmail || !pw) return
    if (locked) return
    if (pwMode === 'signup') {
      const res = await signUpPassword(pwEmail, pw)
      if (res && res.existing) {
        setPwMode('signin')
        setInfoMsg('Email already registered. Please sign in below.')
      } else if (res && !res.ok) {
        setFailCount(c=>c+1)
      } else if (res && res.ok) {
        setPwMode('signin')
        setPw('')
        setPwConfirm('')
        setInfoMsg('Account created. Please sign in.')
        setFailCount(0)
      }
    } else {
      const res = await signInPassword(pwEmail, pw)
      setFailCount(c=> {
        const next = c + 1
        if (next >= 5) setLockedUntil(Date.now()+60_000)
        return next
      })
      if (res?.ok) {
        setInfoMsg('Signed in. Redirecting...')
        setFailCount(0)
      }
    }
  }

  return (
    <div style={{maxWidth:420, margin:'3rem auto', padding:'2rem', background:'#1d1f22', border:'1px solid #2c3136', borderRadius:16, fontFamily:'system-ui', color:'#eee'}}>
  <h1 style={{marginTop:0,fontSize:'1.4rem'}}>Account Access</h1>
  <p style={{fontSize:'.8rem', lineHeight:1.4, opacity:.8}}>Create an account or sign in with your email and password. Accounts, favorites, and history are stored locally in this browser.</p>

      <div style={{display:'flex', gap:'.5rem', marginTop:'1rem'}}>
        <button onClick={()=>setPwMode('signup')} className="pill-btn" style={{background: pwMode==='signup'?'#2563eb':'#1d1f22'}}>Password Sign Up</button>
        <button onClick={()=>setPwMode('signin')} className="pill-btn" style={{background: pwMode==='signin'?'#2563eb':'#1d1f22'}}>Password Sign In</button>
      </div>

      {/* Password form */}
      <form onSubmit={submitPassword} style={{display:'flex', flexDirection:'column', gap:'.75rem', marginTop:'1rem'}}>
        <label style={{display:'flex', flexDirection:'column', gap:'.35rem', fontSize:'.7rem'}}>
          Email
          <input type="email" value={pwEmail} onChange={e=>setPwEmail(e.target.value)} placeholder="you@example.com" required style={{padding:'.6rem .75rem', borderRadius:8, border:'1px solid #2c3136', background:'#111317', color:'inherit'}} />
        </label>
        <label style={{display:'flex', flexDirection:'column', gap:'.35rem', fontSize:'.7rem'}}>
          Password
          <div style={{display:'flex', position:'relative'}}>
            <input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} minLength={6} required placeholder="••••••" style={{flex:1,padding:'.6rem .75rem', borderRadius:8, border:'1px solid #2c3136', background:'#111317', color:'inherit'}} />
            <button type="button" onClick={()=>setShowPw(s=>!s)} style={{position:'absolute', right:6, top:6, fontSize:'.55rem', background:'transparent', color:'#999', border:'none', cursor:'pointer'}}>{showPw?'Hide':'Show'}</button>
          </div>
        </label>
        {pwMode==='signup' && (
          <label style={{display:'flex', flexDirection:'column', gap:'.35rem', fontSize:'.7rem'}}>
            Confirm Password
            <input type={showPw?'text':'password'} value={pwConfirm} onChange={e=>setPwConfirm(e.target.value)} required placeholder="Repeat password" style={{padding:'.6rem .75rem', borderRadius:8, border:'1px solid #2c3136', background:'#111317', color:'inherit'}} />
          </label>
        )}
        <div aria-live="polite" style={{display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.55rem', marginTop:'-.25rem'}}>
          <div style={{flex:1, height:6, background:'#222', borderRadius:4, overflow:'hidden', display:'flex'}}>
            {Array.from({length:5}).map((_,i)=>(
              <span key={i} style={{flex:1, margin:'0 1px', background: i < pwStrength.score ? pwStrength.color : '#2c3136'}} />
            ))}
          </div>
          <span style={{color: pwStrength.color}}>{pwStrength.label}</span>
        </div>
        {pwMismatch && <div style={{fontSize:'.55rem', color:'#f87171'}}>Passwords do not match.</div>}
        {pwMode==='signup' && !pwMismatch && !signupDisabled && <div style={{fontSize:'.55rem', color:'#10b981'}}>Looks good.</div>}
        {pwMode==='signup' && !pwMismatch && signupDisabled && <div style={{fontSize:'.55rem', color:'#f59e0b'}}>Use 8+ chars mixing upper, lower, number, symbol for Fair+.</div>}
        <button disabled={pwSending || (pwMode==='signup' && signupDisabled) || locked} style={{padding:'.65rem 1rem', background: locked ? '#555' : '#10b981', border:'none', borderRadius:8, color:'#fff', fontWeight:600, cursor: locked ? 'not-allowed':'pointer'}}>{locked ? 'Locked' : pwSending ? (pwMode==='signup'?'Creating...':'Signing...') : pwMode==='signup' ? 'Create Account' : 'Sign In'}</button>
      </form>

      <div id="pw-status-msg" tabIndex={-1} style={{marginTop:'.9rem', fontSize:'.65rem'}}>
        {locked && <span style={{color:'#f59e0b'}}>Too many attempts. Try again in {Math.ceil((lockedUntil-Date.now())/1000)}s.</span>}
        {!locked && authError && <span style={{color:'#f55'}}>{authError}</span>}
        {!locked && !authError && infoMsg && <span style={{color:'#4ade80'}}>{infoMsg}</span>}
        {!locked && !authError && !infoMsg && pwMode==='signin' && failCount > 0 && <span style={{opacity:.6}}>Failed attempts: {failCount} / 5</span>}
        {!locked && !authError && !infoMsg && pwMode==='signin' && <span style={{color:'#4ade80', opacity:.8}}>Sign in to continue.</span>}
        {!locked && !authError && !infoMsg && pwMode==='signup' && <span style={{opacity:.5}}>Create a new account.</span>}
      </div>
  <div style={{marginTop:'2rem', fontSize:'.6rem', opacity:.55}}>This is browser-local auth. Clearing site data removes the stored account, favorites, and search history for this browser profile.</div>
    </div>
  )
}
