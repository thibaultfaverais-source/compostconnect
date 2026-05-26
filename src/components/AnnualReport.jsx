import { useState } from 'react'

const KG_PER_LITRE = 0.65

function getKg(entries) {
  return entries.filter(e => e.actionType === 'transfert').reduce((s, e) => s + (Number(e.volumeL) || 0) * KG_PER_LITRE, 0)
}
function getLVal(entries) {
  return entries.filter(e => e.actionType === 'recolte').reduce((s, e) => s + (Number(e.volumeL) || 0), 0)
}

function getYearEntries(entries, year) {
  return entries.filter(e => e.date?.startsWith(year))
}

function fmtN(n, dec = 1) {
  return (Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec)).toLocaleString('fr-FR')
}

export function generateAnnualReport(territory, sites, entries, year) {
  const yearStr = String(year)
  const yearEntries = getYearEntries(entries, yearStr)

  const totalKg = getKg(yearEntries)
  const totalL = getLVal(yearEntries)
  const totalBacs = Math.round(totalKg / 29.87)
  const totalInterventions = yearEntries.length
  const activeSites = sites.filter(s => yearEntries.some(e => e.siteId === s.id)).length

  // Monthly breakdown
  const months = Array.from({length: 12}, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    const mEntries = yearEntries.filter(e => e.date?.startsWith(`${yearStr}-${m}`))
    const label = new Date(`${yearStr}-${m}-01`).toLocaleDateString('fr-FR', { month: 'long' })
    return { label, kg: getKg(mEntries), lVal: getLVal(mEntries), count: mEntries.length }
  })

  // Site breakdown
  const siteRows = sites.map(site => {
    const se = yearEntries.filter(e => e.siteId === site.id)
    const kg = getKg(se)
    const lVal = getLVal(se)
    const ref = site.referents?.[0]?.nom || '—'
    return { site, kg, lVal, bacs: Math.round(kg / 29.87), interventions: se.length, ref }
  }).filter(r => r.interventions > 0 || r.kg > 0).sort((a, b) => b.kg - a.kg)

  const maxKg = Math.max(...months.map(m => m.kg), 1)

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport annuel ${yearStr} — ${territory?.name || 'CompostConnect'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', Arial, sans-serif; color: #1C2B19; background: #fff; }
  .page { max-width: 900px; margin: 0 auto; padding: 48px; }
  
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 3px solid #2D5A27; }
  .logo-area h1 { font-family: 'Playfair Display', serif; font-size: 32px; color: #2D5A27; }
  .logo-area p { color: #7A8470; font-size: 14px; margin-top: 4px; }
  .year-badge { background: #2D5A27; color: #fff; padding: 12px 24px; border-radius: 12px; text-align: center; }
  .year-badge .year { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; }
  .year-badge .label { font-size: 12px; opacity: .8; }

  /* Summary cards */
  .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 48px; }
  .card { background: #F4EBD9; border-radius: 12px; padding: 18px 16px; text-align: center; }
  .card .value { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #2D5A27; }
  .card .unit { font-size: 12px; color: #7A8470; }
  .card .label { font-size: 11px; color: #7A8470; margin-top: 4px; }

  /* Section */
  h2 { font-family: 'Playfair Display', serif; font-size: 20px; color: #2D5A27; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #E0D5C5; }

  /* Monthly chart */
  .chart { margin-bottom: 48px; }
  .month-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .month-label { width: 70px; font-size: 12px; color: #7A8470; text-align: right; flex-shrink: 0; }
  .bar-wrap { flex: 1; background: #F4EBD9; border-radius: 4px; height: 24px; position: relative; overflow: hidden; }
  .bar { height: 100%; background: #2D5A27; border-radius: 4px; display: flex; align-items: center; padding: 0 8px; min-width: 2px; }
  .bar-val { font-size: 11px; color: #fff; font-weight: 600; white-space: nowrap; }
  .bar-0 { background: #E0D5C5; }
  .month-count { width: 60px; font-size: 11px; color: #7A8470; text-align: right; flex-shrink: 0; }

  /* Table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 48px; font-size: 13px; }
  th { background: #2D5A27; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
  td { padding: 10px 12px; border-bottom: 1px solid #E0D5C5; vertical-align: top; }
  tr:nth-child(even) td { background: #F9F5EE; }
  .num { text-align: right; font-weight: 600; color: #2D5A27; }
  .site-name { font-weight: 600; }

  /* Footer */
  .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #E0D5C5; display: flex; justify-content: space-between; font-size: 11px; color: #7A8470; }

  @media print {
    .page { padding: 24px; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      <h1>🌿 CompostConnect</h1>
      <p>${territory?.name || 'SMIEEOM Val de Cher'}</p>
      <p style="margin-top:8px;font-size:13px;color:#4A5A48;">Rapport annuel de suivi du compostage partagé</p>
    </div>
    <div class="year-badge">
      <div class="year">${yearStr}</div>
      <div class="label">Rapport annuel</div>
    </div>
  </div>

  <!-- Summary -->
  <div class="summary">
    <div class="card">
      <div class="value">${fmtN(totalKg, 0)}</div>
      <div class="unit">kg</div>
      <div class="label">Biodéchets détournés des OMR</div>
    </div>
    <div class="card">
      <div class="value">${totalL}</div>
      <div class="unit">L</div>
      <div class="label">Compost mûr valorisé</div>
    </div>
    <div class="card">
      <div class="value">${totalBacs}</div>
      <div class="unit">bacs</div>
      <div class="label">Bacs OMR 120L évités</div>
    </div>
    <div class="card">
      <div class="value">${activeSites}</div>
      <div class="unit">sites</div>
      <div class="label">Sites actifs sur l'année</div>
    </div>
    <div class="card">
      <div class="value">${totalInterventions}</div>
      <div class="unit">saisies</div>
      <div class="label">Interventions enregistrées</div>
    </div>
  </div>

  <!-- Monthly chart -->
  <div class="chart">
    <h2>Évolution mensuelle des biodéchets détournés (kg)</h2>
    ${months.map(m => {
      const pct = maxKg > 0 ? Math.max((m.kg / maxKg) * 100, m.kg > 0 ? 3 : 0) : 0
      return `<div class="month-row">
        <div class="month-label">${m.label.slice(0,3)}.</div>
        <div class="bar-wrap">
          <div class="bar ${m.kg === 0 ? 'bar-0' : ''}" style="width:${pct}%">
            ${m.kg > 0 ? `<span class="bar-val">${fmtN(m.kg, 0)} kg</span>` : ''}
          </div>
        </div>
        <div class="month-count">${m.count > 0 ? `${m.count} saisie${m.count > 1 ? 's' : ''}` : ''}</div>
      </div>`
    }).join('')}
  </div>

  <!-- Sites table -->
  <h2>Bilan par site</h2>
  <table>
    <thead>
      <tr>
        <th>Site</th>
        <th>Référent</th>
        <th style="text-align:right">Bio-déchets (kg)</th>
        <th style="text-align:right">Compost (L)</th>
        <th style="text-align:right">Bacs OMR</th>
        <th style="text-align:right">Interventions</th>
      </tr>
    </thead>
    <tbody>
      ${siteRows.map(r => `<tr>
        <td class="site-name">${r.site.name}</td>
        <td>${r.ref}</td>
        <td class="num">${fmtN(r.kg, 0)}</td>
        <td class="num">${r.lVal}</td>
        <td class="num">${r.bacs}</td>
        <td class="num">${r.interventions}</td>
      </tr>`).join('')}
      <tr style="background:#ECF5E8 !important;">
        <td colspan="2" style="font-weight:700;color:#2D5A27;">TOTAL</td>
        <td class="num" style="color:#2D5A27">${fmtN(totalKg, 0)}</td>
        <td class="num" style="color:#2D5A27">${totalL}</td>
        <td class="num" style="color:#2D5A27">${totalBacs}</td>
        <td class="num" style="color:#2D5A27">${totalInterventions}</td>
      </tr>
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <span>CompostConnect — ${territory?.name || 'SMIEEOM Val de Cher'}</span>
    <span>Rapport généré le ${new Date().toLocaleDateString('fr-FR')}</span>
    <span>Données ${yearStr} — Usage interne</span>
  </div>
</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Autorisez les pop-ups pour générer le rapport.'); return }
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 500)
}

export function AnnualReportButton({ territory, sites, entries }) {
  const currentYear = new Date().getFullYear()
  const years = []
  const allYears = new Set(entries.map(e => e.date?.slice(0, 4)).filter(Boolean))
  allYears.forEach(y => years.push(y))
  years.sort((a, b) => b - a)
  if (!years.length) years.push(String(currentYear))

  const [year, setYear] = useState(String(currentYear))

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #E0D5C5', borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: '#fff', cursor: 'pointer' }}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <button onClick={() => generateAnnualReport(territory, sites, entries, year)} style={{ background: '#7A6B2D', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
        📄 Rapport annuel
      </button>
    </div>
  )
}
