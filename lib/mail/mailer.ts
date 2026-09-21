// lib/mail/mailer.ts
// Sistema de notificaciones internas por email — CABELAB v2.4
// Usa Resend. Si RESEND_API_KEY no está configurada, falla silenciosamente.

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// ─────────────────────────────────────────
// DESTINATARIOS FIJOS (siempre reciben TODO)
// ─────────────────────────────────────────
const FROM_ADDRESS = 'Ventas Cabelab <onboarding@resend.dev>'

// TO del correo de ingreso — siempre fijos
const ENTRY_TO = [
  'ventas@cabelab.com',         // Recepción / Ventas
  'odp@cabelab.com',            // Operaciones
  'heady.mamani@cabelab.com',   // Logística
  'daniel.rojas@cabelab.com',   // Fijo adicional
  'vivian.mamani@cabelab.com',  // Fijo adicional
]

// ─────────────────────────────────────────
// CC DISPONIBLES PARA SELECCIÓN EN EL FRONTEND
// Exportado para que EquipmentForm pueda mostrar el selector.
// ─────────────────────────────────────────
export interface CcOption {
  email: string
  label: string
}

export const CC_OPTIONS: CcOption[] = [
  { email: 'mauricio.beltran@cabelab.com', label: 'Mauricio Beltrán' },
  { email: 'gersson.ortiz@cabelab.com',    label: 'Gersson Ortiz' },
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
// TIPOS
// ─────────────────────────────────────────

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

/** Datos base que se reutilizan en todos los reply-correos */
export interface ThreadBaseData {
  fr_number: string
  client_name: string
  brand: string
  model: string
  serial_number?: string | null
  /** message-id del correo de ingreso guardado en BD */
  thread_id: string
  /** Correos CC guardados al ingresar el equipo */
  email_cc: string[]
}

export interface InformeODPData extends ThreadBaseData {
  diagnostico: string
  /** Buffer del PDF adjunto */
  pdf_buffer: Buffer
  pdf_filename: string
}

export interface AprobacionVentasData extends ThreadBaseData {
  /** Filas de la tabla: descripción, cantidad, precio unitario */
  items: Array<{ descripcion: string; cantidad: string; precio: string }>
  observaciones: string
}

export interface EntregaLogisticaData extends ThreadBaseData {
  /** Repuestos entregados, pueden diferir de los aprobados (compatibles) */
  items: Array<{ descripcion: string; cantidad: string; nota?: string }>
  observaciones: string
}

export interface CulminadoODPData extends ThreadBaseData {
  observaciones: string
}

// ─────────────────────────────────────────
// BUILDERS HTML
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

function buildInformeODPHtml(data: InformeODPData): string {
  return `
    <div style="font-family: Calibri, sans-serif; color: #1f375f; line-height: 1.5;">
      <p>Estimados,</p>
      <p>A continuación les presentamos el informe técnico de diagnóstico para el equipo <strong>${data.fr_number}</strong> — ${data.client_name}.</p>

      <div style="border-left: 4px solid #3B82F6; background-color: #EFF6FF; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <span style="font-size: 15px; font-weight: bold; color: #3B82F6;">🔍 INFORME TÉCNICO — DIAGNÓSTICO</span>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #555;">
          ${data.brand} ${data.model} &nbsp;|&nbsp; Serie: <span style="font-family: monospace;">${data.serial_number ?? 'N/S'}</span>
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tbody>
          <tr style="background-color: #F8FAFC;">
            <td style="${tableCellStyle} font-weight: bold; width: 180px;">Ficha (FR):</td>
            <td style="${tableCellStyle} font-weight: bold;">${data.fr_number}</td>
          </tr>
          <tr>
            <td style="${tableCellStyle} font-weight: bold;">Cliente:</td>
            <td style="${tableCellStyle}">${data.client_name}</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color: #F8FAFC; border: 1px solid #dee2e6; border-radius: 4px; padding: 14px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1f375f;">Diagnóstico técnico:</p>
        <p style="margin: 0; font-size: 11px; color: #333; white-space: pre-wrap;">${data.diagnostico}</p>
      </div>

      <p style="font-size: 11px; color: #555;">📎 Se adjunta el informe técnico en formato PDF.</p>
      ${buildSignature()}
    </div>
  `
}

function buildAprobacionVentasHtml(data: AprobacionVentasData): string {
  const itemRows = data.items.map((item, i) => `
    <tr style="${i % 2 === 0 ? 'background-color: #F8FAFC;' : ''}">
      <td style="${tableCellStyle}">${item.descripcion}</td>
      <td style="${tableCellStyle} text-align: center;">${item.cantidad}</td>
      <td style="${tableCellStyle} text-align: right;">${item.precio}</td>
    </tr>
  `).join('')

  return `
    <div style="font-family: Calibri, sans-serif; color: #1f375f; line-height: 1.5;">
      <p>Estimados,</p>
      <p>Les informamos que el cliente ha <strong style="color: #10B981;">APROBADO</strong> el presupuesto para el equipo <strong>${data.fr_number}</strong> — ${data.client_name}.</p>

      <div style="border-left: 4px solid #10B981; background-color: #ECFDF5; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <span style="font-size: 15px; font-weight: bold; color: #10B981;">✅ APROBACIÓN DE PRESUPUESTO</span>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #555;">
          ${data.brand} ${data.model} &nbsp;|&nbsp; Serie: <span style="font-family: monospace;">${data.serial_number ?? 'N/S'}</span>
        </p>
      </div>

      <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #1f375f; margin-bottom: 6px;">Repuestos y servicios aprobados:</p>
      <div style="overflow-x: auto; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="${tableHeaderStyle}">Descripción</th>
              <th style="${tableHeaderStyle} text-align: center;">Cantidad</th>
              <th style="${tableHeaderStyle} text-align: right;">Precio Unit.</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>

      ${data.observaciones ? `
      <div style="background-color: #F8FAFC; border: 1px solid #dee2e6; border-radius: 4px; padding: 14px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1f375f;">Observaciones:</p>
        <p style="margin: 0; font-size: 11px; color: #333;">${data.observaciones}</p>
      </div>` : ''}

      ${buildSignature()}
    </div>
  `
}

function buildEntregaLogisticaHtml(data: EntregaLogisticaData): string {
  const itemRows = data.items.map((item, i) => `
    <tr style="${i % 2 === 0 ? 'background-color: #F8FAFC;' : ''}">
      <td style="${tableCellStyle}">${item.descripcion}</td>
      <td style="${tableCellStyle} text-align: center;">${item.cantidad}</td>
      <td style="${tableCellStyle} color: #6B7280; font-style: italic;">${item.nota ?? '-'}</td>
    </tr>
  `).join('')

  return `
    <div style="font-family: Calibri, sans-serif; color: #1f375f; line-height: 1.5;">
      <p>Estimados,</p>
      <p>Se confirma la entrega de repuestos para el equipo <strong>${data.fr_number}</strong> — ${data.client_name}.</p>

      <div style="border-left: 4px solid #EC4899; background-color: #FDF2F8; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <span style="font-size: 15px; font-weight: bold; color: #EC4899;">📦 ENTREGA DE REPUESTOS — LOGÍSTICA</span>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #555;">
          ${data.brand} ${data.model} &nbsp;|&nbsp; Serie: <span style="font-family: monospace;">${data.serial_number ?? 'N/S'}</span>
        </p>
      </div>

      <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #1f375f; margin-bottom: 6px;">Repuestos entregados:</p>
      <div style="overflow-x: auto; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="${tableHeaderStyle}">Descripción</th>
              <th style="${tableHeaderStyle} text-align: center;">Cantidad</th>
              <th style="${tableHeaderStyle}">Nota / Reemplazo compatible</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>

      ${data.observaciones ? `
      <div style="background-color: #F8FAFC; border: 1px solid #dee2e6; border-radius: 4px; padding: 14px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1f375f;">Observaciones:</p>
        <p style="margin: 0; font-size: 11px; color: #333;">${data.observaciones}</p>
      </div>` : ''}

      ${buildSignature()}
    </div>
  `
}

function buildCulminadoODPHtml(data: CulminadoODPData): string {
  return `
    <div style="font-family: Calibri, sans-serif; color: #1f375f; line-height: 1.5;">
      <p>Estimados,</p>
      <p>Nos complace informarles que el servicio del equipo <strong>${data.fr_number}</strong> — ${data.client_name} ha sido <strong style="color: #22C55E;">CULMINADO SATISFACTORIAMENTE</strong> y se encuentra listo para entrega al cliente.</p>

      <div style="border-left: 4px solid #22C55E; background-color: #F0FDF4; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <span style="font-size: 15px; font-weight: bold; color: #22C55E;">🟢 SERVICIO CULMINADO — LISTO PARA ENTREGA</span>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #555;">
          ${data.brand} ${data.model} &nbsp;|&nbsp; Serie: <span style="font-family: monospace;">${data.serial_number ?? 'N/S'}</span>
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tbody>
          <tr style="background-color: #F8FAFC;">
            <td style="${tableCellStyle} font-weight: bold; width: 180px;">Ficha (FR):</td>
            <td style="${tableCellStyle} font-weight: bold;">${data.fr_number}</td>
          </tr>
          <tr>
            <td style="${tableCellStyle} font-weight: bold;">Cliente:</td>
            <td style="${tableCellStyle}">${data.client_name}</td>
          </tr>
          <tr style="background-color: #F8FAFC;">
            <td style="${tableCellStyle} font-weight: bold;">Equipo:</td>
            <td style="${tableCellStyle}">${data.brand} ${data.model}</td>
          </tr>
          <tr>
            <td style="${tableCellStyle} font-weight: bold;">Fecha:</td>
            <td style="${tableCellStyle} font-size: 9px; color: #6B7280;">${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })} (Hora Lima)</td>
          </tr>
        </tbody>
      </table>

      ${data.observaciones ? `
      <div style="background-color: #F8FAFC; border: 1px solid #dee2e6; border-radius: 4px; padding: 14px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1f375f;">Observaciones:</p>
        <p style="margin: 0; font-size: 11px; color: #333;">${data.observaciones}</p>
      </div>` : ''}

      ${buildSignature()}
    </div>
  `
}

// ─────────────────────────────────────────
// HELPER: cabeceras de hilo
// ─────────────────────────────────────────
function threadHeaders(threadId: string): Record<string, string> {
  return {
    'In-Reply-To': threadId,
    'References': threadId,
  }
}

// ─────────────────────────────────────────
// API PÚBLICA DEL MAILER
// ─────────────────────────────────────────
export const mailer = {
  /**
   * Correo de ingreso de equipo. Devuelve el message-id para guardarlo en BD.
   * TO fijo: ventas, odp, heady, daniel, vivian
   * CC: los seleccionados en el formulario de ingreso
   */
  async sendEquipmentEntry(data: EquipmentEntryData, cc_extra: string[] = []): Promise<string | null> {
    if (!resend) {
      console.warn('[Mailer] sendEquipmentEntry — RESEND_API_KEY no configurada, correo omitido.')
      return null
    }
    try {
      const res = await resend.emails.send({
        from: FROM_ADDRESS,
        to: ENTRY_TO,
        ...(cc_extra.length > 0 && { cc: cc_extra }),
        subject: `📥 Ingreso de Equipo — ${data.fr_number} — ${data.client_name}`,
        html: buildEntryHtml(data),
      })
      // Resend devuelve el id del mensaje en res.data.id
      return (res as any)?.data?.id ?? null
    } catch (error) {
      console.error('[Mailer] sendEquipmentEntry error:', error)
      return null
    }
  },

  /**
   * ODP responde el hilo con el informe técnico + PDF adjunto.
   * Estado: "Pendiente de aprobación"
   */
  async sendInformeODP(data: InformeODPData): Promise<void> {
    if (!resend) {
      console.warn('[Mailer] sendInformeODP — RESEND_API_KEY no configurada, correo omitido.')
      return
    }
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: ENTRY_TO,
        ...(data.email_cc.length > 0 && { cc: data.email_cc }),
        subject: `RE: 📥 Ingreso de Equipo — ${data.fr_number} — ${data.client_name}`,
        html: buildInformeODPHtml(data),
        headers: threadHeaders(data.thread_id),
        attachments: [
          {
            filename: data.pdf_filename,
            content: data.pdf_buffer,
          },
        ],
      })
    } catch (error) {
      console.error('[Mailer] sendInformeODP error:', error)
    }
  },

  /**
   * Ventas responde el hilo con la aprobación del cliente (tabla de repuestos/servicios).
   * Estado: "Aprobado"
   */
  async sendAprobacionVentas(data: AprobacionVentasData): Promise<void> {
    if (!resend) {
      console.warn('[Mailer] sendAprobacionVentas — RESEND_API_KEY no configurada, correo omitido.')
      return
    }
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: ENTRY_TO,
        ...(data.email_cc.length > 0 && { cc: data.email_cc }),
        subject: `RE: 📥 Ingreso de Equipo — ${data.fr_number} — ${data.client_name}`,
        html: buildAprobacionVentasHtml(data),
        headers: threadHeaders(data.thread_id),
      })
    } catch (error) {
      console.error('[Mailer] sendAprobacionVentas error:', error)
    }
  },

  /**
   * Logística responde el hilo con la entrega de repuestos.
   * Estado: "En espera de repuesto" (cuando se gestiona la entrega)
   */
  async sendEntregaLogistica(data: EntregaLogisticaData): Promise<void> {
    if (!resend) {
      console.warn('[Mailer] sendEntregaLogistica — RESEND_API_KEY no configurada, correo omitido.')
      return
    }
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: ENTRY_TO,
        ...(data.email_cc.length > 0 && { cc: data.email_cc }),
        subject: `RE: 📥 Ingreso de Equipo — ${data.fr_number} — ${data.client_name}`,
        html: buildEntregaLogisticaHtml(data),
        headers: threadHeaders(data.thread_id),
      })
    } catch (error) {
      console.error('[Mailer] sendEntregaLogistica error:', error)
    }
  },

  /**
   * ODP responde el hilo informando que el servicio está culminado.
   * Estado: "Listo para entrega"
   */
  async sendCulminadoODP(data: CulminadoODPData): Promise<void> {
    if (!resend) {
      console.warn('[Mailer] sendCulminadoODP — RESEND_API_KEY no configurada, correo omitido.')
      return
    }
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: ENTRY_TO,
        ...(data.email_cc.length > 0 && { cc: data.email_cc }),
        subject: `RE: 📥 Ingreso de Equipo — ${data.fr_number} — ${data.client_name}`,
        html: buildCulminadoODPHtml(data),
        headers: threadHeaders(data.thread_id),
      })
    } catch (error) {
      console.error('[Mailer] sendCulminadoODP error:', error)
    }
  },
}
