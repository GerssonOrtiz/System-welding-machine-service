'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MasterRenderCharacter } from './MasterRenderCharacter';
import { X, Sparkles, Swords } from 'lucide-react';

type PetAction = 'idle' | 'walk' | 'run' | 'fly' | 'jump' | 'attack' | 'hit' | 'celebrate';

interface PetEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  direction: 'left' | 'right';
  action: PetAction;
  actionTimer: number;
  state: 'walking' | 'flying' | 'battling' | 'resting';
}

export default function DashboardFreeMascots() {
  const [enabled, setEnabled] = useState(true);
  const [battleMode, setBattleMode] = useState(false);
  const [battleLog, setBattleLog] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Ancho y alto de pantalla
  const [bounds, setBounds] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const handleResize = () => {
      setBounds({
        w: window.innerWidth || 1200,
        h: window.innerHeight || 800,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Coordenada Y de la parte inferior fija (franja inferior del dashboard)
  // Dejamos 80px de margen sobre el fondo de la pantalla
  const bottomLaneY = bounds.h - 95;
  const flightY = bounds.h - 170; // Vuelo bajo sobre la franja inferior

  // Entidades
  const dragonRef = useRef<PetEntity>({
    x: 180,
    y: 700,
    vx: 0,
    vy: 0,
    targetX: 350,
    targetY: 700,
    direction: 'right',
    action: 'walk',
    actionTimer: 80,
    state: 'walking',
  });

  const foxRef = useRef<PetEntity>({
    x: 550,
    y: 700,
    vx: 0,
    vy: 0,
    targetX: 720,
    targetY: 700,
    direction: 'left',
    action: 'walk',
    actionTimer: 60,
    state: 'walking',
  });

  const [, setRenderTrigger] = useState(0);

  // Bucle de física delimitado en la parte inferior del dashboard
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);

      const dragon = dragonRef.current;
      const fox = foxRef.current;
      const currentBottomY = bounds.h - 95;
      const currentFlightY = bounds.h - 165;

      const dx = fox.x - dragon.x;
      const dy = fox.y - dragon.y;
      const distance = Math.hypot(dx, dy);

      // --- Inteligencia y Decisiones: Dragón AI ---
      dragon.actionTimer--;
      if (dragon.actionTimer <= 0) {
        if (battleMode) {
          dragon.state = 'battling';
          dragon.targetX = fox.x + (dx > 0 ? -100 : 100);
          dragon.targetY = Math.random() > 0.5 ? currentFlightY : currentBottomY;
          dragon.actionTimer = 40 + Math.floor(Math.random() * 30);
        } else {
          // Alternar entre caminar y vuelo bajo en la franja inferior
          const flyChance = Math.random() > 0.55;
          if (flyChance) {
            dragon.state = 'flying';
            dragon.action = 'fly';
            dragon.targetX = 60 + Math.random() * (bounds.w - 180);
            dragon.targetY = currentFlightY;
            dragon.actionTimer = 80 + Math.floor(Math.random() * 50);
          } else {
            dragon.state = 'walking';
            dragon.action = 'walk';
            dragon.targetX = 60 + Math.random() * (bounds.w - 180);
            dragon.targetY = currentBottomY;
            dragon.actionTimer = 70 + Math.floor(Math.random() * 50);
          }
        }
      }

      // --- Inteligencia y Decisiones: Zorro Tech ---
      fox.actionTimer--;
      if (fox.actionTimer <= 0) {
        if (battleMode) {
          fox.state = 'battling';
          fox.targetX = dragon.x + (dx > 0 ? 100 : -100);
          fox.targetY = currentBottomY;
          fox.actionTimer = 35 + Math.floor(Math.random() * 30);
        } else {
          fox.state = 'walking';
          fox.action = Math.random() > 0.35 ? 'run' : 'jump';
          fox.targetX = 60 + Math.random() * (bounds.w - 180);
          fox.targetY = currentBottomY;
          fox.actionTimer = 60 + Math.floor(Math.random() * 45);
        }
      }

      // --- Interacciones y Combates ---
      if (battleMode && distance < 135) {
        if (Math.random() > 0.5) {
          dragon.action = 'attack';
          fox.action = 'hit';
          setBattleLog('💥 ¡Dragón AI lanza ráfaga de plasma cian!');
        } else {
          fox.action = 'attack';
          dragon.action = 'hit';
          setBattleLog('⚡ ¡Zorro Tech embiste con ráfaga ámbar!');
        }
      } else if (!battleMode && distance < 140 && Math.random() < 0.04) {
        dragon.action = 'celebrate';
        fox.action = 'celebrate';
        setBattleLog('✨ Dragón AI y Zorro Tech coordinan datos de taller');
        setTimeout(() => setBattleLog(null), 2500);
      }

      // Interpolación suave para Dragón
      const dSpeed = dragon.state === 'flying' ? 3.6 : 2.5;
      const dAngle = Math.atan2(dragon.targetY - dragon.y, dragon.targetX - dragon.x);
      if (Math.hypot(dragon.targetX - dragon.x, dragon.targetY - dragon.y) > 6) {
        dragon.vx = Math.cos(dAngle) * dSpeed;
        dragon.vy = Math.sin(dAngle) * dSpeed;
        dragon.x += dragon.vx;
        dragon.y += dragon.vy;
        dragon.direction = dragon.vx > 0 ? 'right' : 'left';
        if (dragon.state === 'flying') dragon.action = 'fly';
        else if (dragon.action !== 'attack' && dragon.action !== 'hit') dragon.action = 'walk';
      } else {
        dragon.vx = 0;
        dragon.vy = 0;
        if (dragon.state === 'flying') dragon.action = 'fly';
        else if (dragon.action !== 'attack' && dragon.action !== 'hit') dragon.action = 'idle';
      }

      // Interpolación suave para Zorro
      const fSpeed = fox.state === 'battling' ? 4.2 : 3.0;
      const fAngle = Math.atan2(fox.targetY - fox.y, fox.targetX - fox.x);
      if (Math.hypot(fox.targetX - fox.x, fox.targetY - fox.y) > 6) {
        fox.vx = Math.cos(fAngle) * fSpeed;
        fox.vy = Math.sin(fAngle) * fSpeed;
        fox.x += fox.vx;
        fox.y += fox.vy;
        fox.direction = fox.vx > 0 ? 'right' : 'left';
        if (fox.action !== 'attack' && fox.action !== 'hit') fox.action = 'run';
      } else {
        fox.vx = 0;
        fox.vy = 0;
        if (fox.action !== 'attack' && fox.action !== 'hit') fox.action = 'idle';
      }

      setRenderTrigger((r) => r + 1);
    }, 50);

    return () => clearInterval(interval);
  }, [enabled, battleMode, bounds]);

  if (!enabled) {
    return (
      <button
        onClick={() => setEnabled(true)}
        className="fixed bottom-3 right-4 z-40 px-3 py-1.5 rounded-xl bg-bg-surface/85 border border-white/10 text-cyan-400 text-xs flex items-center gap-1.5 backdrop-blur-md hover:bg-white/10 transition-colors shadow-lg"
        title="Invocar Mascotas AI"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Mascotas AI</span>
      </button>
    );
  }

  const dragon = dragonRef.current;
  const fox = foxRef.current;

  return (
    <>
      {/* ── Contenedor libre en franja inferior (pointer-events-none para no bloquear controles) ── */}
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
        {/* Dragón AI con Render 3D de alta fidelidad */}
        <div
          className="absolute transition-all ease-linear pointer-events-auto cursor-pointer"
          style={{
            left: `${dragon.x}px`,
            top: `${dragon.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => {
            dragon.targetY = flightY;
            dragon.state = 'flying';
            dragon.action = 'fly';
            setBattleLog('🐉 ¡Dragón AI alza vuelo!');
            setTimeout(() => setBattleLog(null), 2000);
          }}
          title="Dragón AI (Haz clic para hacerlo volar)"
        >
          <MasterRenderCharacter
            kind="dragon-ai"
            action={dragon.action}
            direction={dragon.direction}
            tick={tick}
          />
        </div>

        {/* Zorro Tech con Render 3D de alta fidelidad */}
        <div
          className="absolute transition-all ease-linear pointer-events-auto cursor-pointer"
          style={{
            left: `${fox.x}px`,
            top: `${fox.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => {
            fox.action = 'jump';
            setBattleLog('🦊 ¡Zorro Tech da un salto!');
            setTimeout(() => setBattleLog(null), 2000);
          }}
          title="Zorro Tech (Haz clic para hacerlo saltar)"
        >
          <MasterRenderCharacter
            kind="fox-tech"
            action={fox.action}
            direction={fox.direction}
            tick={tick}
          />
        </div>
      </div>

      {/* ── Barra de Control Minimalista en la esquina inferior ── */}
      <div className="fixed bottom-3 right-4 z-40 flex items-center gap-2 bg-bg-surface/90 border border-white/10 px-3 py-1.5 rounded-2xl backdrop-blur-xl shadow-2xl">
        {/* Banner de eventos o combate */}
        {battleLog && (
          <span className="text-[11px] text-cyan-300 font-mono pr-2 border-r border-white/10 animate-pulse hidden sm:inline">
            {battleLog}
          </span>
        )}

        {/* Botón Modo Pelea / Jugar */}
        <button
          onClick={() => {
            const nextMode = !battleMode;
            setBattleMode(nextMode);
            setBattleLog(nextMode ? '⚔️ ¡Modo Combate activado!' : '🤝 ¡Modo Exploración!');
            setTimeout(() => setBattleLog(null), 2500);
          }}
          className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
            battleMode
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
              : 'bg-white/5 text-text-secondary hover:text-cyan-400 border border-white/10'
          }`}
          title={battleMode ? 'Desactivar combate' : 'Hacer que peleen o jueguen'}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>{battleMode ? 'Combatiendo' : 'Pelear / Jugar'}</span>
        </button>

        {/* Botón Cerrar */}
        <button
          onClick={() => setEnabled(false)}
          className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
          title="Ocultar mascotas"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}
