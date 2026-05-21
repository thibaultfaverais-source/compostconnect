import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts'

const KG_PER_LITRE = 0.65
const C = { green: '#2D5A27', brown: '#7A6B2D', blue: '#2D4F7A', border: '#E0D5C5', card: '#FDFAF6', text: '#1C2B19', muted: '#7A8470', bg: '#F4EBD9' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
      <p style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name} : <strong>{Number(p.value).toFixed(1)}</strong></p>
      ))}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 20px 12px', marginBottom: 20 }}>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16 }}>{title}</p>
      {children}
    </div>
  )
}

// Charts for a single site (by year)
export function SiteCharts({ entries }) {
  const byYear = {}
  entries.forEach(e => {
    const y = e.date?.slice(0, 4)
    if (!y) return
    if (!byYear[y]) byYear[y] = { year: y, kg: 0, lVal: 0 }
    if (e.actionType === 'transfert' && e.volumeL) byYear[y].kg += Number(e.volumeL) * KG_PER_LITRE
    if (e.actionType === 'recolte' && e.volumeL) byYear[y].lVal += Number(e.volumeL)
  })
  const data = Object.values(byYear).sort((a, b) => a.year.localeCompare(b.year))
  if (!data.length) return null

  const actions = {}
  entries.forEach(e => {
    actions[e.actionType] = (actions[e.actionType] || 0) + 1
  })
  const actionsData = Object.entries(actions)
    .map(([type, count]) => ({ type: labelAction(type), count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div style={{ marginBottom: 28 }}>
      <ChartCard title="📊 Biodéchets détournés & compost valorisé par année">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: C.muted }} />
            <YAxis tick={{ fontSize: 11, fill: C.muted }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="kg" name="Biodéchets détournés (kg)" fill={C.green} radius={[4, 4, 0, 0]} />
            <Bar dataKey="lVal" name="Compost valorisé (L)" fill={C.brown} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {actionsData.length > 0 && (
        <ChartCard title="🗂️ Répartition des interventions">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={actionsData} layout="vertical" margin={{ top: 4, right: 16, left: 80, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 12, fill: C.text }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Interventions" radius={[0, 4, 4, 0]}>
                {actionsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}

// Charts for admin dashboard (all sites)
export function AdminCharts({ sites, entries }) {
  const siteData = sites.map(s => {
    const se = entries.filter(e => e.siteId === s.id)
    const kg = se.filter(e => e.actionType === 'transfert').reduce((acc, e) => acc + (Number(e.volumeL) || 0) * KG_PER_LITRE, 0)
    const lVal = se.filter(e => e.actionType === 'recolte').reduce((acc, e) => acc + (Number(e.volumeL) || 0), 0)
    return { name: s.name.replace('-sur-Cher', '').replace('-en-Sologne', ''), kg: Math.round(kg), lVal }
  }).filter(s => s.kg > 0 || s.lVal > 0).sort((a, b) => b.kg - a.kg)

  // Evolution par mois (6 derniers mois)
  const monthData = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthData[key] = { mois: key.slice(5) + '/' + key.slice(2, 4), kg: 0 }
  }
  entries.forEach(e => {
    if (e.actionType !== 'transfert' || !e.volumeL || !e.date) return
    const key = e.date.slice(0, 7)
    if (monthData[key]) monthData[key].kg += Number(e.volumeL) * KG_PER_LITRE
  })
  const monthArray = Object.values(monthData)

  return (
    <div style={{ marginBottom: 28 }}>
      <ChartCard title="📊 Biodéchets détournés & compost valorisé par site">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={siteData} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.muted }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: C.muted }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="kg" name="Biodéchets détournés (kg)" fill={C.green} radius={[4, 4, 0, 0]} />
            <Bar dataKey="lVal" name="Compost valorisé (L)" fill={C.brown} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="📈 Évolution des biodéchets détournés (6 derniers mois)">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthArray} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mois" tick={{ fontSize: 12, fill: C.muted }} />
            <YAxis tick={{ fontSize: 11, fill: C.muted }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="kg" name="kg détournés" fill={C.green} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

const COLORS = ['#2D5A27', '#7A6B2D', '#2D4F7A', '#5C2D7A', '#4A7A6B', '#7A4A2D', '#2D7A6B']

function labelAction(id) {
  const map = {
    transfert: 'Transfert', recolte: 'Récolte', apport: 'Apport',
    brassage: 'Brassage', visite: 'Visite', manutention: 'Manutention',
    remplissage_broyat: 'Broyat',
  }
  return map[id] || id
}
