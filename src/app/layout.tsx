import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const fontOutfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "JyM LingoBridge AI | Tutor de Inglés Inteligente y Deconstructor Sintáctico",
  description: "Aprende inglés de verdad conectando tu educación con la vida real. Tutor interactivo guiado por Inteligencia Artificial (Groq) con deconstrucción visual de oraciones y glosarios para construcción (SENA), tecnología y negocios. Basado en el Marco Común Europeo (MCER).",
  keywords: [
    "inglés sena",
    "aprender inglés con IA",
    "tutor de inglés interactivo",
    "deconstrucción de oraciones inglés",
    "inglés para construcción",
    "inglés técnico colombia",
    "estudiar inglés adultos",
    "LingoBridge",
    "J&M Tech Solutions"
  ],
  authors: [{ name: "J&M Tech Solutions", url: "https://jymtechsolutions.online" }],
  openGraph: {
    title: "JyM LingoBridge AI | Tutor de Inglés Inteligente y Deconstructor",
    description: "Revoluciona tu aprendizaje de inglés. Deconstrucción visual de oraciones, tutor socrático con IA ultra veloz (Groq) y glosarios especializados para sectores técnicos y obras civiles (SENA).",
    url: "https://jym-lingobridge-ai.vercel.app",
    siteName: "JyM LingoBridge AI",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JyM LingoBridge AI | Tutor de Inglés Inteligente",
    description: "Tutor interactivo guiado por IA socrática. Diseñado especialmente para adultos y jóvenes en formación profesional en Colombia.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fontOutfit.variable} ${fontInter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#070913] text-slate-100 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

