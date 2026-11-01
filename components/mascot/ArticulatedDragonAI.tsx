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

  // Frecuencias de marcha cuadrúpeda anatómica
  const speed = action === 'run' ? 0.6 : 0.42;
  const legCycleA = isWalking ? Math.sin(tick * speed) : 0;
  const legCycleB = isWalking ? Math.sin(tick * speed + Math.PI) : 0;
  const legCycleC = isWalking ? Math.sin(tick * speed + Math.PI * 0.5) : 0;
  const legCycleD = isWalking ? Math.sin(tick * speed + Math.PI * 1.5) : 0;

  // Respiración y física de columna
  const breath = Math.sin(tick * 0.12) * 1.5;
  const bodyBob = isWalking ? Math.abs(Math.sin(tick * speed)) * 3 : isFlying ? Math.sin(tick * 0.2) * 7 : breath;
  const bodyPitch = isWalking ? (direction === 'right' ? 2 : -2) : isFlying ? (direction === 'right' ? 9 : -9) : 0;

  // Batimiento de alas
  const wingBeat = isFlying ? Math.sin(tick * 0.42) * 44 : isAttacking ? 28 : Math.sin(tick * 0.12) * 6;

  // Cola hiper-fluida (curva de Bézier segmentada)
  const tail1 = Math.sin(tick * 0.22) * 14;
  const tail2 = Math.sin(tick * 0.22 - 0.5) * 18;
  const tail3 = Math.sin(tick * 0.22 - 1.0) * 22;

  // Movimiento de cabeza
  const headBob = isWalking ? Math.sin(tick * speed) * 3 : isAttacking ? 6 : breath * 0.5;

  return (
    <div
      className="relative select-none filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.8)]"
      style={{
        transform: `scaleX(${direction === 'left' ? -1 : 1}) translateY(${bodyBob}px) rotate(${bodyPitch}deg)`,
        transition: 'transform 0.08s ease-out',
        width: 154,
        height: 112,
      }}
    >
      <svg
        viewBox="0 0 170 120"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Cerámica multicapa con bisel especular (Apple Ceramic Shield) */}
          <linearGradient id="cyberCeramicPure" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#F8FAFC" />
            <stop offset="65%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Titanio Cepillado Grafito Profundo */}
          <linearGradient id="cyberTitaniumPure" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="40%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0B1120" />
          </linearGradient>

          {/* Plasma Eléctrico Cian a Violeta de 4 paradas */}
          <linearGradient id="cyberPlasmaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="35%" stopColor="#38BDF8" />
            <stop offset="75%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>

          {/* Resplandor óptico de alta intensidad */}
          <filter id="bloomCyanPlasma" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Sombras de bisel interior */}
          <linearGradient id="shadowSpec" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* ── 1. PATAS LEJANAS (Plano de fondo) ── */}
        {/* Pata Trasera Lejana */}
        <g transform={`translate(52, 64) rotate(${legCycleB * 24})`}>
          <path d="M-6,-4 L12,-4 L14,16 L-2,16 Z" fill="url(#cyberTitaniumPure)" />
          <circle cx="5" cy="16" r="3.5" fill="#475569" />
          <g transform={`translate(5, 16) rotate(${legCycleB * -18 + 10})`}>
            <path d="M-3,0 L4,0 L7,18 L-2,18 Z" fill="#0F172A" />
            <path d="M-4,18 L11,18 L13,23 L-5,23 Z" fill="#020617" />
          </g>
        </g>

        {/* Pata Delantera Lejana */}
        <g transform={`translate(108, 64) rotate(${legCycleC * 22})`}>
          <path d="M-5,-4 L9,-4 L10,16 L-2,16 Z" fill="url(#cyberTitaniumPure)" />
          <circle cx="4" cy="16" r="3.5" fill="#475569" />
          <g transform={`translate(4, 16) rotate(${legCycleC * -16 + 8})`}>
            <path d="M-3,0 L4,0 L6,18 L-2,18 Z" fill="#0F172A" />
            <path d="M-4,18 L10,18 L12,23 L-5,23 Z" fill="#020617" />
          </g>
        </g>

        {/* ── 2. ALA TRASERA DE ENERGÍA (Fondo) ── */}
        <g
          transform={`translate(78, 40) rotate(${-28 - wingBeat * 0.75})`}
          style={{ transformOrigin: '0% 100%' }}
        >
          {/* Membrana translúcida brillante */}
          <path
            d="M0,0 L-22,-36 L14,-46 L30,-18 Z"
            fill="url(#cyberPlasmaGradient)"
            opacity="0.8"
            filter="url(#bloomCyanPlasma)"
          />
          {/* Hueso mecánico de titanio */}
          <path d="M0,0 L-22,-36 L-16,-37 L5,-12 Z" fill="url(#cyberTitaniumPure)" />
        </g>

        {/* ── 3. COLA ARTICULADA CON NÚCLEO GEOMÉTRICO ── */}
        <g transform="translate(34, 56)">
          {/* Segmento 1 */}
          <g transform={`rotate(${tail1})`}>
            <rect x="-18" y="-7" width="22" height="14" rx="7" fill="url(#cyberCeramicPure)" stroke="#64748B" strokeWidth="0.8" />
            <circle cx="-16" cy="0" r="3" fill="#1E293B" />

            {/* Segmento 2 */}
            <g transform={`translate(-18, 0) rotate(${tail2})`}>
              <rect x="-16" y="-6" width="20" height="12" rx="6" fill="url(#cyberCeramicPure)" stroke="#64748B" strokeWidth="0.8" />
              <line x1="-2" y1="0" x2="-14" y2="0" stroke="#00E5FF" strokeWidth="2" filter="url(#bloomCyanPlasma)" />

              {/* Segmento 3 + Diamante de Plasma */}
              <g transform={`translate(-16, 0) rotate(${tail3})`}>
                <polygon points="0,-4 -12,-3 -12,3 0,4" fill="url(#cyberTitaniumPure)" />
                {/* Punta de plasma en rombo de energía */}
                <polygon
                  points="-12,0 -22,-9 -36,0 -22,9"
                  fill="url(#cyberPlasmaGradient)"
                  filter="url(#bloomCyanPlasma)"
                />
                <circle cx="-22" cy="0" r="3" fill="#FFFFFF" />
              </g>
            </g>
          </g>
        </g>

        {/* ── 4. CHASIS Y TORSO CERÁMICO CURVO (Cyber Glass / Ceramic Shield) ── */}
        <g transform="translate(38, 36)">
          {/* Armadura de cerámica aerodinámica */}
          <rect
            x="0"
            y="0"
            width="74"
            height="36"
            rx="18"
            fill="url(#cyberCeramicPure)"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />
          {/* Bisel especular superior */}
          <path
            d="M8,4 L66,4 Q72,12 66,16 L8,16 Z"
            fill="url(#shadowSpec)"
            opacity="0.4"
          />
          {/* Panel ventral de titanio oscuro */}
          <path
            d="M16,12 L58,12 Q64,26 56,32 L20,32 Z"
            fill="url(#cyberTitaniumPure)"
          />

          {/* Núcleo de Plasma Arc Reactor en el pecho */}
          <g transform="translate(56, 18)">
            {/* Halo pulsante */}
            <circle cx="0" cy="0" r="9" fill="url(#cyberPlasmaGradient)" filter="url(#bloomCyanPlasma)" />
            {/* Núcleo interno de fusión blanca */}
            <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" />
            {/* Anillo de confinamiento magnético */}
            <circle cx="0" cy="0" r="11" fill="none" stroke="#00E5FF" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.9" />
          </g>
        </g>

        {/* ── 5. CUELLO HIDRÁULICO Y CABEZA MECHA ELEGANTE ── */}
        <g transform={`translate(100, ${42 + headBob})`}>
          {/* Pistón de titanio del cuello */}
          <path d="M0,4 L20,-6 L28,14 L0,18 Z" fill="url(#cyberCeramicPure)" stroke="#64748B" strokeWidth="0.8" />
          <line x1="6" y1="14" x2="18" y2="2" stroke="#00E5FF" strokeWidth="2.5" filter="url(#bloomCyanPlasma)" />

          {/* Cabeza mecha */}
          <g transform="translate(16, -6)">
            {/* Casco aerodinámico */}
            <path
              d="M0,-8 L28,-6 Q42,2 38,16 L10,16 Q-4,10 0,-8 Z"
              fill="url(#cyberCeramicPure)"
              stroke="#CBD5E1"
              strokeWidth="1.2"
            />

            {/* Dos cuernos de titanio estilizados */}
            <path d="M4,-8 L-10,-22 L0,-12 Z" fill="url(#cyberTitaniumPure)" />
            <path d="M14,-7 L4,-24 L11,-12 Z" fill="url(#cyberTitaniumPure)" />
            <circle cx="-10" cy="-22" r="1.5" fill="#00E5FF" filter="url(#bloomCyanPlasma)" />
            <circle cx="4" cy="-24" r="1.5" fill="#00E5FF" filter="url(#bloomCyanPlasma)" />

            {/* Visor OLED de cristal curvo negro absoluto */}
            <path d="M16,-1 L33,2 Q35,8 30,12 L13,8 Z" fill="#020617" stroke="#1E293B" strokeWidth="0.5" />

            {/* Emoticonos del visor */}
            {isHit ? (
              <g stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round">
                <line x1="20" y1="3" x2="26" y2="9" />
                <line x1="26" y1="3" x2="20" y2="9" />
              </g>
            ) : isAttacking ? (
              <polygon points="18,3 29,2 26,8 17,6" fill="#00E5FF" filter="url(#bloomCyanPlasma)" />
            ) : (
              <path
                d="M19,5 Q24,0 29,5"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#bloomCyanPlasma)"
              />
            )}

            {/* Disparo de plasma frontal en ataque */}
            {isAttacking && (
              <g transform="translate(36, 7)" filter="url(#bloomCyanPlasma)">
                <circle cx="8" cy="0" r="9" fill="#00E5FF" opacity="0.95" />
                <circle cx="12" cy="0" r="5" fill="#FFFFFF" />
                <path d="M14,0 L48,-2 L44,0 L48,2 Z" fill="url(#cyberPlasmaGradient)" />
              </g>
            )}
          </g>
        </g>

        {/* ── 6. PATAS CERCANAS (Frente - Cuadrúpedas reales de 4 extremidades) ── */}
        {/* Pata Trasera Cercana */}
        <g transform={`translate(48, 64) rotate(${legCycleA * 26})`}>
          <path d="M-6,-4 L14,-4 L16,16 L-2,16 Z" fill="url(#cyberCeramicPure)" stroke="#CBD5E1" strokeWidth="0.8" />
          <circle cx="6" cy="16" r="4.5" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          {/* Espinilla articulada */}
          <g transform={`translate(6, 16) rotate(${legCycleA * -20 + 12})`}>
            <path d="M-4,0 L5,0 L8,20 L-2,20 Z" fill="url(#cyberTitaniumPure)" />
            {/* Pie cerámico con sensor cian */}
            <path d="M-4,18 L14,18 L16,24 L-6,24 Z" fill="url(#cyberCeramicPure)" stroke="#64748B" strokeWidth="0.8" />
            <circle cx="12" cy="22" r="1.5" fill="#00E5FF" filter="url(#bloomCyanPlasma)" />
          </g>
        </g>

        {/* Pata Delantera Cercana */}
        <g transform={`translate(100, 64) rotate(${legCycleD * 24})`}>
          <path d="M-6,-4 L12,-4 L14,16 L-2,16 Z" fill="url(#cyberCeramicPure)" stroke="#CBD5E1" strokeWidth="0.8" />
          <circle cx="5" cy="16" r="4.5" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          {/* Antebrazo articulado */}
          <g transform={`translate(5, 16) rotate(${legCycleD * -18 + 10})`}>
            <path d="M-3,0 L5,0 L7,20 L-2,20 Z" fill="url(#cyberTitaniumPure)" />
            {/* Garra delantera */}
            <path d="M-4,18 L14,18 L16,24 L-5,24 Z" fill="url(#cyberCeramicPure)" stroke="#64748B" strokeWidth="0.8" />
            <circle cx="12" cy="22" r="1.5" fill="#00E5FF" filter="url(#bloomCyanPlasma)" />
          </g>
        </g>

        {/* ── 7. ALA DELANTERA PRINCIPAL (Articulada con esqueleto y membrana) ── */}
        <g
          transform={`translate(72, 40) rotate(${wingBeat})`}
          style={{ transformOrigin: '0% 100%' }}
        >
          {/* Esqueleto de titanio */}
          <path d="M0,0 L-16,-44 L32,-52 L12,-12 Z" fill="url(#cyberTitaniumPure)" />
          {/* Membrana translúcida de energía */}
          <path
            d="M-14,-42 Q24,-64 52,-26 L12,-10 Z"
            fill="url(#cyberPlasmaGradient)"
            opacity="0.9"
            filter="url(#bloomCyanPlasma)"
          />
          <circle cx="20" cy="-40" r="3.5" fill="#FFFFFF" />
          {/* Haces de fibra de plasma en la membrana */}
          <line x1="-14" y1="-42" x2="38" y2="-30" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.9" />
          <line x1="2" y1="-26" x2="48" y2="-28" stroke="#00E5FF" strokeWidth="1.2" opacity="0.75" />
        </g>
      </svg>
    </div>
  );
}
