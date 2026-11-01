'use client';

import React from 'react';

interface ArticulatedFoxProps {
  action: 'walk' | 'run' | 'jump' | 'attack' | 'hit' | 'idle';
  direction: 'left' | 'right';
  tick: number;
}

export function ArticulatedFoxTech({ action, direction, tick }: ArticulatedFoxProps) {
  const isRunning = action === 'run' || action === 'walk';
  const isJumping = action === 'jump';
  const isAttacking = action === 'attack';
  const isHit = action === 'hit';

  const speedMult = action === 'run' ? 0.65 : 0.45;
  const legCycleA = isRunning ? Math.sin(tick * speedMult) : 0;
  const legCycleB = isRunning ? Math.sin(tick * speedMult + Math.PI) : 0;
  const legCycleC = isRunning ? Math.sin(tick * speedMult + Math.PI * 0.5) : 0;
  const legCycleD = isRunning ? Math.sin(tick * speedMult + Math.PI * 1.5) : 0;

  const spineBob = isRunning ? Math.abs(Math.sin(tick * speedMult)) * 4 : isJumping ? -16 : 0;
  const bodyPitch = isRunning ? (direction === 'right' ? 5 : -5) : isJumping ? (direction === 'right' ? -12 : 12) : 0;

  // Cola grande de 3 articulaciones
  const tailSway1 = Math.sin(tick * 0.3) * 16;
  const tailSway2 = Math.sin(tick * 0.3 - 0.6) * 22;
  const tailSway3 = Math.sin(tick * 0.3 - 1.2) * 26;

  // Orejas reactivas
  const earTwitch = Math.sin(tick * 0.2) * 8;

  return (
    <div
      className="relative select-none filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
      style={{
        transform: `scaleX(${direction === 'left' ? -1 : 1}) translateY(${spineBob}px) rotate(${bodyPitch}deg)`,
        transition: 'transform 0.08s ease-out',
        width: 135,
        height: 100,
      }}
    >
      <svg
        viewBox="0 0 150 110"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="foxCeramicPearl" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <linearGradient id="foxTitaniumDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          <linearGradient id="foxGlowingAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="40%" stopColor="#FFB347" />
            <stop offset="100%" stopColor="#FF9D42" />
          </linearGradient>

          <filter id="neonGlowAmber" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── 1. PATAS LEJANAS (Fondo) ── */}
        {/* Pata Trasera Lejana */}
        <g transform={`translate(42, 60) rotate(${legCycleB * 24})`}>
          <path d="M-5,-4 L8,-4 L10,14 L-2,14 Z" fill="url(#foxTitaniumDark)" />
          <circle cx="4" cy="14" r="3" fill="#0F172A" />
          <g transform={`translate(4, 14) rotate(${legCycleB * -18 + 10})`}>
            <path d="M-3,0 L4,0 L6,18 L-2,18 Z" fill="#1E293B" />
            <path d="M-3,18 L8,18 L10,22 L-4,22 Z" fill="#0F172A" />
          </g>
        </g>

        {/* Pata Delantera Lejana */}
        <g transform={`translate(90, 60) rotate(${legCycleC * 22})`}>
          <path d="M-4,-4 L8,-4 L9,14 L-2,14 Z" fill="url(#foxTitaniumDark)" />
          <circle cx="4" cy="14" r="3" fill="#0F172A" />
          <g transform={`translate(4, 14) rotate(${legCycleC * -16 + 8})`}>
            <path d="M-2,0 L4,0 L5,18 L-2,18 Z" fill="#1E293B" />
            <path d="M-3,18 L8,18 L10,22 L-4,22 Z" fill="#0F172A" />
          </g>
        </g>

        {/* ── 2. GRAN COLA MECÁNICA SEGMENTADA CON PUNTA ÁMBAR ── */}
        <g transform="translate(28, 50)">
          {/* Segmento 1 */}
          <g transform={`rotate(${tailSway1})`}>
            <path d="M0,0 Q-12,-8 -20,-16" stroke="url(#foxCeramicPearl)" strokeWidth="13" strokeLinecap="round" />
            <circle cx="-18" cy="-14" r="4" fill="#1E293B" />

            {/* Segmento 2 */}
            <g transform={`translate(-18, -14) rotate(${tailSway2})`}>
              <path d="M0,0 Q-12,-8 -18,-14" stroke="url(#foxTitaniumDark)" strokeWidth="10" strokeLinecap="round" />
              <line x1="-2" y1="0" x2="-14" y2="-10" stroke="#FF9D42" strokeWidth="2" filter="url(#neonGlowAmber)" />

              {/* Segmento 3 + Punta Luminosa Ámbar */}
              <g transform={`translate(-18, -14) rotate(${tailSway3})`}>
                <path
                  d="M0,0 Q-14,-14 -24,-8 Q-22,6 -10,4 Z"
                  fill="url(#foxGlowingAmber)"
                  filter="url(#neonGlowAmber)"
                />
                <circle cx="-14" cy="-4" r="3.5" fill="#FFFFFF" />
              </g>
            </g>
          </g>
        </g>

        {/* ── 3. CUERPO DE ZORRO ESTILIZADO Y ÁGIL ── */}
        <g transform="translate(26, 38)">
          <path
            d="M0,8 Q34,0 60,6 L56,26 Q28,30 2,24 Z"
            fill="url(#foxCeramicPearl)"
            stroke="#94A3B8"
            strokeWidth="1.2"
          />
          {/* Placas laterales de titanio con ranuras ámbar */}
          <path d="M16,10 L46,10 L40,20 L12,18 Z" fill="url(#foxTitaniumDark)" />
          <circle cx="28" cy="14" r="3" fill="#FF9D42" filter="url(#neonGlowAmber)" />
        </g>

        {/* ── 4. CABEZA FACETADA CON OREJAS GRANDES Y VISOR ── */}
        <g transform="translate(86, 36)">
          {/* Cuello */}
          <path d="M-4,6 L12,-4 L20,12 L-2,16 Z" fill="url(#foxCeramicPearl)" />

          {/* Oreja Trasera */}
          <g transform={`translate(2, -18) rotate(${-earTwitch})`}>
            <polygon points="0,0 -8,-24 10,-10" fill="url(#foxTitaniumDark)" />
            <polygon points="-1,-4 -6,-20 6,-8" fill="#00E5FF" />
          </g>

          {/* Cabeza geométrica */}
          <polygon
            points="4,-12 28,-8 38,4 20,12 0,2"
            fill="url(#foxCeramicPearl)"
            stroke="#94A3B8"
            strokeWidth="1"
          />

          {/* Oreja Delantera Grande y Puntiaguda */}
          <g transform={`translate(12, -16) rotate(${earTwitch})`}>
            <polygon points="0,0 2,-28 18,-6" fill="url(#foxCeramicPearl)" stroke="#94A3B8" strokeWidth="0.8" />
            <polygon points="2,-4 3,-24 14,-8" fill="#00E5FF" filter="url(#neonGlowAmber)" />
          </g>

          {/* Visor negro con ojos cian */}
          <polygon points="16,-4 32,-1 34,5 18,3" fill="#050811" />

          {isHit ? (
            <g stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round">
              <line x1="20" y1="0" x2="26" y2="4" />
              <line x1="26" y1="0" x2="20" y2="4" />
            </g>
          ) : isAttacking ? (
            <polygon points="18,0 28,-2 26,4" fill="#FF9D42" filter="url(#neonGlowAmber)" />
          ) : (
            <path
              d="M19,2 Q24,-2 29,2"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Destello de agilidad en ataque */}
          {isAttacking && (
            <g transform="translate(34, 2)" filter="url(#neonGlowAmber)">
              <circle cx="8" cy="0" r="6" fill="#FF9D42" />
              <circle cx="16" cy="-4" r="3.5" fill="#FFE082" />
              <circle cx="14" cy="6" r="3.5" fill="#FFE082" />
            </g>
          )}
        </g>

        {/* ── 5. PATAS CERCANAS (Frente - Cuadrúpedas articuladas) ── */}
        {/* Pata Trasera Cercana */}
        <g transform={`translate(38, 60) rotate(${legCycleA * 26})`}>
          <path d="M-6,-4 L10,-4 L12,16 L-2,16 Z" fill="url(#foxCeramicPearl)" stroke="#94A3B8" strokeWidth="0.8" />
          <circle cx="5" cy="16" r="3.5" fill="#1E293B" />
          <g transform={`translate(5, 16) rotate(${legCycleA * -20 + 12})`}>
            <path d="M-4,0 L5,0 L7,20 L-2,20 Z" fill="url(#foxTitaniumDark)" />
            <path d="M-4,18 L10,18 L12,24 L-5,24 Z" fill="url(#foxCeramicPearl)" stroke="#64748B" strokeWidth="0.6" />
            <circle cx="8" cy="22" r="1.5" fill="#FF9D42" />
          </g>
        </g>

        {/* Pata Delantera Cercana */}
        <g transform={`translate(86, 60) rotate(${legCycleD * 24})`}>
          <path d="M-5,-4 L9,-4 L10,16 L-2,16 Z" fill="url(#foxCeramicPearl)" stroke="#94A3B8" strokeWidth="0.8" />
          <circle cx="4" cy="16" r="3.5" fill="#1E293B" />
          <g transform={`translate(4, 16) rotate(${legCycleD * -18 + 10})`}>
            <path d="M-3,0 L5,0 L6,20 L-2,20 Z" fill="url(#foxTitaniumDark)" />
            <path d="M-4,18 L10,18 L12,24 L-5,24 Z" fill="url(#foxCeramicPearl)" stroke="#64748B" strokeWidth="0.6" />
            <circle cx="8" cy="22" r="1.5" fill="#FF9D42" />
          </g>
        </g>
      </svg>
    </div>
  );
}
