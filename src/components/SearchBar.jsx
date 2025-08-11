import { useRef, useState, useEffect } from 'react'

export default function SearchBar({ value, onChange, disabled, suggestions = [], onSuggestion }) {
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const filtered = value ? suggestions.filter(s => s.toLowerCase().startsWith(value.toLowerCase())).slice(0,6) : suggestions.slice(0,6)
  useEffect(()=> { if (!value) setOpen(false); else if (filtered.length) setOpen(true) }, [value, filtered.length])
  return (
    <div className="search-bar" style={{position:'relative'}}>
      <input
        ref={inputRef}
        type="text"
        placeholder={disabled ? 'API key required' : 'Search movies...'}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search movies"
        onFocus={()=>{ if (filtered.length) setOpen(true) }}
        onBlur={()=> setTimeout(()=> setOpen(false), 120)}
      />
      {value && (
        <button
          className="clear-btn"
          onClick={() => {
            onChange('')
            setOpen(false)
            inputRef.current?.focus()
          }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul style={{position:'absolute', left:0, right:0, top:'100%', margin:0, padding:'.35rem 0', listStyle:'none', background:'#1d1f22', border:'1px solid #2c3136', borderRadius:8, zIndex:10, display:'flex', flexDirection:'column', gap:'.15rem', maxHeight:'14rem', overflowY:'auto'}}>
          {filtered.map(s => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e)=> e.preventDefault()}
                onClick={()=>{ onSuggestion?.(s); onChange(s); setOpen(false); inputRef.current?.focus() }}
                style={{width:'100%', textAlign:'left', background:'transparent', border:'none', padding:'.45rem .75rem', cursor:'pointer', fontSize:'.7rem', color:'inherit'}}
              >{s}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
