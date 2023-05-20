import { useRef, useState, useEffect } from 'react'

export default function SearchBar({ value, onChange, disabled, suggestions = [], onSuggestion }) {
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const suppressNextOpen = useRef(false)
  const filtered = value ? suggestions.filter(s => s.toLowerCase().startsWith(value.toLowerCase())).slice(0,6) : suggestions.slice(0,6)
  useEffect(()=> {
    if (suppressNextOpen.current) {
      suppressNextOpen.current = false
      return
    }
    if (!value) setOpen(false)
    else if (filtered.length) setOpen(true)
  }, [value, filtered.length])
  return (
    <div className="search-bar">
      <input
        className="search-input"
        ref={inputRef}
        type="text"
        placeholder={disabled ? 'API key required' : 'Search movies...'}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search movies"
        onFocus={()=>{ if (filtered.length) setOpen(true) }}
        onBlur={()=> setTimeout(()=> setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setOpen(false)
          }
        }}
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
        <ul className="search-suggestions">
          {filtered.map(s => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e)=> e.preventDefault()}
                onClick={()=>{
                  suppressNextOpen.current = true
                  onSuggestion?.(s)
                  onChange(s)
                  setOpen(false)
                  inputRef.current?.focus()
                }}
                onTouchStart={()=>{
                  suppressNextOpen.current = true
                  onSuggestion?.(s)
                  onChange(s)
                  setOpen(false)
                }}
                className="search-suggestion-btn"
              >{s}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
 
// Nominal update 1684492024
 
// Nominal update 1684585364
