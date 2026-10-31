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

const PET_WIDTH = 150
const PET_HEIGHT = 125
const GROUND_OFFSET = 18 // Distancia desde el fondo de la pantalla
const WALK_SPEED = 1.2
const GRAVITY = 0.65
const TERMINAL_VELOCITY = 14

export function useDragonAI() {
  const [preference, setPreference] = useState<DragonPetPreference>('active')
  const [action, setAction] = useState<DragonAction>('walk')
  const [direction, setDirection] = useState<DragonDirection>('right')
  const [coords, setCoords] = useState<DragonCoordinates>({ x: 120, y: 0 })
  const [frameStep, setFrameStep] = useState<number>(0)
  const [isBlinking, setIsBlinking] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  // Referencias para lazo de animación
  const posRef = useRef<DragonCoordinates>({ x: 120, y: 0 })
  const velRef = useRef<{ vx: number; vy: number }>({ vx: WALK_SPEED, vy: 0 })
  const dirRef = useRef<DragonDirection>('right')
  const actionRef = useRef<DragonAction>('walk')
  const isDraggingRef = useRef<boolean>(false)
  const prefRef = useRef<DragonPetPreference>('active')
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const lastTimeRef = useRef<number>(performance.now())

  // Sincronizar refs con states
  useEffect(() => {
    actionRef.current = action
  }, [action])

  useEffect(() => {
    dirRef.current = direction
  }, [direction])

  useEffect(() => {
    prefRef.current = preference
  }, [preference])

  // Cargar estado inicial desde localStorage y registrar listener para cambios externos
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(DRAGON_STORAGE_KEY) as DragonPetPreference | null
      if (saved && ['active', 'sleep', 'hidden'].includes(saved)) {
        setPreference(saved)
        prefRef.current = saved
        if (saved === 'sleep') setAction('sleep')
      }
    } catch {
      // Ignorar fallback de storage si hay bloqueo de cookies
    }

    // Inicializar posición sobre el suelo de la ventana
    const groundY = window.innerHeight - PET_HEIGHT - GROUND_OFFSET
    const initialX = Math.min(Math.max(40, window.innerWidth * 0.2), window.innerWidth - PET_WIDTH - 40)
    posRef.current = { x: initialX, y: groundY }
    setCoords({ x: initialX, y: groundY })

    const handleCustomToggle = (e: Event) => {
      const customEvent = e as CustomEvent<DragonPetPreference>
      if (customEvent.detail) {
        setPreference(customEvent.detail)
        prefRef.current = customEvent.detail
        if (customEvent.detail === 'sleep') {
          setAction('sleep')
        } else if (customEvent.detail === 'active' && actionRef.current === 'sleep') {
          setAction('walk')
        }
      }
    }

    window.addEventListener(DRAGON_TOGGLE_EVENT, handleCustomToggle)
    return () => window.removeEventListener(DRAGON_TOGGLE_EVENT, handleCustomToggle)
  }, [])

  // Guardar preferencia
  const updatePreference = useCallback((newPref: DragonPetPreference) => {
    setPreference(newPref)
    prefRef.current = newPref
    try {
      localStorage.setItem(DRAGON_STORAGE_KEY, newPref)
    } catch {}

    if (newPref === 'sleep') {
      setAction('sleep')
    } else if (newPref === 'active' && actionRef.current === 'sleep') {
      setAction('walk')
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DRAGON_TOGGLE_EVENT, { detail: newPref }))
    }
  }, [])

  // Parpadeo ocular aleatorio
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (actionRef.current !== 'sleep' && Math.random() > 0.4) {
        setIsBlinking(true)
        setTimeout(() => setIsBlinking(false), 180)
      }
    }, 3500)
    return () => clearInterval(blinkInterval)
  }, [])

  // Generador de travesuras periódicas si la mascota está 'active'
  useEffect(() => {
    if (preference !== 'active') return

    const mischiefTimer = setInterval(() => {
      if (isDraggingRef.current || prefRef.current !== 'active') return

      const roll = Math.random()
      if (roll < 0.28) {
        // Chispita de plasma
        setAction('spark')
        setTimeout(() => {
          if (prefRef.current === 'active' && !isDraggingRef.current) {
            setAction('walk')
          }
        }, 3200)
      } else if (roll < 0.52) {
        // Pescadito tostado
        setAction('snack')
        setTimeout(() => {
          if (prefRef.current === 'active' && !isDraggingRef.current) {
            setAction('walk')
          }
        }, 4000)
      } else if (roll < 0.70) {
        // Voltereta traviesa
        setAction('tumble')
        setTimeout(() => {
          if (prefRef.current === 'active' && !isDraggingRef.current) {
            setAction('walk')
          }
        }, 1200)
      } else if (roll < 0.88) {
        // Pausa pensativa / Curioso
        setAction('idle')
        setTimeout(() => {
          if (prefRef.current === 'active' && !isDraggingRef.current) {
            // Cambiar de dirección a veces al reanudar
            if (Math.random() > 0.5) {
              const newDir = dirRef.current === 'right' ? 'left' : 'right'
              setDirection(newDir)
              dirRef.current = newDir
            }
            setAction('walk')
          }
        }, 2800)
      }
    }, 14000)

    return () => clearInterval(mischiefTimer)
  }, [preference])

  // Ciclo de animación física y movimiento con requestAnimationFrame
  useEffect(() => {
    let animId: number
    let stepCounter = 0

    const updatePhysics = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1) // clamp dt
      lastTimeRef.current = now

      // No mover si la pestaña está oculta o si el dragón está oculto
      if (document.visibilityState === 'hidden' || prefRef.current === 'hidden') {
        animId = requestAnimationFrame(updatePhysics)
        return
      }

      const groundY = window.innerHeight - PET_HEIGHT - GROUND_OFFSET
      const maxX = window.innerWidth - PET_WIDTH - 12
      const minX = 12

      // Si está siendo arrastrado por el ratón, las coordenadas las maneja el mousemove
      if (isDraggingRef.current) {
        animId = requestAnimationFrame(updatePhysics)
        return
      }

      // ── FÍSICA DE CAÍDA (GRAVEDAD) ──
      if (posRef.current.y < groundY - 1) {
        velRef.current.vy = Math.min(velRef.current.vy + GRAVITY, TERMINAL_VELOCITY)
        posRef.current.y += velRef.current.vy

        // Al planear hacia abajo
        if (actionRef.current !== 'fall' && actionRef.current !== 'drag') {
          setAction('fall')
        }

        // Toca el suelo
        if (posRef.current.y >= groundY) {
          posRef.current.y = groundY
          velRef.current.vy = 0
          if (prefRef.current === 'sleep') {
            setAction('sleep')
          } else {
            setAction('walk')
          }
        }

        setCoords({ ...posRef.current })
        animId = requestAnimationFrame(updatePhysics)
        return
      }

      // Si está en el suelo y en modo sueño o pausado en travesura estática
      if (
        prefRef.current === 'sleep' ||
        actionRef.current === 'sleep' ||
        actionRef.current === 'spark' ||
        actionRef.current === 'snack' ||
        actionRef.current === 'idle'
      ) {
        animId = requestAnimationFrame(updatePhysics)
        return
      }

      // ── CAMINATA AUTÓNOMA HORIZONTAL ──
      stepCounter++
      if (stepCounter % 8 === 0) {
        setFrameStep((prev) => (prev + 1) % 4)
      }

      const currentDir = dirRef.current
      const speed = currentDir === 'right' ? WALK_SPEED : -WALK_SPEED

      posRef.current.x += speed * (dt * 60)

      // Rebote en bordes de la pantalla
      if (posRef.current.x >= maxX) {
        posRef.current.x = maxX
        dirRef.current = 'left'
        setDirection('left')
      } else if (posRef.current.x <= minX) {
        posRef.current.x = minX
        dirRef.current = 'right'
        setDirection('right')
      }

      setCoords({ ...posRef.current })
      animId = requestAnimationFrame(updatePhysics)
    }

    animId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animId)
  }, [])

  // ── MANEJO DE DRAG & DROP CON EL MOUSE / TOUCH ──
  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      if (preference === 'hidden') return

      isDraggingRef.current = true
      setIsDragging(true)
      setAction('drag')
      velRef.current.vy = 0

      dragOffsetRef.current = {
        x: clientX - posRef.current.x,
        y: clientY - posRef.current.y,
      }

      const onMouseMove = (moveEvt: MouseEvent) => {
        if (!isDraggingRef.current) return
        const newX = Math.max(10, Math.min(window.innerWidth - PET_WIDTH - 10, moveEvt.clientX - dragOffsetRef.current.x))
        const newY = Math.max(10, Math.min(window.innerHeight - PET_HEIGHT - 10, moveEvt.clientY - dragOffsetRef.current.y))

        // Si se mueve horizontalmente mientras se arrastra, acomodar la vista
        if (moveEvt.movementX > 2) {
          setDirection('right')
          dirRef.current = 'right'
        } else if (moveEvt.movementX < -2) {
          setDirection('left')
          dirRef.current = 'left'
        }

        posRef.current = { x: newX, y: newY }
        setCoords({ x: newX, y: newY })
      }

      const onMouseUp = () => {
        isDraggingRef.current = false
        setIsDragging(false)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)

        // Si quedó en el aire, caerá en el siguiente frame con gravedad
        const groundY = window.innerHeight - PET_HEIGHT - GROUND_OFFSET
        if (posRef.current.y < groundY - 2) {
          setAction('fall')
          velRef.current.vy = 1
        } else {
          posRef.current.y = groundY
          setCoords({ ...posRef.current })
          setAction(prefRef.current === 'sleep' ? 'sleep' : 'walk')
        }
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [preference]
  )

  const triggerPoke = useCallback(() => {
    if (isDraggingRef.current || preference === 'hidden') return

    // Reacción inmediata al hacer click suave (pequeño brinco y chispita)
    velRef.current.vy = -6
    setAction('spark')
    setTimeout(() => {
      if (prefRef.current === 'active' && !isDraggingRef.current) {
        setAction('walk')
      }
    }, 2500)
  }, [preference])

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
