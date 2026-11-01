'use client';

import React from 'react';

interface ArticulatedDragonProps {
  action: 'walk' | 'run' | 'fly' | 'attack' | 'hit' | 'idle';
  direction: 'left' | 'right';
  tick: number;
}

export function ArticulatedDragonAI({ action, direction, tick }: ArticulatedDragonProps) {
  const isWalking = action === 'walk' || action === 'run';
  const isFlying = action === 'fly';
  const isAttacking = action === 'attack';
  const isHit = action === 'hit';

  // Frecuencias y ciclos de movimiento
  const speedMult = action === 'run' ? 0.6 : 0.4;
  const legCycleA = isWalking ? Math.sin(tick * speedMult) : 0;
  const legCycleB = isWalking ? Math.sin(tick * speedMult + Math.PI) : 0;
  const legCycleC = isWalking ? Math.sin(tick * speedMult + Math.PI * 0.5) : 0;
  const legCycleD = isWalking ? Math.sin(tick * speedMult + Math.PI * 1.5) : 0;

  // Movimiento de cuerpo
  const spineBob = isWalking ? Math.abs(Math.sin(tick * speedMult)) * 3.5 : isFlying ? Math.sin(tick * 0.2) * 8 : 0;
  const bodyPitch = isWalking ? (direction === 'right' ? 3 : -3) : isFlying ? (direction === 'right' ? 10 : -10) : 0;

  // Alas
  const wingBeat = isFlying ? Math.sin(tick * 0.45) * 45 : isAttacking ? 25 : Math.sin(tick * 0.15) * 8;

  // Cola
  const tailWave1 = Math.sin(tick * 0.25) * 12;
  const tailWave2 = Math.sin(tick * 0.25 - 0.5) * 16;
  const tailWave3 = Math.sin(tick * 0.25 - 1.0) * 20;

  // Cuello y Cabeza
  const headBob = isWalking ? Math.sin(tick * speedMult) * 4 : isAttacking ? 8 : 0;

  return (
    <div
      className="relative select-none filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
      style={{
        transform: `scaleX(${direction === 'left' ? -1 : 1}) translateY(${spineBob}px) rotate(${bodyPitch}deg)`,
        transition: 'transform 0.08s ease-out',
        width: 145,
        height: 105,
      }}
    >
      <svg
        viewBox="0 0 160 115"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Cerámica blanca perlada */}
          <linearGradient id="ceramicPearl" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F1F5F9" />
            <stop offset="85%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Titanio oscuro cepillado */}
          <linearGradient id="titaniumDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Membrana de energía Cian-Violeta */}
          <linearGradient id="cyanVioletPlasma" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#38BDF8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.95" />
          </linearGradient>

          {/* Resplandor Cian Neón */}
          <filter id="neonGlowCyan" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── 1. PATAS LEJANAS (Fondo) ── */}
        {/* Pata Trasera Lejana (Muslo + Espinilla + Garra) */}
        <g transform={`translate(${48}, 62) rotate(${legCycleB * 24})`}>
          <path d="M-6,-4 L10,-4 L12,14 L-2,14 Z" fill="url(#titaniumDark)" />
          {/* Rodilla / Articulación */}
          <circle cx="5" cy="14" r="3.5" fill="#475569" />
          {/* Espinilla y garra */}
          <g transform={`translate(5, 14) rotate(${legCycleB * -18 + 10})`}>
            <path d="M-3,0 L4,0 L7,18 L-2,18 Z" fill="#1E293B" />
            {/* Garra */}
            <path d="M-4,18 L10,18 L12,22 L-5,22 Z" fill="#090D1A" />
          </g>
        </g>

        {/* Pata Delantera Lejana */}
        <g transform={`translate(${102}, 62) rotate(${legCycleC * 22})`}>
          <path d="M-5,-4 L8,-4 L10,14 L-2,14 Z" fill="url(#titaniumDark)" />
          <circle cx="4" cy="14" r="3.5" fill="#475569" />
          <g transform={`translate(4, 14) rotate(${legCycleC * -16 + 8})`}>
            <path d="M-3,0 L4,0 L6,18 L-2,18 Z" fill="#1E293B" />
            <path d="M-4,18 L9,18 L11,22 L-5,22 Z" fill="#090D1A" />
          </g>
        </g>

        {/* ── 2. ALA TRASERA (Fondo) ── */}
        <g
          transform={`translate(74, 38) rotate(${-25 - wingBeat * 0.7})`}
          style={{ transformOrigin: '0% 100%' }}
        >
          {/* Brazo del ala */}
          <path d="M0,0 L-20,-34 L12,-44 L28,-18 Z" fill="url(#cyanVioletPlasma)" filter="url(#neonGlowCyan)" />
          <path d="M0,0 L-20,-34 L-15,-35 L4,-12 Z" fill="url(#titaniumDark)" />
        </g>

        {/* ── 3. COLA ARTICULADA DE 3 SEGMENTOS ── */}
        <g transform="translate(32, 54)">
          {/* Segmento 1 de cola */}
          <g transform={`rotate(${tailWave1})`}>
            <rect x="-18" y="-6" width="22" height="12" rx="6" fill="url(#ceramicPearl)" stroke="#64748B" strokeWidth="0.8" />
            <circle cx="-16" cy="0" r="3" fill="#1E293B" />

            {/* Segmento 2 de cola */}
            <g transform={`translate(-18, 0) rotate(${tailWave2})`}>
              <rect x="-16" y="-5" width="20" height="10" rx="5" fill="url(#ceramicPearl)" stroke="#64748B" strokeWidth="0.8" />
              <circle cx="-14" cy="0" r="2.5" fill="#1E293B" />

              {/* Segmento 3 de cola + Punta Geométrica */}
              <g transform={`translate(-16, 0) rotate(${tailWave3})`}>
                <polygon points="0,-4 -12,-3 -12,3 0,4" fill="url(#titaniumDark)" />
                {/* Punta de plasma en diamante luminiscente */}
                <polygon points="-12,0 -20,-8 -32,0 -20,8" fill="#00E5FF" filter="url(#neonGlowCyan)" />
                <circle cx="-20" cy="0" r="3" fill="#FFFFFF" />
              </g>
            </g>
          </g>
        </g>

        {/* ── 4. TORSO Y COSTILLAS CERÁMICAS CUADRÚPEDAS ── */}
        <g transform="translate(36, 36)">
          {/* Placas base del torso */}
          <rect x="0" y="0" width="70" height="34" rx="17" fill="url(#ceramicPearl)" stroke="#94A3B8" strokeWidth="1.2" />
          {/* Armadura de titanio ventral y lateral */}
          <path d="M14,10 L56,10 Q62,24 54,30 L18,30 Z" fill="url(#titaniumDark)" />

          {/* Núcleo de energía de plasma circular en el pecho */}
          <g transform="translate(52, 17)">
            <circle cx="0" cy="0" r="8" fill="#00E5FF" filter="url(#neonGlowCyan)" />
            <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="10" fill="none" stroke="#00E5FF" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
          </g>
        </g>

        {/* ── 5. CUELLO Y CABEZA ROBÓTICA ARTICULADA ── */}
        <g transform={`translate(96, ${42 + headBob})`}>
          {/* Cuello articulado con pistón */}
          <path d="M0,4 L18,-6 L26,14 L0,18 Z" fill="url(#ceramicPearl)" stroke="#64748B" strokeWidth="0.8" />
          <line x1="4" y1="14" x2="16" y2="2" stroke="#00E5FF" strokeWidth="2" filter="url(#neonGlowCyan)" />

          {/* Cabeza de dragón */}
          <g transform="translate(14, -6)">
            {/* Casco cerámico estilizado */}
            <path
              d="M0,-8 L26,-6 Q38,2 34,16 L8,16 Q-4,10 0,-8 Z"
              fill="url(#ceramicPearl)"
              stroke="#94A3B8"
              strokeWidth="1"
            />

            {/* Dos cuernos aerodinámicos elegantes */}
            <path d="M4,-8 L-8,-20 L0,-12 Z" fill="url(#titaniumDark)" />
            <path d="M12,-7 L2,-22 L9,-12 Z" fill="url(#titaniumDark)" />
            {/* Punta de cuerno con detalle cian */}
            <circle cx="-8" cy="-20" r="1.5" fill="#00E5FF" />
            <circle cx="2" cy="-22" r="1.5" fill="#00E5FF" />

            {/* Visor de cristal curvo negro brillante */}
            <path d="M14,-1 L30,2 Q32,8 28,12 L12,8 Z" fill="#050811" />

            {/* Expresión del visor en tiempo real */}
            {isHit ? (
              // Ojos en cruz si recibe impacto
              <g stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="3" x2="24" y2="9" />
                <line x1="24" y1="3" x2="18" y2="9" />
              </g>
            ) : isAttacking ? (
              // Ojos afilados en combate
              <polygon points="16,3 27,2 24,8 15,6" fill="#00E5FF" filter="url(#neonGlowCyan)" />
            ) : (
              // Ojos amigables curvos
              <path
                d="M17,5 Q22,0 27,5"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#neonGlowCyan)"
              />
            )}

            {/* Ráfaga de disparo de plasma en ataque */}
            {isAttacking && (
              <g transform="translate(32, 7)" filter="url(#neonGlowCyan)">
                <circle cx="6" cy="0" r="8" fill="#00E5FF" opacity="0.9" />
                <circle cx="10" cy="0" r="4" fill="#FFFFFF" />
                <path d="M12,0 L42,-2 L38,0 L42,2 Z" fill="#00E5FF" />
              </g>
            )}
          </g>
        </g>

        {/* ── 6. PATAS CERCANAS (Frente - Cuadrúpedas articuladas) ── */}
        {/* Pata Trasera Cercana: Cadera + Rodilla + Tobillo + Garras */}
        <g transform={`translate(${44}, 62) rotate(${legCycleA * 26})`}>
          {/* Muslo cerámico */}
          <path d="M-6,-4 L12,-4 L14,16 L-2,16 Z" fill="url(#ceramicPearl)" stroke="#94A3B8" strokeWidth="0.8" />
          <circle cx="6" cy="16" r="4" fill="#1E293B" />
          {/* Espinilla articulada */}
          <g transform={`translate(6, 16) rotate(${legCycleA * -20 + 12})`}>
            <path d="M-4,0 L5,0 L8,20 L-2,20 Z" fill="url(#titaniumDark)" />
            {/* Pie y garras */}
            <path d="M-4,18 L12,18 L14,24 L-6,24 Z" fill="url(#ceramicPearl)" stroke="#64748B" strokeWidth="0.6" />
            <circle cx="10" cy="22" r="1.5" fill="#00E5FF" />
          </g>
        </g>

        {/* Pata Delantera Cercana: Hombro + Codo + Muñeca + Garras */}
        <g transform={`translate(${94}, 62) rotate(${legCycleD * 24})`}>
          {/* Hombro cerámico */}
          <path d="M-6,-4 L10,-4 L12,16 L-2,16 Z" fill="url(#ceramicPearl)" stroke="#94A3B8" strokeWidth="0.8" />
          <circle cx="5" cy="16" r="4" fill="#1E293B" />
          {/* Antebrazo articulado */}
          <g transform={`translate(5, 16) rotate(${legCycleD * -18 + 10})`}>
            <path d="M-3,0 L5,0 L7,20 L-2,20 Z" fill="url(#titaniumDark)" />
            {/* Garra delantera */}
            <path d="M-4,18 L12,18 L14,24 L-5,24 Z" fill="url(#ceramicPearl)" stroke="#64748B" strokeWidth="0.6" />
            <circle cx="10" cy="22" r="1.5" fill="#00E5FF" />
          </g>
        </g>

        {/* ── 7. ALA DELANTERA PRINCIPAL (Articulada) ── */}
        <g
          transform={`translate(68, 38) rotate(${wingBeat})`}
          style={{ transformOrigin: '0% 100%' }}
        >
          {/* Hueso articulado de titanio */}
          <path d="M0,0 L-14,-42 L30,-50 L10,-12 Z" fill="url(#titaniumDark)" />
          {/* Membrana translúcida resplandeciente cian-violeta */}
          <path
            d="M-12,-40 Q22,-60 48,-24 L10,-10 Z"
            fill="url(#cyanVioletPlasma)"
            filter="url(#neonGlowCyan)"
          />
          <circle cx="18" cy="-38" r="3" fill="#FFFFFF" />
          {/* Costillas mecánicas de ala */}
          <line x1="-12" y1="-40" x2="34" y2="-28" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
