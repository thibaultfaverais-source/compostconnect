import { useState, useEffect } from 'react'
import { db } from '../firebase.js'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const C = {
  green: '#2D5A27', text: '#1C2B19', muted: '#7A8470',
  border: '#E0D5C5', card: '#FDFAF6', bg: '#F4EBD9',
}

const inputStyle = {
  width: '100%', padding: '11px 13px', border: `1.5px solid ${C.border}`,
  borderRadius: 9, fontSize: 14, background: '#fff', color: C.text, outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
}

const OBS_OPTIONS = [
  { id: 'odeur',       label: '💨 Mauvaise odeur' },
  { id: 'moucherons',  label: '🦟 Moucherons' },
  { id: 'trop_sec',    label: '🌵 Trop sec' },
  { id: 'trop_humide', label: '💧 Trop humide' },
]

export default function AdminSettingsModal({ onClose, onSettingsLoaded }) {
  const [settings, setSettings] = useState({
    adminEmail: 'thibault.faverais@perso.be',
    emailAlerts: true,
    alertTypes: ['odeur', 'moucherons', 'trop_sec', 'trop_humide'],
  })
  const [newAdminCode, setNewAdminCode] = useState('')
  const [showCodeField, setShowCodeField] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'admin'))
        if (snap.exists()) setSettings(snap.data())
      } catch (e) {}
      setLoaded(true)
    })()
  }, [])

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }))

  const toggleType = (id) => setSettings(s => ({
    ...s,
    alertTypes: s.alertTypes.includes(id)
      ? s.alertTypes.filter(t => t !== id)
      : [...s.alertTypes, id],
  }))

  const save = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'config', 'admin'), settings)
      if (newAdminCode.trim().length >= 4) {
        await setDoc(doc(db, 'config', 'codes'), { adminCode: newAdminCode.trim().toUpperCase() })
        onSettingsLoaded({ ...settings, newAdminCode: newAdminCode.trim().toUpperCase() })
      } else {
        onSettingsLoaded(settings)
      }
      onClose()
    } catch (e) { alert('Erreur sauvegarde') }
    setSaving(false)
  }

  if (!loaded) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,18,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
      <div style={{ background: C.card, width: '100%', maxWidth: 480, borderRadius: 20, padding: 32, boxShadow: '0 8px 48px rgba(0,0,0,0.16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.text }}>⚙️ Paramètres admin</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 7 }}>📧 Email de réception des alertes</label>
          <input
            type="email" value={settings.adminEmail}
            onChange={e => set('adminEmail', e.target.value)}
            placeholder="admin@exemple.fr"
            style={inputStyle}
          />
        </div>

        {/* Email toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>Alertes email activées</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Recevoir un email à chaque problème signalé</p>
          </div>
          <div
            onClick={() => set('emailAlerts', !settings.emailAlerts)}
            style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
              background: settings.emailAlerts ? C.green : '#D0C8BC',
              position: 'relative', transition: 'background .2s', flexShrink: 0,
            }}
          >
            <div style={{
              width: 18, height: 18, background: '#fff', borderRadius: '50%',
              position: 'absolute', top: 3,
              left: settings.emailAlerts ? 23 : 3,
              transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>

        {/* Alert types */}
        {settings.emailAlerts && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>Types d'alertes déclenchant un email</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {OBS_OPTIONS.map(o => {
                const active = settings.alertTypes.includes(o.id)
                return (
                  <button key={o.id} onClick={() => toggleType(o.id)} style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: active ? C.bg : 'transparent',
                    border: `1.5px solid ${active ? C.green : C.border}`,
                    fontSize: 13, color: active ? C.green : C.muted,
                    fontWeight: active ? 600 : 400, fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {active ? '✓ ' : ''}{o.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Restricted admin code (SMIEEOM) */}
        <div style={{ background: '#FEF3E2', border: '1px solid #F5D5A0', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#8B5E00', marginBottom: 8 }}>🔒 Code accès restreint (SMIEEOM)</p>
          <p style={{ fontSize: 12, color: '#A07020', marginBottom: 10 }}>Ce code donne accès uniquement aux 7 sites contractuels : Contres, Chémery, Ouchamps, Chissay, Monthou, Saint-Aignan, Fougères.</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <code style={{ background: 'rgba(0,0,0,0.07)', padding: '4px 10px', borderRadius: 6, fontSize: 14, fontWeight: 700, color: '#8B5E00', letterSpacing: '.08em' }}>SMIEEOM2026</code>
            <span style={{ fontSize: 12, color: '#A07020' }}>← Code actuel (modifiable dans Firebase si besoin)</span>
          </div>
        </div>

        {/* Admin code */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCodeField ? 10 : 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>🔑 Code d'accès administrateur</p>
            <button onClick={() => setShowCodeField(s => !s)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 12px', fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {showCodeField ? 'Annuler' : 'Modifier'}
            </button>
          </div>
          {showCodeField && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Nouveau code (min. 4 caractères) — partagez-le uniquement avec les coordinateurs.</p>
              <input
                value={newAdminCode}
                onChange={e => setNewAdminCode(e.target.value.toUpperCase())}
                placeholder="Ex : BTF2026"
                maxLength={20}
                style={{ ...inputStyle, letterSpacing: '.1em', fontWeight: 600 }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 12, cursor: 'pointer', fontSize: 14, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>Annuler</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: 13, background: C.green, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", opacity: saving ? .7 : 1 }}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
