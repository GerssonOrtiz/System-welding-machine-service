'use client';

import React from 'react';

interface OrganicDragonProps {
  action: 'walk' | 'run' | 'fly' | 'attack' | 'hit' | 'idle';
  direction: 'left' | 'right';
  tick: number;
}

export function OrganicDragonAI({ action, direction, tick }: OrganicDragonProps) {
  const isWalking = action === 'walk' || action === 'run';
  const isFlying = action === 'fly';
  const isAttacking = action === 'attack';
  const isHit = action === 'hit';

  const speed = action === 'run' ? 0.6 : 0.42;
  const cycleA = isWalking ? Math.sin(tick * speed) : 0;
  const cycleB = isWalking ? Math.sin(tick * speed + Math.PI) : 0;
  const cycleC = isWalking ? Math.sin(tick * speed + Math.PI * 0.5) : 0;
  const cycleD = isWalking ? Math.sin(tick * speed + Math.PI * 1.5) : 0;

  // Respiración viva y fluida
  const breath = Math.sin(tick * 0.12) * 2;
  const bodyBob = isWalking ? Math.abs(Math.sin(tick * speed)) * 3.5 : isFlying ? Math.sin(tick * 0.2) * 8 : breath;
  const bodyPitch = isWalking ? (direction === 'right' ? 2 : -2) : isFlying ? (direction === 'right' ? 8 : -8) : 0;

  // Batimiento de alas de cuero místico
  const wingAngle = isFlying ? Math.sin(tick * 0.45) * 45 : isAttacking ? 25 : Math.sin(tick * 0.12) * 8;

  // Cola suave orgánica
  const tail1 = Math.sin(tick * 0.22) * 14;
  const tail2 = Math.sin(tick * 0.22 - 0.5) * 18;
  const tail3 = Math.sin(tick * 0.22 - 1.0) * 24;

  // Cabeza expresiva
  const headBob = isWalking ? Math.sin(tick * speed) * 3 : isAttacking ? 6 : breath * 0.5;

  return (
    <div
      className="relative select-none filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)]"
      style={{
        transform: `scaleX(${direction === 'left' ? -1 : 1}) translateY(${bodyBob}px) rotate(${bodyPitch}deg)`,
        transition: 'transform 0.08s ease-out',
        width: 154,
        height: 115,
      }}
    >
      <svg
        viewBox="0 0 170 120"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Piel orgánica de dragón zafiro nocturno */}
          <radialGradient id="dragonSkinBase" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="35%" stopColor="#0284C7" />
            <stop offset="75%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Pecho y escamas ventrales suaves perla celeste */}
          <linearGradient id="dragonBelly" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="50%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>

          {/* Alas de membrana etérea aurora */}
          <linearGradient id="auroraWing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#818CF8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.95" />
          </linearGradient>

          {/* Ojos grandes luminosos de anime/fantasía */}
          <radialGradient id="dragonEye" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#38BDF8" />
            <stop offset="75%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </radialGradient>

          {/* Fuego místico de aliento */}
          <filter id="mysticFireGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── 1. PATAS LEJANAS (Fondo) ── */}
        {/* Pata Trasera Lejana */}
        <g transform={`translate(52, 64) rotate(${cycleB * 24})`}>
          <path d="M-6,-4 C0,8 14,8 12,18 C10,24 2,24 -2,16 Z" fill="#0C4A6E" />
          <g transform={`translate(4, 16) rotate(${cycleB * -18 + 10})`}>
            <ellipse cx="2" cy="6" rx="5" ry="7" fill="#082F49" />
            {/* Pequeñas garras redondeadas y adorables */}
            <circle cx="-1" cy="12" r="1.8" fill="#E0F2FE" />
            <circle cx="2.5" cy="13" r="1.8" fill="#E0F2FE" />
            <circle cx="6" cy="12" r="1.8" fill="#E0F2FE" />
          </g>
        </g>

        {/* Pata Delantera Lejana */}
        <g transform={`translate(108, 64) rotate(${cycleC * 22})`}>
          <path d="M-5,-4 C0,8 12,8 10,18 C8,24 1,24 -2,16 Z" fill="#0C4A6E" />
          <g transform={`translate(3, 16) rotate(${cycleC * -16 + 8})`}>
            <ellipse cx="2" cy="6" rx="4.5" ry="6.5" fill="#082F49" />
            <circle cx="-1" cy="11.5" r="1.6" fill="#E0F2FE" />
            <circle cx="2.5" cy="12.5" r="1.6" fill="#E0F2FE" />
            <circle cx="5.5" cy="11.5" r="1.6" fill="#E0F2FE" />
          </g>
        </g>

        {/* ── 2. ALA TRASERA (Fondo) ── */}
        <g
          transform={`translate(74, 40) rotate(${-28 - wingAngle * 0.75})`}
          style={{ transformOrigin: '0% 100%' }}
        >
          {/* Membrana mística */}
          <path
            d="M0,0 Q-18,-34 6,-46 Q-6,-24 16,-34 Q8,-14 26,-18 Z"
            fill="url(#auroraWing)"
            opacity="0.8"
            filter="url(#mysticFireGlow)"
          />
          {/* Hueso curvo de ala */}
          <path d="M0,0 Q-16,-32 6,-46" stroke="#0284C7" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        {/* ── 3. COLA DE DRAGÓN SUAVE CON ESPINAS CELESTES ── */}
        <g transform="translate(34, 56)">
          <g transform={`rotate(${tail1})`}>
            <path d="M0,-8 C-10,-8 -18,-4 -20,0 C-18,6 -8,8 0,8 Z" fill="url(#dragonSkinBase)" />
            {/* Espina suave dorsal */}
            <polygon points="-8,-8 -12,-16 -4,-10" fill="#38BDF8" />

            <g transform={`translate(-18, 0) rotate(${tail2})`}>
              <path d="M0,-6 C-8,-6 -14,-3 -16,0 C-14,4 -6,6 0,6 Z" fill="url(#dragonSkinBase)" />
              <polygon points="-6,-6 -10,-13 -3,-7" fill="#38BDF8" />

              {/* Punta de llama de la cola (Glow suave) */}
              <g transform={`translate(-16, 0) rotate(${tail3})`}>
                <path d="M0,-4 C-6,-4 -12,-2 -14,0 C-12,3 -4,4 0,4 Z" fill="url(#dragonSkinBase)" />
                {/* Llama mágica en la punta */}
                <path
                  d="M-10,0 Q-18,-12 -28,-4 Q-22,6 -10,0 Z"
                  fill="url(#auroraWing)"
                  filter="url(#mysticFireGlow)"
                />
                <circle cx="-16" cy="-2" r="2.5" fill="#FFFFFF" />
              </g>
            </g>
          </g>
        </g>

        {/* ── 4. CUERPO REGORDETE Y ADORABLE A 4 PATAS ── */}
        <g transform="translate(38, 36)">
          {/* Espalda y lomo azul noche */}
          <ellipse cx="36" cy="18" rx="36" ry="20" fill="url(#dragonSkinBase)" />

          {/* Pecho suave crema celeste */}
          <path
            d="M16,14 Q38,10 54,20 C46,36 24,34 16,14 Z"
            fill="url(#dragonBelly)"
          />
          {/* Pliegues de escamas suaves */}
          <path d="M26,18 Q36,22 46,20" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M24,24 Q34,28 42,26" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />

          {/* Espinas dorsales curvas y amigables */}
          <polygon points="12,0 16,-8 20,2" fill="#38BDF8" />
          <polygon points="26,-2 30,-11 34,0" fill="#38BDF8" />
          <polygon points="40,0 44,-9 48,2" fill="#38BDF8" />
        </g>

        {/* ── 5. CABEZA EXPRESIVA CON OJOS GRANDES VIVOS ── */}
        <g transform={`translate(100, ${40 + headBob})`}>
          {/* Cuello carnoso suave */}
          <path d="M-2,6 Q12,-4 22,12 Q6,22 -2,16 Z" fill="url(#dragonSkinBase)" />

          <g transform="translate(14, -6)">
            {/* Cabeza redondita amigable */}
            <ellipse cx="18" cy="6" rx="20" ry="16" fill="url(#dragonSkinBase)" />
            {/* Mejilla sonrosada suave */}
            <ellipse cx="14" cy="14" rx="5" ry="3" fill="#F43F5E" opacity="0.3" filter="url(#mysticFireGlow)" />

            {/* Cuernitos curvados adorables estilo dragón de fantasía */}
            <path d="M4,-4 Q-4,-18 2,-22 Q8,-12 10,-4 Z" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="1" />
            <path d="M12,-3 Q10,-16 18,-20 Q18,-10 16,-3 Z" fill="#7DD3FC" stroke="#0284C7" strokeWidth="1" />

            {/* OJO GRANDE EXPRESIVO DE CRIATURA VIVA */}
            {isHit ? (
              // Ojos mareados en espiral o cruz tierna
              <g stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round">
                <line x1="16" y1="2" x2="24" y2="10" />
                <line x1="24" y1="2" x2="16" y2="10" />
              </g>
            ) : isAttacking ? (
              // Mirada traviesa y decidida
              <g>
                <ellipse cx="20" cy="5" rx="7" ry="6" fill="#0284C7" />
                <circle cx="21" cy="4" r="3.5" fill="#020617" />
                <circle cx="22" cy="3" r="2" fill="#FFFFFF" />
              </g>
            ) : (
              // Ojos grandes llenos de luz, tiernos e inteligentes
              <g>
                {/* Fondo blanco esclerótica */}
                <ellipse cx="18" cy="5" rx="8" ry="9" fill="#FFFFFF" />
                {/* Iris zafiro místico */}
                <ellipse cx="18" cy="5" rx="6.5" ry="7.5" fill="url(#dragonEye)" />
                {/* Pupila profunda */}
                <ellipse cx="18" cy="5" rx="4.5" ry="5.5" fill="#030712" />
                {/* Gran brillo de luz de anime (reflejo de vida) */}
                <circle cx="16" cy="3" r="2.8" fill="#FFFFFF" />
                <circle cx="21" cy="8" r="1.4" fill="#FFFFFF" />
              </g>
            )}

            {/* Hocico y sonrisa adorable */}
            <path d="M28,8 Q34,9 36,12 Q32,15 26,14" fill="#BAE6FD" />
            <path d="M30,12 Q33,14 36,12" stroke="#0369A1" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Orificio nasal */}
            <circle cx="34" cy="10" r="1" fill="#0369A1" />

            {/* Aliento místico de fuego mágico en combate */}
            {isAttacking && (
              <g transform="translate(38, 11)" filter="url(#mysticFireGlow)">
                <ellipse cx="8" cy="0" rx="10" ry="7" fill="#38BDF8" opacity="0.9" />
                <ellipse cx="16" cy="-2" rx="14" ry="9" fill="#818CF8" opacity="0.8" />
                <ellipse cx="26" cy="-4" rx="12" ry="7" fill="#C084FC" opacity="0.7" />
                <circle cx="6" cy="0" r="4" fill="#FFFFFF" />
              </g>
            )}
          </g>
        </g>

        {/* ── 6. PATAS CERCANAS (Frente - 4 patas de criatura) ── */}
        {/* Pata Trasera Cercana */}
        <g transform={`translate(48, 64) rotate(${cycleA * 26})`}>
          <path d="M-6,-4 C2,8 16,8 14,18 C12,24 4,24 -2,16 Z" fill="url(#dragonSkinBase)" />
          <g transform={`translate(5, 16) rotate(${cycleA * -20 + 12})`}>
            <ellipse cx="2" cy="7" rx="6" ry="8" fill="url(#dragonSkinBase)" />
            {/* Garras redondeadas suaves */}
            <circle cx="-1" cy="14" r="2" fill="#E0F2FE" />
            <circle cx="3" cy="15" r="2.2" fill="#E0F2FE" />
            <circle cx="7" cy="14" r="2" fill="#E0F2FE" />
          </g>
        </g>

        {/* Pata Delantera Cercana */}
        <g transform={`translate(100, 64) rotate(${cycleD * 24})`}>
          <path d="M-6,-4 C1,8 14,8 12,18 C10,24 3,24 -2,16 Z" fill="url(#dragonSkinBase)" />
          <g transform={`translate(4, 16) rotate(${cycleD * -18 + 10})`}>
            <ellipse cx="2" cy="7" rx="5.5" ry="7.5" fill="url(#dragonSkinBase)" />
            <circle cx="-1" cy="13.5" r="1.8" fill="#E0F2FE" />
            <circle cx="3" cy="14.5" r="2" fill="#E0F2FE" />
            <circle cx="6.5" cy="13.5" r="1.8" fill="#E0F2FE" />
          </g>
        </g>

        {/* ── 7. ALA DELANTERA PRINCIPAL (Alas de Murciélago/Dragón Místico) ── */}
        <g
          transform={`translate(68, 40) rotate(${wingAngle})`}
          style={{ transformOrigin: '0% 100%' }}
        >
          {/* Membrana aurora bioluminiscente */}
          <path
            d="M0,0 Q-24,-42 10,-54 Q-8,-30 22,-40 Q12,-16 34,-20 Z"
            fill="url(#auroraWing)"
            filter="url(#mysticFireGlow)"
          />
          {/* Hueso articulado de ala orgánica */}
          <path d="M0,0 Q-22,-38 10,-54" stroke="#7DD3FC" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Falanges de la membrana */}
          <path d="M-6,-32 Q10,-32 22,-40" stroke="#BAE6FD" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M-2,-20 Q16,-20 34,-20" stroke="#BAE6FD" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
          {/* Garrita en la cúspide del ala */}
          <circle cx="10" cy="-54" r="2.2" fill="#E0F2FE" />
        </g>
      </svg>
    </div>
  );
}
