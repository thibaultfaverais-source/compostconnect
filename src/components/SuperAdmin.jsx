import { useState } from 'react'
import { db } from '../firebase.js'
import { doc, setDoc, collection, getDocs } from 'firebase/firestore'

const C = {
  green: '#2D5A27', greenPale: '#ECF5E8', text: '#1C2B19',
  muted: '#7A8470', border: '#E0D5C5', card: '#FDFAF6', bg: '#F4EBD9',
}

const COLORS = [
  { name: 'Forêt', value: '#2D5A27' }, { name: 'Acajou', value: '#7A4F2D' },
  { name: 'Marine', value: '#2D4F7A' }, { name: 'Prune', value: '#5C2D7A' },
  { name: 'Sarcelle', value: '#2D7A6B' }, { name: 'Ardoise', value: '#4A5A6B' },
]

const inputStyle = {
  width: '100%', padding: '10px 13px', border: `1.5px solid ${C.border}`,
  borderRadius: 9, fontSize: 13, background: '#fff', color: C.text, outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function AddTerritoryModal({ onSave, onClose, existingCodes = [] }) {
  const [form, setForm] = useState({
    name: '', adminCode: '', adminEmail: '', color: '#2D5A27', description: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name || !form.adminCode) { alert('Nom et code obligatoires'); return }
    const code = form.adminCode.trim().toUpperCase()
    if (existingCodes.includes(code)) { alert('Ce code est déjà utilisé'); return }
    setSaving(true)
    const territory = {
      ...form, adminCode: code,
      id: `t${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    try {
      await setDoc(doc(db, 'territories', territory.id), territory)
      // Also store in config/territories for quick lookup
      onSave(territory)
    } catch (e) { alert('Erreur sauvegarde') }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,18,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
      <div style={{ background: C.card, width: '100%', maxWidth: 480, borderRadius: 20, padding: 32, boxShadow: '0 8px 48px rgba(0,0,0,0.16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.text }}>🏢 Nouveau territoire</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>

        <Field label="Nom du territoire / organisme *">
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex : SMIEEOM Beauce" style={inputStyle} />
        </Field>
        <Field label="Code admin du territoire *">
          <input value={form.adminCode} onChange={e => set('adminCode', e.target.value.toUpperCase())} placeholder="Ex : BEAUCE2026" maxLength={20} style={{ ...inputStyle, letterSpacing: '.06em', fontWeight: 600 }} />
        </Field>
        <Field label="Email coordinateur">
          <input type="email" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} placeholder="admin@territoire.fr" style={inputStyle} />
        </Field>
        <Field label="Description (optionnel)">
          <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ex : 12 communes, 150 foyers" style={inputStyle} />
        </Field>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Couleur thème</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <button key={c.value} onClick={() => set('color', c.value)} title={c.name} style={{
                width: 32, height: 32, borderRadius: '50%', background: c.value, cursor: 'pointer',
                border: form.color === c.value ? '3px solid #1C2B19' : '2px solid transparent',
                outline: 'none',
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 12, cursor: 'pointer', fontSize: 14, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>Annuler</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: 12, background: C.green, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", opacity: saving ? .7 : 1 }}>
            {saving ? 'Création…' : 'Créer le territoire'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminView({ territories, allSites, allEntries, onEnterTerritory, onAddTerritory, onLogout, onSyncData, onResetSiteEntries }) {
  const [showAdd, setShowAdd] = useState(false)
  const existingCodes = territories.map(t => t.adminCode)

  const totalKg = allEntries.filter(e => e.actionType === 'transfert').reduce((s, e) => s + (Number(e.volumeL) || 0) * 0.65, 0)
  const totalL = allEntries.filter(e => e.actionType === 'recolte').reduce((s, e) => s + (Number(e.volumeL) || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#1C2B19', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#fff' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>🌿 CompostConnect</h1>
          <p style={{ fontSize: 12, opacity: .6, marginTop: 3 }}>Vue super-administrateur</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onSyncData && <button onClick={onSyncData} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>🔄 Sync données</button>}
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px' }}>
        {/* Global stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 40 }}>
          {[
            { label: 'Territoires', value: territories.length, color: '#1C2B19' },
            { label: 'Sites totaux', value: allSites.length, color: C.green },
            { label: 'kg détournés', value: Math.round(totalKg).toLocaleString('fr-FR'), color: '#7A4F2D' },
            { label: 'L valorisés', value: totalL.toLocaleString('fr-FR'), color: '#7A6B2D' },
            { label: 'Saisies totales', value: allEntries.length, color: '#2D4F7A' },
          ].map((s, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Territories list */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: C.text }}>Territoires</h2>
          <button onClick={() => setShowAdd(true)} style={{ background: C.green, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            + Nouveau territoire
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
          {territories.map(t => {
            const tSites = allSites.filter(s => s.territoryId === t.id || (!s.territoryId && t.id === 'smieeom'))
            const tEntries = allEntries.filter(e => {
              const site = allSites.find(s => s.id === e.siteId)
              return site?.territoryId === t.id || (!site?.territoryId && t.id === 'smieeom')
            })
            const tKg = tEntries.filter(e => e.actionType === 'transfert').reduce((s, e) => s + (Number(e.volumeL) || 0) * 0.65, 0)
            return (
              <div key={t.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, borderLeft: `4px solid ${t.color || C.green}`, cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
                onClick={() => onEnterTerritory(t)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 4 }}>{t.name}</h3>
                {t.description && <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{t.description}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ textAlign: 'center', background: C.bg, borderRadius: 8, padding: '8px' }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: t.color || C.green }}>{tSites.length}</p>
                    <p style={{ fontSize: 11, color: C.muted }}>sites</p>
                  </div>
                  <div style={{ textAlign: 'center', background: C.bg, borderRadius: 8, padding: '8px' }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#7A4F2D' }}>{Math.round(tKg)}</p>
                    <p style={{ fontSize: 11, color: C.muted }}>kg détournés</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 10, fontSize: 12 }}>
                  <span style={{ color: C.muted }}>Code : <code style={{ background: C.greenPale, color: C.green, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{t.adminCode}</code></span>
                  <span style={{ color: t.color || C.green, fontWeight: 600 }}>Gérer →</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reset entries per site */}
  {onResetSiteEntries && (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 8 }}>🔧 Réinitialiser les saisies d'un site</h2>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Supprime les anciennes saisies de démo et recharge les données Excel pour un site spécifique. ⚠️ Les saisies terrain récentes pour ce site seront perdues.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {allSites.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(site => (
          <button key={site.id} onClick={() => onResetSiteEntries(site.id, site.name)}
            style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔄</span>
            <span>{site.name}</span>
          </button>
        ))}
      </div>
    </div>
  )}

  {showAdd && (
        <AddTerritoryModal
          existingCodes={existingCodes}
          onSave={t => { onAddTerritory(t); setShowAdd(false) }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
