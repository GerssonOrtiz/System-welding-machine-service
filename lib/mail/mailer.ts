// lib/mail/mailer.ts
// Sistema de notificaciones internas por email — CABELAB v2.3
// Usa Resend. Si RESEND_API_KEY no está configurada, falla silenciosamente (no rompe el build ni la API).

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// ─────────────────────────────────────────
// DESTINATARIOS INTERNOS
// Modificar aquí para agregar o quitar receptores.
// ─────────────────────────────────────────
const RECIPIENTS = [
  'gortizri001@gmail.com', // Recepción
  'gortizri002@gmail.com', // Operaciones
  'gortizri003@gmail.com', // Logística
]

const CC_RECIPIENTS = [
  'gortizri@gmail.com',
]

// ─────────────────────────────────────────
// ESTILOS COMPARTIDOS
// ─────────────────────────────────────────
const tableHeaderStyle =
  'background-color: #1f375f; color: white; padding: 10px; font-size: 10px; text-transform: uppercase; border: 1px solid #dee2e6;'
const tableCellStyle =
  'padding: 10px; font-size: 10px; border: 1px solid #dee2e6; color: #333;'

// ─────────────────────────────────────────
// FIRMA INSTITUCIONAL
// ─────────────────────────────────────────
function buildSignature(): string {
  return `
    <div style="margin-top: 25px;">
      <p style="margin: 0; font-family: Calibri, sans-serif; color: #1f375f;">Un cordial saludo,</p>
      <p style="margin: 4px 0 0 0; font-family: Calibri, sans-serif;"><strong style="color: #1f375f; font-size: 14px;">Diana Salazar</strong></p>
      <p style="margin: 2px 0 0 0; font-family: Calibri, sans-serif; font-size: 12px; color: #555;">Asesoría Comercial — CABELAB</p>
    </div>

    <div style="margin-top: 20px;">
      <table style="border: none; border-collapse: collapse;">
        <tr>
          <td style="padding-right: 20px; border-right: 2px solid #5B9BD5; vertical-align: middle;">
            <img
              src="https://ofymvvwpusvjiipcdbuq.supabase.co/storage/v1/object/public/assets/cabelab-logo-email.png"
              alt="CABELAB" width="120" style="display: block;"
            />
          </td>
          <td style="padding-left: 20px; font-size: 11px; color: #1f375f; vertical-align: middle;">
            <a href="http://www.cabelab.com" style="color: #0070c0; text-decoration: none;">www.cabelab.com</a><br/>
            Cel: (+51) 919 007 755<br/>
            Mail: <a href="mailto:ventas@cabelab.com" style="color: #0070c0; text-decoration: none;">ventas@cabelab.com</a><br/>
            Av. Venezuela 866, Arequipa, Perú
          </td>
        </tr>
      </table>
    </div>

    <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9px; color: #888; text-align: justify; font-family: Calibri, sans-serif;">
      <strong>Aviso de confidencialidad:</strong> El presente correo, incluido cualquier archivo adjunto, va dirigido a la persona o entidad con información confidencial y/o privilegiada. Está prohibido compartir toda información, parcial y/o completa, con otras personas y/o terceros, sin el consentimiento por escrito del remitente inicial.
    </div>
  `
}

// ─────────────────────────────────────────
// CONFIGURACIÓN POR ESTADO
// Centraliza el asunto, color de encabezado, ícono y mensaje descriptivo para cada estado del workflow.
// Agregar aquí si se crean nuevos estados.
// ─────────────────────────────────────────
interface StateConfig {
  subject: string       // Asunto del correo
  headerColor: string   // Color del encabezado HTML
  icon: string          // Emoji representativo
  description: string   // Texto del cuerpo explicando qué ocurrió
}

const STATE_CONFIGS: Record<string, StateConfig> = {
  'en espera de diagnóstico': {
    subject: '📥 INGRESO DE EQUIPO',
    headerColor: '#5B9BD5',
    icon: '📥',
    description: 'El equipo ha ingresado al taller y se encuentra en espera de ser asignado para diagnóstico.',
  },
  'en diagnóstico': {
    subject: '🔍 EN DIAGNÓSTICO',
    headerColor: '#3B82F6',
    icon: '🔍',
    description: 'El equipo ha sido asignado a un técnico y se encuentra en proceso de diagnóstico.',
  },
  'pendiente de aprobación': {
    subject: '⏳ PENDIENTE DE APROBACIÓN',
    headerColor: '#F59E0B',
    icon: '⏳',
    description: 'El diagnóstico ha sido completado. El equipo está pendiente de aprobación por parte del cliente para proceder con el mantenimiento.',
  },
  'aprobado': {
    subject: '✅ EQUIPO APROBADO',
    headerColor: '#10B981',
    icon: '✅',
    description: 'El cliente ha aprobado el presupuesto. El técnico puede proceder con el mantenimiento del equipo.',
  },
  'en mantenimiento': {
    subject: '🔧 EN MANTENIMIENTO',
    headerColor: '#8B5CF6',
    icon: '🔧',
    description: 'El equipo se encuentra actualmente en proceso de mantenimiento por parte del técnico asignado.',
  },
  'en espera de repuesto': {
    subject: '📦 EN ESPERA DE REPUESTO',
    headerColor: '#EC4899',
    icon: '📦',
    description: 'El equipo requiere un repuesto para continuar con el servicio. Se necesita gestión de logística.',
  },
  'en espera de repuesto adicional': {
    subject: '📦 EN ESPERA DE REPUESTO ADICIONAL',
    headerColor: '#EC4899',
    icon: '📦',
    description: 'Durante el mantenimiento se identificó la necesidad de un repuesto adicional. Se requiere nueva gestión de logística.',
  },
  'control de calidad': {
    subject: '🔎 CONTROL DE CALIDAD',
    headerColor: '#06B6D4',
    icon: '🔎',
    description: 'El mantenimiento ha sido completado. El equipo se encuentra en proceso de control de calidad antes de ser entregado.',
  },
  'listo para entrega': {
    subject: '🟢 LISTO PARA ENTREGA',
    headerColor: '#22C55E',
    icon: '🟢',
    description: 'El equipo ha pasado el control de calidad y está listo para ser retirado por el cliente.',
  },
  'entregado': {
    subject: '🏁 EQUIPO ENTREGADO',
    headerColor: '#64748B',
    icon: '🏁',
    description: 'El equipo ha sido entregado al cliente. El servicio ha sido culminado exitosamente.',
  },
  // Estados especiales
  'revision': {
    subject: '🔁 EQUIPO EN REVISIÓN',
    headerColor: '#F97316',
    icon: '🔁',
    description: 'El equipo ha sido marcado para revisión interna.',
  },
  'prestamo': {
    subject: '🤝 EQUIPO EN PRÉSTAMO',
    headerColor: '#A855F7',
    icon: '🤝',
    description: 'El equipo ha sido registrado como equipo en préstamo.',
  },
}

// Fallback para estados no configurados explícitamente
const DEFAULT_STATE_CONFIG: StateConfig = {
  subject: '🔄 CAMBIO DE ESTADO',
  headerColor: '#64748B',
  icon: '🔄',
  description: 'El estado del equipo ha sido actualizado en el sistema.',
}

function getStateConfig(stateName: string): StateConfig {
  const key = stateName.trim().toLowerCase()
  return STATE_CONFIGS[key] ?? DEFAULT_STATE_CONFIG
}

// ─────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────

export interface StatusChangeData {
  fr_number: string
  client_name: string
  brand: string
  model: string
  serial_number?: string | null
  new_status_name: string
  previous_status_name?: string | null
  /** Solo para forzado por superadmin */
  override_reason?: string | null
  /** Usuario que realizó el cambio */
  changed_by?: string | null
}

export interface EquipmentEntryData {
  fr_number: string
  client_name: string
  brand: string
  model: string
  serial_number: string
  service_type: string
  client_report: string
  accessories: string
  is_priority: boolean
  date_in?: string
}

// ─────────────────────────────────────────
// BUILDER HTML GENÉRICO
// ─────────────────────────────────────────
function buildStatusChangeHtml(data: StatusChangeData, config: StateConfig, isOverride: boolean): string {
  const overrideBlock = isOverride && data.override_reason
    ? `
      <tr style="background-color: #FEF9C3;">
        <td style="${tableCellStyle} font-weight: bold; color: #B45309;">⚠ Motivo Override:</td>
        <td style="${tableCellStyle} color: #B45309; font-weight: bold;">${data.override_reason}</td>
      </tr>
    `
    : ''

  const previousStateRow = data.previous_status_name
    ? `
      <tr>
        <td style="${tableCellStyle} font-weight: bold;">Estado Anterior:</td>
        <td style="${tableCellStyle} color: #6B7280;">${data.previous_status_name}</td>
      </tr>
    `
    : ''

  const changedByRow = data.changed_by
    ? `
      <tr>
        <td style="${tableCellStyle} font-weight: bold;">Registrado por:</td>
        <td style="${tableCellStyle}">${data.changed_by}</td>
      </tr>
    `
    : ''

  const overrideBanner = isOverride
    ? `<div style="background-color: #FEF9C3; border: 1px solid #F59E0B; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 11px; color: #92400E; font-family: Calibri, sans-serif;">
        ⚠ <strong>CAMBIO FORZADO POR SUPERADMIN</strong> — Este cambio de estado fue realizado manualmente fuera del flujo normal del workflow.
      </div>`
    : ''

  return `
    <div style="font-family: Calibri, sans-serif; color: #1f375f; line-height: 1.5; max-width: 700px;">
      <p>Estimados,</p>
      <p style="margin-bottom: 16px;">Mediante el presente correo les informamos la siguiente actualización de estado en el sistema CABELAB.</p>

      ${overrideBanner}

      <div style="border-left: 4px solid ${config.headerColor}; background-color: ${config.headerColor}15; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <span style="font-size: 22px;">${config.icon}</span>
        <span style="font-size: 15px; font-weight: bold; color: ${config.headerColor}; margin-left: 8px; vertical-align: middle;">
          ${data.new_status_name.toUpperCase()}
        </span>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #555;">${config.description}</p>
      </div>

      <div style="overflow-x: auto; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr style="background-color: #F8FAFC;">
              <td style="${tableCellStyle} font-weight: bold; width: 180px;">Ficha (FR):</td>
              <td style="${tableCellStyle} font-weight: bold; font-size: 13px; color: #1f375f;">${data.fr_number}</td>
            </tr>
            <tr>
              <td style="${tableCellStyle} font-weight: bold;">Cliente:</td>
              <td style="${tableCellStyle}">${data.client_name}</td>
            </tr>
            <tr style="background-color: #F8FAFC;">
              <td style="${tableCellStyle} font-weight: bold;">Equipo:</td>
              <td style="${tableCellStyle}">${data.brand} ${data.model}</td>
            </tr>
            ${data.serial_number ? `
            <tr>
              <td style="${tableCellStyle} font-weight: bold;">N° Serie:</td>
              <td style="${tableCellStyle} font-family: monospace;">${data.serial_number}</td>
            </tr>` : ''}
            ${previousStateRow}
            <tr style="background-color: #F8FAFC;">
              <td style="${tableCellStyle} font-weight: bold;">Nuevo Estado:</td>
              <td style="${tableCellStyle} font-weight: bold; color: ${config.headerColor};">${data.new_status_name}</td>
            </tr>
            ${changedByRow}
            ${overrideBlock}
            <tr>
              <td style="${tableCellStyle} font-weight: bold;">Fecha/Hora:</td>
              <td style="${tableCellStyle} font-size: 9px; color: #6B7280;">${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })} (Hora Lima)</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${buildSignature()}
    </div>
  `
}

// ─────────────────────────────────────────
// BUILDER HTML — INGRESO DE EQUIPO
// (Mantiene el formato oficial de tabla horizontal)
// ─────────────────────────────────────────
function buildEntryHtml(data: EquipmentEntryData): string {
  const dateStr = data.date_in
    ? new Date(data.date_in).toLocaleDateString('es-PE')
    : new Date().toLocaleDateString('es-PE')

  return `
    <div style="font-family: Calibri, sans-serif; color: #1f375f; line-height: 1.5;">
      <p>Estimados,</p>
      <p style="margin-bottom: 20px;">Mediante el presente correo les informamos que ingresaron los siguientes equipos para su respectiva revisión.</p>

      <div style="overflow-x: auto; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
          <thead>
            <tr>
              <th style="${tableHeaderStyle}">FR</th>
              <th style="${tableHeaderStyle}">CLIENTE</th>
              <th style="${tableHeaderStyle}">F. INGRESO</th>
              <th style="${tableHeaderStyle}">MARCA</th>
              <th style="${tableHeaderStyle}">MODELO</th>
              <th style="${tableHeaderStyle}">SERIE</th>
              <th style="${tableHeaderStyle}">T. SERVICIO</th>
              <th style="${tableHeaderStyle}">FALLA REPORTADA</th>
              <th style="${tableHeaderStyle}">PRIORIDAD</th>
              <th style="${tableHeaderStyle}">ACCESORIOS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="${tableCellStyle} font-weight: bold;">${data.fr_number}</td>
              <td style="${tableCellStyle}">${data.client_name}</td>
              <td style="${tableCellStyle}">${dateStr}</td>
              <td style="${tableCellStyle}">${data.brand}</td>
              <td style="${tableCellStyle}">${data.model}</td>
              <td style="${tableCellStyle} font-family: monospace;">${data.serial_number}</td>
              <td style="${tableCellStyle}">${data.service_type}</td>
              <td style="${tableCellStyle}">${data.client_report || '-'}</td>
              <td style="${tableCellStyle} text-align: center;">${data.is_priority ? '⭐ Sí' : 'No'}</td>
              <td style="${tableCellStyle}">${data.accessories || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${buildSignature()}
    </div>
  `
}

// ─────────────────────────────────────────
// API PÚBLICA DEL MAILER
// ─────────────────────────────────────────
export const mailer = {
  /**
   * Notificación de ingreso de equipo.
   * Usa el formato de tabla horizontal oficial.
   */
  async sendEquipmentEntry(data: EquipmentEntryData): Promise<void> {
    if (!resend) {
      console.warn('[Mailer] sendEquipmentEntry — RESEND_API_KEY no configurada, correo omitido.')
      return
    }
    try {
      await resend.emails.send({
        from: 'Ventas Cabelab <onboarding@resend.dev>',
        to: RECIPIENTS,
        cc: CC_RECIPIENTS,
        subject: `📥 Ingreso de Equipo — ${data.fr_number} — ${data.client_name}`,
        html: buildEntryHtml(data),
      })
    } catch (error) {
      console.error('[Mailer] sendEquipmentEntry error:', error)
    }
  },

  /**
   * Notificación genérica de cambio de estado.
   * Cubre TODOS los estados del workflow. Se selecciona automáticamente
   * el template correcto en base a `new_status_name`.
   *
   * @param data          Datos del equipo y del cambio
   * @param isOverride    true si el cambio fue forzado por superadmin
   */
  async sendStatusChange(data: StatusChangeData, isOverride = false): Promise<void> {
    if (!resend) {
      console.warn('[Mailer] sendStatusChange — RESEND_API_KEY no configurada, correo omitido.')
      return
    }

    const config = getStateConfig(data.new_status_name)
    const subjectPrefix = isOverride ? '⚠ [OVERRIDE] ' : ''

    try {
      await resend.emails.send({
        from: 'CABELAB Sistema <onboarding@resend.dev>',
        to: RECIPIENTS,
        cc: CC_RECIPIENTS,
        subject: `${subjectPrefix}${config.subject} — ${data.fr_number} — ${data.client_name}`,
        html: buildStatusChangeHtml(data, config, isOverride),
      })
    } catch (error) {
      console.error('[Mailer] sendStatusChange error:', error)
    }
  },
}
