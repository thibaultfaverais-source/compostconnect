const EVENT_TYPE_LABELS = {
  cafe_compost: 'Café compost', visite: 'Visite de suivi',
  transfert: 'Transfert de bac', formation: 'Formation',
  inauguration: 'Inauguration', autre: 'Événement',
}

function pad(n) { return String(n).padStart(2, '0') }

function toICSDate(dateStr) {
  return dateStr.replace(/-/g, '')
}

function escapeICS(str) {
  return (str || '').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export function generateICS(events, sites) {
  const today = new Date()
  const stamp = `${today.getFullYear()}${pad(today.getMonth()+1)}${pad(today.getDate())}T${pad(today.getHours())}${pad(today.getMinutes())}${pad(today.getSeconds())}Z`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CompostConnect//SMIEEOM Val de Cher//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CompostConnect - Événements',
    'X-WR-TIMEZONE:Europe/Paris',
  ]

  const upcoming = events.filter(e => e.date >= new Date().toISOString().split('T')[0])

  upcoming.forEach(ev => {
    const site = sites.find(s => s.id === ev.siteId)
    const typeLabel = EVENT_TYPE_LABELS[ev.type] || 'Événement'
    const siteName = site ? site.name : 'Tous les sites'
    const summary = `${typeLabel} — ${siteName}`
    const dateStr = toICSDate(ev.date)

    // Next day for DTEND (all-day events)
    const nextDay = new Date(ev.date + 'T12:00:00')
    nextDay.setDate(nextDay.getDate() + 1)
    const endStr = `${nextDay.getFullYear()}${pad(nextDay.getMonth()+1)}${pad(nextDay.getDate())}`

    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@compostconnect`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${endStr}`,
      `SUMMARY:${escapeICS(ev.title || summary)}`,
      `DESCRIPTION:${escapeICS([typeLabel, siteName, ev.description].filter(Boolean).join(' | '))}`,
      `CATEGORIES:${escapeICS(typeLabel)}`,
      `LOCATION:${escapeICS(site?.address || '')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    )
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadICS(events, sites, filename = 'compostconnect-evenements.ics') {
  const content = generateICS(events, sites)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ICalButton({ events, sites, small = false }) {
  const upcoming = events.filter(e => e.date >= new Date().toISOString().split('T')[0])
  if (!upcoming.length) return null
  return (
    <button
      onClick={() => downloadICS(events, sites)}
      title={`Exporter ${upcoming.length} événement${upcoming.length > 1 ? 's' : ''} vers votre calendrier`}
      style={{
        background: '#5C2D7A', color: '#fff', border: 'none',
        borderRadius: small ? 8 : 10,
        padding: small ? '8px 12px' : '10px 18px',
        cursor: 'pointer', fontSize: small ? 12 : 13, fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      📆 Calendrier ({upcoming.length})
    </button>
  )
}
