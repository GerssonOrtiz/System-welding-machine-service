// components/dashboard/pet/types.ts
// Tipos e interfaces para la mascota interactiva Shimeji (Cyber Dragon).

export type DragonAction =
  | 'idle'
  | 'walk'
  | 'look'
  | 'sit'
  | 'fly'
  | 'spark'
  | 'snack'
  | 'tumble'
  | 'sleep'
  | 'drag'
  | 'fall'

export type DragonDirection = 'left' | 'right'
export type DragonPetPreference = 'active' | 'sleep' | 'hidden'

export interface DragonCoordinates {
  x: number
  y: number
}

export interface DragonVelocity {
  vx: number
  vy: number
}

export interface DragonDialogue {
  id: string
  text: string
  type: 'fun' | 'tip' | 'alert' | 'snack'
  timestamp: number
}

export const DRAGON_STORAGE_KEY = 'synapse_dragon_pet'
export const DRAGON_TOGGLE_EVENT = 'dragon_pet_toggle'
