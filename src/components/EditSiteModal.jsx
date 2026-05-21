import { useState } from 'react'
import { db } from '../firebase.js'
import { doc, setDoc } from 'firebase/firestore'

const C = {
  green: '#2D5A27', text: '#1C2B19', muted: '#7A8470',
  border: '#E0D5C5', card: '#FDFAF6', danger: '#BE4B48', bg: '#F4EBD9',
}

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

export default function EditSiteModal({ site, onSave, onClose }) {
  const [form, setForm] = useState({ ...site })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setRef = (i, k, v) => setForm(f => {
    const refs = [...(f.referents || [])]
    refs[i] = { ...refs[i], [k]: v }
    return { ...f, referents: refs }
  })

  const addRef = () => setForm(f => ({
    ...f,
    referents: [...(f.referents || []), { role: '', nom: '', tel: '', email: '' }]
  }))

  const removeRef = (i) => setForm(f => ({
    ...f,
    referents: f.referents.filter((_, idx) => idx !== i)
  }))

  const handleSave = async () => {
    if (!form.name || !form.code) { alert('Nom et code obligatoires.'); return }
    setSaving(true)
    try {
      await setDoc(doc(db, 'sites', form.id), form)
      onSave(form)
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la sauvegarde.')
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,18,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: C.card, width: '100%', maxWidth: 660, borderRadius: '22px 22px 0 0', padding: '28px 28px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 48px rgba(0,0,0,0.18)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.text }}>
            ✏️ Modifier — {site.name}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>

        {/* Infos générales */}
        <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Informations générales</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Nom du site *">
            <input value={form.name || ''} onChange={e => set('name', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Code d'accès *">
            <input value={form.code || ''} onChange={e => set('code', e.target.value.toUpperCase())} maxLength={10} style={{ ...inputStyle, letterSpacing: '.1em', fontWeight: 600 }} />
          </Field>
        </div>

        <Field label="Adresse">
          <input value={form.address || ''} onChange={e => set('address', e.target.value)} style={inputStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Type de site">
            <select value={form.typeSite || 'Foyers'} onChange={e => set('typeSite', e.target.value)} style={inputStyle}>
              <option>Foyers</option>
              <option>Foyers + Cantine</option>
              <option>Entreprises</option>
              <option>En cours</option>
            </select>
          </Field>
          <Field label="Foyers inscrits">
            <input type="number" value={form.foyers || 0} onChange={e => set('foyers', Number(e.target.value))} style={inputStyle} />
          </Field>
          <Field label="Capacité (L)">
            <input type="number" value={form.capacityL || 400} onChange={e => set('capacityL', Number(e.target.value))} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Cantine">
            <input value={form.cantine || ''} onChange={e => set('cantine', e.target.value)} placeholder="Ex : 80 repas/jour" style={inputStyle} />
          </Field>
          <Field label="Période">
            <input value={form.periode || ''} onChange={e => set('periode', e.target.value)} placeholder="Ex : Sept. 2024 – Juin 2025" style={inputStyle} />
          </Field>
        </div>

        {/* Coordonnées GPS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Latitude (pour la carte)">
            <input type="number" step="0.0001" value={form.lat || ''} onChange={e => set('lat', Number(e.target.value))} placeholder="Ex : 47.3089" style={inputStyle} />
          </Field>
          <Field label="Longitude (pour la carte)">
            <input type="number" step="0.0001" value={form.lng || ''} onChange={e => set('lng', Number(e.target.value))} placeholder="Ex : 1.4736" style={inputStyle} />
          </Field>
        </div>
        <p style={{ fontSize: 11, color: C.muted, marginBottom: 16, marginTop: -8 }}>
          💡 Trouvez les coordonnées sur <strong>maps.google.fr</strong> → clic droit sur le lieu → copier les coordonnées
        </p>

        {/* Référents */}
        <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Référents</p>

        {(form.referents || []).map((ref, i) => (
          <div key={i} style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', marginBottom: 12, position: 'relative' }}>
            <button onClick={() => removeRef(i)} style={{ position: 'absolute', top: 10, right: 12, background: 'transparent', border: 'none', color: C.danger, fontSize: 18, cursor: 'pointer' }}>✕</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
              <Field label="Rôle">
                <input value={ref.role || ''} onChange={e => setRef(i, 'role', e.target.value)} placeholder="Référent technique" style={inputStyle} />
              </Field>
              <Field label="Nom complet">
                <input value={ref.nom || ''} onChange={e => setRef(i, 'nom', e.target.value)} placeholder="Prénom NOM" style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Téléphone">
                <input value={ref.tel || ''} onChange={e => setRef(i, 'tel', e.target.value)} placeholder="06 12 34 56 78" style={inputStyle} />
              </Field>
              <Field label="Email">
                <input value={ref.email || ''} onChange={e => setRef(i, 'email', e.target.value)} placeholder="prenom@exemple.fr" style={inputStyle} />
              </Field>
            </div>
          </div>
        ))}

        <button onClick={addRef} style={{ width: '100%', padding: '10px', background: 'transparent', border: `1.5px dashed ${C.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, color: C.muted, marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
          + Ajouter un référent
        </button>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 12, cursor: 'pointer', fontSize: 14, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 13, background: C.green, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", opacity: saving ? .7 : 1 }}>
            {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  )
}
