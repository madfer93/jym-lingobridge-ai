'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { examsData, ExamQuestion } from '@/data/exams';
import { 
  GraduationCap, 
  ChevronLeft, 
  Award, 
  BookOpen, 
  AlertCircle, 
  Check, 
  Loader2, 
  Sparkles, 
  Volume2, 
  ArrowRight,
  RefreshCw,
  XCircle,
  FileCheck,
  Layers,
  HelpCircle,
  User,
  LogOut,
  Construction,
  Star,
  Users,
  BarChart3,
  Mail,
  Mic,
  Cpu
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  nivel_cefr: 'A1' | 'A2' | 'B1' | 'B2';
  enfoque_industria: 'general' | 'construccion' | 'tecnologia' | 'negocios';
}

export default function ExamPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);

  // Estados del Examen
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [examFinished, setExamFinished] = useState(false);
  const [scorePercentage, setScorePercentage] = useState(0);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Logo Dinámico
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(localStorage.getItem('lingobridge_logo'));
    }
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
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

        // Obtener historial para calcular XP base
        const { data: practices } = await supabase
          .from('historial_practicas')
          .select('resultado, retroalimentacion')
          .eq('user_id', user.id);

        if (practices) {
          const approved = practices.filter(p => p.resultado === 'aprobado');
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
          calculatedXP += scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
          setXp(calculatedXP);
        }

      } catch (err) {
        console.error('Error loading exam data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
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

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Obtener preguntas según sector y nivel
  const getExamQuestions = (): ExamQuestion[] => {
    if (!profile) return [];
    const sector = profile.enfoque_industria === 'general' ? 'tecnologia' : profile.enfoque_industria;
    const level = profile.nivel_cefr || 'A1';
    
    // Fallback por si la combinación no está
    const sectorData = examsData[sector] || examsData.tecnologia;
    const levelExam = sectorData[level] || sectorData.A1;
    return levelExam.questions;
  };

  const questions = getExamQuestions();

  const handleOptionSelect = (idx: number) => {
    setSelectedOptionIndex(idx);
  };

  const handleNextQuestion = () => {
    if (selectedOptionIndex === null) return;

    const newAnswers = [...answers, selectedOptionIndex];
    setAnswers(newAnswers);
    setSelectedOptionIndex(null);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Fin del examen: Calcular nota
      let correctCount = 0;
      newAnswers.forEach((ans, idx) => {
        if (ans === questions[idx].correctIndex) {
          correctCount++;
        }
      });
      const finalScore = Math.round((correctCount / questions.length) * 100);
      setScorePercentage(finalScore);
      setExamFinished(true);
    }
  };

  const handleRestartExam = () => {
    setExamStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setAnswers([]);
    setExamFinished(false);
    setScorePercentage(0);
  };

  // Generador de PDF usando jsPDF en Landscape
  const handleDownloadCertificate = () => {
    if (!profile) return;
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      // 1. Fondo de lujo (Azul oscuro / Navy)
      doc.setFillColor(7, 9, 19);
      doc.rect(0, 0, width, height, 'F');

      // 2. Doble borde dorado
      doc.setDrawColor(212, 175, 55); // Dorado Metálico
      doc.setLineWidth(1.5);
      doc.rect(10, 10, width - 20, height - 20);

      doc.setDrawColor(184, 134, 11); // Dorado oscuro
      doc.setLineWidth(0.5);
      doc.rect(13, 13, width - 26, height - 26);

      // Esquinas decoradas
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(2);
      doc.line(13, 25, 25, 13);
      doc.line(width - 13, 25, width - 25, 13);
      doc.line(13, height - 25, 25, height - 13);
      doc.line(width - 13, height - 25, width - 25, height - 13);

      // Círculo marca de agua en fondo
      doc.setDrawColor(20, 25, 50);
      doc.setLineWidth(0.25);
      doc.circle(width / 2, height / 2 + 10, 38, 'S');

      // 3. Encabezados de Marca
      doc.setTextColor(190, 200, 220);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('J&M TECH SOLUTIONS & JYM LINGOBRIDGE AI', width / 2, 32, { align: 'center' });

      // 4. Título Principal
      doc.setTextColor(212, 175, 55);
      doc.setFont('Times', 'italic');
      doc.setFontSize(26);
      doc.text('Certificado de Suficiencia Técnica', width / 2, 48, { align: 'center' });

      // 5. Cuerpo del Diploma
      doc.setTextColor(230, 230, 240);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Otorgado formalmente a:', width / 2, 68, { align: 'center' });

      // Nombre (Grande en Blanco)
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(profile.nombre.toUpperCase(), width / 2, 82, { align: 'center' });

      // Texto de Aprobación
      doc.setTextColor(180, 185, 200);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      const textLine1 = `Por haber completado y aprobado con éxito el Examen de Suficiencia de Inglés Técnico`;
      const textLine2 = `especializado en el sector de ${profile.enfoque_industria.toUpperCase()}, demostrando un nivel de competencia`;
      const textLine3 = `e intercomunicación global clasificado bajo el marco internacional MCER como:`;

      doc.text(textLine1, width / 2, 98, { align: 'center' });
      doc.text(textLine2, width / 2, 105, { align: 'center' });
      doc.text(textLine3, width / 2, 112, { align: 'center' });

      // Nivel en cian brillante
      doc.setTextColor(34, 211, 238); // Cyan
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(28);
      doc.text(`NIVEL ${profile.nivel_cefr}`, width / 2, 128, { align: 'center' });

      // Ubicación y Fecha
      doc.setTextColor(120, 125, 140);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      const dateStr = `Villavicencio, Meta, Colombia - ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      doc.text(dateStr, width / 2, 142, { align: 'center' });

      // 6. Firma Dorada
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(width / 2 - 40, 172, width / 2 + 40, 172);

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('MANUEL MADRID', width / 2, 178, { align: 'center' });

      doc.setTextColor(120, 125, 140);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('CEO J&M Tech Solutions', width / 2, 183, { align: 'center' });

      // 7. Hash de Verificación
      const verifyHash = `VERIFY-LB-${profile.id.substring(0, 8).toUpperCase()}-${new Date().getFullYear()}`;
      doc.setTextColor(80, 85, 100);
      doc.setFont('Courier', 'normal');
      doc.setFontSize(7);
      doc.text(`Código de Verificación Seguro: ${verifyHash}`, width / 2, 198, { align: 'center' });

      doc.save(`Certificado_Ingles_${profile.nombre.replace(/\s+/g, '_')}_${profile.nivel_cefr}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error al generar el certificado en PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const xpProgress = getXPProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Abriendo panel de exámenes y certificaciones...</p>
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
                  {profile.enfoque_industria === 'construccion' ? (
                    <Construction className="w-4.5 h-4.5 text-purple-300" />
                  ) : (
                    <User className="w-4.5 h-4.5" />
                  )}
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
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-white/5 border border-white/5 text-white transition-all block"
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
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
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
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-900/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        {profile && (
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="pb-6 border-b border-white/5">
              <h1 className="font-outfit text-3xl font-black text-white flex items-center gap-2">
                <Award className="w-8 h-8 text-cyan-400 animate-pulse" />
                Examen y Certificado de Suficiencia
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Demuestra tus destrezas en inglés técnico dentro del sector **{profile.enfoque_industria.toUpperCase()}** en tu nivel actual (**{profile.nivel_cefr}**). Aprueba el examen y descarga tu diploma firmado en PDF.
              </p>
            </div>

            {/* VISTA 1: ANTES DE INICIAR */}
            {!examStarted && !examFinished && (
              <div className="grid md:grid-cols-3 gap-8">
                
                {/* Lado 1: Información de Examen */}
                <div className="md:col-span-2 p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-6">
                  <h3 className="font-outfit font-black text-lg text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-cyan-400" />
                    Reglas del Examen
                  </h3>
                  
                  <ul className="space-y-4 text-slate-300 text-xs">
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded bg-cyan-500/15 border border-cyan-400/20 text-cyan-400 shrink-0 flex items-center justify-center font-bold text-[10px]">1</div>
                      <span>El examen consta de **5 preguntas de selección múltiple** adaptadas estrictamente al vocabulario de tu sector (**{profile.enfoque_industria}**).</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded bg-cyan-500/15 border border-cyan-400/20 text-cyan-400 shrink-0 flex items-center justify-center font-bold text-[10px]">2</div>
                      <span>Para aprobar y desbloquear tu certificado, debes responder correctamente al menos **4 preguntas (80%)**.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded bg-cyan-500/15 border border-cyan-400/20 text-cyan-400 shrink-0 flex items-center justify-center font-bold text-[10px]">3</div>
                      <span>Si no apruebas en tu primer intento, no te preocupes: puedes repasar tus tareas de la IA y reintentar el test las veces que quieras.</span>
                    </li>
                  </ul>

                  <div className="pt-4">
                    <button
                      onClick={() => setExamStarted(true)}
                      className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm flex items-center gap-2 cursor-pointer hover:scale-[1.01] transition-all"
                    >
                      Iniciar Examen Técnico
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lado 2: Vista previa del Diploma */}
                <div className="md:col-span-1 p-6 rounded-2xl border border-yellow-500/10 bg-yellow-950/5 flex flex-col justify-between items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-400/20 flex items-center justify-center text-yellow-300 animate-pulse">
                    <Award className="w-9 h-9" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-outfit font-black text-sm text-yellow-400">DIPLOMA AUTOMÁTICO</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed leading-5">
                      Al aprobar, se generará un certificado formal en formato apaisado (Landscape) con tu código único de verificación firmado por el director de **J&M Tech Solutions**.
                    </p>
                  </div>
                  <div className="w-full p-3 rounded-lg bg-black/40 border border-white/5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    Certificación de Nivel {profile.nivel_cefr}
                  </div>
                </div>

              </div>
            )}

            {/* VISTA 2: EXAMEN EN CURSO */}
            {examStarted && !examFinished && questions.length > 0 && (
              <div className="max-w-2xl mx-auto p-6 md:p-8 rounded-2xl border border-white/5 bg-slate-900/20 space-y-6">
                
                {/* Indicador de Progreso */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
                  <span className="text-cyan-400">Nivel {profile.nivel_cefr}</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
                </div>

                {/* Pregunta */}
                <div className="space-y-3">
                  <h3 className="font-outfit font-extrabold text-base md:text-lg text-white leading-relaxed">
                    {questions[currentQuestionIndex].question}
                  </h3>
                </div>

                {/* Opciones */}
                <div className="grid gap-3.5 pt-2">
                  {questions[currentQuestionIndex].options.map((opt, idx) => {
                    const isSelected = selectedOptionIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        className={`p-4 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected 
                          ? 'bg-cyan-950/20 border-cyan-500/70 text-cyan-200' 
                          : 'bg-black/30 border-white/5 text-slate-300 hover:bg-black/40 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border shrink-0 ${
                            isSelected 
                            ? 'bg-cyan-500 border-cyan-400 text-white' 
                            : 'bg-slate-850 border-white/10 text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Botón Siguiente */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNextQuestion}
                    disabled={selectedOptionIndex === null}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 disabled:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    {currentQuestionIndex + 1 === questions.length ? 'Finalizar Examen' : 'Siguiente Pregunta'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* VISTA 3: RESULTADOS DEL EXAMEN */}
            {examFinished && (
              <div className="max-w-2xl mx-auto p-6 md:p-8 rounded-2xl border text-center space-y-8 bg-slate-900/20 border-white/5 relative overflow-hidden">
                
                {scorePercentage >= 80 ? (
                  // APROBADO SUCCESS
                  <div className="space-y-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 mx-auto animate-bounce">
                      <Award className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest block">¡FELICITACIONES!</span>
                      <h2 className="font-outfit text-3xl font-black text-white">¡Examen Aprobado!</h2>
                      <p className="text-slate-300 text-xs max-w-md mx-auto leading-relaxed">
                        Lograste un puntaje perfecto de <strong>{scorePercentage}/100</strong> en el Examen de Suficiencia Técnico. Tu diploma digital oficial ya está firmado y disponible.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/10 max-w-xs mx-auto text-xs font-semibold text-cyan-300">
                      Nivel Acreditado: Nivel {profile.nivel_cefr}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                      <button
                        onClick={handleRestartExam}
                        className="px-5 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                      >
                        Reintentar Examen
                      </button>
                      <button
                        onClick={handleDownloadCertificate}
                        disabled={generatingPdf}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition-all disabled:opacity-50"
                      >
                        {generatingPdf ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generando PDF...
                          </>
                        ) : (
                          <>
                            Descargar Certificado PDF
                            <Award className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  // REPROBADO RETRY
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">CASI LO LOGRAS</span>
                      <h2 className="font-outfit text-2xl font-black text-white">Examen No Aprobado ({scorePercentage}/100)</h2>
                      <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                        Obtuviste una nota de {scorePercentage}%. Recuerda que debes alcanzar al menos un **80% (4 de 5 correctas)** para poder certificarte formalmente.
                      </p>
                    </div>

                    <p className="text-slate-500 text-[10px] italic">
                      Consejo del Coach: Revisa tu vocabulario del sector y repasa las correcciones en el panel de Tareas Evaluadas antes de volver a intentarlo.
                    </p>

                    <div className="pt-4 flex justify-center gap-3">
                      <Link
                        href="/dashboard"
                        className="px-5 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
                      >
                        Volver al Panel
                      </Link>
                      <button
                        onClick={handleRestartExam}
                        className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-purple-500 transition-all"
                      >
                        Reintentar Examen
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}
