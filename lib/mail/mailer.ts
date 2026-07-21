import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Configuración de destinatarios para fase de pruebas
const RECIPIENTS = [
  'gortizri001@gmail.com', // Recepción
  'gortizri002@gmail.com', // Operaciones
  'gortizri003@gmail.com'  // Logística
]

const CC_RECIPIENTS = [
  'gortizri@gmail.com'
]

// Estilos comunes para las tablas
const tableHeaderStyle = 'background-color: #5B9BD5; color: white; padding: 10px; font-size: 10px; text-transform: uppercase; border: 1px solid #dee2e6;'
const tableCellStyle = 'padding: 10px; font-size: 10px; border: 1px solid #dee2e6; color: #333;'

export const mailer = {
  /**
   * 1. Notificación de Ingreso de Equipo (Basado en formato oficial)
   */
  async sendEquipmentEntry(data: {
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
  }) {
    const dateStr = data.date_in 
      ? new Date(data.date_in).toLocaleDateString('es-PE') 
      : new Date().toLocaleDateString('es-PE')

    if (!resend) {
      console.warn('[Mailer] Skip sending email: RESEND_API_KEY not configured')
      return
    }

    try {
      await resend.emails.send({
        from: 'Ventas Cabelab <onboarding@resend.dev>',
        to: RECIPIENTS,
        cc: CC_RECIPIENTS,
        subject: `Ingreso de Equipo - ${data.fr_number} - ${data.client_name}`,
        html: `
          <div style="font-family: Calibri, sans-serif; color: #1f375f; line-height: 1.5;">
            <p>Estimados,</p>
            <p style="font-weight: bold; margin-bottom: 20px;">Daniel Rojas y Sergio Masco</p>
            
            <p>Mediante el presente correo les informamos que ingresaron los siguientes equipos para su respectiva revisión.</p>
            
            <div style="overflow-x: auto; margin-top: 20px; margin-bottom: 20px;">
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
                    <th style="${tableHeaderStyle}">FALLA</th>
                    <th style="${tableHeaderStyle}">OBSERVACIONES ADICIONALES</th>
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
                    <td style="${tableCellStyle}">${data.serial_number}</td>
                    <td style="${tableCellStyle}">${data.service_type}</td>
                    <td style="${tableCellStyle}">${data.client_report || '-'}</td>
                    <td style="${tableCellStyle}">${data.is_priority ? 'Prioridad' : '-'}</td>
                    <td style="${tableCellStyle}">${data.accessories || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>Quedo atenta a sus comentarios.</p>
            
            <p style="margin-top: 25px;">Un cordial saludo,</p>
            
            <div style="margin-top: 10px;">
              <strong style="color: #1f375f; font-size: 14px;">Diana Salazar</strong><br/>
              <span style="font-size: 12px; color: #555;">Asesoría Comercial</span>
            </div>

            <div style="margin-top: 20px;">
              <table style="border: none;">
                <tr>
                  <td style="padding-right: 20px; border-right: 2px solid #5B9BD5;">
                    <img src="https://ofymvvwpusvjiipcdbuq.supabase.co/storage/v1/object/public/assets/cabelab-logo-email.png" alt="CABELAB" width="120" style="display: block;"/>
                  </td>
                  <td style="padding-left: 20px; font-size: 11px; color: #1f375f;">
                    <a href="http://www.cabelab.com" style="color: #0070c0; text-decoration: none;">www.cabelab.com</a><br/>
                    Cel: (+51) 919 007 755<br/>
                    Mail: <a href="mailto:ventas@cabelab.com" style="color: #0070c0; text-decoration: none;">ventas@cabelab.com</a><br/>
                    Av. Venezuela 866, Arequipa, Perú
                  </td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9px; color: #888; text-align: justify;">
              <strong>Aviso de confidencialidad:</strong> El presente correo, incluido cualquier archivo adjunto, va dirigido a la persona, grupo de personas o entidad pública o privada, con información confidencial y/o privilegiada. Está prohibido compartir toda información, parcial y/o completa, con otras personas y/o terceros, sin el consentimiento por escrito del remitente inicial. Si recibió este mensaje por error, informar al remitente y eliminar el presente mensaje y cualquier adjunto de inmediato.
            </div>
          </div>
        `
      })
    } catch (error) {
      console.error('[Mailer] Error sending entry email:', error)
    }
  },

  /**
   * 2. Notificación de Aprobación de Equipo
   */
  async sendEquipmentApproved(data: {
    fr_number: string
    client_name: string
    brand: string
    model: string
  }) {
    if (!resend) {
      console.warn('[Mailer] Skip sending email: RESEND_API_KEY not configured')
      return
    }

    try {
      await resend.emails.send({
        from: 'CABELAB System <onboarding@resend.dev>',
        to: RECIPIENTS,
        cc: CC_RECIPIENTS,
        subject: `✅ APROBADO: Equipo listo para mantenimiento - [${data.fr_number}]`,
        html: `
          <div style="font-family: Calibri, sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #10B981; border-bottom: 2px solid #10B981; padding-bottom: 10px;">EQUIPO APROBADO</h2>
            <p>El presupuesto para el equipo ha sido aprobado. Puede proceder con el mantenimiento.</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold; width: 150px;">Ficha (FR):</td><td style="padding: 8px;">${data.fr_number}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Cliente:</td><td style="padding: 8px;">${data.client_name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Equipo:</td><td style="padding: 8px;">${data.brand} ${data.model}</td></tr>
            </table>
            <div style="margin-top: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
              Notificación automática del Sistema CABELAB v2.0
            </div>
          </div>
        `
      })
    } catch (error) {
      console.error('[Mailer] Error sending approval email:', error)
    }
  },

  /**
   * 3. Notificación de Repuestos (Logística)
   */
  async sendPartsRequest(data: {
    fr_number: string
    client_name: string
    brand: string
    model: string
    status: string
  }) {
    if (!resend) {
      console.warn('[Mailer] Skip sending email: RESEND_API_KEY not configured')
      return
    }

    try {
      await resend.emails.send({
        from: 'CABELAB System <onboarding@resend.dev>',
        to: RECIPIENTS,
        cc: CC_RECIPIENTS,
        subject: `📦 LOGÍSTICA: Requerimiento de Repuestos - [${data.fr_number}]`,
        html: `
          <div style="font-family: Calibri, sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #9D4EDD; border-bottom: 2px solid #9D4EDD; padding-bottom: 10px;">REQUERIMIENTO DE REPUESTOS</h2>
            <p>Se requiere atención de logística para el siguiente equipo:</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold; width: 150px;">Ficha (FR):</td><td style="padding: 8px;">${data.fr_number}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Cliente:</td><td style="padding: 8px;">${data.client_name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Estado:</td><td style="padding: 8px; font-weight: bold; color: #9D4EDD;">${data.status}</td></tr>
            </table>
            <div style="margin-top: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
              Favor de revisar el detalle de repuestos en el sistema.
            </div>
          </div>
        `
      })
    } catch (error) {
      console.error('[Mailer] Error sending parts email:', error)
    }
  }
}
