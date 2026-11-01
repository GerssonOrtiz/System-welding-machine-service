'use client';

import React from 'react';

interface OrganicFoxProps {
  action: 'walk' | 'run' | 'jump' | 'attack' | 'hit' | 'idle';
  direction: 'left' | 'right';
  tick: number;
}

export function OrganicFoxTech({ action, direction, tick }: OrganicFoxProps) {
  const isRunning = action === 'run' || action === 'walk';
  const isJumping = action === 'jump';
  const isAttacking = action === 'attack';
  const isHit = action === 'hit';

  const speed = action === 'run' ? 0.65 : 0.45;
  const cycleA = isRunning ? Math.sin(tick * speed) : 0;
  const cycleB = isRunning ? Math.sin(tick * speed + Math.PI) : 0;
  const cycleC = isRunning ? Math.sin(tick * speed + Math.PI * 0.5) : 0;
  const cycleD = isRunning ? Math.sin(tick * speed + Math.PI * 1.5) : 0;

  const breath = Math.sin(tick * 0.14) * 2;
  const spineBob = isRunning ? Math.abs(Math.sin(tick * speed)) * 4 : isJumping ? -20 : breath;
  const bodyPitch = isRunning ? (direction === 'right' ? 4 : -4) : isJumping ? (direction === 'right' ? -14 : 14) : 0;

  // Cola esponjosa gigante de zorro de fantasía (Kitsune / Eevee)
  const tail1 = Math.sin(tick * 0.28) * 18;
  const tail2 = Math.sin(tick * 0.28 - 0.5) * 24;
  const tail3 = Math.sin(tick * 0.28 - 1.0) * 28;

  // Orejitas peludas reactivas
  const earTwitch = Math.sin(tick * 0.18) * 8;

  return (
    <div
      className="relative select-none filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)]"
      style={{
        transform: `scaleX(${direction === 'left' ? -1 : 1}) translateY(${spineBob}px) rotate(${bodyPitch}deg)`,
        transition: 'transform 0.08s ease-out',
        width: 142,
        height: 110,
      }}
    >
      <svg
        viewBox="0 0 160 120"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Pelaje zorro naranja dorado cálido */}
          <radialGradient id="foxFurGradient" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="35%" stopColor="#FB923C" />
            <stop offset="75%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#C2410C" />
          </radialGradient>

          {/* Pecho esponjoso blanco crema */}
          <linearGradient id="foxFluff" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFF7ED" />
            <stop offset="100%" stopColor="#FED7AA" />
          </linearGradient>

          {/* Ojos grandes ámbar miel de fantasía */}
          <radialGradient id="foxAmberEye" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FDE047" />
            <stop offset="75%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </radialGradient>

          {/* Brillo mágico de zorro kitsune */}
          <filter id="spiritGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── 1. PATAS LEJANAS (Fondo) ── */}
        {/* Pata Trasera Lejana */}
        <g transform={`translate(44, 64) rotate(${cycleB * 24})`}>
          <path d="M-6,-4 C0,8 12,8 10,18 C8,24 1,24 -2,16 Z" fill="#9A3412" />
          <g transform={`translate(4, 16) rotate(${cycleB * -18 + 10})`}>
            {/* Calcetín negro/marrón característico de zorro */}
            <ellipse cx="2" cy="6" rx="4.5" ry="7" fill="#431407" />
            <circle cx="-0.5" cy="12" r="1.5" fill="#431407" />
            <circle cx="2.5" cy="12.5" r="1.5" fill="#431407" />
            <circle cx="5.5" cy="12" r="1.5" fill="#431407" />
          </g>
        </g>

        {/* Pata Delantera Lejana */}
        <g transform={`translate(96, 64) rotate(${cycleC * 22})`}>
          <path d="M-5,-4 C0,8 10,8 8,18 C7,24 1,24 -2,16 Z" fill="#9A3412" />
          <g transform={`translate(3, 16) rotate(${cycleC * -16 + 8})`}>
            <ellipse cx="2" cy="6" rx="4" ry="6.5" fill="#431407" />
            <circle cx="-0.5" cy="11.5" r="1.4" fill="#431407" />
            <circle cx="2.5" cy="12" r="1.4" fill="#431407" />
            <circle cx="5" cy="11.5" r="1.4" fill="#431407" />
          </g>
        </g>

        {/* ── 2. GRAN COLA ESPONJOSA CON PUNTA BLANCA DE NUBE ── */}
        <g transform="translate(30, 54)">
          {/* Raíz de la cola */}
          <g transform={`rotate(${tail1})`}>
            <ellipse cx="-10" cy="-6" rx="14" ry="11" fill="url(#foxFurGradient)" />

            {/* Curva media esponjosa */}
            <g transform={`translate(-18, -10) rotate(${tail2})`}>
              <ellipse cx="-12" cy="-8" rx="16" ry="14" fill="url(#foxFurGradient)" />

              {/* Punta suave y esponjosa blanca */}
              <g transform={`translate(-18, -10) rotate(${tail3})`}>
                <ellipse cx="-12" cy="-6" rx="16" ry="14" fill="url(#foxFluff)" />
                {/* Mechones suaves */}
                <path d="M-22,-14 Q-30,-6 -24,4 Q-12,8 -6,0 Z" fill="#FFFFFF" />
                <circle cx="-16" cy="-4" r="3" fill="#FFF7ED" />
              </g>
            </g>
          </g>
        </g>

        {/* ── 3. CUERPO ESPONJOSO DE ZORRO ÁGIL ── */}
        <g transform="translate(28, 42)">
          {/* Lomo y cuerpo */}
          <ellipse cx="34" cy="16" rx="34" ry="18" fill="url(#foxFurGradient)" />

          {/* Cuello y pecho blanco esponjoso de peluche */}
          <path
            d="M36,4 Q58,6 64,18 C56,32 38,30 36,4 Z"
            fill="url(#foxFluff)"
          />
          {/* Mechones de pelaje en el pecho */}
          <path d="M48,8 Q54,16 60,14" stroke="#FB923C" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M44,14 Q50,22 56,18" stroke="#FB923C" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* ── 4. CABEZA ADORABLE DE ZORRO CON GRANDES OREJAS ── */}
        <g transform="translate(90, 40)">
          {/* Cuello */}
          <path d="M-4,6 Q10,-4 18,10 Q6,20 -2,14 Z" fill="url(#foxFurGradient)" />

          {/* Oreja Trasera con interior rosado suave */}
          <g transform={`translate(2, -18) rotate(${-earTwitch})`}>
            <polygon points="0,0 -8,-28 14,-10" fill="#EA580C" />
            <polygon points="-1,-4 -6,-24 9,-8" fill="#FDA4AF" />
          </g>

          <g transform="translate(12, -4)">
            {/* Cabeza redondita de zorro */}
            <ellipse cx="16" cy="6" rx="18" ry="15" fill="url(#foxFurGradient)" />

            {/* Mejillas blancas peluditas */}
            <path d="M4,10 Q14,20 28,14 Q22,4 12,4 Z" fill="url(#foxFluff)" />
            {/* Rubor tierno en mejillas */}
            <ellipse cx="8" cy="12" rx="4" ry="2.5" fill="#F43F5E" opacity="0.3" />

            {/* Oreja Delantera Grande y Expresiva */}
            <g transform={`translate(2, -16) rotate(${earTwitch})`}>
              <polygon points="0,0 2,-32 20,-6" fill="url(#foxFurGradient)" />
              {/* Interior de oreja peludo blanco y rosado */}
              <polygon points="2,-4 3,-28 16,-8" fill="#FFF7ED" />
              <polygon points="3,-6 4,-24 13,-10" fill="#FDA4AF" />
              {/* Mechoncito de pelo en la oreja */}
              <path d="M4,-10 Q8,-16 6,-4" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
            </g>

            {/* OJO GRANDE EXPRESIVO DE ZORRO DE ANIME/FANTASÍA */}
            {isHit ? (
              <g stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round">
                <line x1="16" y1="2" x2="24" y2="10" />
                <line x1="24" y1="2" x2="16" y2="10" />
              </g>
            ) : isAttacking ? (
              // Mirada pícara de zorro
              <g>
                <ellipse cx="18" cy="5" rx="7" ry="6" fill="#D97706" />
                <circle cx="19" cy="4" r="3.5" fill="#431407" />
                <circle cx="20" cy="3" r="2" fill="#FFFFFF" />
              </g>
            ) : (
              // Gran ojo tierno y vivo color miel
              <g>
                <ellipse cx="16" cy="5" rx="7.5" ry="8.5" fill="#FFFFFF" />
                <ellipse cx="16" cy="5" rx="6" ry="7" fill="url(#foxAmberEye)" />
                <ellipse cx="16" cy="5" rx="4" ry="5" fill="#431407" />
                <circle cx="14" cy="3" r="2.6" fill="#FFFFFF" />
                <circle cx="19" cy="7.5" r="1.3" fill="#FFFFFF" />
              </g>
            )}

            {/* Nariz negra y sonrisa pícara */}
            <ellipse cx="28" cy="9" rx="2" ry="1.5" fill="#1C1917" />
            <path d="M26,11 Q28,13 30,11" stroke="#431407" strokeWidth="1.2" strokeLinecap="round" fill="none" />

            {/* Hojas mágicas o fuego fatuo de zorro en ataque */}
            {isAttacking && (
              <g transform="translate(32, 8)" filter="url(#spiritGlow)">
                <ellipse cx="8" cy="0" rx="9" ry="6" fill="#FBBF24" opacity="0.9" />
                <ellipse cx="16" cy="-2" rx="12" ry="8" fill="#FB923C" opacity="0.8" />
                <circle cx="6" cy="0" r="4" fill="#FFFFFF" />
              </g>
            )}
          </g>
        </g>

        {/* ── 5. PATAS CERCANAS (Frente - Calcetines oscuros de zorro) ── */}
        {/* Pata Trasera Cercana */}
        <g transform={`translate(42, 64) rotate(${cycleA * 26})`}>
          <path d="M-6,-4 C2,8 14,8 12,18 C10,24 3,24 -2,16 Z" fill="url(#foxFurGradient)" />
          <g transform={`translate(5, 16) rotate(${cycleA * -20 + 12})`}>
            <ellipse cx="2" cy="7" rx="5" ry="8" fill="#431407" />
            {/* Almohadilla tierno */}
            <circle cx="2" cy="14" r="2" fill="#FDA4AF" />
          </g>
        </g>

        {/* Pata Delantera Cercana */}
        <g transform={`translate(90, 64) rotate(${cycleD * 24})`}>
          <path d="M-5,-4 C1,8 12,8 10,18 C9,24 2,24 -2,16 Z" fill="url(#foxFurGradient)" />
          <g transform={`translate(4, 16) rotate(${cycleD * -18 + 10})`}>
            <ellipse cx="2" cy="7" rx="4.5" ry="7.5" fill="#431407" />
            <circle cx="2" cy="13.5" r="1.8" fill="#FDA4AF" />
          </g>
        </g>
      </svg>
    </div>
  );
}
