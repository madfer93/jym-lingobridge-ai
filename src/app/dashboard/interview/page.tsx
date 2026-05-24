'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, 
  ChevronLeft, 
  BookOpen, 
  AlertCircle, 
  Check, 
  Loader2, 
  Volume2, 
  Star,
  Users,
  BarChart3,
  Mail,
  Mic,
  MicOff,
  Cpu,
  Layers,
  Sparkles,
  Award,
  LogOut,
  Send,
  HelpCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  nivel_cefr: string;
  enfoque_industria: 'general' | 'construccion' | 'tecnologia' | 'negocios';
}

interface Correction {
  original: string;
  correction: string;
  reason: string;
}

interface InterviewResult {
  feedback: string;
  grammar_corrections: Correction[];
  next_question: string;
  score_impact: number;
}

export default function InterviewSimulator() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);

  // Estados de Entrevista
  const [messages, setMessages] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('Welcome! Please introduce yourself and describe your professional experience.');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewResult | null>(null);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  
  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(localStorage.getItem('lingobridge_logo'));
    }
  }, []);

  // Cargar perfil e inicializar
  useEffect(() => {
    const loadProfile = async () => {
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

        // Cambiar la primera pregunta en base al sector de interés
        let initialQuestion = 'Welcome! Please introduce yourself and describe your professional experience.';
        if (userProfile.enfoque_industria === 'construccion') {
          initialQuestion = 'Hello! Welcome to the job site. To start, can you introduce yourself and tell me about your experience working with blueprints and construction site safety?';
        } else if (userProfile.enfoque_industria === 'tecnologia') {
          initialQuestion = 'Welcome! Thanks for joining this technical interview. Could you introduce yourself and describe your experience with databases and production software deployments?';
        } else if (userProfile.enfoque_industria === 'negocios') {
          initialQuestion = 'Hello, welcome to this business interview. Please tell me a bit about your experience writing professional emails and managing client negotiations.';
        }

        setCurrentQuestion(initialQuestion);

        // Cargar XP desde historial
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
        console.error('Error loading simulator profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [router]);

  // Inicializar Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        rec.onerror = (e: any) => {
          console.error('Speech Recognition Error:', e);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

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

  // Escuchar la pregunta por Text-To-Speech (TTS)
  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta Speech Recognition (Te recomendamos Google Chrome).');
      return;
    }
    setTranscript('');
    setIsRecording(true);
    recognitionRef.current.start();
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Enviar respuesta técnica a calificar y obtener siguiente pregunta
  const submitAnswer = async () => {
    if (!transcript.trim()) return;
    
    stopVoiceRecording();
    setApiLoading(true);
    setEvaluation(null);

    const updatedMessages = [
      ...messages,
      { role: 'assistant', content: currentQuestion },
      { role: 'user', content: transcript }
    ];

    try {
      const res = await fetch('/api/interview/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          userProfile: profile,
          previousAnswer: transcript
        })
      });

      const data = await res.json();
      if (res.ok && data) {
        setEvaluation(data);
        setCurrentQuestion(data.next_question);
        setMessages(updatedMessages);
        
        if (data.score_impact) {
          setScoreHistory(prev => [...prev, data.score_impact]);
          
          // Registrar XP (+15 XP por completar respuesta evaluada en simulación)
          const earned = data.score_impact >= 60;
          await supabase.from('historial_practicas').insert([
            {
              user_id: profile?.id,
              tipo_practica: 'chat_tutor',
              ejercicio: `AI Interview: ${currentQuestion.slice(0, 30)}...`,
              resultado: earned ? 'aprobado' : 'corregido',
              retroalimentacion: JSON.stringify({ score: data.score_impact })
            }
          ]);
          setXp(prev => prev + 15);
        }

        // Narrar la siguiente pregunta de inmediato
        speakQuestion(data.next_question);

        // Limpiar el cuadro de texto para la siguiente pregunta
        setTranscript('');
      } else {
        alert(data.error || 'Ocurrió un error al enviar tu respuesta.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el evaluador de IA.');
    } finally {
      setApiLoading(false);
    }
  };

  const xpProgress = getXPProgress();
  const averageScore = scoreHistory.length > 0 
    ? Math.round(scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Iniciando simulador de entrevistas técnicas...</p>
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
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-white/5 border border-white/5 text-white transition-all block"
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
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative flex flex-col justify-between">
        
        {/* Glow de Fondo */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-900/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="w-full max-w-4xl mx-auto space-y-8">
          
          {/* Cabecera */}
          <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-outfit text-3xl font-black text-white flex items-center gap-2">
                <Mic className="w-8 h-8 text-purple-400" />
                Simulador de Entrevista de Trabajo AI
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Practica tu inglés conversacional respondiendo oralmente. El sistema escuchará pacientemente sin interrumpirte y te dará feedback exacto de cada frase.
              </p>
            </div>

            {/* Marcador de Desempeño */}
            {scoreHistory.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-center shrink-0 flex items-center gap-4">
                <div>
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Preguntas</span>
                  <span className="font-outfit font-black text-base text-cyan-400">{scoreHistory.length}</span>
                </div>
                <div className="border-l border-white/5 pl-4">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Promedio</span>
                  <span className="font-outfit font-black text-base text-purple-400">{averageScore}%</span>
                </div>
              </div>
            )}
          </div>

          {/* CUADRO DE DIÁLOGO ACTIVO */}
          <div className="grid md:grid-cols-5 gap-6">
            
            {/* Panel de Pregunta y Entrada */}
            <div className="md:col-span-3 space-y-6">
              
              {/* Tarjeta de Pregunta actual */}
              <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/30 shadow-xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none -z-10" />
                
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Entrevistador Técnico
                  </span>
                  <button 
                    onClick={() => speakQuestion(currentQuestion)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer flex items-center gap-1.5 text-[9px] font-bold"
                    title="Escuchar Pregunta"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Escuchar
                  </button>
                </div>

                <p className="font-outfit font-bold text-base text-white leading-relaxed">
                  "{currentQuestion}"
                </p>
              </div>

              {/* Dictador por Voz No Interruptivo */}
              <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/10 backdrop-blur-md space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
                    Dictado por Voz de tu Respuesta
                  </h3>
                  {isRecording && (
                    <span className="text-[10px] font-semibold text-red-400 animate-pulse uppercase tracking-wider">
                      Escuchando en vivo sin interrumpir...
                    </span>
                  )}
                </div>

                {/* Transcripción en vivo */}
                <div className="relative">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Haz clic en 'Grabar Respuesta' y empieza a hablar en inglés con naturalidad... O escribe directamente aquí."
                    className="w-full h-32 p-4 bg-black/40 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none transition-all font-semibold resize-none"
                  />
                  
                  {isRecording && (
                    <div className="absolute inset-0 bg-purple-950/5 border border-purple-500/10 rounded-2xl flex items-center justify-center backdrop-blur-[1px] pointer-events-none animate-pulse">
                      <p className="text-[10px] text-purple-300 font-bold select-none uppercase tracking-wider">
                        🎤 Grabando respuesta... Habla ahora.
                      </p>
                    </div>
                  )}
                </div>

                {/* Controles de Entrada */}
                <div className="flex flex-wrap gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startVoiceRecording}
                      disabled={apiLoading}
                      className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-white/5 uppercase tracking-wider"
                    >
                      <Mic className="w-4 h-4 text-white" />
                      Grabar Respuesta
                    </button>
                  ) : (
                    <button
                      onClick={stopVoiceRecording}
                      className="px-5 py-3 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-white/5 uppercase tracking-wider"
                    >
                      <MicOff className="w-4 h-4 text-white animate-bounce" />
                      Detener Grabación
                    </button>
                  )}

                  <button
                    onClick={submitAnswer}
                    disabled={apiLoading || !transcript.trim()}
                    className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-purple-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-white/5 uppercase tracking-wider shrink-0"
                  >
                    {apiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        Enviar y Evaluar
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* Panel de Evaluación e Historial */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Esqueleto de Carga */}
              {apiLoading && (
                <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/10 text-center space-y-4 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 mx-auto animate-bounce flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Evaluando Respuesta</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                    El tutor de IA está verificando tu estructura lingüística y preparando la siguiente pregunta técnica en caliente...
                  </p>
                </div>
              )}

              {/* Tarjeta de Feedback en Caliente */}
              {evaluation && !apiLoading && (
                <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/20 backdrop-blur-md shadow-xl space-y-6 animate-fade-in-up">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Feedback del Reclutador
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      evaluation.score_impact >= 60 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      Puntaje: {evaluation.score_impact}/100
                    </span>
                  </div>

                  {/* Comentario Socrático */}
                  <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                    {evaluation.feedback}
                  </p>

                  {/* Correcciones Gramaticales */}
                  {evaluation.grammar_corrections && evaluation.grammar_corrections.length > 0 ? (
                    <div className="space-y-4">
                      <span className="block text-[8px] font-bold text-red-400 uppercase tracking-widest">Correcciones Detalladas</span>
                      
                      <div className="space-y-3">
                        {evaluation.grammar_corrections.map((corr, idx) => (
                          <div key={idx} className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold text-slate-500 uppercase block">Dijiste:</span>
                              <p className="text-[10px] text-red-400 line-through font-semibold">"{corr.original}"</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold text-cyan-400 uppercase block">Corrección:</span>
                              <p className="text-[10px] text-emerald-400 font-bold">"{corr.correction}"</p>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                              💡 {corr.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <p className="text-[10px] text-emerald-400 font-bold">
                        ¡Excelente gramática! No se detectaron errores de importancia en tu respuesta.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Guía Rápida */}
              {!evaluation && !apiLoading && (
                <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/10 backdrop-blur-md space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    Didáctica de Voz a Texto
                  </h3>
                  <ul className="space-y-2 text-[10px] text-slate-400 leading-relaxed font-semibold">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>No te preocupes por hablar perfectamente; el sistema está diseñado para ayudarte a perder el miedo.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>Hablamos en bloques enteros: grabas la respuesta y la envías cuando consideres que has terminado de dar tu explicación.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>Cada envío te otorga <strong>+15 XP</strong> permanentes en el sistema para tu ranquin y nivel.</span>
                    </li>
                  </ul>
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
