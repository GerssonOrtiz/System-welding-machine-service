'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QuadrupedDragonAI } from './QuadrupedDragonAI';
import { TechFoxCompanion } from './TechFoxCompanion';
import { X, Sparkles, Swords, Play, Pause, RefreshCw } from 'lucide-react';
import useSWR from 'swr';

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
  state: 'roaming' | 'flying' | 'chasing' | 'battling' | 'resting';
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardFreeMascots() {
  const [enabled, setEnabled] = useState(true);
  const [battleMode, setBattleMode] = useState(false);
  const [battleLog, setBattleLog] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Dimensiones de pantalla
  const [bounds, setBounds] = useState({ w: 1200, h: 800 });

  // Datos reales del sistema para contexto
  const { data: statsData } = useSWR('/api/stats', fetcher, { refreshInterval: 60000 });

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

  // Entidades físicas
  const dragonRef = useRef<PetEntity>({
    x: 180,
    y: 500,
    vx: 0,
    vy: 0,
    targetX: 400,
    targetY: 500,
    direction: 'right',
    action: 'walk',
    actionTimer: 80,
    state: 'roaming',
  });

  const foxRef = useRef<PetEntity>({
    x: 550,
    y: 520,
    vx: 0,
    vy: 0,
    targetX: 750,
    targetY: 520,
    direction: 'left',
    action: 'run',
    actionTimer: 60,
    state: 'roaming',
  });

  const [, setRenderTrigger] = useState(0);

  // Loop de física y comportamiento (60 FPS simulado a 30 FPS para rendimiento óptimo)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);

      const dragon = dragonRef.current;
      const fox = foxRef.current;
      const groundY = Math.max(250, bounds.h - 130);

      // Distancia entre ambos
      const dx = fox.x - dragon.x;
      const dy = fox.y - dragon.y;
      const distance = Math.hypot(dx, dy);

      // --- Lógica de la Mascota: Dragón AI ---
      dragon.actionTimer--;
      if (dragon.actionTimer <= 0) {
        // Escoger nuevo objetivo o comportamiento
        if (battleMode) {
          dragon.state = 'battling';
          dragon.targetX = fox.x + (dx > 0 ? -90 : 90);
          dragon.targetY = fox.y - (Math.random() > 0.4 ? 40 : 0);
          dragon.actionTimer = 40 + Math.floor(Math.random() * 40);
        } else {
          // Roaming normal o vuelo
          const shouldFly = Math.random() > 0.6;
          if (shouldFly) {
            dragon.state = 'flying';
            dragon.action = 'fly';
            dragon.targetX = 80 + Math.random() * (bounds.w - 240);
            dragon.targetY = 120 + Math.random() * (bounds.h * 0.45);
            dragon.actionTimer = 90 + Math.floor(Math.random() * 60);
          } else {
            dragon.state = 'roaming';
            dragon.action = 'walk';
            dragon.targetX = 60 + Math.random() * (bounds.w - 200);
            dragon.targetY = groundY;
            dragon.actionTimer = 70 + Math.floor(Math.random() * 50);
          }
        }
      }

      // --- Lógica de la Mascota: Zorro Tech ---
      fox.actionTimer--;
      if (fox.actionTimer <= 0) {
        if (battleMode) {
          fox.state = 'battling';
          fox.targetX = dragon.x + (dx > 0 ? 90 : -90);
          fox.targetY = groundY;
          fox.actionTimer = 35 + Math.floor(Math.random() * 35);
        } else {
          // El zorro prefiere el suelo y saltos ágiles
          fox.state = 'roaming';
          fox.action = Math.random() > 0.4 ? 'run' : 'jump';
          fox.targetX = 80 + Math.random() * (bounds.w - 220);
          fox.targetY = groundY;
          fox.actionTimer = 60 + Math.floor(Math.random() * 50);
        }
      }

      // Interacción de Combate / Juego
      if (battleMode && distance < 130) {
        if (Math.random() > 0.5) {
          dragon.action = 'attack';
          fox.action = 'hit';
          setBattleLog('💥 ¡Dragón AI lanza ráfaga de plasma cian!');
        } else {
          fox.action = 'attack';
          dragon.action = 'hit';
          setBattleLog('⚡ ¡Zorro Tech embiste con ráfaga ámbar!');
        }
      } else if (!battleMode && distance < 150 && Math.random() < 0.05) {
        // Interacción amistosa ocasional
        dragon.action = 'celebrate';
        fox.action = 'celebrate';
        setBattleLog('✨ ¡Dragón AI y Zorro Tech sincronizan datos!');
        setTimeout(() => setBattleLog(null), 3000);
      }

      // Movimiento físico interpolado para Dragón
      const dSpeed = dragon.state === 'flying' ? 3.8 : 2.4;
      const dAngle = Math.atan2(dragon.targetY - dragon.y, dragon.targetX - dragon.x);
      if (Math.hypot(dragon.targetX - dragon.x, dragon.targetY - dragon.y) > 8) {
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

      // Movimiento físico interpolado para Zorro
      const fSpeed = fox.state === 'battling' ? 4.5 : 3.2;
      const fAngle = Math.atan2(fox.targetY - fox.y, fox.targetX - fox.x);
      if (Math.hypot(fox.targetX - fox.x, fox.targetY - fox.y) > 8) {
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
        className="fixed bottom-4 right-4 z-40 px-3 py-1.5 rounded-xl bg-bg-surface/80 border border-white/10 text-cyan-400 text-xs flex items-center gap-1.5 backdrop-blur-md hover:bg-white/10 transition-colors shadow-lg"
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
      {/* ── Contenedor libre sobre el dashboard con pointer-events-none para no bloquear clics ── */}
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
        {/* Dragón AI Cuadrúpedo / Volador */}
        <div
          className="absolute transition-all ease-linear pointer-events-auto cursor-pointer"
          style={{
            left: `${dragon.x}px`,
            top: `${dragon.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => {
            dragon.targetY = 140;
            dragon.state = 'flying';
            dragon.action = 'fly';
            setBattleLog('🐉 Dragón AI alza vuelo al hacerle clic!');
            setTimeout(() => setBattleLog(null), 2500);
          }}
          title="Dragón AI (Haz clic para hacerlo volar)"
        >
          <QuadrupedDragonAI
            action={dragon.action === 'fly' ? 'fly' : dragon.action === 'attack' ? 'attack' : dragon.action === 'hit' ? 'hit' : dragon.action === 'walk' ? 'walk' : 'idle'}
            direction={dragon.direction}
            tick={tick}
          />
        </div>

        {/* Zorro Tech Ágil */}
        <div
          className="absolute transition-all ease-linear pointer-events-auto cursor-pointer"
          style={{
            left: `${fox.x}px`,
            top: `${fox.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => {
            fox.action = 'jump';
            setBattleLog('🦊 Zorro Tech salta ágilmente!');
            setTimeout(() => setBattleLog(null), 2500);
          }}
          title="Zorro Tech (Haz clic para hacerlo saltar)"
        >
          <TechFoxCompanion
            action={fox.action === 'run' ? 'run' : fox.action === 'attack' ? 'attack' : fox.action === 'hit' ? 'hit' : 'idle'}
            direction={fox.direction}
            tick={tick}
          />
        </div>
      </div>

      {/* ── Barra de Control Superior Flotante para las Mascotas ── */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-bg-surface/90 border border-white/10 px-3 py-1.5 rounded-2xl backdrop-blur-xl shadow-2xl">
        {/* Banner de evento o combate */}
        {battleLog && (
          <span className="text-[11px] text-cyan-300 font-mono pr-2 border-r border-white/10 animate-pulse">
            {battleLog}
          </span>
        )}

        {/* Botón Modo Batalla / Modo Amistoso */}
        <button
          onClick={() => {
            const nextMode = !battleMode;
            setBattleMode(nextMode);
            setBattleLog(nextMode ? '⚔️ ¡Modo Combate activado!' : '🤝 ¡Modo Exploración libre activado!');
            setTimeout(() => setBattleLog(null), 3000);
          }}
          className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
            battleMode
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
              : 'bg-white/5 text-text-secondary hover:text-cyan-400 border border-white/10'
          }`}
          title={battleMode ? 'Desactivar combate' : 'Hacer que peleen o jueguen'}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>{battleMode ? 'En Combate' : 'Pelear / Jugar'}</span>
        </button>

        {/* Ocultar mascotas */}
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
