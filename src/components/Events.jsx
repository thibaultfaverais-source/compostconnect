import { useState } from 'react'
import { db } from '../firebase.js'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'

const C = {
  green: '#2D5A27', text: '#1C2B19', muted: '#7A8470',
  border: '#E0D5C5', card: '#FDFAF6', bg: '#F4EBD9', danger: '#BE4B48',
}

const EVENT_TYPES = [
  { id: 'cafe_compost',  label: 'Café compost',      icon: '☕', color: '#7A4F2D', bg: '#F8EDD8' },
  { id: 'visite',        label: 'Visite de suivi',   icon: '👁️', color: '#5C2D7A', bg: '#EDE3F5' },
  { id: 'transfert',     label: 'Transfert de bac',  icon: '🔄', color: '#2D4F7A', bg: '#E3EEFA' },
  { id: 'formation',     label: 'Formation',          icon: '📚', color: '#2D5A27', bg: '#ECF5E8' },
  { id: 'inauguration',  label: 'Inauguration',      icon: '🎉', color: '#7A6B2D', bg: '#F5EDD8' },
  { id: 'autre',         label: 'Autre',              icon: '📌', color: '#7A8470', bg: '#F0EFEA' },
]

const getType = (id) => EVENT_TYPES.find(t => t.id === id) || EVENT_TYPES[5]

const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const todayStr = () => new Date().toISOString().split('T')[0]

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

function AddEventModal({ sites, onSave, onClose, defaultSiteId = null, isDemoMode = false }) {
  const [form, setForm] = useState({
    siteId: defaultSiteId || '',
    date: '',
    type: 'cafe_compost',
    title: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.date || !form.title) { alert('Date et titre obligatoires.'); return }
    setSaving(true)
    const ev = { ...form, id: `ev${Date.now()}`, createdAt: new Date().toISOString() }
    if (isDemoMode) { onSave(ev); setSaving(false); return }
    try {
      await setDoc(doc(db, 'events', ev.id), ev)
      onSave(ev)
    } catch (e) { alert('Erreur sauvegarde.') }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,18,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: C.card, width: '100%', maxWidth: 520, borderRadius: '22px 22px 0 0', padding: '28px 28px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 48px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: C.text }}>📅 Nouvel événement</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>

        <Field label="Date *">
          <input type="date" value={form.date} min={todayStr()} onChange={e => set('date', e.target.value)} style={inputStyle} />
        </Field>

        <Field label="Type d'événement">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {EVENT_TYPES.map(t => {
              const sel = form.type === t.id
              return (
                <button key={t.id} onClick={() => set('type', t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, cursor: 'pointer', border: `1.5px solid ${sel ? t.color : C.border}`, background: sel ? t.bg : 'transparent', fontFamily: "'DM Sans', sans-serif" }}>
                  <span>{t.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? t.color : C.text }}>{t.label}</span>
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Titre *">
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex : Café compost mensuel" style={inputStyle} />
        </Field>

        {!defaultSiteId && (
          <Field label="Site concerné">
            <select value={form.siteId} onChange={e => set('siteId', e.target.value)} style={inputStyle}>
              <option value="">Tous les sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="Description (optionnel)">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Informations complémentaires…" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 12, cursor: 'pointer', fontSize: 14, color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>Annuler</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: 12, background: C.green, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", opacity: saving ? .7 : 1 }}>
            {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function EventsList({ events, sites, isAdmin, siteId = null, onDelete }) {
  const today = todayStr()
  const filtered = events
    .filter(e => e.date >= today)
    .filter(e => !siteId || e.siteId === siteId || !e.siteId)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!filtered.length) return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, textAlign: 'center', color: C.muted }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
      <p style={{ fontSize: 14 }}>Aucun événement à venir</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {filtered.map(ev => {
        const t = getType(ev.type)
        const site = sites.find(s => s.id === ev.siteId)
        return (
          <div key={ev.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ background: t.bg, borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: C.text, margin: 0 }}>{ev.title}</p>
                {onDelete && (
                  <button onClick={() => onDelete(ev.id)} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1, flexShrink: 0 }}>✕</button>
                )}
              </div>
              <p style={{ fontSize: 12, color: t.color, fontWeight: 600, margin: '3px 0 2px' }}>{t.label}{site ? ` · ${site.name}` : ' · Tous les sites'}</p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>📅 {fmtDate(ev.date)}</p>
              {ev.description && <p style={{ fontSize: 12, color: C.muted, margin: '5px 0 0', fontStyle: 'italic' }}>{ev.description}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function EventsSection({ events, sites, isAdmin, siteId, onAddEvent, onDeleteEvent, isDemoMode = false }) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: C.text }}>📅 Prochains événements</h2>
        <button onClick={() => setShowAdd(true)} style={{ background: C.green, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
          + Événement
        </button>
      </div>
      <EventsList events={events} sites={sites} isAdmin={isAdmin} siteId={siteId} onDelete={onDeleteEvent} />
      {showAdd && <AddEventModal sites={sites} defaultSiteId={siteId} onSave={ev => { onAddEvent(ev); setShowAdd(false) }} onClose={() => setShowAdd(false)} isDemoMode={isDemoMode} />}
    </div>
  )
}
