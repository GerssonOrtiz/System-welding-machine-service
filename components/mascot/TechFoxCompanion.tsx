'use client';

import React from 'react';

interface TechFoxProps {
  action: 'run' | 'jump' | 'idle' | 'attack' | 'hit' | 'celebrate';
  direction: 'left' | 'right';
  tick: number;
}

export function TechFoxCompanion({ action, direction, tick }: TechFoxProps) {
  const isRunning = action === 'run';
  const isJumping = action === 'jump';
  const isAttacking = action === 'attack';
  const isHit = action === 'hit';

  const legCycle1 = isRunning ? Math.sin(tick * 0.5) * 16 : 0;
  const legCycle2 = isRunning ? Math.sin(tick * 0.5 + Math.PI) * 16 : 0;
  const bodyBob = isRunning ? Math.abs(Math.sin(tick * 0.5)) * 5 : isJumping ? -12 : 0;
  const tailSway = Math.sin(tick * 0.4) * 16;
  const earTwitch = Math.sin(tick * 0.2) * 5;

  return (
    <div
      className="relative select-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
      style={{
        transform: `scaleX(${direction === 'left' ? -1 : 1}) translateY(${bodyBob}px)`,
        transition: 'transform 0.1s linear',
        width: 130,
        height: 95,
      }}
    >
      <svg
        viewBox="0 0 150 110"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="foxCeramic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="foxAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="100%" stopColor="#FF9D42" />
          </linearGradient>
          <filter id="glowAmber" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pata Trasera Lejana */}
        <g transform={`translate(${38 + legCycle2 * 0.7}, 60) rotate(${-legCycle2 * 1.6})`}>
          <path d="M0,0 L-4,18 L4,26 L12,26 L6,0 Z" fill="#1E293B" />
        </g>

        {/* Pata Delantera Lejana */}
        <g transform={`translate(${86 + legCycle1 * 0.7}, 60) rotate(${-legCycle1 * 1.6})`}>
          <path d="M0,0 L2,18 L8,26 L16,26 L8,0 Z" fill="#1E293B" />
        </g>

        {/* Gran Cola Mecánica Segmentada con Punta Ámbar */}
        <g transform={`translate(24, 48) rotate(${tailSway})`}>
          {/* Segmento base cerámico */}
          <path
            d="M0,0 Q-16,-8 -24,-20 Q-34,-32 -48,-24"
            fill="none"
            stroke="url(#foxCeramic)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Banda de titanio oscura */}
          <path
            d="M-12,-8 L-16,-18"
            stroke="#1E293B"
            strokeWidth="5"
          />
          {/* Punta esponjosa ámbar luminosa */}
          <path
            d="M-36,-24 Q-54,-36 -64,-24 Q-56,-8 -40,-16 Z"
            fill="url(#foxAmber)"
            filter="url(#glowAmber)"
          />
          <circle cx="-52" cy="-22" r="3" fill="#FFFFFF" />
        </g>

        {/* Cuerpo Ágil Estilizado */}
        <path
          d="M24,42 Q55,36 82,44 L78,64 Q50,68 28,62 Z"
          fill="url(#foxCeramic)"
          stroke="#94A3B8"
          strokeWidth="1.2"
        />
        {/* Placa lateral de titanio con detalles ámbar */}
        <path
          d="M38,48 L68,48 L62,60 L34,58 Z"
          fill="#263044"
        />
        <circle cx="52" cy="54" r="3" fill="#FF9D42" filter="url(#glowAmber)" />

        {/* Cuello y Cabeza de Zorro Facetada */}
        <g transform="translate(82, 38)">
          {/* Cuello */}
          <path d="M-2,6 L14,-6 L22,12 L0,18 Z" fill="url(#foxCeramic)" />

          {/* Oreja Trasera */}
          <g transform={`translate(4, -18) rotate(${-earTwitch})`}>
            <polygon points="0,0 -8,-24 10,-12" fill="#263044" />
            <polygon points="-1,-4 -6,-20 6,-10" fill="#00E5FF" />
          </g>

          {/* Cabeza geométrica */}
          <polygon
            points="6,-14 28,-10 38,4 20,12 2,2"
            fill="url(#foxCeramic)"
            stroke="#94A3B8"
            strokeWidth="1"
          />

          {/* Oreja Delantera Grande */}
          <g transform={`translate(14, -16) rotate(${earTwitch})`}>
            <polygon points="0,0 2,-28 18,-8" fill="url(#foxCeramic)" stroke="#94A3B8" strokeWidth="0.8" />
            <polygon points="2,-4 3,-24 14,-10" fill="#00E5FF" filter="url(#glowAmber)" />
          </g>

          {/* Visor negro con ojos cian */}
          <polygon points="16,-6 32,-3 34,4 18,2" fill="#090D1A" />

          {isHit ? (
            <g stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
              <line x1="22" y1="-3" x2="28" y2="2" />
              <line x1="28" y1="-3" x2="22" y2="2" />
            </g>
          ) : isAttacking ? (
            // Mirada pícara / decidida en ataque
            <polygon points="20,-2 28,-4 26,2" fill="#FF9D42" filter="url(#glowAmber)" />
          ) : (
            // Ojos amigables
            <path
              d="M21,-1 Q25,-5 29,-1"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Chispas de agilidad ámbar si ataca */}
          {isAttacking && (
            <g transform="translate(36, 0)" filter="url(#glowAmber)">
              <circle cx="8" cy="0" r="5" fill="#FF9D42" />
              <circle cx="16" cy="-4" r="3" fill="#FFE082" />
              <circle cx="14" cy="6" r="3" fill="#FFE082" />
            </g>
          )}
        </g>

        {/* Pata Trasera Cercana */}
        <g transform={`translate(${34 + legCycle1 * 0.8}, 62) rotate(${legCycle1 * 1.8})`}>
          <path d="M0,0 L-4,16 L4,26 L14,26 L8,0 Z" fill="url(#foxCeramic)" stroke="#94A3B8" strokeWidth="0.8" />
          <path d="M2,22 L14,22 L16,26 L3,26 Z" fill="#FF9D42" />
        </g>

        {/* Pata Delantera Cercana */}
        <g transform={`translate(${82 + legCycle2 * 0.8}, 62) rotate(${legCycle2 * 1.8})`}>
          <path d="M0,0 L2,16 L8,26 L18,26 L10,0 Z" fill="url(#foxCeramic)" stroke="#94A3B8" strokeWidth="0.8" />
          <path d="M6,22 L18,22 L20,26 L7,26 Z" fill="#FF9D42" />
        </g>
      </svg>
    </div>
  );
}
