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
  Clipboard,
  FileText,
  Clock,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  nivel_cefr: string;
  enfoque_industria: 'general' | 'construccion' | 'tecnologia' | 'negocios';
}

interface MailerResult {
  formal: string;
  casual: string;
  urgent: string;
}

export default function SaaSMailer() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);

  // Estados de Mailer
  const [idea, setIdea] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [emails, setEmails] = useState<MailerResult | null>(null);
  const [copiedTone, setCopiedTone] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(localStorage.getItem('lingobridge_logo'));
    }
  }, []);

  // Cargar Perfil
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

        // Pre-cargar ideas de borrador según industria
        let placeholderIdea = 'Quiero pedirle al arquitecto que revise el vaciado de concreto porque hay fisuras.';
        if (userProfile.enfoque_industria === 'tecnologia') {
          placeholderIdea = 'Necesito avisarle al cliente que el despliegue del servidor se retrasará 2 horas por un bug en la base de datos.';
        } else if (userProfile.enfoque_industria === 'negocios') {
          placeholderIdea = 'Quiero enviarle una cotización con descuento comercial a la empresa si cierran el trato esta semana.';
        }
        setIdea(placeholderIdea);

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
        console.error('Error loading mailer profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
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

  // Generar Correos
  const generateEmails = async () => {
    if (!idea.trim()) return;

    setApiLoading(true);
    setEmails(null);
    try {
      const res = await fetch('/api/mailer/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          userProfile: profile
        })
      });

      const data = await res.json();
      if (res.ok && data) {
        setEmails(data);
        // +10 XP al redactar y estructurar correos comerciales en caliente
        try {
          await supabase.from('historial_practicas').insert([
            {
              user_id: profile?.id,
              tipo_practica: 'glosario',
              ejercicio: 'Redacción de Correo SaaS Mailer',
              resultado: 'aprobado',
              retroalimentacion: JSON.stringify({ score: 95 })
            }
          ]);
          setXp(prev => prev + 10);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert(data.error || 'No se pudo generar las redacciones.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al conectar con el asistente de redacción.');
    } finally {
      setApiLoading(false);
    }
  };

  // Copiar al portapapeles
  const handleCopy = (text: string, tone: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTone(tone);
    setTimeout(() => setCopiedTone(null), 2000);
  };

  // Enviar directamente al Deconstructor
  const handleDeconstruct = (text: string) => {
    if (typeof window !== 'undefined') {
      // Limpiar y enviar la primera frase o el cuerpo del email
      const rawText = text.replace(/Subject:.*?\n/gi, '').trim();
      localStorage.setItem('lingobridge_deconstruct_draft', rawText);
      router.push('/deconstructor');
    }
  };

  const xpProgress = getXPProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Abriendo SaaS Mailer comercial...</p>
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
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-white/5 border border-white/5 text-white transition-all block"
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
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-900/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Cabecera */}
          <div className="pb-6 border-b border-white/5">
            <h1 className="font-outfit text-3xl font-black text-white flex items-center gap-2">
              <Mail className="w-8 h-8 text-cyan-400" />
              SaaS Mailer: Asistente Rápido de Correos
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Escribe tus ideas en español o borradores rápidos en inglés técnico. El motor de IA las convertirá instantáneamente en 3 correos comerciales perfectos con tonos Formal, Casual y Urgente.
            </p>
          </div>

          {/* INPUT FORM */}
          <div className="p-6 rounded-3xl border border-white/5 bg-slate-900/10 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              Borrador de Idea / Punto Clave (Español o Inglés)
            </h3>
            
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ej. 'Necesito informarle al arquitecto supervisor que suspenderemos el vertido de hormigón debido a la lluvia fuerte y que reprogramemos para mañana a las 8 am.'"
              className="w-full h-28 p-4 bg-black/40 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-650 focus:border-cyan-500 focus:outline-none transition-all font-semibold resize-none"
            />

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-semibold">
                Cada correo generado te recompensa con <strong>+10 XP</strong> didácticos.
              </span>
              <button
                onClick={generateEmails}
                disabled={apiLoading || !idea.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-white/5 uppercase tracking-wider shrink-0"
              >
                {apiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    Escribiendo Correos...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    Redactar Correos Premium
                  </>
                )}
              </button>
            </div>
          </div>

          {/* LOADING SKELETON */}
          {apiLoading && (
            <div className="grid md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map(n => (
                <div key={n} className="p-5 rounded-2xl border border-white/5 bg-slate-900/10 space-y-4">
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-800 rounded w-3/4" />
                  <div className="h-16 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* DIBUJAR CORREOS GENERADOS */}
          {emails && !apiLoading && (
            <div className="grid lg:grid-cols-3 gap-6 animate-fade-in-up">
              
              {/* TONO 1: FORMAL */}
              <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/30 backdrop-blur-md flex flex-col justify-between space-y-6 relative overflow-hidden shadow-xl">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      Tono Formal
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase">Oficial y Ejecutivo</span>
                  </div>
                  <pre className="text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-text select-all max-h-[220px] overflow-y-auto custom-scrollbar">
                    {emails.formal}
                  </pre>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                  <button
                    onClick={() => handleDeconstruct(emails.formal)}
                    className="text-[9px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Estudiar Estructura
                  </button>
                  <button
                    onClick={() => handleCopy(emails.formal, 'formal')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-all"
                  >
                    {copiedTone === 'formal' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* TONO 2: CASUAL */}
              <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/30 backdrop-blur-md flex flex-col justify-between space-y-6 relative overflow-hidden shadow-xl">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Tono Casual
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase">Equipo y Slack</span>
                  </div>
                  <pre className="text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-text select-all max-h-[220px] overflow-y-auto custom-scrollbar">
                    {emails.casual}
                  </pre>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                  <button
                    onClick={() => handleDeconstruct(emails.casual)}
                    className="text-[9px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Estudiar Estructura
                  </button>
                  <button
                    onClick={() => handleCopy(emails.casual, 'casual')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-all"
                  >
                    {copiedTone === 'casual' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* TONO 3: URGENTE */}
              <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/30 backdrop-blur-md flex flex-col justify-between space-y-6 relative overflow-hidden shadow-xl">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Tono Urgente
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase">Acción y Fechas</span>
                  </div>
                  <pre className="text-[11px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-text select-all max-h-[220px] overflow-y-auto custom-scrollbar">
                    {emails.urgent}
                  </pre>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                  <button
                    onClick={() => handleDeconstruct(emails.urgent)}
                    className="text-[9px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Estudiar Estructura
                  </button>
                  <button
                    onClick={() => handleCopy(emails.urgent, 'urgent')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-all"
                  >
                    {copiedTone === 'urgent' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
