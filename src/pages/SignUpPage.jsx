import { useState, useMemo, useEffect } from 'react'
import useSupabaseAuth from '../hooks/useSupabaseAuth'
import { evaluatePassword, isAcceptable } from '../utils/passwordStrength'

export default function SignUpPage() {
  const { signUpPassword, signInPassword, pwSending, authError, lastSignInInfo, resetPassword, resendConfirmation } = useSupabaseAuth()
  const [pwMode, setPwMode] = useState('signup') // 'signup' | 'signin'
  const [pwEmail, setPwEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [confirmPendingEmail, setConfirmPendingEmail] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  const pwStrength = useMemo(()=>evaluatePassword(pw), [pw])
  const pwMismatch = pwMode==='signup' && pwConfirm && pw !== pwConfirm
  const signupDisabled = pwMode==='signup' && (!isAcceptable(pwStrength.score) || pwMismatch)
  const locked = Date.now() < lockedUntil
  // Reset info message when mode changes
  useEffect(()=> { setInfoMsg('') }, [pwMode])

  // (Delayed auto-switch removed; we now switch immediately when confirmation required.)

  const submitPassword = async (e) => {
    e.preventDefault()
    if (!pwEmail || !pw) return
    if (locked) return
    if (pwMode === 'signup') {
      // If we already sent confirmation for this email, avoid re-triggering and instruct user
      if (confirmPendingEmail && confirmPendingEmail === pwEmail) {
        setInfoMsg('Confirmation already sent. Check your email, then sign in below once verified.')
        setTimeout(()=>{ document.getElementById('pw-status-msg')?.focus() }, 40)
        return
      }
      const res = await signUpPassword(pwEmail, pw)
      if (res && res.existing) {
        setPwMode('signin')
        setInfoMsg('Email already registered. Please sign in below.')
        setTimeout(()=>{ document.getElementById('pw-status-msg')?.focus() }, 40)
      } else if (res && res.requiresConfirmation) {
        setConfirmPendingEmail(pwEmail)
        setPwMode('signin')
        setInfoMsg('Confirmation email sent. After verifying, sign in below.')
        setTimeout(()=>{ document.getElementById('pw-status-msg')?.focus() }, 40)
      } else if (res && !res.ok) {
        setFailCount(c=>c+1)
      } else if (res && res.ok) {
        setFailCount(0)
      }
    } else {
      await signInPassword(pwEmail, pw)
      setFailCount(c=> {
        const next = c + 1
        if (next >= 5) setLockedUntil(Date.now()+60_000)
        return next
      })
      // On success (session will mount), reset after short delay
      setTimeout(()=> setFailCount(0), 1500)
    }
  }
  const submitReset = async (e) => {
    e.preventDefault()
    if (!resetEmail) return
    await resetPassword(resetEmail)
    setResetSent(true)
  }

  return (
    <div style={{maxWidth:420, margin:'3rem auto', padding:'2rem', background:'#1d1f22', border:'1px solid #2c3136', borderRadius:16, fontFamily:'system-ui', color:'#eee'}}>
  <h1 style={{marginTop:0,fontSize:'1.4rem'}}>Account Access</h1>
  <p style={{fontSize:'.8rem', lineHeight:1.4, opacity:.8}}>Create an account or sign in with your email & password. Favorites & history sync automatically.</p>

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

      {/* Password reset */}
      <form onSubmit={submitReset} style={{display:'flex', flexDirection:'column', gap:'.5rem', marginTop:'2rem'}}>
        <div style={{display:'flex', gap:'.5rem', alignItems:'center'}}>
          <input type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} placeholder="Email to reset password" style={{flex:1,padding:'.5rem .6rem', borderRadius:8, border:'1px solid #2c3136', background:'#111317', color:'inherit', fontSize:'.65rem'}} />
          <button disabled={pwSending} style={{padding:'.5rem .8rem', background:'#4f46e5', border:'none', borderRadius:8, color:'#fff', fontSize:'.6rem', cursor:'pointer'}}>Reset</button>
        </div>
        {resetSent && <div style={{fontSize:'.6rem', color:'#4ade80'}}>If the email exists, a reset link was sent.</div>}
      </form>

      <div id="pw-status-msg" tabIndex={-1} style={{marginTop:'.9rem', fontSize:'.65rem'}}>
        {locked && <span style={{color:'#f59e0b'}}>Too many attempts. Try again in {Math.ceil((lockedUntil-Date.now())/1000)}s.</span>}
        {!locked && authError && <span style={{color:'#f55'}}>{authError}</span>}
        {!locked && !authError && infoMsg && <span style={{color:'#4ade80'}}>{infoMsg} {confirmPendingEmail && infoMsg.toLowerCase().includes('confirmation') && (
          <button type="button" onClick={()=>resendConfirmation(confirmPendingEmail)} disabled={pwSending} style={{marginLeft:6, fontSize:'.55rem', background:'#2563eb', border:'none', color:'#fff', padding:'.25rem .4rem', borderRadius:4, cursor:'pointer'}}>Resend</button>
        )}</span>}
        {!locked && !authError && !infoMsg && pwMode==='signin' && <span style={{color:'#4ade80', opacity:.8}}>Sign in to continue.</span>}
        {!locked && !authError && !infoMsg && pwMode==='signup' && <span style={{opacity:.5}}>Create a new account.</span>}
      </div>
  <div style={{marginTop:'2rem', fontSize:'.6rem', opacity:.55}}>After sign-in your favorites & history sync automatically. After confirming via email, return here to sign in.</div>
  {lastSignInInfo && (
        <details style={{marginTop:'1.5rem'}}>
          <summary style={{cursor:'pointer', fontSize:'.65rem'}}>Diagnostics</summary>
          <pre style={{fontSize:'.55rem', whiteSpace:'pre-wrap', background:'#111317', padding:'.75rem', borderRadius:8, marginTop:'.5rem'}}>{JSON.stringify(lastSignInInfo, null, 2)}</pre>
          <ul style={{fontSize:'.55rem', lineHeight:1.4, opacity:.8, paddingLeft:'1rem'}}>
            <li>Ensure Email auth is enabled in Supabase Dashboard (Authentication &gt; Providers &gt; Email).</li>
            <li>Check Auth SMTP settings (uses built-in by default; custom SMTP requires correct credentials).</li>
            <li>Verify redirect URL domain is allowed (Authentication &gt; URL Configuration).</li>
            <li>Look in Project Logs &gt; Auth for delivery attempts/errors.</li>
            <li>Try a different email provider if emails (confirmation/reset) are missing.</li>
          </ul>
        </details>
      )}
    </div>
  )
}
