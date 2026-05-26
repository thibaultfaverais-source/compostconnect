const { Resend } = require('resend');

const OBS_LABELS = {
  odeur:       { label: 'Mauvaise odeur', emoji: '💨', color: '#BE4B48' },
  moucherons:  { label: 'Moucherons',     emoji: '🦟', color: '#7A4A2D' },
  trop_sec:    { label: 'Trop sec',       emoji: '🌵', color: '#C07A00' },
  trop_humide: { label: 'Trop humide',    emoji: '💧', color: '#3A7AC0' },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { siteName, siteAddress, referentName, observations, date, commentaire, adminEmail } = req.body;
  if (!adminEmail || !observations?.length) return res.status(400).json({ error: 'Missing fields' });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const obsText = observations.map(id => OBS_LABELS[id]?.label || id).join(', ');
  const obsHtml = observations.map(id => { const o = OBS_LABELS[id] || { label: id, emoji: '⚠️', color: '#666' }; return `<span style="display:inline-block;background:${o.color}20;color:${o.color};border:1px solid ${o.color}40;padding:4px 12px;border-radius:20px;font-size:14px;font-weight:600;margin:0 4px 4px 0;">${o.emoji} ${o.label}</span>`; }).join('');
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4EBD9;font-family:Arial,sans-serif;"><div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;"><div style="background:#2D5A27;padding:28px 32px;text-align:center;"><div style="font-size:36px;">🌿</div><h1 style="color:#fff;margin:8px 0 0;font-size:22px;">CompostConnect</h1><p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:14px;">Alerte composteur partagé</p></div><div style="background:#FEF3E2;border-left:4px solid #C07A00;padding:16px 32px;"><p style="margin:0;font-weight:700;color:#8B5E00;">⚠️ Intervention recommandée</p><p style="margin:4px 0 0;color:#A07020;font-size:13px;">Un problème a été signalé sur l'un de vos sites</p></div><div style="padding:28px 32px;"><div style="background:#F4EBD9;border-radius:10px;padding:16px 20px;margin-bottom:20px;"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#7A8470;text-transform:uppercase;">Site concerné</p><p style="margin:0;font-size:18px;font-weight:700;color:#1C2B19;">${siteName}</p>${siteAddress ? `<p style="margin:4px 0 0;font-size:13px;color:#7A8470;">📍 ${siteAddress}</p>` : ''}${referentName ? `<p style="margin:4px 0 0;font-size:13px;color:#7A8470;">👤 ${referentName}</p>` : ''}</div><p style="margin:0 0 8px;font-size:13px;color:#7A8470;">📅 ${dateFormatted}</p><p style="margin:16px 0 8px;font-size:13px;font-weight:700;color:#1C2B19;">Problèmes signalés :</p><div style="margin-bottom:20px;">${obsHtml}</div>${commentaire ? `<div style="background:#F9F5EE;border-radius:8px;padding:14px 16px;"><p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#7A8470;">Commentaire</p><p style="margin:0;font-size:14px;color:#4A5A48;font-style:italic;">"${commentaire}"</p></div>` : ''}<div style="text-align:center;margin-top:24px;"><a href="https://biotrifoule.fr" style="display:inline-block;background:#2D5A27;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;">Voir le tableau de bord →</a></div></div><div style="padding:20px 32px;border-top:1px solid #E0D5C5;text-align:center;"><p style="margin:0;font-size:12px;color:#7A8470;">CompostConnect — SMIEEOM Val de Cher</p></div></div></body></html>`;
  try {
    const result = await resend.emails.send({ from: 'CompostConnect <contact@biotrifoule.fr>', to: adminEmail, subject: `⚠️ Alerte — ${siteName} : ${obsText}`, html });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: error.message });
  }
};
