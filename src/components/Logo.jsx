export function LogoIcon({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#2D5A27"/>
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>

      {/* Earth / compost mound */}
      <path d="M20 63 Q50 50 80 63 Q80 74 50 74 Q20 74 20 63Z" fill="rgba(255,255,255,0.18)"/>

      {/* Stem */}
      <rect x="48" y="33" width="4" height="31" rx="2" fill="white"/>

      {/* Left leaf */}
      <path d="M50 47 C42 39 29 41 27 50 C34 54 44 51 50 47Z" fill="white"/>

      {/* Right leaf */}
      <path d="M50 38 C58 29 71 32 73 42 C66 46 57 43 50 38Z" fill="white"/>

      {/* Connection nodes */}
      <circle cx="29" cy="77" r="3.5" fill="white" opacity="0.65"/>
      <circle cx="50" cy="81" r="3.5" fill="white" opacity="0.65"/>
      <circle cx="71" cy="77" r="3.5" fill="white" opacity="0.65"/>

      {/* Connection lines */}
      <path d="M32 76 L47 80 M53 80 L68 76"
            stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function LogoFull({ size = 48, dark = false }) {
  const textColor = dark ? '#2D5A27' : '#ffffff'
  const subColor = dark ? '#7A8470' : 'rgba(255,255,255,0.75)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <LogoIcon size={size} />
      <div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: size * 0.52,
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}>
          Compost<span style={{ fontStyle: 'italic' }}>Connect</span>
        </div>
        <div style={{ fontSize: size * 0.25, color: subColor, marginTop: 2 }}>
          SMIEEOM Val de Cher
        </div>
      </div>
    </div>
  )
}

export default LogoIcon
