import { useRef } from 'react'

export default function SearchBar({ value, onChange, disabled }) {
  const inputRef = useRef(null)
  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        type="text"
        placeholder={disabled ? 'API key required' : 'Search movies...'}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search movies"
      />
      {value && (
        <button
          className="clear-btn"
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  )
}
