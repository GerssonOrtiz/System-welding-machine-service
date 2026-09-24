// components/equipment/QRPrintModal.tsx
'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import * as Dialog from '@radix-ui/react-dialog'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, X, QrCode, ExternalLink } from 'lucide-react'

interface QRPrintModalProps {
  isOpen: boolean
  onClose: () => void
  serialNumber: string
  frNumber: string
  brand: string
  model: string
  clientName: string
}

export default function QRPrintModal({
  isOpen,
  onClose,
  serialNumber,
  frNumber,
  brand,
  model,
  clientName,
}: QRPrintModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null)

  // URL del QR pública
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cabelab.local'
  const qrUrl = `${origin}/doc/${encodeURIComponent(serialNumber.trim())}`

  const handlePrint = () => {
    if (!printAreaRef.current) {
      window.print()
      return
    }

    // Crear un iframe invisible para aislar completamente la impresión
    // Esto evita que Next.js, Radix UI o el DOM principal creen hojas extras en cualquier tamaño de papel
    const existingIframe = document.getElementById('qr-print-iframe')
    if (existingIframe) {
      existingIframe.remove()
    }

    const iframe = document.createElement('iframe')
    iframe.id = 'qr-print-iframe'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document || iframe.contentDocument
    if (!doc) {
      window.print()
      return
    }

    const labelHtml = printAreaRef.current.innerHTML

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta QR - ${frNumber}</title>
          <style>
            @page {
              size: auto;
              margin: 0mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              width: 100%;
              height: auto;
            }
            .print-wrapper {
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 6mm;
              page-break-after: avoid;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .label-card {
              width: 320px;
              max-width: 100%;
              padding: 12px;
              border: 2px solid #000;
              border-radius: 10px;
              text-align: center;
              background: #fff;
            }
            .label-header {
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .logo-img {
              width: 38px;
              height: 38px;
              object-fit: contain;
            }
            .info-box {
              background: #f1f5f9;
              padding: 8px;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
              text-align: left;
              font-size: 11px;
              line-height: 1.3;
              margin-bottom: 8px;
            }
            .info-brand {
              font-weight: bold;
              text-transform: uppercase;
              color: #0f172a;
              margin-bottom: 2px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              font-family: monospace;
              font-size: 10px;
              color: #334155;
            }
            .info-client {
              font-size: 10px;
              color: #475569;
              text-transform: uppercase;
              margin-top: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .qr-container {
              padding: 6px;
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 4px 0;
            }
            .qr-container svg {
              display: block;
              margin: 0 auto;
            }
            .label-footer {
              border-top: 1px solid #cbd5e1;
              padding-top: 6px;
              margin-top: 4px;
            }
            .footer-title {
              display: block;
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #0f172a;
            }
            .footer-url {
              display: block;
              font-family: monospace;
              font-size: 8px;
              color: #64748b;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            <div class="label-card">
              <div class="label-header">
                <img src="/cabelab.png" alt="Logo" class="logo-img" />
              </div>
              <div class="info-box">
                <div class="info-brand">${brand} ${model}</div>
                <div class="info-row">
                  <span>N° SERIE: <strong>${serialNumber}</strong></span>
                  <span>FR: <strong>${frNumber}</strong></span>
                </div>
                <div class="info-client">${clientName}</div>
              </div>
              <div class="qr-container">
                ${printAreaRef.current.querySelector('.qr-box-inner')?.innerHTML || ''}
              </div>
              <div class="label-footer">
                <span class="footer-title">ESCANEAR PARA HISTORIAL E INFORMES</span>
                <span class="footer-url">${qrUrl}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
    doc.close()

    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        iframe.remove()
      }, 2000)
    }, 250)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] bg-[#0F172A] border border-[#00E5FF]/30 rounded-2xl shadow-[0_0_40px_rgba(0,229,255,0.15)] p-6 z-50 font-sans text-slate-100 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-5">
            <Dialog.Title className="text-sm font-bold text-[#00E5FF] flex items-center gap-2 uppercase tracking-wider">
              <QrCode className="w-4 h-4" />
              <span>Etiqueta QR para Motosoldadora</span>
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Área de la etiqueta (Imprimible y previsualización) */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
            <div
              id="cabelab-qr-label"
              ref={printAreaRef}
              className="bg-white text-slate-950 p-4 rounded-xl shadow-md border-2 border-slate-300 w-full max-w-[320px] flex flex-col items-center text-center space-y-2.5 font-sans"
            >
              {/* Header de la etiqueta: Solo el logo centrado sin texto */}
              <div className="border-b-2 border-slate-900 pb-2 w-full flex items-center justify-center">
                <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                  <Image
                    src="/cabelab.png"
                    alt="CABELAB Logo"
                    width={24}
                    height={24}
                    className="object-contain w-full h-full"
                  />
                </div>
                <span>CABELAB</span>
              </div>

              {/* Datos clave del equipo */}
              <div className="w-full text-left bg-slate-100 p-2.5 rounded-lg border border-slate-300 text-[11px] leading-tight space-y-1">
                <div className="font-bold truncate uppercase text-slate-900 text-xs">
                  {brand} {model}
                </div>
                <div className="flex justify-between font-mono text-[10px] text-slate-700">
                  <span>N° SERIE: <strong className="text-slate-950">{serialNumber}</strong></span>
                  <span>FR: <strong>{frNumber}</strong></span>
                </div>
                <div className="text-[10px] text-slate-600 truncate uppercase">
                  {clientName}
                </div>
              </div>

              {/* Código QR */}
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm my-1 qr-box-inner flex items-center justify-center">
                <QRCodeSVG
                  value={qrUrl}
                  size={150}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Pie de la etiqueta */}
              <div className="w-full border-t border-slate-300 pt-1.5 text-center">
                <span className="block text-[8px] font-black uppercase tracking-wider text-slate-900">
                  ESCANEAR PARA HISTORIAL E INFORMES
                </span>
                <span className="block font-mono text-[8px] text-slate-500 truncate">
                  {qrUrl}
                </span>
              </div>
            </div>
          </div>

          {/* Enlace y acciones */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs bg-[#1E293B]/60 px-3 py-2 rounded-lg border border-[#334155]">
              <span className="text-slate-400 truncate max-w-[280px] font-mono text-[11px]">{qrUrl}</span>
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00E5FF] hover:underline flex items-center gap-1 font-bold text-[11px]"
              >
                <span>Probar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold uppercase transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 rounded-lg bg-[#00E5FF] hover:bg-[#33EAFF] text-[#0A0D14] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Etiqueta</span>
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
