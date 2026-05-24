'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Cpu, 
  Layers, 
  HelpCircle, 
  ArrowRight, 
  Check, 
  Sparkles, 
  CheckCircle, 
  MessageSquare, 
  ChevronRight, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  Activity,
  Play,
  RotateCcw
} from 'lucide-react';

export default function LandingPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(localStorage.getItem('lingobridge_logo'));
    }
  }, []);

  const [selectedIndustry, setSelectedIndustry] = useState<'construccion' | 'tecnologia' | 'negocios'>('construccion');
  const [simulatorState, setSimulatorState] = useState<'unstarted' | 'solving' | 'success'>('unstarted');
  const [simulatorBlocks, setSimulatorBlocks] = useState([
    { id: 1, text: 'Blueprint', category: 'subject', order: 2 },
    { id: 2, text: 'The', category: 'connector', order: 1 },
    { id: 3, text: 'is', category: 'auxiliary', order: 4 },
    { id: 4, text: 'new', category: 'adjective', order: 3 },
    { id: 5, text: 'ready', category: 'object', order: 5 },
  ]);
  const [orderedSentence, setOrderedSentence] = useState<string[]>([]);

  // Glosario ilustrativo para la landing
  const glossaries = {
    construccion: [
      { word: 'Blueprint', trans: 'Plano arquitectónico', pron: '/blú-print/', exEng: 'The blueprint is ready.', exEsp: 'El plano está listo.' },
      { word: 'Concrete', trans: 'Hormigón o concreto', pron: '/cón-crit/', exEng: 'We poured the concrete.', exEsp: 'Vertimos el concreto.' },
      { word: 'Scaffolding', trans: 'Andamio de obra', pron: '/scá-fol-ding/', exEng: 'Check the scaffolding.', exEsp: 'Revisa el andamio.' }
    ],
    tecnologia: [
      { word: 'Database', trans: 'Base de datos', pron: '/déi-ta-béis/', exEng: 'The database is secure.', exEsp: 'La base de datos es segura.' },
      { word: 'Deployment', trans: 'Despliegue de software', pron: '/di-plói-ment/', exEng: 'Vercel deployment is live.', exEsp: 'El despliegue en Vercel está en vivo.' },
      { word: 'Framework', trans: 'Marco de desarrollo', pron: '/fréim-uorc/', exEng: 'Next.js is a great framework.', exEsp: 'Next.js es un gran framework.' }
    ],
    negocios: [
      { word: 'Deadline', trans: 'Fecha límite / Plazo', pron: '/déd-láin/', exEng: 'We met the project deadline.', exEsp: 'Cumplimos el plazo del proyecto.' },
      { word: 'Agreement', trans: 'Acuerdo o contrato', pron: '/a-grí-ment/', exEng: 'We signed the agreement.', exEsp: 'Firmamos el acuerdo.' },
      { word: 'Workflow', trans: 'Flujo de trabajo', pron: '/uórc-flou/', exEng: 'Let\'s optimize the workflow.', exEsp: 'Optimicemos el flujo de trabajo.' }
    ]
  };

  const handleBlockClick = (block: typeof simulatorBlocks[0]) => {
    if (orderedSentence.includes(block.text)) return;
    setOrderedSentence([...orderedSentence, block.text]);
    
    const newLen = orderedSentence.length + 1;
    if (newLen === simulatorBlocks.length) {
      const isCorrect = [...orderedSentence, block.text].join(' ') === 'The Blueprint is new ready' || [...orderedSentence, block.text].join(' ') === 'The Blueprint is ready' || [...orderedSentence, block.text].join(' ') === 'The new Blueprint is ready';
      // Para efectos del simulador interactivo sencillo, validamos el orden lógico: The (2) -> new (4) -> Blueprint (1) -> is (3) -> ready (5)
      const correctText = 'The new Blueprint is ready';
      const userText = [...orderedSentence, block.text].join(' ');
      if (userText.toLowerCase().replace(/\s+/g, '') === 'thenewblueprintisready') {
        setSimulatorState('success');
      } else {
        setSimulatorState('solving');
      }
    }
  };

  const resetSimulator = () => {
    setOrderedSentence([]);
    setSimulatorState('unstarted');
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans relative">
      
      {/* Resplandores de fondo estilo búnker premium */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* HEADER / NAVIGATION */}
      <header className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50 bg-[#070913]/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="JyM LingoBridge AI" className="h-10 object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-600/25">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-outfit font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
                    JyM LingoBridge
                  </span>
                  <span className="block text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
                    AI EDUCATION ENGINE
                  </span>
                </div>
              </>
            )}
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#metodo" className="hover:text-purple-400 transition-colors">Método Activo</a>
            <a href="#simulador" className="hover:text-purple-400 transition-colors">Simulador</a>
            <a href="#glosarios" className="hover:text-purple-400 transition-colors">Glosarios</a>
            <a href="#tarifas" className="hover:text-purple-400 transition-colors">Precios</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-semibold text-slate-200 hover:text-white px-4 py-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
            >
              Acceder a mi Cuenta
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Educación Informal con IA Acreditada por MCER
          </div>
          <h1 className="font-outfit text-5xl md:text-7xl font-black leading-tight tracking-tight max-w-5xl mx-auto bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Aprende Inglés <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Sin Copiar y Pegar</span> de la IA
          </h1>
          <p className="mt-8 text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Revolucionamos el aprendizaje activo de inglés. En lugar de darte la traducción resuelta, **JyM LingoBridge AI** deconstruye oraciones en bloques visuales y te guía socráticamente con ejemplos del mundo real, adaptados al SENA y a tu profesión.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6">
            <a 
              href="https://wa.me/573045788873?text=Hola%20Manuel,%20me%20interesa%20agendar%20una%20demostracion%20del%20tutor%20de%20ingles%20JyM%20LingoBridge%20AI" 
              target="_blank" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-600/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Agendar Demo Gratuita
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="#simulador" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              Probar Simulador
              <Play className="w-4 h-4" />
            </a>
          </div>
          <div className="mt-6 text-slate-500 text-sm flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            100% Legal en Colombia (Educación Informal conforme al Decreto 1075 de 2015)
          </div>
        </section>

        {/* COMPARATIVE SECTION: ACTIVE VS PASSIVE */}
        <section id="metodo" className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold">
              ¿Por qué los métodos tradicionales y ChatGPT fallan?
            </h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
              Copiar la tarea a traductores o pedirle a ChatGPT que la resuelva te da la respuesta fácil, pero anula tu aprendizaje real.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* ChatGPT tradicional */}
            <div className="p-8 rounded-2xl border border-white/5 bg-slate-950/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-900/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-950/30 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-lg text-slate-200">ChatGPT y Traductores</h3>
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">APRENDIZAJE PASIVO</span>
                </div>
              </div>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-lg leading-none">×</span>
                  <span><strong>Efecto Copy-Paste:</strong> Copias la oración terminada sin retener la estructura en tu memoria.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-lg leading-none">×</span>
                  <span><strong>Disonancia Gramatical:</strong> Las traducciones literales a menudo dejan la oración en español en desorden sin explicarte el porqué.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-lg leading-none">×</span>
                  <span><strong>Vocabulario Abstracto:</strong> Ejemplos repetitivos y aburridos que no aplican a tu especialidad técnica (SENA).</span>
                </li>
              </ul>
            </div>

            {/* LingoBridge AI */}
            <div className="p-8 rounded-2xl border border-purple-500/20 bg-purple-950/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-lg text-white">JyM LingoBridge AI</h3>
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">APRENDIZAJE ACTIVO</span>
                </div>
              </div>
              <ul className="space-y-4 text-slate-300 text-sm">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                  <span><strong>Método Socrático:</strong> Nuestro tutor te guía con pistas interactivas y explicaciones para que deduzcas el orden.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                  <span><strong>Deconstrucción Sintáctica:</strong> Desarmamos la oración en tarjetas visuales de colores por categoría gramatical.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                  <span><strong>Glosarios de Oficios Reales:</strong> Prácticas contextualizadas a tu carrera: Construcción, TI o Administración.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* INTERACTIVE SIMULATOR SECTION */}
        <section id="simulador" className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5 scroll-margin-top-24">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block mb-2">Simulador Interactivo</span>
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold">Prueba el Deconstructor de Oraciones</h2>
            <p className="text-slate-400 mt-2 max-w-xl mx-auto">
              Intenta armar la oración correcta en inglés: **"El nuevo plano está listo"**. Haz clic en las palabras de abajo en el orden lógico.
            </p>
          </div>

          <div className="max-w-xl mx-auto p-8 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md relative">
            <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold">
              Simulador en Vivo
            </div>
            
            {/* Caja de Oración Ordenada */}
            <div className="w-full min-h-[60px] p-4 rounded-xl border border-dashed border-white/10 bg-black/40 mb-6 flex flex-wrap gap-2 items-center justify-center">
              {orderedSentence.length === 0 ? (
                <span className="text-slate-500 text-sm">Tu oración aparecerá aquí...</span>
              ) : (
                orderedSentence.map((word, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900 to-purple-800 text-white font-semibold text-sm border border-purple-500/20 shadow-md animate-fade-in"
                  >
                    {word}
                  </span>
                ))
              )}
            </div>

            {/* Bloques para Seleccionar */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {simulatorBlocks.map((block) => {
                const isSelected = orderedSentence.includes(block.text);
                return (
                  <button
                    key={block.id}
                    disabled={isSelected}
                    onClick={() => handleBlockClick(block)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm border shadow-sm transition-all duration-200 ${
                      isSelected 
                      ? 'bg-slate-950/20 border-white/5 text-slate-600 scale-95 cursor-not-allowed' 
                      : block.category === 'subject' 
                      ? 'bg-blue-900/30 border-blue-500/30 hover:border-blue-400 text-blue-200' 
                      : block.category === 'adjective'
                      ? 'bg-amber-900/30 border-amber-500/30 hover:border-amber-400 text-amber-200'
                      : block.category === 'auxiliary'
                      ? 'bg-violet-900/30 border-violet-500/30 hover:border-violet-400 text-violet-200'
                      : block.category === 'connector'
                      ? 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300'
                      : 'bg-emerald-900/30 border-emerald-500/30 hover:border-emerald-400 text-emerald-200'
                    }`}
                  >
                    {block.text}
                  </button>
                );
              })}
            </div>

            {/* Panel de Resultado */}
            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              {simulatorState === 'unstarted' && (
                <p className="text-slate-500 text-xs">Pistas: Recuerda que en inglés, el artículo va primero, luego el adjetivo y después el sustantivo.</p>
              )}
              {simulatorState === 'solving' && (
                <div className="text-amber-400 text-sm flex flex-col items-center gap-2">
                  <span>⚠️ ¡Estuviste cerca! Pero el orden sintáctico no es exacto en inglés.</span>
                  <button onClick={resetSimulator} className="text-xs underline flex items-center gap-1 hover:text-amber-300">
                    <RotateCcw className="w-3.5 h-3.5" /> Reintentar
                  </button>
                </div>
              )}
              {simulatorState === 'success' && (
                <div className="text-emerald-400 text-sm font-semibold flex flex-col items-center gap-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>¡Excelente! "The new Blueprint is ready" es correcto.</span>
                  </div>
                  <p className="text-slate-400 font-normal text-xs px-4">
                    **Explicación:** El adjetivo "new" (nuevo) DEBE anteceder al sustantivo "Blueprint" (plano). En español decimos "plano nuevo", pero la estructura mental inglesa es inversa.
                  </p>
                  <button onClick={resetSimulator} className="text-xs underline text-slate-500 hover:text-slate-300 flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5" /> Jugar de nuevo
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* GLOSSARY & TABS SECTION */}
        <section id="glosarios" className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5 scroll-margin-top-24">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">Vocabulario Técnico</span>
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold">Glosarios de tu Oficio en Tiempo Real</h2>
            <p className="text-slate-400 mt-2 max-w-xl mx-auto">
              Para los estudiantes adultos, la clave de la retención es estudiar palabras que utilicen en su día a día. Selecciona tu especialidad:
            </p>
          </div>

          {/* Botones de Tablas */}
          <div className="flex justify-center gap-4 mb-8">
            <button 
              onClick={() => setSelectedIndustry('construccion')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedIndustry === 'construccion' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-900/60 border border-white/5 text-slate-400'}`}
            >
              Construcción y Obras (SENA)
            </button>
            <button 
              onClick={() => setSelectedIndustry('tecnologia')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedIndustry === 'tecnologia' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-900/60 border border-white/5 text-slate-400'}`}
            >
              Tecnología & Software
            </button>
            <button 
              onClick={() => setSelectedIndustry('negocios')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedIndustry === 'negocios' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-900/60 border border-white/5 text-slate-400'}`}
            >
              Negocios & Oficina
            </button>
          </div>

          {/* Renderizado de Glosario */}
          <div className="max-w-3xl mx-auto grid gap-6">
            {glossaries[selectedIndustry].map((item, idx) => (
              <div 
                key={idx}
                className="p-5 rounded-xl border border-white/5 bg-slate-950/40 hover:border-purple-500/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-outfit font-extrabold text-lg text-white">{item.word}</span>
                    <span className="text-xs text-purple-400 font-medium px-2 py-0.5 rounded-full bg-purple-950/30 border border-purple-500/10">{item.pron}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{item.trans}</p>
                </div>
                <div className="text-left md:text-right border-t md:border-t-0 border-white/5 pt-3 md:pt-0 w-full md:w-auto">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Ejemplo de Práctica</span>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">"{item.exEng}"</p>
                  <p className="text-xs text-slate-500">"{item.exEsp}"</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING PLANS SECTION */}
        <section id="tarifas" className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5 scroll-margin-top-24">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block mb-2">Planes e Inversión</span>
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold">Modelos de Inversión Claro y Justo</h2>
            <p className="text-slate-400 mt-2 max-w-xl mx-auto">
              Nuestra plataforma funciona bajo un esquema formal de software SaaS. IA de Groq integrada sin cargos sorpresa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Individual */}
            <div className="p-8 rounded-2xl border border-white/10 bg-slate-900/30 relative flex flex-col justify-between">
              <div>
                <h3 className="font-outfit font-extrabold text-2xl text-white">Plan Estudiante Individual</h3>
                <p className="text-slate-400 text-sm mt-1">Perfecto para profesionales independientes, adultos de oficios técnicos y estudiantes.</p>
                <div className="my-6">
                  <span className="font-outfit text-4xl font-black text-white">$65.000 COP</span>
                  <span className="text-slate-500 text-sm"> / mes</span>
                </div>
                <ul className="space-y-4 text-slate-300 text-sm mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Acceso ilimitado al Tutor IA 24/7.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Deconstructor de tareas y oraciones en desorden.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Estudio por glosarios de especialidades.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Estadísticas individuales de retención y progreso.</span>
                  </li>
                </ul>
              </div>
              <a 
                href="https://wa.me/573045788873?text=Hola%20Manuel,%20quiero%20adquirir%20el%20Plan%20Individual%20de%20JyM%20LingoBridge%20AI" 
                target="_blank"
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-center hover:bg-white/10 hover:border-white/20 transition-all block"
              >
                Comprar Plan Estudiante
              </a>
            </div>

            {/* Plan Institutos */}
            <div className="p-8 rounded-2xl border-2 border-purple-500 bg-purple-950/10 relative flex flex-col justify-between shadow-xl shadow-purple-600/10">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                Recomendado
              </div>
              <div>
                <h3 className="font-outfit font-extrabold text-2xl text-white">Plan Academias & Empresas</h3>
                <p className="text-slate-300 text-sm mt-1">Ideal para colegios, grupos de formación del SENA, o constructoras B2B.</p>
                <div className="my-6">
                  <span className="font-outfit text-4xl font-black text-white">$280.000 COP</span>
                  <span className="text-slate-300 text-sm"> / mes</span>
                </div>
                <ul className="space-y-4 text-slate-200 text-sm mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><strong>Hasta 50 Estudiantes</strong> activos con cuentas individuales.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Panel de Control Administrativo para el profesor.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Carga personalizada de glosarios técnicos para el grupo.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Estadísticas consolidadas de avance y tareas.</span>
                  </li>
                </ul>
              </div>
              <a 
                href="https://wa.me/573045788873?text=Hola%20Manuel,%20me%20interesa%20contratar%20el%20Plan%20Académico%20de%20JyM%20LingoBridge%20AI" 
                target="_blank"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-center hover:scale-[1.02] shadow-lg shadow-purple-600/20 transition-all block"
              >
                Adquirir Licencia Institutos
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                <GraduationCap className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-outfit font-extrabold text-lg text-white">JyM LingoBridge AI</span>
            </div>
            <p className="text-slate-500 text-xs max-w-sm">
              Una solución premium de **J&M Tech Solutions** de Manuel Madrid. Villavicencio, Meta, Colombia.
              Matrícula Mercantil No. 495502.
            </p>
          </div>
          <div className="text-left md:text-right flex flex-col md:items-end gap-3">
            <span className="text-slate-400 text-sm">¿Dudas o demostraciones físicas?</span>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
              <a href="mailto:jymlingobridge@gmail.com" className="hover:text-white flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                jymlingobridge@gmail.com
              </a>
              <a href="https://wa.me/573045788873" className="hover:text-white flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                +57 304 578 8873
              </a>
            </div>
            <span className="text-[10px] text-slate-600 mt-2 block">
              &copy; 2026 J&M Tech Solutions. Todos los derechos reservados.
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
