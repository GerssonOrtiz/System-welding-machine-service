'use client';

import React from 'react';

interface QuadDragonProps {
  action: 'walk' | 'fly' | 'idle' | 'attack' | 'hit' | 'celebrate';
  direction: 'left' | 'right';
  tick: number;
}

export function QuadrupedDragonAI({ action, direction, tick }: QuadDragonProps) {
  const isFlying = action === 'fly';
  const isWalking = action === 'walk';
  const isAttacking = action === 'attack';
  const isHit = action === 'hit';

  // Ciclo de animación para 4 patas
  const legCycle1 = isWalking ? Math.sin(tick * 0.4) * 14 : 0;
  const legCycle2 = isWalking ? Math.sin(tick * 0.4 + Math.PI) * 14 : 0;
  const wingAngle = isFlying
    ? Math.sin(tick * 0.5) * 35
    : isAttacking
    ? 25
    : Math.sin(tick * 0.15) * 8;
  const bodyBob = isWalking ? Math.abs(Math.sin(tick * 0.4)) * 4 : isFlying ? Math.sin(tick * 0.25) * 8 : 0;
  const tailSway = Math.sin(tick * 0.3) * 12;

  return (
    <div
      className="relative select-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
      style={{
        transform: `scaleX(${direction === 'left' ? -1 : 1}) translateY(${bodyBob}px)`,
        transition: 'transform 0.1s linear',
        width: 140,
        height: 100,
      }}
    >
      <svg
        viewBox="0 0 160 120"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradientes y efectos de energía de plasma */}
          <linearGradient id="dragonCeramic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="dragonTitanium" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="cyanPlasma" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="70%" stopColor="#8B5CF6" />
          </linearGradient>
          <filter id="glowCyan" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pata Trasera Lejana */}
        <g transform={`translate(${45 + legCycle2 * 0.6}, ${65}) rotate(${-legCycle2 * 1.5})`}>
          <path d="M0,0 L6,22 L15,22 L10,0 Z" fill="#1E293B" />
          <path d="M6,22 L15,22 L17,25 L5,25 Z" fill="#0F172A" />
        </g>

        {/* Pata Delantera Lejana */}
        <g transform={`translate(${105 + legCycle1 * 0.6}, ${65}) rotate(${-legCycle1 * 1.5})`}>
          <path d="M0,0 L5,22 L14,22 L8,0 Z" fill="#1E293B" />
          <path d="M5,22 L14,22 L16,25 L4,25 Z" fill="#0F172A" />
        </g>

        {/* Cola Articulada con punta geométrica */}
        <g transform={`translate(28, 55) rotate(${tailSway})`}>
          {/* Segmentos de cola */}
          <path
            d="M0,0 Q-15,4 -28,-4 Q-40,-12 -52,-2"
            fill="none"
            stroke="url(#dragonCeramic)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M0,0 Q-15,4 -28,-4 Q-40,-12 -52,-2"
            fill="none"
            stroke="#1E293B"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Punta de plasma en rombo luminoso */}
          <polygon
            points="-54,-2 -62,-8 -72,-2 -62,4"
            fill="#00E5FF"
            filter="url(#glowCyan)"
          />
          <circle cx="-62" cy="-2" r="2.5" fill="#FFFFFF" />
        </g>

        {/* Ala Trasera (Membrana cian-violeta) */}
        <g
          transform={`translate(68, 38) rotate(${-30 - wingAngle * 0.8})`}
          style={{ transformOrigin: '0% 100%' }}
        >
          <path
            d="M0,0 L-25,-32 L15,-40 L28,-18 Z"
            fill="url(#cyanPlasma)"
            opacity="0.75"
            filter="url(#glowCyan)"
          />
          <path
            d="M0,0 L-25,-32 L-20,-33 L5,-12 Z"
            fill="#1E293B"
          />
        </g>

        {/* Cuerpo Cuadrúpedo Robusto */}
        {/* Armadura base */}
        <rect
          x="32"
          y="38"
          width="75"
          height="32"
          rx="16"
          fill="url(#dragonCeramic)"
          stroke="#94A3B8"
          strokeWidth="1.5"
        />
        {/* Placas de titanio lateral */}
        <path
          d="M48,46 L90,46 Q95,58 88,64 L52,64 Z"
          fill="url(#dragonTitanium)"
          opacity="0.9"
        />
        {/* Núcleo de energía en el pecho */}
        <circle
          cx="88"
          cy="55"
          r="7"
          fill="#00E5FF"
          filter="url(#glowCyan)"
        />
        <circle cx="88" cy="55" r="3.5" fill="#FFFFFF" />

        {/* Cuello y Cabeza */}
        <g transform="translate(98, 44)">
          {/* Cuello robusto */}
          <path d="M0,6 L18,-6 L24,14 L0,18 Z" fill="url(#dragonCeramic)" />
          {/* Cabeza */}
          <path
            d="M12,-16 L38,-14 Q48,-6 44,8 L16,10 Z"
            fill="url(#dragonCeramic)"
            stroke="#94A3B8"
            strokeWidth="1"
          />
          {/* Cuernos cortos elegantes */}
          <path
            d="M16,-16 L2,-26 L12,-20 Z"
            fill="#1E293B"
          />
          <path
            d="M24,-16 L12,-28 L22,-20 Z"
            fill="#1E293B"
          />
          {/* Visor negro curvo con ojos cian */}
          <path
            d="M26,-8 L42,-4 Q43,2 38,5 L24,2 Z"
            fill="#090D1A"
          />
          {/* Expresión del visor */}
          {isHit ? (
            // Ojos en X cuando recibe golpe
            <g stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
              <line x1="30" y1="-3" x2="36" y2="2" />
              <line x1="36" y1="-3" x2="30" y2="2" />
            </g>
          ) : isAttacking ? (
            // Ojos afilados en ataque
            <path
              d="M28,-1 L38,-3 L34,2 Z"
              fill="#00E5FF"
              filter="url(#glowCyan)"
            />
          ) : (
            // Ojos curvados amistosos
            <path
              d="M29,-1 Q34,-5 38,-1"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#glowCyan)"
            />
          )}

          {/* Fogonazo de plasma si está atacando */}
          {isAttacking && (
            <g transform="translate(44, 2)" filter="url(#glowCyan)">
              <circle cx="10" cy="0" r="8" fill="#00E5FF" opacity="0.8" />
              <circle cx="14" cy="0" r="4" fill="#FFFFFF" />
              <line x1="16" y1="0" x2="40" y2="0" stroke="#00E5FF" strokeWidth="6" strokeLinecap="round" />
            </g>
          )}
        </g>

        {/* Pata Trasera Cercana */}
        <g transform={`translate(${42 + legCycle1 * 0.8}, ${66}) rotate(${legCycle1 * 1.8})`}>
          <path d="M0,0 L-2,14 L6,25 L16,25 L8,0 Z" fill="url(#dragonCeramic)" stroke="#94A3B8" strokeWidth="0.8" />
          <path d="M4,22 L16,22 L18,25 L5,25 Z" fill="#1E293B" />
        </g>

        {/* Pata Delantera Cercana */}
        <g transform={`translate(${94 + legCycle2 * 0.8}, ${66}) rotate(${legCycle2 * 1.8})`}>
          <path d="M0,0 L2,14 L8,25 L18,25 L10,0 Z" fill="url(#dragonCeramic)" stroke="#94A3B8" strokeWidth="0.8" />
          <path d="M6,22 L18,22 L20,25 L7,25 Z" fill="#1E293B" />
        </g>

        {/* Ala Delantera Principal */}
        <g
          transform={`translate(64, 40) rotate(${wingAngle})`}
          style={{ transformOrigin: '0% 100%' }}
        >
          {/* Estructura de titanio */}
          <path
            d="M0,0 L-10,-40 L28,-46 L8,-12 Z"
            fill="#1E293B"
          />
          {/* Membrana de plasma brillante */}
          <path
            d="M-8,-38 Q18,-54 44,-24 L8,-10 Z"
            fill="url(#cyanPlasma)"
            opacity="0.88"
            filter="url(#glowCyan)"
          />
          <circle cx="18" cy="-35" r="2.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}
