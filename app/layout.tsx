import type { Metadata } from "next";
import "./globals.css";
import { ToasterProvider } from "@/components/ui/ToasterProvider";

// next/font/google no es compatible con el bundler de Next.js 16 / Turbopack.
// Las fuentes Inter y JetBrains Mono se cargan desde globals.css vía
// @import url('https://fonts.googleapis.com/...') — mismo resultado visual.

export const metadata: Metadata = {
  title: {
    default: "SYNAPSE — Plataforma de Gestión Operativa",
    template: "%s | SYNAPSE",
  },
  description: "Plataforma de gestión operativa de mantenimiento de motosoldadoras para CABELAB — Arequipa, Perú.",
  authors: [{ name: "Br. Gersson Ortiz" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary font-sans">
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}

