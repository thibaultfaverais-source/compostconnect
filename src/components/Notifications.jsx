import { useState } from 'react'
import { db } from '../firebase.js'
import { doc, updateDoc, writeBatch, collection, getDocs, query, where } from 'firebase/firestore'

const C = {
  green: '#2D5A27', text: '#1C2B19', muted: '#7A8470',
  border: '#E0D5C5', card: '#FDFAF6', bg: '#F4EBD9',
  danger: '#BE4B48', warn: '#C07A00',
}

const OBS_LABELS = {
  odeur:       { label: 'Mauvaise odeur', emoji: '💨', color: '#BE4B48', bg: '#FAEAEA' },
  moucherons:  { label: 'Moucherons',     emoji: '🦟', color: '#7A4A2D', bg: '#F5E8E3' },
  trop_sec:    { label: 'Trop sec',       emoji: '🌵', color: '#C07A00', bg: '#FEF3E2' },
  trop_humide: { label: 'Trop humide',    emoji: '💧', color: '#3A7AC0', bg: '#E3EEFA' },
}

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NotificationBell({ notifications, onMarkRead, onMarkAllRead }) {
  const [open, setOpen] = useState(false)
  const unread = notifications.filter(n => !n.read).length

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: unread > 0 ? '#FEF3E2' : 'transparent',
          border: `1px solid ${unread > 0 ? '#EDBC60' : C.border}`,
          borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.text,
          position: 'relative',
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            background: C.danger, color: '#fff', borderRadius: '50%',
            width: 18, height: 18, fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          />
          {/* Panel */}
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8,
            width: 380, maxHeight: 520, overflowY: 'auto',
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 100,
          }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                Alertes {unread > 0 && <span style={{ color: C.danger }}>({unread})</span>}
              </p>
              {unread > 0 && (
                <button onClick={onMarkAllRead} style={{ background: 'transparent', border: 'none', fontSize: 12, color: C.muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: C.muted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <p style={{ fontSize: 14 }}>Aucune alerte</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '14px 18px',
                    borderBottom: `1px solid ${C.border}`,
                    background: n.read ? C.card : '#FFFBF0',
                    cursor: 'pointer',
                  }}
                  onClick={() => !n.read && onMarkRead(n.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.text }}>{n.siteName}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>{fmtDate(n.date)}</p>
                    </div>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.danger, marginTop: 4, flexShrink: 0 }} />}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(n.observations || []).map(id => {
                      const o = OBS_LABELS[id] || { label: id, emoji: '⚠️', color: C.muted, bg: '#F0EFEA' }
                      return (
                        <span key={id} style={{ background: o.bg, color: o.color, padding: '2px 9px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {o.emoji} {o.label}
                        </span>
                      )
                    })}
                  </div>
                  {n.commentaire && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: C.muted, fontStyle: 'italic' }}>"{n.commentaire}"</p>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
