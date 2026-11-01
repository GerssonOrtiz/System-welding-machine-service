'use client';

import React from 'react';
import Image from 'next/image';

interface MasterRenderCharacterProps {
  kind: 'dragon-ai' | 'fox-tech';
  action: 'walk' | 'run' | 'fly' | 'jump' | 'attack' | 'hit' | 'idle' | 'celebrate';
  direction: 'left' | 'right';
  tick: number;
}

export function MasterRenderCharacter({
  kind,
  action,
  direction,
  tick,
}: MasterRenderCharacterProps) {
  const isDragon = kind === 'dragon-ai';
  const isFlying = action === 'fly';
  const isWalking = action === 'walk' || action === 'run';
  const isAttacking = action === 'attack';
  const isHit = action === 'hit';
  const isJumping = action === 'jump';

  // Animaciones de física orgánica para 4 patas
  // Bobbing vertical al caminar / trotar
  const walkBob = isWalking ? Math.sin(tick * 0.5) * 5 : 0;
  // Inclinación hacia adelante al trotar o volar
  const tiltAngle = isFlying ? (direction === 'right' ? 8 : -8) : isWalking ? (direction === 'right' ? 4 : -4) : 0;
  // Aleteo / flotación en el aire para el dragón
  const flightFloat = isFlying ? Math.sin(tick * 0.25) * 12 : 0;
  // Salto para el zorro
  const jumpHeight = isJumping ? -18 : 0;

  // Retroceso y sacudida al ser golpeado
  const hitShake = isHit ? Math.sin(tick * 1.5) * 6 : 0;

  // Imagen render 3D hiperrealista aprobada
  const imgSrc = isDragon
    ? '/mascots/dragon-ai/dragon-render-transparent.png'
    : '/mascots/fox-tech/fox-render-transparent.png';

  const accentGlow = isDragon ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 157, 66, 0.45)';

  return (
    <div
      className="relative select-none pointer-events-auto transition-transform duration-75 ease-out"
      style={{
        transform: `translateX(${hitShake}px) translateY(${walkBob + flightFloat + jumpHeight}px) rotate(${tiltAngle}deg) scaleX(${
          direction === 'left' ? -1 : 1
        })`,
        width: isDragon ? 124 : 112,
        height: isDragon ? 116 : 106,
      }}
    >
      {/* Sombra de contacto dinámica en el suelo */}
      <div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full blur-md bg-black/60 pointer-events-none transition-all duration-150"
        style={{
          width: isFlying ? '40px' : '75px',
          height: '14px',
          opacity: isFlying ? 0.25 : 0.7,
        }}
      />

      {/* Halo de energía de plasma ambiental */}
      <div
        className="absolute inset-0 rounded-full blur-xl pointer-events-none opacity-40 transition-opacity"
        style={{
          background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
        }}
      />

      {/* Render 3D de alta fidelidad */}
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={imgSrc}
          alt={isDragon ? 'Dragón AI' : 'Zorro Tech'}
          width={isDragon ? 124 : 112}
          height={isDragon ? 116 : 106}
          priority
          className={`w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] ${
            isHit ? 'brightness-125 sepia hue-rotate-[320deg]' : ''
          }`}
          sizes="130px"
        />
      </div>

      {/* Efectos de combate / partículas cuando ataca */}
      {isAttacking && (
        <div
          className="absolute -top-1 -right-4 pointer-events-none animate-ping"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isDragon
              ? 'radial-gradient(circle, #00E5FF 0%, #8B5CF6 80%)'
              : 'radial-gradient(circle, #FF9D42 0%, #FFB347 80%)',
            boxShadow: `0 0 20px ${isDragon ? '#00E5FF' : '#FF9D42'}`,
          }}
        />
      )}
    </div>
  );
}
