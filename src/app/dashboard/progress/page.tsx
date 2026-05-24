'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, 
  ChevronLeft, 
  BookOpen, 
  AlertCircle, 
  Check, 
  Loader2, 
  Star,
  Users,
  BarChart3,
  Mail,
  Mic,
  Cpu,
  Layers,
  Sparkles,
  Award,
  LogOut,
  TrendingUp,
  Activity,
  Brain,
  ShieldAlert,
  PieChart
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  nivel_cefr: string;
  enfoque_industria: 'general' | 'construccion' | 'tecnologia' | 'negocios';
}

export default function CognitiveProgressDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);

  // Estados de Métricas
  const [totalPractices, setTotalPractices] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [averageScore, setAverageScore] = useState(80);
  const [activeTab, setActiveTab] = useState<'radar' | 'history'>('radar');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(localStorage.getItem('lingobridge_logo'));
    }
  }, []);

  // Cargar Perfil e Historial
  useEffect(() => {
    const loadProgressData = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('perfiles_usuario')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !userProfile) {
          router.push('/login');
          return;
        }

        setProfile(userProfile);

        // Consultar Historial para extraer métricas cognitivas exactas
        const { data: practices } = await supabase
          .from('historial_practicas')
          .select('*')
          .eq('user_id', user.id);

        if (practices && practices.length > 0) {
          setTotalPractices(practices.length);
          const approved = practices.filter(p => p.resultado === 'aprobado');
          setApprovedCount(approved.length);

          let calculatedXP = approved.length * 50;

          let scoreSum = 0;
          let scoreCount = 0;
          practices.forEach(p => {
            if (p.resultado === 'aprobado' && p.retroalimentacion) {
              try {
                const parsed = JSON.parse(p.retroalimentacion);
                if (parsed && parsed.score) {
                  scoreSum += parsed.score;
                  scoreCount++;
                }
              } catch (e) {
                scoreSum += 80;
                scoreCount++;
              }
            }
          });

          const finalAverage = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 80;
          setAverageScore(finalAverage);

          calculatedXP += scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
          setXp(calculatedXP);
        } else {
          // Fallback seguro si es cuenta nueva
          setTotalPractices(0);
          setApprovedCount(0);
          setAverageScore(0);
          setXp(15);
        }

      } catch (err) {
        console.error('Error loading progress stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProgressData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getXPProgress = () => {
    let minXP = 0;
    let maxXP = 80;
    let levelName = 'Principiante A1';

    if (xp >= 300) {
      minXP = 300;
      maxXP = 500;
      levelName = 'Intermedio Alto B2';
    } else if (xp >= 180) {
      minXP = 180;
      maxXP = 300;
      levelName = 'Intermedio B1';
    } else if (xp >= 80) {
      minXP = 80;
      maxXP = 180;
      levelName = 'Elemental A2';
    }

    const percentage = Math.min(100, Math.max(0, ((xp - minXP) / (maxXP - minXP)) * 100));
    return { percentage, maxXP, levelName };
  };

  const xpProgress = getXPProgress();

  // Mapeo cognitivo dinámico basado en prácticas reales
  // Puntos cognitivos: Vocabulario, Gramática, Pronunciación, Comprensión Escrita, Fluidez Conversacional
  const baseMetrics = {
    vocabulary: totalPractices > 0 ? Math.min(95, 45 + (approvedCount * 12)) : 35,
    grammar: averageScore > 0 ? Math.round(averageScore * 0.95) : 30,
    pronunciation: totalPractices > 0 ? Math.min(90, 50 + (totalPractices * 8)) : 40,
    reading: averageScore > 0 ? Math.round(averageScore * 1.05) : 45,
    fluency: totalPractices > 0 ? Math.min(95, 40 + (approvedCount * 15)) : 30
  };

  // Coordenadas para el Polígono Radar SVG (Centro en x=150, y=150, Radio máx=100)
  // Ángulos: Vocabulario = 0° (x=150+R, y=150), Gramática = 72° (x=150+R*cos(72°), y=150+R*sin(72°)), etc.
  const getRadarPoints = () => {
    const cx = 150;
    const cy = 150;
    
    // Convertir puntajes del 0 al 100 en radio
    const rVocab = (baseMetrics.vocabulary / 100) * 100;
    const rGrammar = (baseMetrics.grammar / 100) * 100;
    const rPron = (baseMetrics.pronunciation / 100) * 100;
    const rRead = (baseMetrics.reading / 100) * 100;
    const rFluency = (baseMetrics.fluency / 100) * 100;

    // Ángulos en radianes (0, 72, 144, 216, 288)
    const p1 = { x: cx + rVocab * Math.cos(0), y: cy - rVocab * Math.sin(0) };
    const p2 = { x: cx + rGrammar * Math.cos((72 * Math.PI) / 180), y: cy - rGrammar * Math.sin((72 * Math.PI) / 180) };
    const p3 = { x: cx + rPron * Math.cos((144 * Math.PI) / 180), y: cy - rPron * Math.sin((144 * Math.PI) / 180) };
    const p4 = { x: cx + rRead * Math.cos((216 * Math.PI) / 180), y: cy - rRead * Math.sin((216 * Math.PI) / 180) };
    const p5 = { x: cx + rFluency * Math.cos((288 * Math.PI) / 180), y: cy - rFluency * Math.sin((288 * Math.PI) / 180) };

    return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y} ${p5.x},${p5.y}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Analizando tu mapa cerebral de inglés técnico...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR DE CONTROL PERSISTENTE */}
      <aside className="w-full md:w-64 border-r border-white/5 bg-[#070913] flex flex-col justify-between shrink-0 p-6 md:min-h-screen">
        <div className="space-y-8">
          
          {/* Branding */}
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="JyM LingoBridge AI" className="h-8 object-contain" />
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-outfit font-extrabold text-md tracking-tight text-white block">
                    JyM LingoBridge
                  </span>
                  <span className="block text-[8px] font-bold text-cyan-400 tracking-widest uppercase">
                    AI EDUCATION ENGINE
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Tarjeta Perfil Rápido */}
          {profile && (
            <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs uppercase">
                  <svg className="w-4.5 h-4.5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-xs text-white truncate">{profile.nombre}</h4>
                  <span className="block text-[8px] font-bold text-purple-400 uppercase tracking-widest truncate">
                    Sector {profile.enfoque_industria}
                  </span>
                </div>
              </div>

              {/* Barra XP */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-slate-400">Progreso de Nivel</span>
                  <span className="text-cyan-400">{xp} / {xpProgress.maxXP} XP</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${xpProgress.percentage}%` }} />
                </div>
                <span className="text-[8px] text-slate-500 block text-center font-semibold uppercase">{xpProgress.levelName}</span>
              </div>
            </div>
          )}

          {/* Enlaces de Navegación */}
          <nav className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            <Link 
              href="/dashboard" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Cpu className="w-4 h-4 text-purple-400" />
              Panel de Control
            </Link>
            <Link 
              href="/deconstructor" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              Deconstructor Visual
            </Link>
            <Link 
              href="/dashboard/challenges" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              Tareas por IA
            </Link>
            <Link 
              href="/dashboard/exam" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Award className="w-4 h-4 text-cyan-400" />
              Examen & Certificado
            </Link>
            <Link 
              href="/dashboard/glossary" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Glosario Técnico
            </Link>
            <Link 
              href="/dashboard/flashcards" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Star className="w-4 h-4 text-amber-400" />
              Flashcards SRS
            </Link>
            <Link 
              href="/dashboard/interview" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Mic className="w-4 h-4 text-purple-400" />
              Entrevistas AI
            </Link>
            <Link 
              href="/dashboard/mailer" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              SaaS Mailer
            </Link>
            <Link 
              href="/dashboard/leaderboard" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Users className="w-4 h-4 text-purple-400" />
              Ranquin Global
            </Link>
            <Link 
              href="/dashboard/progress" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-white/5 border border-white/5 text-white transition-all block"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Mi Progreso
            </Link>
          </nav>
        </div>

        {/* Cerrar Sesión */}
        <button 
          onClick={handleLogout}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-500/10 transition-all mt-8 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </aside>

      {/* PANEL CENTRAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-900/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Cabecera */}
          <div className="pb-6 border-b border-white/5">
            <h1 className="font-outfit text-3xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
              Reporte Analítico: Progreso Cognitivo
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Visualiza en tiempo real el desglose de tus habilidades de inglés técnico basándote en tu interacción diaria con nuestros motores educativos AI.
            </p>
          </div>

          {/* DIBUJAR TARJETAS DE MÉTRICAS GENERALES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 text-center space-y-1">
              <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Ejercicios Totales</span>
              <span className="font-outfit font-black text-2xl text-white">{totalPractices}</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 text-center space-y-1">
              <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Prácticas Aprobadas</span>
              <span className="font-outfit font-black text-2xl text-cyan-400">{approvedCount}</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 text-center space-y-1">
              <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Puntaje Promedio</span>
              <span className="font-outfit font-black text-2xl text-purple-400">{averageScore}%</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 text-center space-y-1">
              <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Precisión Cognitiva</span>
              <span className="font-outfit font-black text-2xl text-emerald-400">
                {totalPractices > 0 ? Math.round((approvedCount / totalPractices) * 100) : 0}%
              </span>
            </div>

          </div>

          {/* CUADRO INTERACTIVO DE GRÁFICOS */}
          <div className="grid md:grid-cols-5 gap-6 items-center">
            
            {/* GRÁFICO RADAR COGNITIVO SVG */}
            <div className="md:col-span-2 p-6 rounded-3xl border border-white/10 bg-slate-900/30 backdrop-blur-md flex flex-col items-center justify-center space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-400" />
                Radar de Habilidades
              </h3>

              <svg width="220" height="220" viewBox="0 0 300 300" className="w-full max-w-[200px]">
                {/* Capas concéntricas del Radar */}
                <circle cx="150" cy="150" r="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <circle cx="150" cy="150" r="75" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <circle cx="150" cy="150" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <circle cx="150" cy="150" r="25" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Ejes radiales (5 dimensiones) */}
                {[0, 72, 144, 216, 288].map(ang => (
                  <line 
                    key={ang} 
                    x1="150" 
                    y1="150" 
                    x2={150 + 100 * Math.cos((ang * Math.PI) / 180)} 
                    y2={150 - 100 * Math.sin((ang * Math.PI) / 180)} 
                    stroke="rgba(255,255,255,0.08)" 
                    strokeWidth="1"
                  />
                ))}

                {/* Polígono de Habilidades Cognitivas */}
                <polygon 
                  points={getRadarPoints()} 
                  fill="rgba(168, 85, 247, 0.2)" 
                  stroke="rgba(6, 182, 212, 0.8)" 
                  strokeWidth="2.5" 
                  className="transition-all duration-700"
                />

                {/* Indicadores en los vértices */}
                <circle cx={150 + (baseMetrics.vocabulary / 100) * 100 * Math.cos(0)} cy={150 - (baseMetrics.vocabulary / 100) * 100 * Math.sin(0)} r="4" fill="#a855f7" />
                <circle cx={150 + (baseMetrics.grammar / 100) * 100 * Math.cos((72 * Math.PI) / 180)} cy={150 - (baseMetrics.grammar / 100) * 100 * Math.sin((72 * Math.PI) / 180)} r="4" fill="#06b6d4" />
                <circle cx={150 + (baseMetrics.pronunciation / 100) * 100 * Math.cos((144 * Math.PI) / 180)} cy={150 - (baseMetrics.pronunciation / 100) * 100 * Math.sin((144 * Math.PI) / 180)} r="4" fill="#a855f7" />
                <circle cx={150 + (baseMetrics.reading / 100) * 100 * Math.cos((216 * Math.PI) / 180)} cy={150 - (baseMetrics.reading / 100) * 100 * Math.sin((216 * Math.PI) / 180)} r="4" fill="#06b6d4" />
                <circle cx={150 + (baseMetrics.fluency / 100) * 100 * Math.cos((288 * Math.PI) / 180)} cy={150 - (baseMetrics.fluency / 100) * 100 * Math.sin((288 * Math.PI) / 180)} r="4" fill="#a855f7" />
              </svg>
            </div>

            {/* PANEL DE INDICADORES NUMÉRICOS DETALLADOS */}
            <div className="md:col-span-3 space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                Desglose Analítico por Destreza
              </h3>

              <div className="space-y-4">
                
                {/* Vocabulario Técnico */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-350">Vocabulario Técnico ({profile?.enfoque_industria})</span>
                    <span className="text-purple-400">{baseMetrics.vocabulary}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full rounded-full transition-all duration-700" style={{ width: `${baseMetrics.vocabulary}%` }} />
                  </div>
                </div>

                {/* Razonamiento Sintáctico */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-350">Razonamiento Sintáctico (Gramática)</span>
                    <span className="text-cyan-400">{baseMetrics.grammar}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-cyan-500 to-purple-600 h-full rounded-full transition-all duration-700" style={{ width: `${baseMetrics.grammar}%` }} />
                  </div>
                </div>

                {/* Pronunciación Fonética */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-350">Pronunciación y Fonética</span>
                    <span className="text-purple-400">{baseMetrics.pronunciation}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full rounded-full transition-all duration-700" style={{ width: `${baseMetrics.pronunciation}%` }} />
                  </div>
                </div>

                {/* Comprensión Escrita */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-350">Comprensión Escrita / Lectura</span>
                    <span className="text-cyan-400">{baseMetrics.reading}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-cyan-500 to-purple-600 h-full rounded-full transition-all duration-700" style={{ width: `${baseMetrics.reading}%` }} />
                  </div>
                </div>

                {/* Fluidez Conversacional */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-350">Fluidez Conversacional (Simulaciones)</span>
                    <span className="text-purple-400">{baseMetrics.fluency}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full rounded-full transition-all duration-700" style={{ width: `${baseMetrics.fluency}%` }} />
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
