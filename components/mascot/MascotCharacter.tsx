'use client';

import React from 'react';
import Image from 'next/image';
import { MascotKind, MascotMood, MASCOT_PROFILES } from './mascot-config';

interface MascotCharacterProps {
  kind: MascotKind;
  mood: MascotMood;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function MascotCharacter({
  kind,
  mood,
  size = 120,
  className = '',
  onClick,
}: MascotCharacterProps) {
  const config = MASCOT_PROFILES[kind];
  const imageSrc = `/mascots/${kind}/${kind}-${mood}.png`;

  // Animaciones y efectos contextuales de mood
  const getMoodAnimationClass = () => {
    switch (mood) {
      case 'idle':
        return 'animate-float-subtle';
      case 'happy':
        return 'animate-bounce-gentle';
      case 'thinking':
        return 'animate-pulse-slow';
      case 'alert':
        return 'animate-ping-once';
      case 'sleeping':
        return 'opacity-80 scale-95';
      case 'error':
        return 'animate-shake-gentle';
      case 'working':
        return 'animate-pulse-glow';
      default:
        return '';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative select-none cursor-pointer group transition-transform duration-300 hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
      title={`${config.name} (${mood})`}
    >
      {/* Halo de luz de fondo sintonizado */}
      <div
        className="absolute inset-2 rounded-full blur-xl opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${config.accentColor} 0%, transparent 70%)`,
        }}
      />

      {/* Renderizado de la mascota con dimensiones reservadas para evitar Layout Shifts */}
      <div className={`relative w-full h-full flex items-center justify-center ${getMoodAnimationClass()}`}>
        <Image
          src={imageSrc}
          alt={`${config.name} - ${mood}`}
          width={size}
          height={size}
          priority={mood === 'idle'}
          className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
          sizes={`${size}px`}
        />
      </div>

      {/* Indicador de estado discreto en esquina inferior */}
      <div className="absolute bottom-1 right-1 flex items-center justify-center">
        <span
          className="relative flex h-3 w-3"
          title={`Estado: ${mood}`}
        >
          {mood === 'alert' || mood === 'working' ? (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: mood === 'alert' ? '#EF4444' : config.accentColor }}
            />
          ) : null}
          <span
            className="relative inline-flex rounded-full h-3 w-3 border border-bg-surface/80 shadow-sm"
            style={{
              backgroundColor:
                mood === 'error'
                  ? '#EF4444'
                  : mood === 'alert'
                  ? '#F59E0B'
                  : mood === 'sleeping'
                  ? '#64748B'
                  : config.accentColor,
            }}
          />
        </span>
      </div>
    </div>
  );
}
