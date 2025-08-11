import { useState } from 'react'
import useSupabaseAuth from '../hooks/useSupabaseAuth'

export default function SignUpPage() {
  const { signIn, sending, authError } = useSupabaseAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email) return
    await signIn(email)
    setSent(true)
  }

  return (
    <div style={{maxWidth:420, margin:'3rem auto', padding:'2rem', background:'#1d1f22', border:'1px solid #2c3136', borderRadius:16, fontFamily:'system-ui', color:'#eee'}}>
      <h1 style={{marginTop:0,fontSize:'1.4rem'}}>Create / Access Your Account</h1>
      <p style={{fontSize:'.8rem', lineHeight:1.4, opacity:.8}}>Enter your email. We'll send a magic link for verification. After clicking the link you'll be redirected and your favorites will sync in the cloud.</p>
      <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:'.75rem', marginTop:'1rem'}}>
        <label style={{display:'flex', flexDirection:'column', gap:'.35rem', fontSize:'.7rem', letterSpacing:'.05em', textTransform:'uppercase'}}>
          Email
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" style={{padding:'.6rem .75rem', borderRadius:8, border:'1px solid #2c3136', background:'#111317', color:'inherit'}} />
        </label>
        <button disabled={sending} style={{padding:'.7rem 1rem', background:'#2563eb', border:'none', borderRadius:8, color:'#fff', fontWeight:600, cursor:'pointer'}}>{sending ? 'Sending...' : 'Send Magic Link'}</button>
      </form>
      {authError && <div style={{marginTop:'.75rem', color:'#f55', fontSize:'.7rem'}}>{authError}</div>}
      {sent && !authError && <div style={{marginTop:'.75rem', color:'#4ade80', fontSize:'.7rem'}}>Check your email for the magic link.</div>}
      <div style={{marginTop:'2.5rem', fontSize:'.65rem', opacity:.55}}>Already have a link open? Just return here after it authenticates.</div>
    </div>
  )
}
