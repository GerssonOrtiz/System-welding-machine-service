// components/ui/CabelabLogo.tsx
// Logo SVG propio de CABELAB — reemplaza el placeholder "CL"

interface CabelabLogoProps {
  /** Tamaño en px del contenedor cuadrado. Default: 48 */
  size?: number
  /** Mostrar solo el símbolo (modo collapsed del sidebar) */
  compact?: boolean
  className?: string
}

export function CabelabLogo({ size = 48, compact = false, className = '' }: CabelabLogoProps) {
  if (compact) {
    // Versión mínima: solo el símbolo de arco eléctrico para sidebar colapsado
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="CABELAB"
      >
        {/* Fondo circular con glow sutil */}
        <circle cx="16" cy="16" r="15" fill="#00E5FF" fillOpacity="0.08" stroke="#00E5FF" strokeOpacity="0.3" strokeWidth="1" />
        {/* Símbolo: arco eléctrico / rayo de soldadora */}
        <path
          d="M11 8 L15 14 L12 14 L17 24 L21 18 L18 18 L22 8"
          stroke="#00E5FF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Punto de arco (chispa) */}
        <circle cx="16" cy="21" r="1.2" fill="#00E5FF" fillOpacity="0.7" />
      </svg>
    )
  }

  // Versión completa: símbolo + logotipo de texto
  return (
    <svg
      width={size * 3.5}
      height={size}
      viewBox="0 0 168 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CABELAB"
    >
      {/* Símbolo de arco/rayo */}
      <circle cx="24" cy="24" r="22" fill="#00E5FF" fillOpacity="0.07" stroke="#00E5FF" strokeOpacity="0.25" strokeWidth="1.2" />
      <path
        d="M17 12 L22 21 L18 21 L25 36 L31 27 L27 27 L33 12"
        stroke="#00E5FF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="25" cy="32" r="1.8" fill="#00E5FF" fillOpacity="0.65" />

      {/* Texto CABELAB */}
      <text
        x="54"
        y="30"
        fontFamily="'Inter', 'system-ui', sans-serif"
        fontWeight="700"
        fontSize="20"
        letterSpacing="3"
        fill="#F1F5F9"
      >
        CABE
      </text>
      <text
        x="119"
        y="30"
        fontFamily="'Inter', 'system-ui', sans-serif"
        fontWeight="700"
        fontSize="20"
        letterSpacing="3"
        fill="#00E5FF"
      >
        LAB
      </text>

      {/* Línea decorativa bajo el texto */}
      <line x1="54" y1="35" x2="162" y2="35" stroke="#00E5FF" strokeOpacity="0.2" strokeWidth="1" />
    </svg>
  )
}
