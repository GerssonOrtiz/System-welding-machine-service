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
    window.print()
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

          {/* Área de la etiqueta (Imprimible) */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
            <div
              id="cabelab-qr-label"
              ref={printAreaRef}
              className="bg-white text-slate-950 p-4 rounded-xl shadow-md border-2 border-slate-300 w-full max-w-[340px] flex flex-col items-center text-center space-y-2.5 font-sans"
            >
              {/* Header de la etiqueta */}
              <div className="border-b-2 border-slate-900 pb-1.5 w-full flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="relative w-6 h-6 shrink-0">
                    <Image
                      src="/cabelab.png"
                      alt="CABELAB"
                      width={24}
                      height={24}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <span className="font-black text-xs tracking-wider uppercase font-mono text-slate-950">
                    CABELAB
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-700 uppercase">TALLER DE MOTOSOLDADORAS</span>
              </div>

              {/* Datos clave del equipo */}
              <div className="w-full text-left bg-slate-100 p-2 rounded border border-slate-300 text-[11px] leading-tight space-y-0.5">
                <div className="font-bold truncate uppercase text-slate-900">
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
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm my-1">
                <QRCodeSVG
                  value={qrUrl}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Pie de la etiqueta */}
              <div className="w-full border-t border-slate-300 pt-1.5 text-center">
                <span className="block text-[9px] font-black uppercase tracking-wider text-slate-900">
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

      {/* Estilos dedicados para la impresión limpia de la etiqueta física sin hojas extras */}
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #cabelab-qr-label, #cabelab-qr-label * {
            visibility: visible !important;
          }
          #cabelab-qr-label {
            position: absolute !important;
            left: 50% !important;
            top: 40px !important;
            transform: translateX(-50%) !important;
            width: 320px !important;
            max-width: 320px !important;
            margin: 0 !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </Dialog.Root>
  )
}
