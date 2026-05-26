export function formatCapturedAt(iso: string): string {
  const date = new Date(iso)
  const sameYear = date.getFullYear() === new Date().getFullYear()

  const datePart = date.toLocaleDateString('sv-SE', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })

  const timePart = date.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${datePart} · ${timePart}`
}

export function getCapturedAtSearchText(iso: string): string {
  const date = new Date(iso)

  return [
    date.toISOString().slice(0, 10),
    date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }),
    date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }),
    date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' }),
    date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }),
    String(date.getFullYear()),
  ]
    .join(' ')
    .toLowerCase()
}
