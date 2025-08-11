// Simple password strength scoring
// Returns { score: 0-5, label, color }
export function evaluatePassword(pw) {
  if (!pw) return { score: 0, label: 'Empty', color: '#555' }
  let score = 0
  const length = pw.length
  if (length >= 12) score += 2
  else if (length >= 8) score += 1
  if (/[a-z]/.test(pw)) score += 1
  if (/[A-Z]/.test(pw)) score += 1
  if (/\d/.test(pw)) score += 1
  if (/[^A-Za-z0-9]/.test(pw)) score += 1
  if (score > 5) score = 5
  let label, color
  switch (true) {
    case score <= 1: label = 'Very Weak'; color = '#ef4444'; break
    case score === 2: label = 'Weak'; color = '#f97316'; break
    case score === 3: label = 'Fair'; color = '#facc15'; break
    case score === 4: label = 'Good'; color = '#10b981'; break
    default: label = 'Strong'; color = '#059669'; break
  }
  return { score, label, color }
}

export function isAcceptable(score) {
  return score >= 3 // require Fair or better
}
