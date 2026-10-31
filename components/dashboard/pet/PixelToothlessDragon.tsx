// components/dashboard/pet/PixelToothlessDragon.tsx
'use client'

import React from 'react'
import { DragonAction, DragonDirection } from './types'

interface PixelToothlessDragonProps {
  action: DragonAction
  direction: DragonDirection
  isBlinking?: boolean
  frameStep?: number
  scale?: number
}

/**
 * Sparky — Cyber Dragon Pixel Art v2
 * Rediseño fiel a Furia Nocturna (Chimuelo) en pixel art SVG puro.
 * ViewBox 80×56. Pose principal: agazapado con alas abiertas y ojos dorados grandes.
 * shapeRendering="crispEdges" para aspecto pixel art limpio.
 */
export function PixelToothlessDragon({
  action,
  direction,
  isBlinking = false,
  frameStep = 0,
  scale = 1.8,
}: PixelToothlessDragonProps) {
  const W = 80
  const H = 56

  const flying  = action === 'fly' || action === 'fall' || action === 'drag'
  const resting = action === 'idle' || action === 'sit' || action === 'sleep' || action === 'look'
  const walking = action === 'walk'
  const sleeping = action === 'sleep'
  const step    = frameStep % 2 === 1

  // Acciones "en suelo" que no son ni walking ni flying (snack, spark, tumble)
  const groundOther = !flying && !walking && !resting

  // La cola resting se usa para ground+resting; walking tiene su propia
  const useRestingTail = resting || groundOther

  // y central del ojo según postura
  const eyeY = resting ? 25 : walking ? 18 : 20

  return (
    <div
      className={[
        'sparky-sprite relative select-none pointer-events-none',
        flying        ? 'sparky-airborne' : '',
        walking       ? 'sparky-walking'  : '',
        resting       ? 'sparky-resting'  : '',
        sleeping      ? 'sparky-sleeping' : '',
        action === 'tumble' ? 'sparky-tumbling' : '',
      ].join(' ')}
      style={{
        width:  `${W * scale}px`,
        height: `${H * scale}px`,
        transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        transformOrigin: 'center bottom',
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        role="img"
        aria-label="Sparky, mascota Cyber Dragon"
        style={{ shapeRendering: 'crispEdges', imageRendering: 'pixelated', overflow: 'visible' }}
      >
        <defs>
          {/* Brillo suave en los ojos */}
          <filter id="sk-eye-glow" x="-110%" y="-110%" width="320%" height="320%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Brillo para efectos de plasma/chispa */}
          <filter id="sk-plasma-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <style>{`
          @keyframes sk-breathe  { 0%,100%{transform:translateY(0)}     50%{transform:translateY(-1.1px)} }
          @keyframes sk-tail-sw  { 0%,100%{transform:rotate(4deg)}      50%{transform:rotate(-9deg)} }
          @keyframes sk-wing-idle{ 0%,100%{transform:scaleY(1)}         50%{transform:scaleY(0.78)} }
          @keyframes sk-wing-fly { 0%,100%{transform:scaleY(1)}         50%{transform:scaleY(0.2)} }
          @keyframes sk-hover    { 0%,100%{transform:translateY(0)}      50%{transform:translateY(-3px)} }
          @keyframes sk-blink    { 0%,85%,100%{transform:scaleY(1)}     90%{transform:scaleY(0.06)} }
          @keyframes sk-tumble   { 0%{transform:rotate(0deg)}           100%{transform:rotate(360deg)} }
          @keyframes sk-zzz      { 0%{opacity:0;transform:translate(0,4px)} 30%{opacity:1} 100%{opacity:0;transform:translate(7px,-12px)} }

          .sk-body             { transform-box:fill-box; transform-origin:center; animation:sk-breathe 2.8s ease-in-out infinite; }
          .sk-tail             { transform-box:fill-box; transform-origin:0% 50%; animation:sk-tail-sw 2.4s ease-in-out infinite; }
          .sk-wing             { transform-box:fill-box; }
          .sk-eye              { transform-box:fill-box; transform-origin:center; animation:sk-blink 5.2s infinite; }

          .sparky-resting  .sk-wing   { animation:sk-wing-idle 3.6s ease-in-out infinite; }
          .sparky-airborne .sk-wing   { animation:sk-wing-fly  0.19s ease-in-out infinite; }
          .sparky-walking  .sk-body   { animation-duration:0.38s; }
          .sparky-resting  .sk-body   { animation-duration:4.5s; }
          .sparky-sleeping .sk-body   { animation-duration:6s; }
          .sparky-airborne            { animation:sk-hover 0.5s ease-in-out infinite; }
          .sparky-tumbling            { animation:sk-tumble 0.72s ease-in-out; }

          @media (prefers-reduced-motion:reduce) {
            .sparky-sprite *, .sparky-sprite { animation:none!important; }
          }
        `}</style>

        {/* ── Sombra en el suelo ── */}
        <ellipse
          cx="40" cy="54"
          rx={flying ? 8 : 24} ry={flying ? 1.2 : 2.6}
          fill="#000" opacity={flying ? '0.10' : '0.22'}
        />

        {/* ══════════════════════════════════
            COLA (detrás del cuerpo)
            ══════════════════════════════════ */}
        <g className="sk-tail">
          {useRestingTail && (
            <>
              {/* Cola barriendo hacia la derecha, pegada al suelo */}
              <path d="M53 46 L61 44 L69 41 L76 40 L80 44 L78 50 L70 52 L62 50 L53 50Z" fill="#0d1117" />
              {/* Extremo de la cola */}
              <path d="M74 38 L80 33 L84 40 L80 49 L74 49Z" fill="#1c2230" />
              {/* Segmentos de la cola */}
              <line x1="59" y1="45" x2="59" y2="51" stroke="#1c2230" strokeWidth="0.9" />
              <line x1="65" y1="43" x2="65" y2="51" stroke="#1c2230" strokeWidth="0.9" />
              <line x1="71" y1="41" x2="71" y2="50" stroke="#252d3c" strokeWidth="0.9" />
              {/* Prótesis roja (aleta carmesí) */}
              <path d="M76 34 L83 27 L87 36 L82 45Z" fill="#b91c1c" />
              <rect x="79" y="29" width="2" height="2" fill="#fca5a5" />
            </>
          )}
          {walking && (
            <>
              {/* Cola alzada detrás al caminar */}
              <path d="M32 42 L23 34 L14 27 L8 21 L12 21 L20 27 L28 35 L36 44Z" fill="#0d1117" />
              <path d="M8 18 L4 14 L10 18 L12 22Z" fill="#1c2230" />
              {/* Aleta carmesí al final */}
              <path d="M4 14 L0 10 L6 14 L6 18Z" fill="#b91c1c" />
              <rect x="1" y="11" width="2" height="2" fill="#fca5a5" />
            </>
          )}
          {flying && (
            <>
              {/* Cola extendida en vuelo */}
              <path d="M30 40 L19 32 L9 24 L4 18 L8 20 L17 26 L27 36 L33 42Z" fill="#0d1117" />
              <path d="M4 16 L0 12 L6 16 L6 20Z" fill="#1c2230" />
              <path d="M0 10 L-2 6 L4 12 L4 16Z"  fill="#b91c1c" />
            </>
          )}
        </g>

        {/* ══════════════════════════════════
            ALA TRASERA IZQUIERDA (grande, detrás del cuerpo)
            ══════════════════════════════════ */}
        <g className="sk-wing" style={{ transformOrigin: '28px 42px' }}>
          {flying ? (
            /* Vuelo: ala levantada */
            <path d="M26 40 L2 4 L10 18 L4 10 L8 30 L20 36 L26 42Z" fill="#161b22" stroke="#0a0d12" strokeWidth="1.5" />
          ) : (
            /* Reposo/caminar: ala abierta a los lados */
            <>
              <path d="M26 40 L4 24 L10 34 L2 30 L6 45 L18 47 L26 47Z" fill="#161b22" stroke="#0a0d12" strokeWidth="1.5" />
              {/* Costillas de membrana */}
              <line x1="6"  y1="40" x2="18" y2="47" stroke="#272f40" strokeWidth="0.9" />
              <line x1="7"  y1="34" x2="19" y2="45" stroke="#272f40" strokeWidth="0.9" />
              <line x1="9"  y1="28" x2="20" y2="43" stroke="#272f40" strokeWidth="0.9" />
            </>
          )}
        </g>

        {/* ══════════════════════════════════
            GRUPO CUERPO (respira junto)
            ══════════════════════════════════ */}
        <g className="sk-body">

          {/* ── Cuerpo principal ── */}
          <path
            d={resting
              ? 'M22 44 Q26 32 40 30 L58 32 Q66 40 64 54 L22 54Z'
              : walking
              ? 'M24 36 Q28 24 40 22 L58 24 Q66 32 64 48 L24 48Z'
              : 'M26 34 Q28 22 42 20 L58 22 Q66 30 64 44 L26 44Z'}
            fill="#0d1117" stroke="#050609" strokeWidth="1.5"
          />
          {/* Capa superior (gris muy oscuro) */}
          <path
            d={resting
              ? 'M26 40 L56 42 L54 54 L24 52Z'
              : walking
              ? 'M28 32 L56 34 L54 48 L26 46Z'
              : 'M30 30 L56 32 L54 44 L28 42Z'}
            fill="#161b22"
          />
          {/* Vientre (tonos marrones/tostados como la referencia) */}
          <path
            d={resting
              ? 'M30 42 L52 44 L50 54 L28 52Z'
              : walking
              ? 'M32 34 L52 36 L50 48 L30 46Z'
              : 'M34 32 L52 34 L50 44 L32 42Z'}
            fill="#2d1e10" opacity=".72"
          />
          {/* Pequeñas escamas en el lomo */}
          <rect x={resting ? 28 : 30} y={resting ? 32 : walking ? 24 : 22} width="3" height="2" fill="#252d3c" />
          <rect x={resting ? 38 : 40} y={resting ? 30 : walking ? 22 : 20} width="3" height="2" fill="#252d3c" />
          <rect x={resting ? 48 : 50} y={resting ? 31 : walking ? 23 : 21} width="3" height="2" fill="#252d3c" />

          {/* ── Patas / Garras ── */}
          {resting ? (
            <g fill="#0d1117" stroke="#050609" strokeWidth="1">
              {/* Pata delantera izquierda */}
              <path d="M26 50 L18 54 L20 59 L34 59 L36 53 L30 50Z" />
              {/* Pata delantera derecha */}
              <path d="M44 50 L42 54 L44 59 L58 59 L60 53 L54 50Z" />
              {/* Garras izquierda */}
              <line x1="20" y1="59" x2="18" y2="62" stroke="#07090e" strokeWidth="1.5" />
              <line x1="26" y1="59" x2="25" y2="62" stroke="#07090e" strokeWidth="1.5" />
              <line x1="32" y1="59" x2="33" y2="62" stroke="#07090e" strokeWidth="1.5" />
              {/* Garras derecha */}
              <line x1="44" y1="59" x2="42" y2="62" stroke="#07090e" strokeWidth="1.5" />
              <line x1="50" y1="59" x2="50" y2="62" stroke="#07090e" strokeWidth="1.5" />
              <line x1="56" y1="59" x2="58" y2="62" stroke="#07090e" strokeWidth="1.5" />
            </g>
          ) : walking ? (
            <g fill="#0d1117" stroke="#050609" strokeWidth="1">
              <path d={step
                ? 'M26 44 L22 48 L24 54 L34 54 L36 50Z'
                : 'M26 44 L28 48 L26 54 L36 54 L36 48Z'} />
              <path d={step
                ? 'M46 42 L50 48 L48 54 L58 52 L58 46Z'
                : 'M46 42 L42 48 L44 54 L54 54 L56 48Z'} />
            </g>
          ) : (
            <g fill="#0d1117" stroke="#050609" strokeWidth="1">
              <path d="M28 40 L24 44 L26 50 L36 50 L38 44 L34 40Z" />
              <path d="M46 40 L44 44 L46 50 L56 48 L56 42 L52 40Z" />
            </g>
          )}

          {/* ── Ala frontal derecha (encima del cuerpo) ── */}
          <g className="sk-wing" style={{ transformOrigin: '52px 41px' }}>
            {flying ? (
              <path d="M50 36 L64 8 L68 22 L76 10 L74 38 L60 44 L50 42Z" fill="#1c2230" stroke="#0a0d12" strokeWidth="1.5" />
            ) : resting ? (
              <path d="M52 40 L64 28 L70 34 L78 24 L74 45 L62 49 L52 46Z" fill="#1c2230" stroke="#0a0d12" strokeWidth="1.5" />
            ) : (
              <path d="M50 36 L62 22 L68 28 L76 18 L74 38 L62 43 L50 42Z" fill="#1c2230" stroke="#0a0d12" strokeWidth="1.5" />
            )}
            {/* Costillas del ala */}
            <line x1="57" y1="38" x2="67" y2="27" stroke="#2a3244" strokeWidth="0.8" />
            <line x1="61" y1="43" x2="70" y2="32" stroke="#252d3c" strokeWidth="0.8" />
          </g>

          {/* ── Cuello ── */}
          <path
            d={resting
              ? 'M38 36 L50 32 L56 38 L54 46 L38 46Z'
              : walking
              ? 'M38 28 L50 24 L56 30 L54 38 L38 38Z'
              : 'M38 28 L50 24 L56 30 L54 38 L38 38Z'}
            fill="#111620" stroke="#050609" strokeWidth="1"
          />

          {/* ── CABEZA ── */}
          <path
            d={resting
              ? 'M22 34 Q20 16 36 12 L52 12 Q62 16 62 32 L58 42 L24 40Z'
              : walking
              ? 'M22 26 Q20 8 36 4 L52 4 Q62 8 62 24 L58 34 L24 32Z'
              : 'M22 28 Q20 10 36 6 L52 6 Q62 10 62 26 L58 36 L24 34Z'}
            fill="#0d1117" stroke="#050609" strokeWidth="2"
          />
          {/* Brillo superior de la cabeza */}
          <path
            d={resting
              ? 'M26 30 Q30 18 42 14 L54 18 L56 28 L52 38 L28 36Z'
              : walking
              ? 'M26 22 Q30 10 42 6 L54 10 L56 20 L52 30 L28 28Z'
              : 'M26 24 Q30 12 42 8 L54 12 L56 22 L52 32 L28 30Z'}
            fill="#161b22"
          />

          {/* ── Aletas / Cuernos del oído ── */}
          {/* Aleta izquierda */}
          <path
            d={resting  ? 'M30 20 L22 4  L32 8  L38 20Z'
              : walking  ? 'M30 12 L22 -1 L32 3  L38 13Z'
              :            'M30 14 L22 1  L32 5  L38 14Z'}
            fill="#0d1117" stroke="#050609" strokeWidth="1.5"
          />
          {/* Aleta derecha */}
          <path
            d={resting  ? 'M46 18 L52 2  L58 8  L54 20Z'
              : walking  ? 'M46 10 L52 -4 L58 2  L54 12Z'
              :            'M46 12 L52 -1 L58 5  L54 14Z'}
            fill="#0d1117" stroke="#050609" strokeWidth="1.5"
          />
          {/* Sombras internas de las aletas */}
          <line x1={resting ? 31 : 31} y1={resting ? 16 : 10} x2={resting ? 26 : 26} y2={resting ? 6 : 2} stroke="#262d3a" strokeWidth="0.9" />
          <line x1={resting ? 50 : 50} y1={resting ? 14 : 8}  x2={resting ? 54 : 54} y2={resting ? 6 : 2}  stroke="#262d3a" strokeWidth="0.9" />

          {/* ── Hocico / Morro ── */}
          <path
            d={resting
              ? 'M52 26 L62 24 L66 28 L64 34 L54 34Z'
              : walking
              ? 'M52 18 L62 16 L66 20 L64 26 L54 26Z'
              : 'M52 20 L62 18 L66 22 L64 28 L54 28Z'}
            fill="#161b22" stroke="#050609" strokeWidth="1"
          />
          {/* Fosa nasal */}
          <rect x="61" y={resting ? 25 : walking ? 17 : 19} width="2" height="2" fill="#050609" />
          {/* Boca */}
          <path
            d={resting  ? 'M56 34 Q61 36 64 34'
              : walking  ? 'M56 26 Q61 28 64 26'
              :            'M56 28 Q61 30 64 28'}
            fill="none" stroke="#050609" strokeWidth="0.9"
          />

          {/* ── Papada / Mandíbula (tono marrón tostado) ── */}
          <path
            d={resting
              ? 'M28 36 Q42 42 54 38 L54 42 L28 42Z'
              : walking
              ? 'M28 28 Q42 34 54 30 L54 34 L28 34Z'
              : 'M28 30 Q42 36 54 32 L54 36 L28 36Z'}
            fill="#2d1e10"
          />

          {/* ══════════════════════════════════
              OJOS — elemento más importante
              Grandes, dorados/ámbar, pupila vertical
              ══════════════════════════════════ */}
          {sleeping ? (
            /* Ojos cerrados: arcos curvos */
            <g>
              <path
                d={resting ? 'M33 26 Q37 30 41 26' : 'M33 19 Q37 23 41 19'}
                fill="none" stroke="#c9a820" strokeWidth="2.5"
              />
              <path
                d={resting ? 'M46 26 Q50 29 54 26' : 'M46 19 Q50 22 54 19'}
                fill="none" stroke="#c9a820" strokeWidth="2"
              />
            </g>
          ) : (
            <>
              {/* Ojo izquierdo — más grande (ojo cercano del espectador) */}
              <g className="sk-eye" filter="url(#sk-eye-glow)">
                {/* Anillo exterior oscuro (limbo) */}
                <ellipse cx="37" cy={eyeY} rx="6.4" ry="7.8" fill="#6b4d00" />
                {/* Iris ámbar oscuro */}
                <ellipse cx="37" cy={eyeY} rx="5.2" ry="6.5" fill="#c08800" />
                {/* Iris ámbar claro */}
                <ellipse cx="37" cy={eyeY} rx="3.8" ry="6.5" fill="#e8c020" />
                {/* Pupila vertical negra */}
                <ellipse cx="37" cy={eyeY} rx="1.7" ry="5.5" fill="#060608" />
                {/* Reflejo blanco (punto de luz) */}
                <rect x="33" y={eyeY - 5.5} width="2.2" height="2.2" fill="#fffde0" opacity=".96" />
              </g>

              {isBlinking ? (
                /* Guiño / Parpadeo */
                <line
                  x1="31" y1={eyeY}
                  x2="55" y2={eyeY}
                  stroke="#c9a820" strokeWidth="2.5"
                />
              ) : (
                /* Ojo derecho — ligeramente más pequeño */
                <g filter="url(#sk-eye-glow)">
                  <ellipse cx="49" cy={eyeY} rx="5.5" ry="6.8" fill="#6b4d00" />
                  <ellipse cx="49" cy={eyeY} rx="4.3" ry="5.5" fill="#c08800" />
                  <ellipse cx="49" cy={eyeY} rx="3.0" ry="5.5" fill="#e8c020" />
                  <ellipse cx="49" cy={eyeY} rx="1.4" ry="4.7" fill="#060608" />
                  <rect x="45.5" y={eyeY - 4.8} width="2" height="2" fill="#fffde0" opacity=".96" />
                </g>
              )}
            </>
          )}
        </g>{/* fin .sk-body */}

        {/* ══════════════════════════════════
            EFECTOS (fuera del grupo cuerpo)
            ══════════════════════════════════ */}

        {/* Chispa de arco eléctrico */}
        {action === 'spark' && (
          <g filter="url(#sk-plasma-glow)">
            <path d="M66 28 L74 20 L72 28 L80 24 L74 34 L70 32Z" fill="#00d2ff" stroke="#b8f5ff" strokeWidth="1" />
            <circle cx="72" cy="28" r="2.5" fill="#fff" />
          </g>
        )}

        {/* Snack: pescadito */}
        {action === 'snack' && (
          <g>
            <path d="M64 28 L72 26 L76 30 L72 36 L64 36Z" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
            <path d="M72 26 L77 22 L76 28Z" fill="#fb923c" />
            <circle cx="66" cy="30" r="0.8" fill="#111" />
          </g>
        )}

        {/* Zzz durmiendo */}
        {sleeping && (
          <g fill="#38bdf8" fontFamily="monospace" fontWeight="bold">
            <text x="60" y="14" fontSize="6" style={{ animation: 'sk-zzz 2s ease-out infinite' }}>z</text>
            <text x="66" y="8"  fontSize="8" style={{ animation: 'sk-zzz 2s 0.6s ease-out infinite' }}>Z</text>
          </g>
        )}

        {/* Partículas de viento en vuelo */}
        {action === 'fly' && (
          <g fill="#67e8f9" opacity=".8">
            <rect x="6" y="20" width="3" height="1" />
            <rect x="3" y="26" width="5" height="1" />
            <rect x="8" y="30" width="2" height="1" />
          </g>
        )}

        {/* Líneas de caída */}
        {action === 'fall' && (
          <g fill="none" stroke="#94a3b8" opacity=".65">
            <path d="M10 14 L8 20 L11 18 L9 24" strokeWidth="1.5" />
            <path d="M16 20 L14 26" strokeWidth="1.2" />
          </g>
        )}
      </svg>
    </div>
  )
}
