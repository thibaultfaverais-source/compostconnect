import { useState, useEffect } from 'react'
import { db } from '../firebase.js'
import { collection, getDocs } from 'firebase/firestore'
import SiteMap from './SiteMap.jsx'

const C = {
  green: '#2D5A27', greenPale: '#ECF5E8', brown: '#7A4F2D',
  text: '#1C2B19', muted: '#7A8470', border: '#E0D5C5',
  card: '#FDFAF6', bg: '#F4EBD9',
}

const KG_PER_LITRE = 0.65

function StatCard({ value, unit, label, color = C.green, emoji }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>
        {value}<span style={{ fontSize: 14, fontWeight: 400, color: C.muted, marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{label}</div>
    </div>
  )
}

export default function PublicDashboard({ onClose }) {
  const [sites, setSites] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [s, e] = await Promise.all([
          getDocs(collection(db, 'sites')),
          getDocs(collection(db, 'entries')),
        ])
        setSites(s.docs.map(d => d.data()))
        setEntries(e.docs.map(d => d.data()))
      } catch {}
      setLoading(false)
    })()
  }, [])

  const totalKg = entries.filter(e => e.actionType === 'transfert').reduce((s, e) => s + (Number(e.volumeL) || 0) * KG_PER_LITRE, 0)
  const totalL = entries.filter(e => e.actionType === 'recolte').reduce((s, e) => s + (Number(e.volumeL) || 0), 0)
  const totalBacs = Math.round(totalKg / 29.87)
  const foyers = sites.reduce((s, site) => s + (site.foyers || 0), 0)

  // By year
  const byYear = {}
  entries.forEach(e => {
    const y = e.date?.slice(0, 4)
    if (!y) return
    if (!byYear[y]) byYear[y] = { kg: 0, lVal: 0 }
    if (e.actionType === 'transfert' && e.volumeL) byYear[y].kg += Number(e.volumeL) * KG_PER_LITRE
    if (e.actionType === 'recolte' && e.volumeL) byYear[y].lVal += Number(e.volumeL)
  })
  const years = Object.entries(byYear).sort((a, b) => a[0].localeCompare(b[0]))
  const maxKg = Math.max(...years.map(([, v]) => v.kg), 1)

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: C.muted }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
        <p>Chargement…</p>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, overflowY: 'auto', zIndex: 200, fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Header */}
      <div style={{ background: C.green, padding: '28px 32px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#fff' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, margin: 0 }}>🌿 CompostConnect</h1>
            <p style={{ opacity: .75, fontSize: 13, marginTop: 4 }}>Tableau de bord public — SMIEEOM Val de Cher</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            ← Retour
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        {/* Hero text */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: C.text, marginBottom: 10 }}>
            Le compostage partagé en chiffres
          </h2>
          <p style={{ color: C.muted, fontSize: 15, maxWidth: 560, margin: '0 auto' }}>
            {sites.length} sites de compostage partagé actifs dans le territoire Val de Cher, suivis par {foyers} foyers participants.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
          <StatCard emoji="♻️" value={Math.round(totalKg).toLocaleString('fr-FR')} unit="kg" label="Biodéchets détournés des OMR" color={C.green} />
          <StatCard emoji="🌾" value={totalL.toLocaleString('fr-FR')} unit="L" label="Compost mûr valorisé" color={C.brown} />
          <StatCard emoji="🗑️" value={totalBacs.toLocaleString('fr-FR')} unit="bacs" label="Bacs OMR 120L évités" color="#2D4F7A" />
          <StatCard emoji="📍" value={sites.length} unit="" label="Sites de compostage actifs" color="#5C2D7A" />
          <StatCard emoji="👨‍👩‍👧" value={foyers} unit="foyers" label="Ménages participants" color="#2D7A6B" />
        </div>

        {/* Map */}
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.text, marginBottom: 16 }}>Carte des sites</h3>
        <SiteMap sites={sites} entries={entries} height={420} />

        {/* Yearly evolution */}
        {years.length > 0 && (
          <>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.text, marginBottom: 20 }}>Évolution annuelle</h3>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', marginBottom: 40 }}>
              {years.map(([year, stats]) => (
                <div key={year} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <span style={{ width: 50, fontSize: 13, fontWeight: 700, color: C.text }}>{year}</span>
                    <div style={{ flex: 1, background: '#F4EBD9', borderRadius: 6, height: 28, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: C.green, borderRadius: 6, width: `${(stats.kg / maxKg) * 100}%`, display: 'flex', alignItems: 'center', paddingLeft: 10, minWidth: stats.kg > 0 ? 60 : 0 }}>
                        {stats.kg > 0 && <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{Math.round(stats.kg).toLocaleString('fr-FR')} kg</span>}
                      </div>
                    </div>
                    {stats.lVal > 0 && <span style={{ fontSize: 12, color: C.brown, fontWeight: 600, whiteSpace: 'nowrap' }}>🌾 {stats.lVal} L</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: C.muted, fontSize: 12, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
          <p>Données issues de la plateforme CompostConnect — SMIEEOM Val de Cher</p>
          <p style={{ marginTop: 4 }}>Mis à jour le {new Date().toLocaleDateString('fr-FR')} · <a href="https://biotrifoule.fr" style={{ color: C.green }}>biotrifoule.fr</a></p>
        </div>
      </div>
    </div>
  )
}
