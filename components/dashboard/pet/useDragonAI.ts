// components/dashboard/pet/useDragonAI.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DragonAction,
  DragonDirection,
  DragonCoordinates,
  DragonPetPreference,
  DRAGON_STORAGE_KEY,
  DRAGON_TOGGLE_EVENT,
} from './types'

// Dimensiones reales del sprite = viewBox (80×56) × scale (1.8)
const PET_WIDTH  = 144   // 80 × 1.8
const PET_HEIGHT = 101   // 56 × 1.8
const GROUND_OFFSET = 16
const WALK_SPEED_MIN = 0.55
const WALK_SPEED_MAX = 1.45
const GRAVITY = 0.65
const TERMINAL_VELOCITY = 14

type TimedAction = Exclude<DragonAction, 'drag' | 'fall' | 'sleep'>

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min)

export function useDragonAI() {
  const [preference, setPreference] = useState<DragonPetPreference>('active')
  const [action, setAction] = useState<DragonAction>('walk')
  const [direction, setDirection] = useState<DragonDirection>('right')
  const [coords, setCoords] = useState<DragonCoordinates>({ x: 120, y: 0 })
  const [frameStep, setFrameStep] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const posRef = useRef<DragonCoordinates>({ x: 120, y: 0 })
  const velRef = useRef({ vx: WALK_SPEED_MIN, vy: 0 })
  const dirRef = useRef<DragonDirection>('right')
  const actionRef = useRef<DragonAction>('walk')
  const isDraggingRef = useRef(false)
  const prefRef = useRef<DragonPetPreference>('active')
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const lastTimeRef = useRef(0)
  const actionEndsAtRef = useRef(0)
  const directionChangeAtRef = useRef(0)
  const nextSpeedRef = useRef(WALK_SPEED_MIN)
  const frameCounterRef = useRef(0)
  const lastRenderAtRef = useRef(0)

  const changeDirection = useCallback((next: DragonDirection) => {
    dirRef.current = next
    setDirection(next)
  }, [])

  const chooseNextAction = useCallback((now = performance.now()) => {
    if (prefRef.current !== 'active' || isDraggingRef.current) return

    // Caminatas de duración variable intercaladas con pausas y pequeñas travesuras.
    const roll = Math.random()
    let next: TimedAction
    let duration: number

    if (roll < 0.43) {
      next = 'walk'
      duration = randomBetween(3200, 7600)
      nextSpeedRef.current = randomBetween(WALK_SPEED_MIN, WALK_SPEED_MAX)
      directionChangeAtRef.current = now + randomBetween(1200, 4200)
    } else if (roll < 0.61) {
      next = 'idle'
      duration = randomBetween(1600, 3600)
    } else if (roll < 0.73) {
      next = 'look'
      duration = randomBetween(1800, 3300)
    } else if (roll < 0.83) {
      next = 'sit'
      duration = randomBetween(2600, 5200)
    } else if (roll < 0.89) {
      next = 'spark'
      duration = 1900
    } else if (roll < 0.95) {
      next = 'snack'
      duration = 3300
    } else if (roll < 0.985) {
      next = 'tumble'
      duration = 1500
    } else {
      next = 'fly'
      duration = 2200
    }

    actionRef.current = next
    setAction(next)
    actionEndsAtRef.current = now + duration

    // A veces Sparky cambia de idea y mira hacia el otro lado antes de andar.
    if (next === 'look' && Math.random() < 0.55) {
      changeDirection(dirRef.current === 'right' ? 'left' : 'right')
    }
  }, [changeDirection])

  // Mantener la preferencia y la acción inicial sincronizadas con localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(DRAGON_STORAGE_KEY) as DragonPetPreference | null
      if (saved && ['active', 'sleep', 'hidden'].includes(saved)) {
        setPreference(saved)
        prefRef.current = saved
        if (saved === 'sleep') {
          setAction('sleep')
          actionRef.current = 'sleep'
        }
      }
    } catch {
      // El dashboard sigue funcionando aunque el navegador bloquee localStorage.
    }

    const groundY = window.innerHeight - PET_HEIGHT - GROUND_OFFSET
    const initialX = Math.min(
      Math.max(40, window.innerWidth * 0.2),
      Math.max(12, window.innerWidth - PET_WIDTH - 40),
    )
    posRef.current = { x: initialX, y: groundY }
    setCoords({ x: initialX, y: groundY })
    if (prefRef.current === 'active') chooseNextAction(performance.now())

    const handleCustomToggle = (event: Event) => {
      const next = (event as CustomEvent<DragonPetPreference>).detail
      if (!next || !['active', 'sleep', 'hidden'].includes(next)) return
      prefRef.current = next
      setPreference(next)

      if (next === 'sleep') {
        actionRef.current = 'sleep'
        setAction('sleep')
      } else if (next === 'active') {
        chooseNextAction()
      }
    }

    window.addEventListener(DRAGON_TOGGLE_EVENT, handleCustomToggle)
    return () => window.removeEventListener(DRAGON_TOGGLE_EVENT, handleCustomToggle)
  }, [chooseNextAction])

  const updatePreference = useCallback((newPref: DragonPetPreference) => {
    prefRef.current = newPref
    setPreference(newPref)

    try {
      localStorage.setItem(DRAGON_STORAGE_KEY, newPref)
    } catch {
      // Preferencia en memoria como fallback.
    }

    if (newPref === 'sleep') {
      actionRef.current = 'sleep'
      setAction('sleep')
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DRAGON_TOGGLE_EVENT, { detail: newPref }))
    }
  }, [chooseNextAction])

  // Parpadeos con intervalos irregulares, evitando parpadear mientras duerme o vuela.
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    const scheduleBlink = () => {
      blinkTimeout = setTimeout(() => {
        if (stopped) return
        if (!['sleep', 'fall', 'drag'].includes(actionRef.current) && Math.random() > 0.18) {
          setIsBlinking(true)
          setTimeout(() => setIsBlinking(false), 150)
        }
        scheduleBlink()
      }, randomBetween(2400, 5200))
    }

    scheduleBlink()
    return () => {
      stopped = true
      if (blinkTimeout) clearTimeout(blinkTimeout)
    }
  }, [])

  // Motor de locomoción: cambia de dirección durante el recorrido y decide cuándo parar.
  useEffect(() => {
    let animId = 0
    lastTimeRef.current = performance.now()

    const updatePhysics = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = now

      if (document.visibilityState === 'hidden' || prefRef.current === 'hidden') {
        animId = requestAnimationFrame(updatePhysics)
        return
      }

      const groundY = window.innerHeight - PET_HEIGHT - GROUND_OFFSET
      const minX = 12
      const maxX = Math.max(minX, window.innerWidth - PET_WIDTH - 12)

      if (isDraggingRef.current) {
        animId = requestAnimationFrame(updatePhysics)
        return
      }

      // Gravedad al soltar a Sparky en el aire o después de un pequeño salto.
      if (posRef.current.y < groundY - 1 || velRef.current.vy < 0) {
        velRef.current.vy = Math.min(velRef.current.vy + GRAVITY, TERMINAL_VELOCITY)
        posRef.current.y += velRef.current.vy

        if (actionRef.current !== 'fall' && actionRef.current !== 'spark') {
          actionRef.current = 'fall'
          setAction('fall')
        }

        if (posRef.current.y >= groundY) {
          posRef.current.y = groundY
          velRef.current.vy = 0
          if (prefRef.current === 'sleep') {
            actionRef.current = 'sleep'
            setAction('sleep')
          } else {
            chooseNextAction(now)
          }
        }

        if (now - lastRenderAtRef.current > 32) {
          setCoords({ ...posRef.current })
          lastRenderAtRef.current = now
        }
        animId = requestAnimationFrame(updatePhysics)
        return
      }

      if (prefRef.current === 'sleep') {
        if (actionRef.current !== 'sleep') {
          actionRef.current = 'sleep'
          setAction('sleep')
        }
        animId = requestAnimationFrame(updatePhysics)
        return
      }

      // El final de cada acción decide el siguiente comportamiento.
      if (actionRef.current !== 'fly' && now >= actionEndsAtRef.current && actionEndsAtRef.current > 0) {
        chooseNextAction(now)
      }

      if (actionRef.current === 'walk') {
        // Cambios espontáneos de dirección a mitad de camino, no solo al tocar el borde.
        if (now >= directionChangeAtRef.current) {
          if (Math.random() < 0.68) {
            changeDirection(dirRef.current === 'right' ? 'left' : 'right')
          }
          directionChangeAtRef.current = now + randomBetween(1800, 4800)
        }

        const sign = dirRef.current === 'right' ? 1 : -1
        posRef.current.x += sign * nextSpeedRef.current * dt * 60

        if (posRef.current.x >= maxX) {
          posRef.current.x = maxX
          changeDirection('left')
          directionChangeAtRef.current = now + randomBetween(1800, 3600)
        } else if (posRef.current.x <= minX) {
          posRef.current.x = minX
          changeDirection('right')
          directionChangeAtRef.current = now + randomBetween(1800, 3600)
        }

        frameCounterRef.current += dt * 60
        if (frameCounterRef.current >= 7) {
          frameCounterRef.current = 0
          setFrameStep((prev) => (prev + 1) % 4)
        }
      }

      // Limitar renders de posición para que la mascota no fuerce renders a 60 FPS.
      if (now - lastRenderAtRef.current > 32) {
        setCoords({ ...posRef.current })
        lastRenderAtRef.current = now
      }

      animId = requestAnimationFrame(updatePhysics)
    }

    animId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animId)
  }, [changeDirection, chooseNextAction])

  // Recalcular el suelo y mantener a Sparky dentro de la ventana al redimensionar.
  useEffect(() => {
    const handleResize = () => {
      const maxX = Math.max(12, window.innerWidth - PET_WIDTH - 12)
      const groundY = window.innerHeight - PET_HEIGHT - GROUND_OFFSET
      posRef.current.x = Math.min(Math.max(12, posRef.current.x), maxX)
      if (posRef.current.y > groundY) posRef.current.y = groundY
      setCoords({ ...posRef.current })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Drag & drop con mouse y touch mediante Pointer Events.
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (prefRef.current === 'hidden') return

    isDraggingRef.current = true
    setIsDragging(true)
    actionRef.current = 'drag'
    setAction('drag')
    velRef.current.vy = 0
    dragOffsetRef.current = {
      x: clientX - posRef.current.x,
      y: clientY - posRef.current.y,
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return
      const newX = Math.max(10, Math.min(window.innerWidth - PET_WIDTH - 10, event.clientX - dragOffsetRef.current.x))
      const newY = Math.max(10, Math.min(window.innerHeight - PET_HEIGHT - 10, event.clientY - dragOffsetRef.current.y))

      if (event.movementX > 1) changeDirection('right')
      else if (event.movementX < -1) changeDirection('left')

      posRef.current = { x: newX, y: newY }
      setCoords({ x: newX, y: newY })
    }

    const onPointerUp = () => {
      isDraggingRef.current = false
      setIsDragging(false)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)

      const groundY = window.innerHeight - PET_HEIGHT - GROUND_OFFSET
      if (posRef.current.y < groundY - 2) {
        actionRef.current = 'fall'
        setAction('fall')
        velRef.current.vy = 1
      } else {
        posRef.current.y = groundY
        setCoords({ ...posRef.current })
        chooseNextAction()
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }, [changeDirection, chooseNextAction])

  const triggerPoke = useCallback(() => {
    if (isDraggingRef.current || prefRef.current === 'hidden') return
    velRef.current.vy = -6
    actionRef.current = 'spark'
    setAction('spark')
    actionEndsAtRef.current = performance.now() + 1700
  }, [])

  return {
    preference,
    updatePreference,
    action,
    direction,
    coords,
    frameStep,
    isBlinking,
    isDragging,
    handleDragStart,
    triggerPoke,
  }
}
