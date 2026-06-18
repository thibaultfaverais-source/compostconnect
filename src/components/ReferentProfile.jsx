import { useState } from 'react'
import { db } from '../firebase.js'
import { doc, setDoc } from 'firebase/firestore'

const C = {
  green: '#2D5A27', text: '#1C2B19', muted: '#7A8470',
  border: '#E0D5C5', card: '#FDFAF6', bg: '#F4EBD9',
}

const inputStyle = {
  width: '100%', padding: '11px 13px', border: `1.5px solid ${C.border}`,
  borderRadius: 9, fontSize: 14, background: '#fff', color: C.text, outline: 'none',
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

export default function ReferentProfile({ site, onSave, onClose, isDemoMode = false }) {
  // Ensure 2 referent slots
  const initRefs = () => {
    const refs = [...(site.referents || [])]
    while (refs.length < 2) refs.push({ role: refs.length === 0 ? 'Référent principal' : 'Référent secondaire', nom: '', tel: '', email: '' })
    return refs.slice(0, 2)
  }

  const [refs, setRefs] = useState(initRefs())
  const [saving, setSaving] = useState(false)

  const setRef = (i, k, v) => setRefs(prev => {
    const updated = [...prev]
    updated[i] = { ...updated[i], [k]: v }
    return updated
  })

  const save = async () => {
    setSaving(true)
    const cleanRefs = refs.filter(r => r.nom.trim())
    const updatedSite = { ...site, referents: cleanRefs }
    if (isDemoMode) { onSave(updatedSite); setSaving(false); return }
    try {
      await setDoc(doc(db, 'sites', site.id), updatedSite)
      onSave(updatedSite)
    } catch (e) {
      alert('Erreur lors de la sauvegarde.')
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,18,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: C.card, width: '100%', maxWidth: 560, borderRadius: '22px 22px 0 0', padding: '28px 28px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 48px rgba(0,0,0,0.18)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.text }}>👤 Mes coordonnées</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Site : <strong style={{ color: C.text }}>{site.name}</strong></p>

        {refs.map((ref, i) => (
          <div key={i} style={{ background: C.bg, borderRadius: 14, padding: '18px 18px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 14 }}>
              {i === 0 ? '🌿 Référent principal' : '🌿 Référent secondaire'}
            </p>

            <Field label="Nom complet">
              <input
                value={ref.nom}
                onChange={e => setRef(i, 'nom', e.target.value)}
                placeholder="Prénom NOM"
                style={inputStyle}
              />
            </Field>

            <Field label="Rôle / Fonction">
              <input
                value={ref.role}
                onChange={e => setRef(i, 'role', e.target.value)}
                placeholder="Ex : Référent technique, Élu…"
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="📞 Téléphone">
                <input
                  type="tel"
                  value={ref.tel}
                  onChange={e => setRef(i, 'tel', e.target.value)}
                  placeholder="06 12 34 56 78"
                  style={inputStyle}
                />
              </Field>
              <Field label="✉️ Email">
                <input
                  type="email"
                  value={ref.email}
                  onChange={e => setRef(i, 'email', e.target.value)}
                  placeholder="prenom@exemple.fr"
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        ))}

        <div style={{ background: '#E3EEFA', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#2D4F7A' }}>
            💡 Ces informations sont visibles par le coordinateur dans son tableau de bord.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 12, cursor: 'pointer', fontSize: 14, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
            Annuler
          </button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: 13, background: C.green, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", opacity: saving ? .7 : 1 }}>
            {saving ? 'Sauvegarde…' : 'Enregistrer mes coordonnées'}
          </button>
        </div>
      </div>
    </div>
  )
}
