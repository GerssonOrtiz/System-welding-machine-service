// components/ui/CabelabLogo.tsx
// Logo SVG propio de CABELAB — reemplaza el placeholder "CL"

import Image from 'next/image'

interface CabelabLogoProps {
  /** Tamaño en px del contenedor/alto. Default: 48 */
  size?: number
  /** Mostrar solo el símbolo (modo collapsed del sidebar) */
  compact?: boolean
  className?: string
}

export function CabelabLogo({ size = 40, compact = false, className = '' }: CabelabLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/cabelab.png"
        alt="CABELAB"
        width={size}
        height={size}
        className="object-contain w-full h-full"
        priority
      />
    </div>
  )
}
