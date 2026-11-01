'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OrganicDragonAI } from './OrganicDragonAI';
import { OrganicFoxTech } from './OrganicFoxTech';
import { X, Sparkles, Swords } from 'lucide-react';

type PetAction = 'idle' | 'walk' | 'run' | 'fly' | 'jump' | 'attack' | 'hit';

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
  state: 'walking' | 'flying' | 'battling';
}

export default function DashboardFreeMascots() {
  const [enabled, setEnabled] = useState(true);
  const [battleMode, setBattleMode] = useState(false);
  const [battleLog, setBattleLog] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Límites dinámicos de pantalla
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

  // Entidades confinadas en la franja inferior del dashboard
  const dragonRef = useRef<PetEntity>({
    x: 200,
    y: 700,
    vx: 0,
    vy: 0,
    targetX: 380,
    targetY: 700,
    direction: 'right',
    action: 'walk',
    actionTimer: 80,
    state: 'walking',
  });

  const foxRef = useRef<PetEntity>({
    x: 600,
    y: 700,
    vx: 0,
    vy: 0,
    targetX: 750,
    targetY: 700,
    direction: 'left',
    action: 'walk',
    actionTimer: 60,
    state: 'walking',
  });

  const [, setRenderTrigger] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);

      const dragon = dragonRef.current;
      const fox = foxRef.current;
      const groundY = bounds.h - 90;
      const flightY = bounds.h - 180;

      const dx = fox.x - dragon.x;
      const dy = fox.y - dragon.y;
      const distance = Math.hypot(dx, dy);

      // --- Dragón Místico: Comportamiento ---
      dragon.actionTimer--;
      if (dragon.actionTimer <= 0) {
        if (battleMode) {
          dragon.state = 'battling';
          dragon.targetX = fox.x + (dx > 0 ? -95 : 95);
          dragon.targetY = Math.random() > 0.4 ? flightY : groundY;
          dragon.actionTimer = 35 + Math.floor(Math.random() * 30);
        } else {
          const shouldFly = Math.random() > 0.6;
          if (shouldFly) {
            dragon.state = 'flying';
            dragon.action = 'fly';
            dragon.targetX = 80 + Math.random() * (bounds.w - 220);
            dragon.targetY = flightY;
            dragon.actionTimer = 80 + Math.floor(Math.random() * 50);
          } else {
            dragon.state = 'walking';
            dragon.action = 'walk';
            dragon.targetX = 80 + Math.random() * (bounds.w - 220);
            dragon.targetY = groundY;
            dragon.actionTimer = 70 + Math.floor(Math.random() * 50);
          }
        }
      }

      // --- Zorro Mágico: Comportamiento ---
      fox.actionTimer--;
      if (fox.actionTimer <= 0) {
        if (battleMode) {
          fox.state = 'battling';
          fox.targetX = dragon.x + (dx > 0 ? 95 : -95);
          fox.targetY = groundY;
          fox.actionTimer = 30 + Math.floor(Math.random() * 30);
        } else {
          fox.state = 'walking';
          fox.action = Math.random() > 0.4 ? 'run' : 'jump';
          fox.targetX = 80 + Math.random() * (bounds.w - 220);
          fox.targetY = groundY;
          fox.actionTimer = 60 + Math.floor(Math.random() * 45);
        }
      }

      // --- Batallas y Juego Amistoso ---
      if (battleMode && distance < 130) {
        if (Math.random() > 0.5) {
          dragon.action = 'attack';
          fox.action = 'hit';
          setBattleLog('✨ ¡El Dragón lanza un aliento de fuego místico!');
        } else {
          fox.action = 'attack';
          dragon.action = 'hit';
          setBattleLog('🦊 ¡El Zorro salta con un fuego fatuo dorado!');
        }
      }

      // Física Dragón
      const dSpeed = dragon.state === 'flying' ? 3.8 : 2.6;
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

      // Física Zorro
      const fSpeed = fox.state === 'battling' ? 4.2 : 3.2;
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
    }, 45);

    return () => clearInterval(interval);
  }, [enabled, battleMode, bounds]);

  if (!enabled) {
    return (
      <button
        onClick={() => setEnabled(true)}
        className="fixed bottom-3 right-4 z-40 px-3 py-1.5 rounded-xl bg-bg-surface/85 border border-white/10 text-cyan-400 text-xs flex items-center gap-1.5 backdrop-blur-md hover:bg-white/10 transition-colors shadow-lg"
        title="Invocar Mascotas de Fantasía"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Mascotas Mágicas</span>
      </button>
    );
  }

  const dragon = dragonRef.current;
  const fox = foxRef.current;
  const flightY = bounds.h - 180;

  return (
    <>
      {/* ── Franja Inferior Interactiva (pointer-events-none para no bloquear el dashboard) ── */}
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
        {/* Dragón Místico Orgánico Cuadrúpedo */}
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
            setBattleLog('🐉 ¡El pequeño dragón alza el vuelo aleteando!');
            setTimeout(() => setBattleLog(null), 2000);
          }}
          title="Dragón Mágico (Haz clic para hacerlo volar)"
        >
          <OrganicDragonAI
            action={dragon.action === 'fly' ? 'fly' : dragon.action === 'attack' ? 'attack' : dragon.action === 'hit' ? 'hit' : dragon.action === 'walk' ? 'walk' : 'idle'}
            direction={dragon.direction}
            tick={tick}
          />
        </div>

        {/* Zorro Mágico Orgánico Cuadrúpedo */}
        <div
          className="absolute transition-all ease-linear pointer-events-auto cursor-pointer"
          style={{
            left: `${fox.x}px`,
            top: `${fox.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => {
            fox.action = 'jump';
            setBattleLog('🦊 ¡El zorro da un salto juguetón!');
            setTimeout(() => setBattleLog(null), 2000);
          }}
          title="Zorro Mágico (Haz clic para hacerlo saltar)"
        >
          <OrganicFoxTech
            action={fox.action === 'run' ? 'run' : fox.action === 'jump' ? 'jump' : fox.action === 'attack' ? 'attack' : fox.action === 'hit' ? 'hit' : 'idle'}
            direction={fox.direction}
            tick={tick}
          />
        </div>
      </div>

      {/* ── Barra de Control en Esquina Inferior ── */}
      <div className="fixed bottom-3 right-4 z-40 flex items-center gap-2 bg-bg-surface/90 border border-white/10 px-3 py-1.5 rounded-2xl backdrop-blur-xl shadow-2xl">
        {battleLog && (
          <span className="text-[11px] text-cyan-300 font-sans pr-2 border-r border-white/10 animate-pulse hidden sm:inline">
            {battleLog}
          </span>
        )}

        {/* Botón Jugar / Pelear */}
        <button
          onClick={() => {
            const nextMode = !battleMode;
            setBattleMode(nextMode);
            setBattleLog(nextMode ? '⚔️ ¡A jugar y combatir!' : '🤝 ¡Explorando tranquilos!');
            setTimeout(() => setBattleLog(null), 2500);
          }}
          className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
            battleMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-white/5 text-text-secondary hover:text-cyan-400 border border-white/10'
          }`}
          title={battleMode ? 'Detener juego' : 'Hacer que jueguen o peleen'}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>{battleMode ? 'Jugando' : 'Jugar / Pelear'}</span>
        </button>

        {/* Botón Ocultar */}
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
