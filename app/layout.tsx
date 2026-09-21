import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/ui/ToasterProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "CABELAB — Sistema de Motosoldadoras",
    template: "%s | CABELAB",
  },
  description: "Sistema de gestión operativa para taller de mantenimiento de motosoldadoras — CABELAB, Arequipa, Perú.",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary font-sans">
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
