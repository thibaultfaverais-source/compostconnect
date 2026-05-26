import * as XLSX from 'xlsx'

const KG_PER_LITRE = 0.65

const ACTION_LABELS = {
  transfert: 'Transfert de bac', recolte: 'Récolte', apport: 'Apport biodéchets',
  brassage: 'Brassage', visite: 'Visite de suivi', manutention: 'Manutention / Réparation',
  remplissage_broyat: 'Remplissage broyat',
}

const OBS_LABELS = {
  odeur: 'Odeur', moucherons: 'Moucherons', trop_sec: 'Trop sec', trop_humide: 'Trop humide',
}

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR')
}

function entryToRow(entry, siteName) {
  const kg = entry.actionType === 'transfert' && entry.volumeL ? Number(entry.volumeL) * KG_PER_LITRE : ''
  const lVal = entry.actionType === 'recolte' && entry.volumeL ? Number(entry.volumeL) : ''
  return {
    'Date': fmtDate(entry.date),
    'Site': siteName || '',
    'Type d\'action': ACTION_LABELS[entry.actionType] || entry.actionType,
    'Volume (L)': entry.volumeL || '',
    'Biodéchets détournés (kg)': kg || '',
    'Compost valorisé (L)': lVal || '',
    'Observations': (entry.observations || []).map(o => OBS_LABELS[o] || o).join(', '),
    'Température (°C)': entry.temperature || '',
    'Temps passé (min)': entry.tempsMin || '',
    'Commentaire': entry.commentaire || '',
  }
}

// Export all sites (admin global)
export function exportGlobal(sites, entries) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Summary
  const summaryData = sites.map(site => {
    const se = entries.filter(e => e.siteId === site.id)
    const kgTotal = se.filter(e => e.actionType === 'transfert').reduce((s, e) => s + (Number(e.volumeL) || 0) * KG_PER_LITRE, 0)
    const lVal = se.filter(e => e.actionType === 'recolte').reduce((s, e) => s + (Number(e.volumeL) || 0), 0)
    const bacsOMR = Math.round(kgTotal / 29.87)
    return {
      'Site': site.name,
      'Adresse': site.address || '',
      'Type': site.typeSite || '',
      'Foyers inscrits': site.foyers || 0,
      'Période': site.periode || '',
      'Référent principal': site.referents?.[0]?.nom || '',
      'Tél.': site.referents?.[0]?.tel || '',
      'Email': site.referents?.[0]?.email || '',
      'Biodéchets détournés (kg)': Math.round(kgTotal * 10) / 10,
      'Compost valorisé (L)': lVal,
      'Bacs OMR 120L évités': bacsOMR,
      'Nombre d\'interventions': se.length,
      'Code d\'accès': site.code,
    }
  })

  const ws1 = XLSX.utils.json_to_sheet(summaryData)
  ws1['!cols'] = [20,30,18,10,20,20,14,25,18,16,16,14,12].map(w => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws1, 'Récapitulatif global')

  // Sheet 2: All entries
  const allRows = entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(e => {
      const site = sites.find(s => s.id === e.siteId)
      return entryToRow(e, site?.name || '?')
    })
  const ws2 = XLSX.utils.json_to_sheet(allRows)
  ws2['!cols'] = [12,20,20,10,18,16,25,12,12,40].map(w => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws2, 'Toutes les saisies')

  // One sheet per site
  sites.forEach(site => {
    const siteEntries = entries.filter(e => e.siteId === site.id).sort((a, b) => b.date.localeCompare(a.date))
    if (!siteEntries.length) return
    const rows = siteEntries.map(e => entryToRow(e, site.name))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [12,20,20,10,18,16,25,12,12,40].map(w => ({ wch: w }))
    const sheetName = site.name.substring(0, 28).replace(/[/\\?*[\]]/g, '_')
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
  XLSX.writeFile(wb, `CompostConnect_Bilan_${date}.xlsx`)
}

// Export single site (referent or admin)
export function exportSite(site, entries) {
  const wb = XLSX.utils.book_new()
  const siteEntries = entries.filter(e => e.siteId === site.id).sort((a, b) => b.date.localeCompare(a.date))

  // Stats sheet
  const kgTotal = siteEntries.filter(e => e.actionType === 'transfert').reduce((s, e) => s + (Number(e.volumeL) || 0) * KG_PER_LITRE, 0)
  const lVal = siteEntries.filter(e => e.actionType === 'recolte').reduce((s, e) => s + (Number(e.volumeL) || 0), 0)

  const statsData = [
    { 'Indicateur': 'Site', 'Valeur': site.name },
    { 'Indicateur': 'Adresse', 'Valeur': site.address || '' },
    { 'Indicateur': 'Période', 'Valeur': site.periode || '' },
    { 'Indicateur': 'Foyers inscrits', 'Valeur': site.foyers || 0 },
    { 'Indicateur': 'Référent principal', 'Valeur': site.referents?.[0]?.nom || '' },
    { 'Indicateur': '', 'Valeur': '' },
    { 'Indicateur': 'Biodéchets détournés (kg)', 'Valeur': Math.round(kgTotal * 10) / 10 },
    { 'Indicateur': 'Compost valorisé (L)', 'Valeur': lVal },
    { 'Indicateur': 'Bacs OMR 120L évités', 'Valeur': Math.round(kgTotal / 29.87) },
    { 'Indicateur': 'Nombre d\'interventions', 'Valeur': siteEntries.length },
  ]
  const ws1 = XLSX.utils.json_to_sheet(statsData)
  ws1['!cols'] = [{ wch: 28 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Bilan')

  // Entries sheet
  const rows = siteEntries.map(e => entryToRow(e, site.name))
  const ws2 = XLSX.utils.json_to_sheet(rows)
  ws2['!cols'] = [12,20,20,10,18,16,25,12,12,40].map(w => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws2, 'Saisies')

  const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
  const siteName = site.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
  XLSX.writeFile(wb, `CompostConnect_${siteName}_${date}.xlsx`)
}

// Export button component
export function ExportButton({ label = '📥 Exporter Excel', onClick, small = false }) {
  return (
    <button onClick={onClick} style={{
      background: '#2D4F7A', color: '#fff', border: 'none',
      borderRadius: small ? 8 : 10,
      padding: small ? '8px 14px' : '10px 20px',
      cursor: 'pointer', fontSize: small ? 13 : 14, fontWeight: 600,
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {label}
    </button>
  )
}
