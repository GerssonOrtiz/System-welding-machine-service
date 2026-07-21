// lib/validations/user.schema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3, { message: 'Ingrese su nombre de usuario' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
})

export const registerSchema = z.object({
  username: z.string()
    .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
    .max(20, { message: 'El nombre de usuario no puede exceder los 20 caracteres' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Solo se permiten letras, números y guiones bajos' }),
  email: z.string().email({ message: 'Debe ingresar un correo electrónico válido' }).optional().or(z.literal('')),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, { message: 'Ingrese su contraseña actual' }),
  newPassword: z.string().min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmNewPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
