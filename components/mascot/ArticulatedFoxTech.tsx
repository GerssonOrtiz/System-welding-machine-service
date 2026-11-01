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

  const speed = action === 'run' ? 0.65 : 0.45;
  const legCycleA = isRunning ? Math.sin(tick * speed) : 0;
  const legCycleB = isRunning ? Math.sin(tick * speed + Math.PI) : 0;
  const legCycleC = isRunning ? Math.sin(tick * speed + Math.PI * 0.5) : 0;
  const legCycleD = isRunning ? Math.sin(tick * speed + Math.PI * 1.5) : 0;

  const breath = Math.sin(tick * 0.14) * 1.5;
  const spineBob = isRunning ? Math.abs(Math.sin(tick * speed)) * 3.5 : isJumping ? -18 : breath;
  const bodyPitch = isRunning ? (direction === 'right' ? 4 : -4) : isJumping ? (direction === 'right' ? -12 : 12) : 0;

  // Cola grande esponjosa-mecánica (física de 3 segmentos de látigo)
  const tail1 = Math.sin(tick * 0.28) * 16;
  const tail2 = Math.sin(tick * 0.28 - 0.5) * 22;
  const tail3 = Math.sin(tick * 0.28 - 1.0) * 26;

  // Orejas mecha reactivas
  const earTwitch = Math.sin(tick * 0.18) * 7;

  return (
    <div
      className="relative select-none filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.8)]"
      style={{
        transform: `scaleX(${direction === 'left' ? -1 : 1}) translateY(${spineBob}px) rotate(${bodyPitch}deg)`,
        transition: 'transform 0.08s ease-out',
        width: 142,
        height: 106,
      }}
    >
      <svg
        viewBox="0 0 160 115"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Cerámica multicapa con bisel */}
          <linearGradient id="foxCyberCeramic" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#F8FAFC" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Titanio Grafito Cobalto */}
          <linearGradient id="foxCyberTitanium" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0B1120" />
          </linearGradient>

          {/* Ámbar Solar Cálido */}
          <linearGradient id="foxSolarAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="25%" stopColor="#FDE68A" />
            <stop offset="65%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Resplandor óptico ámbar de alta fidelidad */}
          <filter id="bloomAmberFox" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── 1. PATAS LEJANAS (Fondo) ── */}
        {/* Pata Trasera Lejana */}
        <g transform={`translate(44, 62) rotate(${legCycleB * 24})`}>
          <path d="M-5,-4 L9,-4 L11,14 L-2,14 Z" fill="url(#foxCyberTitanium)" />
          <circle cx="4" cy="14" r="3.2" fill="#0F172A" />
          <g transform={`translate(4, 14) rotate(${legCycleB * -18 + 10})`}>
            <path d="M-3,0 L4,0 L6,18 L-2,18 Z" fill="#0F172A" />
            <path d="M-3,18 L9,18 L11,23 L-4,23 Z" fill="#020617" />
          </g>
        </g>

        {/* Pata Delantera Lejana */}
        <g transform={`translate(96, 62) rotate(${legCycleC * 22})`}>
          <path d="M-4,-4 L8,-4 L9,14 L-2,14 Z" fill="url(#foxCyberTitanium)" />
          <circle cx="4" cy="14" r="3.2" fill="#0F172A" />
          <g transform={`translate(4, 14) rotate(${legCycleC * -16 + 8})`}>
            <path d="M-2,0 L4,0 L5,18 L-2,18 Z" fill="#0F172A" />
            <path d="M-3,18 L9,18 L11,23 L-4,23 Z" fill="#020617" />
          </g>
        </g>

        {/* ── 2. GRAN COLA MECÁNICA SEGMENTADA CON PUNTA ÁMBAR VIBRANTE ── */}
        <g transform="translate(30, 52)">
          {/* Segmento 1 */}
          <g transform={`rotate(${tail1})`}>
            <path d="M0,0 Q-14,-8 -22,-18" stroke="url(#foxCyberCeramic)" strokeWidth="15" strokeLinecap="round" />
            <circle cx="-20" cy="-16" r="4.5" fill="#1E293B" stroke="#475569" strokeWidth="1" />

            {/* Segmento 2 */}
            <g transform={`translate(-20, -16) rotate(${tail2})`}>
              <path d="M0,0 Q-14,-8 -20,-16" stroke="url(#foxCyberTitanium)" strokeWidth="11" strokeLinecap="round" />
              <line x1="-2" y1="0" x2="-16" y2="-12" stroke="#F59E0B" strokeWidth="2.5" filter="url(#bloomAmberFox)" />

              {/* Segmento 3 + Punta Cálida de Fusión Solar */}
              <g transform={`translate(-20, -16) rotate(${tail3})`}>
                <path
                  d="M0,0 Q-16,-16 -28,-8 Q-24,8 -12,6 Z"
                  fill="url(#foxSolarAmber)"
                  filter="url(#bloomAmberFox)"
                />
                <circle cx="-16" cy="-4" r="4" fill="#FFFFFF" />
              </g>
            </g>
          </g>
        </g>

        {/* ── 3. CHASIS DE ZORRO AERODINÁMICO Y ÁGIL ── */}
        <g transform="translate(28, 40)">
          <path
            d="M0,8 Q36,0 64,6 L60,28 Q30,32 4,26 Z"
            fill="url(#foxCyberCeramic)"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />
          {/* Ranura de titanio lateral con indicador ámbar */}
          <path d="M18,10 L48,10 L42,20 L14,18 Z" fill="url(#foxCyberTitanium)" />
          <circle cx="30" cy="14" r="3.5" fill="#F59E0B" filter="url(#bloomAmberFox)" />
          <circle cx="30" cy="14" r="1.5" fill="#FFFFFF" />
        </g>

        {/* ── 4. CABEZA FACETADA CON OREJAS ALTAS E INTERIOR CIAN ── */}
        <g transform="translate(90, 38)">
          {/* Cuello articulado */}
          <path d="M-4,6 L14,-4 L22,12 L-2,16 Z" fill="url(#foxCyberCeramic)" />

          {/* Oreja Trasera */}
          <g transform={`translate(2, -18) rotate(${-earTwitch})`}>
            <polygon points="0,0 -8,-26 12,-10" fill="url(#foxCyberTitanium)" />
            <polygon points="-1,-4 -6,-22 8,-8" fill="#00E5FF" />
          </g>

          {/* Cabeza geométrica limpia */}
          <polygon
            points="4,-12 30,-8 40,4 22,12 0,2"
            fill="url(#foxCyberCeramic)"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />

          {/* Oreja Delantera Grande y Puntiaguda */}
          <g transform={`translate(14, -16) rotate(${earTwitch})`}>
            <polygon points="0,0 2,-30 20,-6" fill="url(#foxCyberCeramic)" stroke="#CBD5E1" strokeWidth="0.8" />
            <polygon points="2,-4 3,-26 16,-8" fill="#00E5FF" filter="url(#bloomAmberFox)" />
          </g>

          {/* Visor negro curvo con ojos cian */}
          <polygon points="18,-4 34,-1 36,6 20,4" fill="#020617" stroke="#1E293B" strokeWidth="0.5" />

          {isHit ? (
            <g stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round">
              <line x1="22" y1="0" x2="28" y2="5" />
              <line x1="28" y1="0" x2="22" y2="5" />
            </g>
          ) : isAttacking ? (
            <polygon points="20,0 30,-2 28,5" fill="#F59E0B" filter="url(#bloomAmberFox)" />
          ) : (
            <path
              d="M21,2 Q26,-2 31,2"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Chispas ámbar de agilidad en ataque */}
          {isAttacking && (
            <g transform="translate(36, 2)" filter="url(#bloomAmberFox)">
              <circle cx="8" cy="0" r="7" fill="#F59E0B" />
              <circle cx="16" cy="-4" r="4" fill="#FFE082" />
              <circle cx="14" cy="6" r="4" fill="#FFE082" />
            </g>
          )}
        </g>

        {/* ── 5. PATAS CERCANAS (Frente - 4 patas activas) ── */}
        {/* Pata Trasera Cercana */}
        <g transform={`translate(42, 62) rotate(${legCycleA * 26})`}>
          <path d="M-6,-4 L12,-4 L14,16 L-2,16 Z" fill="url(#foxCyberCeramic)" stroke="#CBD5E1" strokeWidth="0.8" />
          <circle cx="6" cy="16" r="4" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <g transform={`translate(6, 16) rotate(${legCycleA * -20 + 12})`}>
            <path d="M-4,0 L5,0 L7,20 L-2,20 Z" fill="url(#foxCyberTitanium)" />
            <path d="M-4,18 L12,18 L14,24 L-5,24 Z" fill="url(#foxCyberCeramic)" stroke="#64748B" strokeWidth="0.6" />
            <circle cx="10" cy="22" r="1.5" fill="#F59E0B" filter="url(#bloomAmberFox)" />
          </g>
        </g>

        {/* Pata Delantera Cercana */}
        <g transform={`translate(90, 62) rotate(${legCycleD * 24})`}>
          <path d="M-5,-4 L10,-4 L12,16 L-2,16 Z" fill="url(#foxCyberCeramic)" stroke="#CBD5E1" strokeWidth="0.8" />
          <circle cx="5" cy="16" r="4" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <g transform={`translate(5, 16) rotate(${legCycleD * -18 + 10})`}>
            <path d="M-3,0 L5,0 L6,20 L-2,20 Z" fill="url(#foxCyberTitanium)" />
            <path d="M-4,18 L12,18 L14,24 L-5,24 Z" fill="url(#foxCyberCeramic)" stroke="#64748B" strokeWidth="0.6" />
            <circle cx="10" cy="22" r="1.5" fill="#F59E0B" filter="url(#bloomAmberFox)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
