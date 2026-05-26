const C = {
  green: '#2D5A27', text: '#1C2B19', muted: '#7A8470',
  border: '#E0D5C5', card: '#FDFAF6', bg: '#F4EBD9',
}

export default function LegalPage({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,18,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: C.card, width: '100%', maxWidth: 640, borderRadius: '22px 22px 0 0', padding: '28px 32px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 48px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text }}>Mentions légales & CGU</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>

        <Section title="Éditeur de l'application">
          <p>CompostConnect est édité par le <strong>SMIEEOM Val de Cher</strong> (Syndicat Mixte Intercommunal d'Élimination et d'Exploitation des Ordures Ménagères du Val de Cher).</p>
          <p style={{ marginTop: 8 }}>Contact : <a href="mailto:contact@biotrifoule.fr" style={{ color: C.green }}>contact@biotrifoule.fr</a></p>
          <p style={{ marginTop: 4 }}>Site web : <a href="https://biotrifoule.fr" style={{ color: C.green }}>biotrifoule.fr</a></p>
        </Section>

        <Section title="Hébergement">
          <p><strong>Vercel Inc.</strong> — 340 Pine Street, Suite 701, San Francisco, CA 94104, USA<br /><a href="https://vercel.com" style={{ color: C.green }}>vercel.com</a></p>
          <p style={{ marginTop: 8 }}><strong>Base de données :</strong> Google Firebase (Firestore) — région Europe Ouest (eur3)</p>
        </Section>

        <Section title="Données personnelles">
          <p>L'application collecte et traite les données suivantes :</p>
          <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
            <li>Nom, téléphone et email des référents de sites</li>
            <li>Données de suivi du compostage (volumes, dates, observations)</li>
          </ul>
          <p style={{ marginTop: 8 }}>Ces données sont utilisées exclusivement dans le cadre du suivi des composteurs partagés par le SMIEEOM Val de Cher.</p>
          <p style={{ marginTop: 8 }}>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez <a href="mailto:contact@biotrifoule.fr" style={{ color: C.green }}>contact@biotrifoule.fr</a>.</p>
        </Section>

        <Section title="Conditions d'utilisation">
          <p>L'accès à CompostConnect est réservé aux référents de sites de compostage partagé et aux coordinateurs du SMIEEOM Val de Cher.</p>
          <p style={{ marginTop: 8 }}>Les codes d'accès sont personnels et confidentiels. Tout partage non autorisé est interdit.</p>
          <p style={{ marginTop: 8 }}>Les données saisies par les référents engagent leur responsabilité quant à l'exactitude des informations renseignées.</p>
        </Section>

        <Section title="Cookies">
          <p>Cette application n'utilise pas de cookies de suivi ou publicitaires. Les données de session sont stockées dans le navigateur uniquement pour le bon fonctionnement de l'application.</p>
        </Section>

        <div style={{ background: C.bg, borderRadius: 12, padding: '14px 18px', marginTop: 16 }}>
          <p style={{ fontSize: 12, color: C.muted, margin: 0, textAlign: 'center' }}>
            Document mis à jour en 2026 — SMIEEOM Val de Cher
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#2D5A27', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #E0D5C5' }}>{title}</h3>
      <div style={{ fontSize: 13, color: '#4A5A48', lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}
