import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

const C = {
  green: '#2D5A27', brown: '#7A4F2D', text: '#1C2B19', muted: '#7A8470',
  border: '#E0D5C5', card: '#FDFAF6',
}

const TYPE_COLORS = {
  'Foyers': '#2D5A27',
  'Foyers + Cantine': '#2D4F7A',
  'Entreprises': '#5C2D7A',
  'En cours': '#C07A00',
  'Extra': '#7A8470',
}

const KG_PER_LITRE = 0.65

function createIcon(color, highlighted = false) {
  const size = highlighted ? 20 : 14
  return L.divIcon({
    html: `<div style="
      background:${color};
      width:${size}px;height:${size}px;
      border-radius:50%;
      border:${highlighted ? '3px' : '2px'} solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      transition:all .2s;
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FitBounds({ sites }) {
  const map = useMap()
  useEffect(() => {
    const valid = sites.filter(s => s.lat && s.lng)
    if (valid.length === 0) return
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 13)
    } else {
      const bounds = L.latLngBounds(valid.map(s => [s.lat, s.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [sites, map])
  return null
}

export default function SiteMap({ sites, entries = [], highlightSiteId = null, height = 360 }) {
  const validSites = sites.filter(s => s.lat && s.lng)
  if (validSites.length === 0) return null

  const center = [47.30, 1.40]

  const getKg = (siteId) => {
    return entries
      .filter(e => e.siteId === siteId && e.actionType === 'transfert')
      .reduce((s, e) => s + (Number(e.volumeL) || 0) * KG_PER_LITRE, 0)
  }

  const getLVal = (siteId) => {
    return entries
      .filter(e => e.siteId === siteId && e.actionType === 'recolte')
      .reduce((s, e) => s + (Number(e.volumeL) || 0), 0)
  }

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: 28 }}>
      <MapContainer
        center={center}
        zoom={11}
        style={{ height, width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds sites={validSites} />
        {validSites.map(site => {
          const highlighted = site.id === highlightSiteId
          const color = TYPE_COLORS[site.typeSite] || '#7A8470'
          const kg = getKg(site.id)
          const lVal = getLVal(site.id)
          return (
            <Marker
              key={site.id}
              position={[site.lat, site.lng]}
              icon={createIcon(color, highlighted)}
            >
              <Popup>
                <div style={{ fontFamily: "'DM Sans', sans-serif", minWidth: 180 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: C.text }}>{site.name}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{site.address}</p>
                  {site.referents?.[0] && (
                    <p style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>👤 {site.referents[0].nom}</p>
                  )}
                  {kg > 0 && (
                    <p style={{ fontSize: 12, color: '#2D5A27', fontWeight: 600 }}>♻️ {kg.toFixed(0)} kg détournés</p>
                  )}
                  {lVal > 0 && (
                    <p style={{ fontSize: 12, color: '#7A6B2D', fontWeight: 600 }}>🌾 {lVal} L valorisés</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      {/* Legend */}
      <div style={{ background: C.card, padding: '10px 16px', display: 'flex', gap: 16, flexWrap: 'wrap', borderTop: `1px solid ${C.border}` }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            {type}
          </div>
        ))}
      </div>
    </div>
  )
}
