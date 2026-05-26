import { useState } from 'react'

const C = {
  green: '#2D5A27', text: '#1C2B19', muted: '#7A8470',
  border: '#E0D5C5', card: '#FDFAF6', bg: '#F4EBD9',
}

const ADMIN_SECTIONS = [
  {
    title: 'Navigation',
    icon: '🗺️',
    content: [
      { q: 'Comment accéder à un site ?', a: 'Cliquez sur la carte de site dans le tableau de bord pour voir son détail : historique, graphiques, carte et référents.' },
      { q: 'Comment ajouter un nouveau site ?', a: 'Bouton "+ Nouveau site" dans le tableau de bord. Renseignez le nom, l\'adresse, un code d\'accès unique et les coordonnées GPS pour la carte.' },
      { q: 'Comment changer le code d\'un site ?', a: 'Ouvrez la fiche du site → le code est affiché avec un bouton "Modifier" à côté.' },
    ]
  },
  {
    title: 'Saisies & Données',
    icon: '✏️',
    content: [
      { q: 'Comment ajouter une saisie pour un site ?', a: 'Ouvrez la fiche du site → bouton "Ajouter une saisie pour ce site". Choisissez le type d\'action, renseignez les données et enregistrez.' },
      { q: 'Que signifie "biodéchets détournés" ?', a: 'Volume du bac d\'apport (litres) × 0,65 = kg de biodéchets détournés des ordures ménagères résiduelles (OMR). Ce calcul s\'applique uniquement lors d\'un Transfert de bac.' },
      { q: 'Comment calculer les bacs OMR évités ?', a: 'kg détournés ÷ 29,87 = nombre de bacs OMR 120L évités. Ce chiffre représente l\'équivalent en collecte d\'ordures évitée.' },
    ]
  },
  {
    title: 'Alertes & Paramètres',
    icon: '🔔',
    content: [
      { q: 'Comment configurer les alertes email ?', a: 'Bouton ⚙️ dans le header → renseignez votre email et choisissez les types de problèmes qui déclenchent une alerte.' },
      { q: 'Comment changer le code administrateur ?', a: 'Bouton ⚙️ → section "Code d\'accès administrateur" → cliquez "Modifier" et entrez le nouveau code (min. 4 caractères).' },
      { q: 'Que faire si un référent perd son code ?', a: 'Ouvrez la fiche du site → cliquez "Modifier" à côté du code → entrez un nouveau code et communiquez-le au référent.' },
    ]
  },
  {
    title: 'Exports & Événements',
    icon: '📊',
    content: [
      { q: 'Comment exporter les données en Excel ?', a: 'Bouton "📥 Exporter Excel" dans le tableau de bord (export global) ou dans la fiche site (export site uniquement). Le fichier contient un récapitulatif et toutes les saisies.' },
      { q: 'Comment ajouter un événement ?', a: 'Section "Prochains événements" → bouton "+ Événement". Choisissez la date, le type, le site concerné (ou tous les sites) et un titre.' },
    ]
  },
]

const REFERENT_SECTIONS = [
  {
    title: 'Saisir une intervention',
    icon: '✏️',
    content: [
      { q: 'Comment enregistrer une saisie ?', a: 'Bouton "✏️ Nouvelle saisie" → choisissez le type d\'action → renseignez les données → Enregistrer. C\'est tout !' },
      { q: 'Quand utiliser "Transfert de bac" ?', a: 'Lors du passage d\'un Cycloposteur ou d\'un agent SMIEEOM : mesurez le volume du bac d\'apport en litres. Ce volume × 0,65 donne le kg de biodéchets détournés.' },
      { q: 'Quand utiliser "Récolte" ?', a: 'Lors de l\'extraction du compost mûr du bac de maturation : mesurez le volume récolté en litres. Ce chiffre représente votre compost valorisé.' },
      { q: 'Que mettre dans "Observations" ?', a: 'Cochez les problèmes constatés : odeur, moucherons, trop sec, trop humide. Ces infos alertent automatiquement le coordinateur.' },
    ]
  },
  {
    title: 'Comprendre mes statistiques',
    icon: '📊',
    content: [
      { q: 'Que signifie "kg de biodéchets détournés" ?', a: 'C\'est le poids de déchets organiques qui ne sont pas partis aux ordures : volume du bac d\'apport × 0,65 kg/L.' },
      { q: 'Que signifie "compost valorisé" ?', a: 'C\'est le volume de compost mûr extrait et redistribué (jardins, espaces verts…). Mesuré en litres lors de chaque récolte.' },
      { q: 'Que sont les "bacs OMR évités" ?', a: 'L\'équivalent en nombre de bacs d\'ordures ménagères (120L) que vos biodéchets auraient rempli si non compostés.' },
    ]
  },
  {
    title: 'Mon espace',
    icon: '👤',
    content: [
      { q: 'Comment mettre à jour mes coordonnées ?', a: 'Bouton "👤 Mes infos" dans le header de votre site → renseignez nom, téléphone et email pour les 2 référents.' },
      { q: 'Puis-je voir les autres sites ?', a: 'Non, chaque référent accède uniquement à son site. Seul le coordinateur a une vue d\'ensemble.' },
    ]
  },
]

function Section({ section }) {
  const [open, setOpen] = useState(null)
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 12 }}>
        {section.icon} {section.title}
      </p>
      {section.content.map((item, i) => (
        <div key={i} style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', textAlign: 'left', padding: '11px 0', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{item.q}</span>
            <span style={{ color: C.muted, fontSize: 18, lineHeight: 1, transition: 'transform .2s', transform: open === i ? 'rotate(45deg)' : 'none' }}>+</span>
          </button>
          {open === i && (
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, paddingBottom: 14, margin: 0 }}>{item.a}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default function HelpGuide({ isAdmin, onClose }) {
  const sections = isAdmin ? ADMIN_SECTIONS : REFERENT_SECTIONS
  const title = isAdmin ? 'Guide coordinateur' : 'Guide référent'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,18,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: C.card, width: '100%', maxWidth: 600, borderRadius: '22px 22px 0 0', padding: '28px 28px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 -8px 48px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>❓ {title}</h2>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Questions fréquentes et conseils d'utilisation</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>
        {sections.map((s, i) => <Section key={i} section={s} />)}
        <div style={{ background: C.bg, borderRadius: 12, padding: '14px 18px', marginTop: 8 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            Pour toute question non couverte ici, contactez le SMIEEOM Val de Cher.
          </p>
        </div>
      </div>
    </div>
  )
}
