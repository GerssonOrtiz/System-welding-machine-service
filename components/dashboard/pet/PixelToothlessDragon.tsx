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
 * Sparky — dragón pixel art inspirado en una pequeña Furia Nocturna.
 * SVG vectorial con bordes duros para conservar el aspecto pixel art.
 */
export function PixelToothlessDragon({
  action,
  direction,
  isBlinking = false,
  frameStep = 0,
  scale = 2.4,
}: PixelToothlessDragonProps) {
  const width = 80
  const height = 64
  const flying = action === 'fly' || action === 'fall' || action === 'drag'
  const sitting = action === 'sit' || action === 'sleep' || action === 'idle' || action === 'look'
  const walking = action === 'walk'
  const eating = action === 'snack'
  const sleeping = action === 'sleep'
  const looking = action === 'look'
  const step = frameStep % 2 === 1

  return (
    <div
      className={`sparky-sprite relative select-none pointer-events-none ${flying ? 'sparky-airborne' : ''} ${walking ? 'sparky-walking' : ''} ${sitting ? 'sparky-resting' : ''} ${sleeping ? 'sparky-sleeping' : ''} ${action === 'tumble' ? 'sparky-tumbling' : ''}`}
      style={{
        width: `${width * scale}px`,
        height: `${height * scale}px`,
        transform: `${direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`,
        transformOrigin: 'center bottom',
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        role="img"
        aria-label="Sparky, mascota cyber dragón"
        style={{ shapeRendering: 'crispEdges', imageRendering: 'pixelated', overflow: 'visible' }}
      >
        <defs>
          <filter id="sparky-eye-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="sparky-plasma-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <style>{`
          @keyframes sparky-breathe { 0%,100%{transform:translateY(0) scaleY(1)} 50%{transform:translateY(-1px) scaleY(1.025)} }
          @keyframes sparky-tail { 0%,100%{transform:rotate(2deg)} 50%{transform:rotate(-7deg)} }
          @keyframes sparky-wing { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(.48)} }
          @keyframes sparky-wing-fast { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(.28)} }
          @keyframes sparky-hover { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
          @keyframes sparky-blink { 0%,90%,100%{transform:scaleY(1)} 94%{transform:scaleY(.12)} }
          @keyframes sparky-z { 0%{opacity:0;transform:translate(0,4px)} 30%{opacity:1} 100%{opacity:0;transform:translate(5px,-10px)} }
          @keyframes sparky-tumble { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
          .sparky-body { transform-box:fill-box; transform-origin:center bottom; animation:sparky-breathe 2.4s ease-in-out infinite; }
          .sparky-tail { transform-box:fill-box; transform-origin:100% 50%; animation:sparky-tail 2.1s ease-in-out infinite; }
          .sparky-wing { transform-box:fill-box; transform-origin:70% 90%; }
          .sparky-airborne .sparky-wing { animation:sparky-wing-fast .22s ease-in-out infinite; }
          .sparky-resting .sparky-body { animation-duration:3.5s; }
          .sparky-walking .sparky-body { animation-duration:.42s; }
          .sparky-sprite.sparky-airborne { animation:sparky-hover .55s ease-in-out infinite; }
          .sparky-sleeping .sparky-body { animation-duration:4s; }
          .sparky-tumbling { animation:sparky-tumble .65s ease-in-out; }
          .sparky-eye { transform-box:fill-box; transform-origin:center; animation:sparky-blink 4.8s infinite; }
          @media (prefers-reduced-motion: reduce) { .sparky-sprite *, .sparky-sprite { animation:none!important; } }
        `}</style>

        {/* Sombra: se estrecha cuando está en el aire */}
        <ellipse cx="39" cy="58" rx={flying ? 12 : 29} ry={flying ? 2 : 3.2} fill="#050609" opacity={flying ? '.16' : '.32'} />

        {/* Cola larga y flexible con prótesis roja */}
        <g className="sparky-tail">
          <path d="M23 43 L15 42 L10 39 L7 35 L8 32 L13 34 L17 36 L25 35 L32 38 L31 43Z" fill="#0b0d12" stroke="#050609" strokeWidth="1.5" />
          <path d="M11 37 L6 33 L3 29 L8 29 L13 32Z" fill="#252a34" />
          <path d="M6 29 L2 27 L4 23 L9 24 L11 28Z" fill="#b91c3b" stroke="#101116" strokeWidth="1" />
          <rect x="4" y="25" width="2" height="2" fill="#fda4af" />
          <path d="M13 40 L7 38 L5 35" fill="none" stroke="#424957" strokeWidth="1.5" />
        </g>

        {/* Ala posterior */}
        <g className="sparky-wing" style={{ animationDuration: flying ? '.2s' : '2.8s' }}>
          <path d={flying ? 'M31 34 L20 8 L29 15 L34 3 L39 16 L49 7 L47 34Z' : 'M29 35 L24 18 L33 23 L39 14 L43 25 L49 21 L47 39Z'} fill="#171b24" stroke="#07090e" strokeWidth="2" />
          <path d="M28 20 L34 27 L39 17 L42 29 L47 24" fill="none" stroke="#343b49" strokeWidth="2" />
          <path d="M31 28 L37 32 L43 28" fill="none" stroke="#252c38" strokeWidth="1.5" />
        </g>

        {/* Cuerpo principal */}
        <g className="sparky-body">
          <path d="M18 34 Q20 27 31 27 L48 29 Q57 33 58 43 L53 53 L22 54 L15 47Z" fill="#11141b" stroke="#050609" strokeWidth="2" />
          <path d="M23 33 Q31 29 43 33 L50 43 L45 51 L24 50 L19 43Z" fill="#202530" />
          <path d="M28 35 L35 34 L41 38 L39 47 L29 47Z" fill="#292f3b" />
          <path d="M30 39 L37 39 L38 45 L31 46Z" fill="#343b47" opacity=".65" />
          {/* pequeñas escamas y reflejos */}
          <rect x="25" y="30" width="3" height="2" fill="#49515d" />
          <rect x="34" y="29" width="2" height="2" fill="#515967" />
          <rect x="42" y="31" width="3" height="2" fill="#3c4451" />
          <rect x="20" y="44" width="2" height="2" fill="#596270" opacity=".7" />

          {/* Patas: postura sentada o zancada */}
          {sitting ? (
            <g fill="#0b0d12" stroke="#050609" strokeWidth="1">
              <path d="M20 46 L29 46 L30 54 L27 57 L17 56 L16 52Z" />
              <path d="M39 45 L48 44 L52 52 L49 57 L39 57 L36 53Z" />
              <path d="M16 54 L29 54 L29 58 L14 58Z" fill="#242a35" />
              <path d="M38 54 L52 54 L54 58 L37 58Z" fill="#242a35" />
            </g>
          ) : (
            <g fill="#0b0d12" stroke="#050609" strokeWidth="1">
              <path d={step ? 'M20 45 L27 46 L25 55 L19 57 L14 55Z' : 'M20 45 L27 46 L30 54 L27 57 L18 56Z'} />
              <path d={step ? 'M39 45 L46 45 L52 53 L49 57 L41 56Z' : 'M39 45 L46 45 L44 55 L39 57 L35 54Z'} />
              <path d="M14 55 L27 55 L28 58 L12 58Z" fill="#252b36" />
              <path d="M38 55 L51 55 L53 58 L36 58Z" fill="#252b36" />
            </g>
          )}

          {/* Ala visible del primer plano */}
          <g className="sparky-wing" style={{ animationDuration: flying ? '.19s' : '3.2s' }}>
            <path d={flying ? 'M31 38 L17 15 L26 19 L29 7 L36 19 L44 13 L43 39Z' : 'M29 37 L22 22 L29 25 L34 18 L39 27 L45 23 L43 41Z'} fill="#252b36" stroke="#080a10" strokeWidth="2" />
            <path d="M24 24 L31 32 L35 22 L40 33" fill="none" stroke="#424b59" strokeWidth="1.6" />
            <path d="M28 31 L35 37 L41 31" fill="none" stroke="#171b24" strokeWidth="2" />
          </g>

          {/* Cuello y cabeza grande */}
          <path d="M40 35 L48 31 L55 34 L56 43 L49 47 L41 43Z" fill="#171b24" stroke="#050609" strokeWidth="1.5" />
          <path d="M31 23 Q30 14 39 12 L49 13 Q57 15 59 23 L57 34 L51 39 L37 37 L31 31Z" fill="#171b24" stroke="#050609" strokeWidth="2" />
          <path d="M35 19 Q39 14 48 16 L54 21 L53 31 L47 35 L37 32Z" fill="#252b36" />

          {/* Orejas / cuernos característicos */}
          <path d="M34 17 L27 4 L34 6 L39 15Z" fill="#171b24" stroke="#050609" strokeWidth="1.5" />
          <path d="M47 15 L53 3 L57 7 L55 19Z" fill="#171b24" stroke="#050609" strokeWidth="1.5" />
          <path d="M31 9 L34 12 L35 15" fill="none" stroke="#424957" strokeWidth="1.5" />
          <path d="M52 8 L54 12 L53 16" fill="none" stroke="#424957" strokeWidth="1.5" />
          {/* Hocico */}
          <path d="M51 26 L61 25 L65 29 L63 34 L54 35 L50 31Z" fill="#1c212b" stroke="#080a10" strokeWidth="1.5" />
          <rect x="61" y="28" width="2" height="2" fill="#080a10" />
          <path d="M55 34 Q59 36 62 33" fill="none" stroke="#080a10" strokeWidth="1" />

          {/* Ojos grandes dorado/verde lima, como la referencia */}
          {sleeping ? (
            <path d="M40 25 Q44 29 48 25" fill="none" stroke="#d7c78a" strokeWidth="2" />
          ) : (
            <g className="sparky-eye" filter="url(#sparky-eye-glow)">
              <ellipse cx="43" cy="24" rx="4.3" ry="5.2" fill="#c9b66e" />
              <ellipse cx="43" cy="24" rx="3.1" ry="4" fill="#f3e6a4" />
              <ellipse cx={looking ? 44.2 : 43} cy="24" rx="1.45" ry="3.3" fill="#11130d" />
              <rect x="41" y="21" width="1.5" height="1.5" fill="#fff8d8" />
            </g>
          )}
          {!sleeping && !isBlinking && (
            <g filter="url(#sparky-eye-glow)">
              <ellipse cx="53" cy="24" rx="3.5" ry="4.5" fill="#c9b66e" />
              <ellipse cx="53" cy="24" rx="2.5" ry="3.5" fill="#f3e6a4" />
              <ellipse cx="53" cy="24" rx="1.2" ry="3" fill="#11130d" />
              <rect x="51.5" y="21" width="1.2" height="1.2" fill="#fff8d8" />
            </g>
          )}
          {isBlinking && !sleeping && <path d="M39 25 L47 25 M50 25 L56 25" stroke="#d8c77f" strokeWidth="2" />}
        </g>

        {/* Expresiones y efectos */}
        {action === 'spark' && (
          <g filter="url(#sparky-plasma-glow)">
            <path d="M64 28 L70 22 L68 28 L75 25 L70 33 L66 32Z" fill="#00d2ff" stroke="#b8f5ff" strokeWidth="1" />
            <circle cx="70" cy="29" r="2" fill="#fff" />
          </g>
        )}
        {eating && (
          <g>
            <path d="M61 35 L69 34 L72 37 L68 40 L61 39Z" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
            <path d="M68 34 L73 31 L72 37Z" fill="#fb923c" />
            <circle cx="64" cy="35" r=".7" fill="#111" />
          </g>
        )}
        {sleeping && (
          <g fill="#38bdf8" fontFamily="monospace" fontWeight="bold">
            <text x="59" y="15" fontSize="6" style={{ animation: 'sparky-z 2s ease-out infinite' }}>z</text>
            <text x="65" y="10" fontSize="8" style={{ animation: 'sparky-z 2s .55s ease-out infinite' }}>Z</text>
          </g>
        )}
        {action === 'fly' && (
          <g fill="#67e8f9" opacity=".9">
            <rect x="11" y="19" width="3" height="1" />
            <rect x="7" y="23" width="5" height="1" />
            <rect x="13" y="27" width="2" height="1" />
          </g>
        )}
        {action === 'fall' && (
          <g fill="#94a3b8" opacity=".75">
            <path d="M12 12 L9 17 L12 16 L10 21" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M18 17 L16 22" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
          </g>
        )}
      </svg>
    </div>
  )
}
