// components/dashboard/pet/PixelToothlessDragon.tsx
'use client'

import React from 'react'
import { DragonAction, DragonDirection } from './types'

interface PixelToothlessDragonProps {
  action: DragonAction
  direction: DragonDirection
  isBlinking?: boolean
  frameStep?: number
  scale?: number
}

/**
 * Renderizador SVG nativo estilo pixel art para Chimuelo (Night Fury Toothless)
 * Paleta:
 * - Piel / Escamas: #0c0d12, #161922, #232836 (obsidiana y grafito con reflejos)
 * - Ojos: #10b981 (esmeralda vivo), #059669 (borde), #34d399 (pupila reflectante)
 * - Chispas / Plasma: #00D2FF, #38bdf8, #ffffff
 * - Pescadito snack: #f97316 (salmón asado), #e2e8f0 (espinas), #ef4444 (brasa)
 */
export function PixelToothlessDragon({
  action,
  direction,
  isBlinking = false,
  frameStep = 0,
  scale = 2.4,
}: PixelToothlessDragonProps) {
  // Dimensiones base del lienzo pixel art
  const width = 64
  const height = 52

  const isFlipped = direction === 'left'

  // Variaciones de patas según frameStep para 'walk'
  const isWalkStep = action === 'walk' && frameStep % 2 === 1
  const isTumble = action === 'tumble'
  const isSleeping = action === 'sleep'
  const isDragging = action === 'drag'
  const isFalling = action === 'fall'
  const isSpurtingSpark = action === 'spark'
  const isEatingSnack = action === 'snack'

  return (
    <div
      className="relative select-none pointer-events-none transition-transform duration-75"
      style={{
        width: `${width * scale}px`,
        height: `${height * scale}px`,
        transform: `${isFlipped ? 'scaleX(-1)' : 'scaleX(1)'} ${
          isTumble ? 'rotate(180deg)' : ''
        }`,
        transformOrigin: 'center bottom',
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        className="w-full h-full"
        style={{
          shapeRendering: 'crispEdges',
          imageRendering: 'pixelated',
        }}
      >
        <defs>
          <filter id="plasma-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#00D2FF" floodOpacity="0.8" />
          </filter>
          <filter id="fire-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#f97316" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* ── COLA Y ALETA TIMÓN ROJA / NEGRA DE CHIMUELO ── */}
        <g id="dragon-tail">
          {/* Cola curva */}
          <rect x="6" y="32" width="6" height="4" fill="#0f1117" />
          <rect x="2" y="30" width="6" height="4" fill="#161922" />
          <rect x="0" y="26" width="4" height="6" fill="#161922" />
          
          {/* Aletas caudales (una negra original, una roja con calavera sutil / prótesis) */}
          <rect x="0" y="22" width="4" height="5" fill="#e11d48" /> {/* Aleta prótesis roja de Hipo */}
          <rect x="1" y="23" width="2" height="2" fill="#ffffff" /> {/* Detalle blanco */}
          <rect x="2" y="31" width="4" height="4" fill="#0c0d12" /> {/* Aleta inferior negra */}
        </g>

        {/* ── ALAS (Plegadas o Desplegadas al caer/arrastrar) ── */}
        <g id="dragon-wings">
          {isDragging || isFalling ? (
            /* Alas abiertas planeando / pataleando */
            <g id="wings-open">
              <path
                d="M 18 20 L 10 10 L 18 13 L 26 8 L 25 22 Z"
                fill="#161922"
                stroke="#0c0d12"
                strokeWidth="1"
              />
              <rect x="12" y="12" width="10" height="2" fill="#232836" />
              <rect x="15" y="15" width="8" height="2" fill="#1e222e" />
            </g>
          ) : (
            /* Alas plegadas sobre el lomo */
            <g id="wings-folded">
              <rect x="18" y="24" width="12" height="4" fill="#1e222e" />
              <rect x="20" y="22" width="9" height="3" fill="#2a3040" />
              <rect x="22" y="20" width="5" height="3" fill="#161922" />
            </g>
          )}
        </g>

        {/* ── CUERPO PRINCIPAL ── */}
        <g id="dragon-body">
          {/* Sombra base en suelo */}
          {!isDragging && !isFalling && (
            <ellipse cx="32" cy="48" rx="20" ry="3.5" fill="#000000" fillOpacity="0.35" />
          )}

          {/* Torso robusto */}
          <rect x="12" y="26" width="26" height="15" rx="3" fill="#161922" />
          <rect x="14" y="28" width="22" height="11" fill="#1c212d" />
          {/* Escamas de lomo */}
          <rect x="16" y="25" width="2" height="2" fill="#2e3547" />
          <rect x="22" y="25" width="2" height="2" fill="#2e3547" />
          <rect x="28" y="25" width="2" height="2" fill="#2e3547" />
          <rect x="34" y="25" width="2" height="2" fill="#2e3547" />

          {/* Pecho con reflejo grafito */}
          <rect x="26" y="32" width="10" height="7" rx="1" fill="#12151c" />
        </g>

        {/* ── PATITAS (Animadas al caminar o patalear) ── */}
        <g id="dragon-legs">
          {isDragging ? (
            /* Pataleo en el aire */
            <>
              <rect x="14" y="40" width="4" height="6" fill="#0c0d12" />
              <rect x="13" y="45" width="6" height="3" fill="#161922" />
              <rect x="24" y="39" width="4" height="7" fill="#0c0d12" />
              <rect x="23" y="45" width="6" height="3" fill="#161922" />
              <rect x="34" y="41" width="4" height="6" fill="#0c0d12" />
              <rect x="34" y="46" width="6" height="3" fill="#161922" />
            </>
          ) : isWalkStep ? (
            /* Frame 2 de caminata */
            <>
              <rect x="15" y="41" width="5" height="5" fill="#0c0d12" />
              <rect x="14" y="45" width="6" height="3" fill="#161922" />
              <rect x="24" y="40" width="5" height="4" fill="#0c0d12" />
              <rect x="25" y="44" width="6" height="3" fill="#161922" />
              <rect x="34" y="40" width="5" height="6" fill="#0c0d12" />
              <rect x="33" y="45" width="6" height="3" fill="#161922" />
            </>
          ) : (
            /* Frame 1 o descanso */
            <>
              <rect x="14" y="40" width="5" height="6" fill="#0c0d12" />
              <rect x="13" y="45" width="6" height="3" fill="#161922" />
              <rect x="25" y="41" width="5" height="5" fill="#0c0d12" />
              <rect x="24" y="45" width="6" height="3" fill="#161922" />
              <rect x="35" y="41" width="5" height="5" fill="#0c0d12" />
              <rect x="35" y="45" width="6" height="3" fill="#161922" />
            </>
          )}
        </g>

        {/* ── CABEZA DE CHIMUELO (Grande, expresiva y con orejitas/alerones) ── */}
        <g id="dragon-head">
          {/* Cuello */}
          <rect x="32" y="24" width="8" height="9" fill="#161922" />

          {/* Base cabeza */}
          <rect x="34" y="13" width="22" height="16" rx="4" fill="#161922" />
          <rect x="36" y="15" width="19" height="13" fill="#1a1e29" />

          {/* Orejitas principales (alerones de dragón Furia Nocturna) */}
          {/* Oreja superior trasera */}
          <polygon points="36,13 31,4 39,9" fill="#12151c" />
          <polygon points="36,12 33,6 38,10" fill="#242b3b" />
          {/* Oreja superior delantera */}
          <polygon points="42,13 42,3 47,9" fill="#161922" />
          <polygon points="43,12 43,5 46,10" fill="#2b3346" />
          {/* Orejitas laterales secundarias */}
          <polygon points="34,18 29,15 34,16" fill="#12151c" />
          <polygon points="34,22 28,21 34,20" fill="#12151c" />

          {/* Morro / Hocico redondeado */}
          <rect x="49" y="19" width="9" height="8" rx="3" fill="#161922" />
          <rect x="52" y="22" width="2" height="2" fill="#0c0d12" /> {/* Narina */}

          {/* Ojos grandes esmeralda */}
          {isSleeping ? (
            /* Ojos cerrados durmiendo: línea suave */
            <g id="eyes-sleeping">
              <path d="M 43 20 Q 47 23 51 20" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          ) : isBlinking ? (
            /* Ojos parpadeando */
            <rect x="43" y="21" width="8" height="2" rx="1" fill="#10b981" />
          ) : (
            /* Ojos abiertos luminosos */
            <g id="eyes-open">
              {/* Esclerótica esmeralda */}
              <ellipse cx="47" cy="20" rx="4.5" ry="5.5" fill="#10b981" />
              {/* Brillo interior verdoso claro */}
              <ellipse cx="46.5" cy="19.5" rx="3.5" ry="4.5" fill="#34d399" />
              {/* Pupila de gato/reptil negra */}
              <ellipse cx="47" cy="20" rx="1.6" ry="4" fill="#09261a" />
              {/* Reflejos de luz especular blanca */}
              <circle cx="45.5" cy="18" r="1.2" fill="#ffffff" />
              <circle cx="48" cy="22" r="0.7" fill="#ffffff" />
            </g>
          )}

          {/* Sonrisa sutil / Lengüita rosada traviesa */}
          {isEatingSnack ? (
            <rect x="52" y="25" width="4" height="2" fill="#f43f5e" rx="1" />
          ) : (
            <path d="M 52 25 Q 55 27 57 24" stroke="#0c0d12" strokeWidth="1" fill="none" />
          )}
        </g>

        {/* ── TRAVESURA 1: CHISPITA DE PLASMA / ARCO ELÉCTRICO ── */}
        {isSpurtingSpark && (
          <g id="plasma-spark" filter="url(#plasma-glow)">
            {/* Bola de plasma azul saliendo de la boca */}
            <circle cx="61" cy="23" r="3.5" fill="#00D2FF" />
            <circle cx="61" cy="23" r="1.8" fill="#ffffff" />
            {/* Rayos / chispas eléctricas */}
            <path d="M 62 20 L 66 17 L 64 21 L 68 19" stroke="#38bdf8" strokeWidth="1.2" fill="none" />
            <path d="M 62 25 L 67 27 L 65 24 L 69 25" stroke="#00D2FF" strokeWidth="1" fill="none" />
            <rect x="58" y="26" width="2" height="2" fill="#ffffff" />
            <rect x="65" y="22" width="1.5" height="1.5" fill="#ffffff" />
          </g>
        )}

        {/* ── TRAVESURA 2: PESCADITO TOSTADO CON LLAMARADA ── */}
        {isEatingSnack && (
          <g id="roasted-snack" filter="url(#fire-glow)">
            {/* Pescadito asado en brocheta */}
            <line x1="53" y1="26" x2="63" y2="28" stroke="#78350f" strokeWidth="1.5" />
            {/* Cuerpo del pescadito */}
            <ellipse cx="60" cy="27" rx="3.5" ry="2" fill="#f97316" />
            {/* Colita del pez */}
            <polygon points="63,27 65,25 65,29" fill="#ea580c" />
            {/* Ojo del pez */}
            <circle cx="58" cy="26.5" r="0.6" fill="#1c1917" />
            {/* Humo aromático */}
            <circle cx="60" cy="23" r="1" fill="#e2e8f0" fillOpacity="0.6" />
            <circle cx="62" cy="20" r="1.5" fill="#cbd5e1" fillOpacity="0.4" />
          </g>
        )}

        {/* ── TRAVESURA 3: Zzz DURMIENDO ── */}
        {isSleeping && (
          <g id="sleep-bubbles" className="animate-pulse">
            <text x="49" y="10" fill="#38bdf8" fontSize="6" fontFamily="monospace" fontWeight="bold">
              z
            </text>
            <text x="54" y="6" fill="#00D2FF" fontSize="7" fontFamily="monospace" fontWeight="bold">
              Z
            </text>
            <text x="59" y="2" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold">
              Z
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
