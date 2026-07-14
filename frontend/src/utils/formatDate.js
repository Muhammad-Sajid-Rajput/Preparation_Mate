export const formatRelativeTime = (iso) => {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1)  return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  })
}

export const formatDate = (iso) => {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

export const formatShortDate = (iso) => {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  })
}

export const formatTime = (iso) => {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  })
}

export const daysFromNow = (iso) => {
  const diff = new Date(iso) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
