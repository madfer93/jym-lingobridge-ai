'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { challenges, Challenge } from '@/data/challenges';
import { 
  GraduationCap, 
  ChevronLeft, 
  Sparkles, 
  Award, 
  BookOpen, 
  AlertCircle, 
  Check, 
  Loader2, 
  PenTool, 
  FileText, 
  ArrowRight,
  RefreshCw,
  XCircle,
  HelpCircle,
  TrendingUp,
  FileCheck,
  Layers,
  Languages,
  ArrowLeftRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  nivel_cefr: 'A1' | 'A2' | 'B1' | 'B2';
  enfoque_industria: 'general' | 'construccion' | 'tecnologia' | 'negocios';
}

interface GrammarError {
  original: string;
  correction: string;
  reason: string;
}

interface EvaluationResult {
  score: number;
  cefr_assessment: string;
  feedback: string;
  errors: GrammarError[];
  polished_version: string;
  xp_earned: number;
  total_xp?: number;
  new_level?: 'A1' | 'A2' | 'B1' | 'B2';
  level_up?: boolean;
}

export default function ChallengesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>([]);
  
  // Estados para Selección y Edición
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para el Traductor de Apoyo (100% Gratis & Client-Side)
  const [showTranslator, setShowTranslator] = useState(false);
  const [translateInput, setTranslateInput] = useState('');
  const [translateOutput, setTranslateOutput] = useState('');
  const [translateDirection, setTranslateDirection] = useState<'es|en' | 'en|es'>('es|en');
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!translateInput.trim()) return;
    setTranslating(true);
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(translateInput)}&langpair=${translateDirection}`
      );
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        setTranslateOutput(data.responseData.translatedText);
      } else {
        setTranslateOutput('Error al obtener la traducción. Por favor reintente.');
      }
    } catch (err) {
      console.error(err);
      setTranslateOutput('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setTranslating(false);
    }
  };

  const handleInsertTranslation = () => {
    if (!translateOutput.trim()) return;
    setSubmissionText(prev => {
      const spacing = prev.trim().length > 0 ? ' ' : '';
      return prev + spacing + translateOutput;
    });
  };
  
  // Celebración de Subida de Nivel
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ oldLevel: string; newLevel: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Obtener usuario de Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // 2. Obtener Perfil del Usuario
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

        // 3. Obtener Historial de Prácticas
        const { data: practices, error: practicesError } = await supabase
          .from('historial_practicas')
          .select('ejercicio, resultado, retroalimentacion')
          .eq('user_id', user.id);

        if (!practicesError && practices) {
          // Extraer retos aprobados
          const approvedChallenges = practices
            .filter(p => p.resultado === 'aprobado')
            .map(p => p.ejercicio);
          setCompletedChallengeIds(approvedChallenges);

          // Calcular XP dinámico acumulado = total aprobados * 50 + score promedio o de los retos
          const totalApproved = approvedChallenges.length;
          let calculatedXP = totalApproved * 50;
          
          // Buscar calificaciones reales de las retroalimentaciones guardadas
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
                // Si no es JSON, sumamos un score por defecto
                scoreSum += 80;
                scoreCount++;
              }
            }
          });

          calculatedXP = (totalApproved * 50) + (scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0);
          setXp(calculatedXP);
        }

      } catch (err) {
        console.error('Error cargando datos de desafíos:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSubmitChallenge = async () => {
    if (!profile || !selectedChallenge || !submissionText.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setEvaluation(null);

    try {
      const response = await fetch('/api/grade-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          challengeId: selectedChallenge.id,
          submissionText,
          userProfile: profile
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setEvaluation(data);
      
      // Actualizar XP local
      if (data.total_xp) {
        setXp(data.total_xp);
      }

      // Si aprobó, marcar reto como completado
      if (data.score >= 60) {
        setCompletedChallengeIds(prev => [...prev, selectedChallenge.id]);
        
        // Disparar Level Up si corresponde
        if (data.level_up && data.new_level) {
          setLevelUpData({
            oldLevel: profile.nivel_cefr,
            newLevel: data.new_level
          });
          setShowLevelUpModal(true);
          
          // Actualizar perfil local
          setProfile(prev => prev ? { ...prev, nivel_cefr: data.new_level } : null);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al intentar calificar el desafío técnico.');
    } finally {
      setSubmitting(false);
    }
  };

  const getXPProgress = () => {
    // Escala de niveles: A1 (0-80), A2 (80-180), B1 (180-300), B2 (300+)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Abriendo panel de retos de inglés técnico...</p>
      </div>
    );
  }

  // Filtrar desafíos por la industria del usuario para sugerir primero
  const userIndustry = profile?.enfoque_industria || 'general';
  const suggestedChallenges = challenges.filter(c => c.industry === userIndustry);
  const otherChallenges = challenges.filter(c => c.industry !== userIndustry);

  const xpProgress = getXPProgress();

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR DE CONTROL PERSISTENTE */}
      <aside className="w-full md:w-64 border-r border-white/5 bg-[#070913] flex flex-col justify-between shrink-0 p-6 md:min-h-screen">
        <div className="space-y-8">
          
          {/* Branding */}
          <div className="flex items-center gap-3">
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
          </div>

          {/* Tarjeta Perfil Rápido */}
          {profile && (
            <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs uppercase">
                  {profile.nombre.substring(0,2)}
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
          <nav className="space-y-2">
            <Link 
              href="/dashboard" 
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              Panel de Control
            </Link>
            <Link 
              href="/deconstructor" 
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              Deconstructor Visual
            </Link>
            <Link 
              href="/dashboard/challenges" 
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 bg-white/5 border border-white/5 text-white transition-all block"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              Tareas Evaluadas por IA
            </Link>
          </nav>
        </div>

        {/* Volver */}
        <Link 
          href="/dashboard"
          className="w-full px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 text-slate-400 hover:text-white border border-transparent hover:border-white/5 transition-all mt-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al Panel
        </Link>
      </aside>

      {/* PANEL CENTRAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-900/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Creador de Retos y Tareas */}
        {!selectedChallenge ? (
          <div className="space-y-10">
            
            {/* Cabecera */}
            <div>
              <h1 className="font-outfit text-3xl font-black text-white flex items-center gap-2">
                <PenTool className="w-8 h-8 text-purple-500" />
                Desafíos Escritos & Tareas de IA
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Escribe textos extensos y contundentes en inglés de nivel técnico. Nuestra IA evaluará tu redacción, corregirá tu gramática de forma amigable y te otorgará puntos de experiencia (XP) para subir de nivel.
              </p>
            </div>

            {/* SECCIÓN 1: RECOMENDADAS PARA TU SECTOR */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                Recomendadas para tu Sector ({profile?.enfoque_industria.toUpperCase()})
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {suggestedChallenges.map((challenge) => {
                  const isCompleted = completedChallengeIds.includes(challenge.id);
                  return (
                    <div 
                      key={challenge.id}
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setSubmissionText('');
                        setEvaluation(null);
                        setErrorMsg('');
                      }}
                      className="p-6 rounded-2xl border border-purple-500/10 hover:border-purple-500/30 bg-slate-900/20 hover:bg-slate-900/30 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-purple-500/20 border border-purple-400/20 text-purple-300">
                            Nivel {challenge.level}
                          </span>
                          <span className="text-[9px] font-bold text-cyan-400 block">{challenge.xp} XP</span>
                        </div>
                        <h3 className="font-outfit font-black text-base text-white group-hover:text-purple-400 transition-colors">
                          {challenge.title}
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                          {challenge.description}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ver Escenario Técnico</span>
                        {isCompleted ? (
                          <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px] flex items-center gap-1">
                            ✓ Completado
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 2: OTROS SECTORES DISPONIBLES */}
            <div className="space-y-4 pt-6">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Otros Desafíos Técnicos Disponibles
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherChallenges.map((challenge) => {
                  const isCompleted = completedChallengeIds.includes(challenge.id);
                  return (
                    <div 
                      key={challenge.id}
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setSubmissionText('');
                        setEvaluation(null);
                        setErrorMsg('');
                      }}
                      className="p-5 rounded-2xl border border-white/5 hover:border-white/10 bg-slate-900/10 hover:bg-slate-900/20 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-800 border border-white/5 text-slate-400">
                            Nivel {challenge.level} ({challenge.industry})
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">{challenge.xp} XP</span>
                        </div>
                        <h3 className="font-outfit font-extrabold text-sm text-slate-200 group-hover:text-cyan-400 transition-colors">
                          {challenge.title}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                          {challenge.description}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5 text-[9px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-cyan-400">
                        <span>Iniciar Tarea</span>
                        {isCompleted ? (
                          <span className="text-emerald-500 font-bold">✓ Listo</span>
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          /* PÁGINA INDIVIDUAL DEL DESAFÍO SELECCIONADO */
          <div className="space-y-8">
            
            {/* Header del Reto */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedChallenge(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-purple-500/20 border border-purple-400/20 text-purple-300">
                      Nivel {selectedChallenge.level}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-cyan-500/20 border border-cyan-400/20 text-cyan-300 uppercase">
                      Sector {selectedChallenge.industry}
                    </span>
                  </div>
                  <h1 className="font-outfit text-2xl font-black text-white mt-1.5">{selectedChallenge.title}</h1>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-purple-900/10 border border-purple-500/20 text-purple-300 font-bold text-xs">
                Valor del reto: {selectedChallenge.xp} XP
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Lado 1: Escenario Técnico y Requisitos (Lado Izquierdo) */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Caja de Escenario */}
                <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-3">
                  <h3 className="font-outfit font-black text-sm text-white flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-purple-400" />
                    El Escenario Técnico
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed">{selectedChallenge.scenario}</p>
                </div>

                {/* Requisitos Checklist */}
                <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-4">
                  <h3 className="font-outfit font-black text-sm text-white flex items-center gap-2">
                    <FileCheck className="w-4.5 h-4.5 text-cyan-400" />
                    Requisitos Obligatorios
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-400">
                    {selectedChallenge.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded bg-slate-800 border border-white/10 shrink-0 flex items-center justify-center text-[10px] text-cyan-400">
                          {idx + 1}
                        </div>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Glosario de Ayuda */}
                <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-3">
                  <h3 className="font-outfit font-black text-sm text-white flex items-center gap-2">
                    <BookOpen className="w-4.5 h-4.5 text-emerald-400" />
                    Vocabulario a Utilizar
                  </h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed">
                    Incluir estos términos técnicos del sector sumará puntos a tu calificación:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedChallenge.vocabulary.map((voc, idx) => {
                      const included = submissionText.toLowerCase().includes(voc.toLowerCase());
                      return (
                        <span 
                          key={idx}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                            included 
                            ? 'bg-emerald-500/20 border-emerald-400/20 text-emerald-300' 
                            : 'bg-slate-800 border-white/5 text-slate-400'
                          }`}
                        >
                          {voc}
                        </span>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Lado 2: Canvas de Redacción y Retroalimentación (Lado Derecho) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Caja de Redacción */}
                {!evaluation ? (
                  <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-outfit font-black text-sm text-white flex items-center gap-2">
                        <PenTool className="w-4.5 h-4.5 text-purple-400" />
                        Tu Entrega en Inglés
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {submissionText.split(/\s+/).filter(Boolean).length} palabras
                      </span>
                    </div>

                    <textarea 
                      rows={8}
                      required
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Redacta tu correo, reporte o escrito aquí en inglés..."
                      disabled={submitting}
                      className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-700 text-white font-medium resize-none leading-relaxed"
                    />

                    {/* Toggle del Traductor de Apoyo */}
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="text-xs font-bold text-slate-300">Traductor de Apoyo (100% Gratis)</span>
                      </div>
                      <button
                        onClick={() => setShowTranslator(!showTranslator)}
                        className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 text-cyan-300 font-bold text-[10px] transition-all cursor-pointer"
                      >
                        {showTranslator ? 'Ocultar Traductor' : 'Mostrar Traductor'}
                      </button>
                    </div>

                    {showTranslator && (
                      <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-3">
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {translateDirection === 'es|en' ? 'Español ➔ Inglés' : 'Inglés ➔ Español'}
                          </span>
                          <button
                            onClick={() => {
                              setTranslateDirection(prev => prev === 'es|en' ? 'en|es' : 'es|en');
                              setTranslateInput(translateOutput);
                              setTranslateOutput('');
                            }}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-all"
                            title="Cambiar Idioma"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <textarea
                              rows={3}
                              value={translateInput}
                              onChange={(e) => setTranslateInput(e.target.value)}
                              placeholder={translateDirection === 'es|en' ? 'Escribe en español...' : 'Escribe en inglés...'}
                              className="w-full p-2.5 bg-black/40 border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                            />
                            <button
                              onClick={handleTranslate}
                              disabled={translating || !translateInput.trim()}
                              className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                            >
                              {translating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Traduciendo...
                                </>
                              ) : (
                                'Traducir'
                              )}
                            </button>
                          </div>

                          <div className="flex flex-col justify-between p-2.5 bg-black/50 border border-white/5 rounded-lg min-h-[90px]">
                            <p className="text-xs text-slate-300 leading-relaxed italic select-all">
                              {translateOutput || 'La traducción aparecerá aquí...'}
                            </p>
                            {translateOutput && translateOutput !== 'Error al obtener la traducción. Por favor reintente.' && (
                              <button
                                onClick={handleInsertTranslation}
                                className="mt-2 py-1 px-2.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1 self-end transition-all cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                Insertar en mi entrega
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedChallenge.hint && (
                      <div className="p-4 rounded-xl border border-purple-500/10 bg-purple-950/20 space-y-2">
                        <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-extrabold uppercase tracking-widest">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          ¿Atascado? Pista Pedagógica del Coach
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed italic whitespace-pre-line">
                          {selectedChallenge.hint}
                        </p>
                      </div>
                    )}

                    {errorMsg && (
                      <p className="text-red-400 text-xs flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}</p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        onClick={() => setSelectedChallenge(null)}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSubmitChallenge}
                        disabled={submitting || !submissionText.trim()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition-all disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Calificando por IA...
                          </>
                        ) : (
                          <>
                            Enviar para Calificación
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  
                  /* REPORTE DE EVALUACIÓN DE IA COMPLETO */
                  <div className="space-y-6">
                    
                    {/* Tarjeta de Calificación Principal */}
                    <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-6 ${
                      evaluation.score >= 60 
                      ? 'border-emerald-500/20 bg-emerald-950/10' 
                      : 'border-amber-500/20 bg-amber-950/10'
                    }`}>
                      <div className="space-y-2 text-center sm:text-left">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resultado de la Tarea</span>
                        <h2 className="font-outfit text-3xl font-black text-white">
                          {evaluation.score >= 60 ? '✓ ¡Desafío Aprobado!' : '⚠ Tarea con Correcciones'}
                        </h2>
                        <p className="text-slate-400 text-xs max-w-md">
                          Has sido calificado con un nivel estimado **{evaluation.cefr_assessment}**. {evaluation.score >= 60 ? '¡Excelente trabajo técnico!' : 'Revisa las correcciones para seguir puliendo tu redacción.'}
                        </p>
                      </div>

                      {/* Score Badge */}
                      <div className="text-center shrink-0">
                        <div className={`w-20 h-20 rounded-full border-4 flex flex-col justify-center items-center font-outfit shadow-lg ${
                          evaluation.score >= 60 
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-emerald-500/10' 
                          : 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-amber-500/10'
                        }`}>
                          <span className="text-2xl font-black">{evaluation.score}</span>
                          <span className="text-[9px] font-bold opacity-60">/ 100</span>
                        </div>
                        <span className="text-[9px] font-extrabold text-cyan-400 block mt-2">+{evaluation.score} XP Ganados</span>
                      </div>
                    </div>

                    {/* Retroalimentación General del Coach de IA */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-3">
                      <h3 className="font-outfit font-black text-sm text-purple-400 flex items-center gap-2">
                        <HelpCircle className="w-4.5 h-4.5" />
                        Comentarios del Coach de LingoBridge
                      </h3>
                      <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">{evaluation.feedback}</p>
                    </div>

                    {/* Tabla de Errores e Explicaciones */}
                    {evaluation.errors && evaluation.errors.length > 0 && (
                      <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-4">
                        <h3 className="font-outfit font-black text-sm text-amber-400 flex items-center gap-2">
                          <AlertCircle className="w-4.5 h-4.5" />
                          Detalle de Errores Encontrados ({evaluation.errors.length})
                        </h3>

                        <div className="space-y-4 divide-y divide-white/5">
                          {evaluation.errors.map((err, idx) => (
                            <div key={idx} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} space-y-2 text-xs`}>
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/10 text-red-300 italic">
                                  <span className="text-[8px] font-extrabold text-red-400 uppercase tracking-widest block mb-1">Tu Texto:</span>
                                  "{err.original}"
                                </div>
                                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/10 text-emerald-300 font-medium">
                                  <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-widest block mb-1">Corrección Sugerida:</span>
                                  "{err.correction}"
                                </div>
                              </div>
                              <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
                                <span className="font-bold text-slate-500">¿Por qué es un error?:</span> {err.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Versión Pulida Premium Reescrita */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-3">
                      <h3 className="font-outfit font-black text-sm text-cyan-400 flex items-center gap-2">
                        <Award className="w-4.5 h-4.5" />
                        Versión Premium Propuesta por IA
                      </h3>
                      <p className="text-slate-500 text-[10px] leading-relaxed">
                        Estudia y copia esta propuesta de redacción formal de alta calidad en tu libreta:
                      </p>
                      <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-slate-200 leading-relaxed select-all">
                        {evaluation.polished_version}
                      </div>
                    </div>

                    {/* Botones de Cierre / Reintento */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        onClick={() => {
                          setEvaluation(null);
                          setSubmissionText('');
                        }}
                        className="px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                      >
                        Reintentar o Limpiar
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedChallenge(null);
                          setEvaluation(null);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        Volver al Menú de Retos
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </main>

      {/* MODAL FULLSCREEN DE CELEBRACIÓN DE NIVEL (Sparkles Level Up!) */}
      {showLevelUpModal && levelUpData && (
        <div className="fixed inset-0 bg-[#070913]/90 backdrop-blur-md z-50 flex flex-col justify-center items-center p-6 text-center animate-fade-in">
          
          {/* Neon Glow particles decoratives */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-600/20 rounded-full blur-[80px] -z-10 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[100px] -z-10 animate-pulse delay-100" />

          {/* Celebración Card */}
          <div className="max-w-md p-8 rounded-3xl border border-white/10 bg-slate-900/40 shadow-2xl relative space-y-6">
            
            {/* Animación Icono */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-600/35 mx-auto animate-bounce">
              <Award className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest block">¡Logro Desbloqueado!</span>
              <h2 className="font-outfit text-3xl font-black text-white">¡Subiste de Nivel!</h2>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                Tus excelentes resultados y perseverancia en inglés técnico te han llevado al siguiente escalafón del Marco Común Europeo:
              </p>
            </div>

            {/* Transición de nivel */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex justify-center items-center gap-6 max-w-xs mx-auto">
              <span className="text-slate-500 font-black text-xl line-through">{levelUpData.oldLevel}</span>
              <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-black text-4xl animate-scaleUp">{levelUpData.newLevel}</span>
            </div>

            <button 
              onClick={() => setShowLevelUpModal(false)}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-600/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              ¡Excelente, Continuar Aprendiendo!
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
