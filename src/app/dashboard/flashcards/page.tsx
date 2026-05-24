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
  Volume2, 
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
  RotateCcw,
  Sparkle
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  nivel_cefr: string;
  enfoque_industria: 'general' | 'construccion' | 'tecnologia' | 'negocios';
}

interface GlossaryWord {
  id: string;
  palabra: string;
  categoria: string;
  traduccion: string;
  pronunciacion: string;
  ejemplo_ingles: string;
  ejemplo_espanol: string;
  industria: string;
  nivel_cefr: string;
}

export default function FlashcardsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);

  // Estados de Flashcards
  const [allWords, setAllWords] = useState<GlossaryWord[]>([]);
  const [studyDeck, setStudyDeck] = useState<GlossaryWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({ easy: 0, medium: 0, hard: 0 });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [deckType, setDeckType] = useState<'favorites' | 'industry' | 'all'>('favorites');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(localStorage.getItem('lingobridge_logo'));
    }
  }, []);

  // Cargar perfil y diccionario de Supabase
  useEffect(() => {
    const loadData = async () => {
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

        // Cargar todo el glosario
        const { data: glossary, error: glossaryError } = await supabase
          .from('glosario_terminos')
          .select('*');

        if (!glossaryError && glossary) {
          setAllWords(glossary);
          
          // Leer favoritos de localStorage
          const favsStr = localStorage.getItem('lingobridge_favorites');
          let favsList: string[] = [];
          if (favsStr) {
            try {
              favsList = JSON.parse(favsStr);
            } catch (e) {
              console.error(e);
            }
          }

          // Filtrar favoritos
          const favWords = glossary.filter(w => favsList.includes(w.id));
          if (favWords.length > 0) {
            setStudyDeck(favWords);
            setDeckType('favorites');
          } else {
            // Si no hay favoritos, cargar por defecto el vocabulario de su sector
            const industryWords = glossary.filter(w => w.industria === userProfile.enfoque_industria);
            if (industryWords.length > 0) {
              setStudyDeck(industryWords);
              setDeckType('industry');
            } else {
              setStudyDeck(glossary);
              setDeckType('all');
            }
          }
        }

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
        console.error('Error in Flashcards:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const changeDeckType = (type: 'favorites' | 'industry' | 'all') => {
    setDeckType(type);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    if (type === 'favorites') {
      const favsStr = localStorage.getItem('lingobridge_favorites');
      let favsList: string[] = [];
      if (favsStr) {
        try {
          favsList = JSON.parse(favsStr);
        } catch (e) {
          console.error(e);
        }
      }
      const favWords = allWords.filter(w => favsList.includes(w.id));
      setStudyDeck(favWords);
    } else if (type === 'industry') {
      const industryWords = allWords.filter(w => w.industria === profile?.enfoque_industria);
      setStudyDeck(industryWords);
    } else {
      setStudyDeck(allWords);
    }
  };

  const addXP = async (amount: number) => {
    if (!profile) return;
    const newXP = xp + amount;
    setXp(newXP);

    // Guardar una práctica completada para que se refleje permanentemente la XP en Supabase
    try {
      await supabase.from('historial_practicas').insert([
        {
          user_id: profile.id,
          tipo_practica: 'glosario',
          ejercicio: 'Flashcards Mastered Word',
          resultado: 'aprobado',
          retroalimentacion: JSON.stringify({ score: 100 })
        }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSrsAction = (srsType: 'again' | 'hard' | 'medium' | 'easy') => {
    setIsFlipped(false);

    // Estadísticas
    if (srsType === 'easy') {
      setStats(prev => ({ ...prev, easy: prev.easy + 1 }));
      addXP(10); // +10 XP por dominar palabra fácil
    } else if (srsType === 'medium') {
      setStats(prev => ({ ...prev, medium: prev.medium + 1 }));
      addXP(5); // +5 XP por palabra intermedia
    } else if (srsType === 'hard') {
      setStats(prev => ({ ...prev, hard: prev.hard + 1 }));
    }

    setTimeout(() => {
      if (srsType === 'again') {
        // Enviar palabra actual al final de la baraja para volverla a estudiar pronto
        const currentWord = studyDeck[currentIndex];
        const nextDeck = [...studyDeck];
        nextDeck.splice(currentIndex, 1); // Quitar de su lugar
        nextDeck.push(currentWord); // Agregar al final
        setStudyDeck(nextDeck);
      } else {
        // Continuar a la siguiente
        setCurrentIndex(prev => prev + 1);
      }
    }, 250);
  };

  const xpProgress = getXPProgress();
  const activeWord = studyDeck[currentIndex];
  const hasFinishedDeck = currentIndex >= studyDeck.length && studyDeck.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Cargando baraja de repetición espaciada...</p>
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
                  <UserIcon industry={profile.enfoque_industria} />
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
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-white/5 border border-white/5 text-white transition-all block"
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
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative flex flex-col items-center justify-between">
        
        {/* Glow de Fondo */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-900/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="w-full max-w-2xl space-y-6">
          
          {/* Cabecera */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-4 w-full">
            <div>
              <h1 className="font-outfit text-2xl font-black text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                Estudio Activo: Flashcards SRS
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Aprende de forma interactiva con el método de repetición espaciada de SuperMemo.
              </p>
            </div>

            {/* Selección de Baraja */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/5">
              <button 
                onClick={() => changeDeckType('favorites')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  deckType === 'favorites' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⭐ Favoritos
              </button>
              <button 
                onClick={() => changeDeckType('industry')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  deckType === 'industry' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏗️ Sector
              </button>
              <button 
                onClick={() => changeDeckType('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  deckType === 'all' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                📖 Todos
              </button>
            </div>
          </div>

          {/* Estado de Vacío */}
          {studyDeck.length === 0 ? (
            <div className="w-full p-12 rounded-3xl border border-white/5 bg-slate-900/10 text-center space-y-4 shadow-2xl backdrop-blur-md">
              <Star className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-outfit font-bold text-base text-white">Baraja de Favoritos vacía</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Marca palabras con una estrella en el Glosario Técnico para agregarlas a tu baraja personal de estudio de repetición espaciada.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Link
                  href="/dashboard/glossary"
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs font-bold text-slate-350 hover:bg-white/5 transition-all block"
                >
                  Ir al Glosario
                </Link>
                <button
                  onClick={() => changeDeckType('industry')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl text-xs font-bold transition-all hover:opacity-90 shadow-lg cursor-pointer"
                >
                  Estudiar Vocabulario de Sector
                </button>
              </div>
            </div>
          ) : hasFinishedDeck ? (
            /* Pantalla final de sesión terminada */
            <div className="w-full p-10 rounded-3xl border border-white/5 bg-slate-900/20 text-center space-y-6 shadow-2xl backdrop-blur-md relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none -z-10" />
              
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
                <Sparkle className="w-8 h-8 text-white animate-spin-slow" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-outfit font-black text-2xl text-white">¡Sesión de Flashcards Completada!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Has repasado exitosamente toda tu baraja de estudio. Tu memoria de largo plazo te lo agradecerá en tu próximo proyecto técnico.
                </p>
              </div>

              {/* Estadísticas de sesión */}
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto p-4 rounded-2xl bg-black/40 border border-white/5 text-center">
                <div>
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Fáciles</span>
                  <span className="font-outfit font-black text-lg text-emerald-400">{stats.easy}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Medios</span>
                  <span className="font-outfit font-black text-lg text-cyan-400">{stats.medium}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Difíciles</span>
                  <span className="font-outfit font-black text-lg text-amber-500">{stats.hard}</span>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setCurrentIndex(0);
                    setStats({ easy: 0, medium: 0, hard: 0 });
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-2 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Repasar Otra Vez
                </button>
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer transition-all block"
                >
                  Ir al Dashboard
                </Link>
              </div>
            </div>
          ) : (
            /* Render de Flashcard Activa con Giro 3D */
            <div className="space-y-8 w-full">
              
              {/* Barra de Progreso */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Progreso de Baraja</span>
                  <span>{currentIndex + 1} de {studyDeck.length} Tarjetas</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / studyDeck.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* CARD DE GIRO 3D */}
              <div 
                className="perspective-1000 w-full h-[320px] cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div 
                  className={`relative w-full h-full duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                >
                  {/* CARA ANVERSO (Front) */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-8 flex flex-col justify-between shadow-2xl backdrop-blur-md">
                    <div className="flex justify-between items-center">
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/10`}>
                        {activeWord.industria} ({activeWord.nivel_cefr})
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{activeWord.categoria}</span>
                    </div>

                    <div className="text-center space-y-2">
                      <h2 className="font-outfit font-black text-4xl text-white tracking-tight drop-shadow-md select-none">
                        {activeWord.palabra}
                      </h2>
                      <span className="inline-block text-xs font-bold text-cyan-400 tracking-widest">{activeWord.pronunciacion}</span>
                    </div>

                    <div className="text-center text-[10px] text-slate-500 font-semibold select-none flex items-center justify-center gap-1.5 hover:text-white transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Haz clic para revelar la traducción
                    </div>
                  </div>

                  {/* CARA REVERSO (Back) */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl border border-cyan-500/20 bg-slate-950/60 p-8 flex flex-col justify-between shadow-2xl backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none -z-10" />

                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{activeWord.categoria}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(activeWord.palabra);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-all flex items-center justify-center cursor-pointer"
                        title="Escuchar"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-center space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Traducción</span>
                      <h3 className="font-outfit font-black text-2xl text-cyan-400 tracking-tight">
                        {activeWord.traduccion}
                      </h3>
                    </div>

                    <div className="border-t border-white/5 pt-4 space-y-2 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] text-slate-350 italic font-semibold leading-relaxed">
                          En: "{activeWord.ejemplo_ingles}"
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudio(activeWord.ejemplo_ingles);
                          }}
                          className="text-[9px] text-slate-500 hover:text-cyan-400 shrink-0"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                        Es: "{activeWord.ejemplo_espanol}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTROLES SRS (MÉTODO DE MEMORIZACIÓN) */}
              {isFlipped && (
                <div className="space-y-3 animate-fade-in-up">
                  <span className="block text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">¿Qué tan fácil te resultó recordar esta palabra?</span>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleSrsAction('again')}
                      className="px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-950/10 text-red-400 hover:bg-red-900/20 transition-all text-[11px] font-bold text-center cursor-pointer"
                    >
                      🔴 Re-estudiar
                    </button>
                    <button
                      onClick={() => handleSrsAction('hard')}
                      className="px-3 py-2.5 rounded-xl border border-amber-500/20 bg-amber-950/10 text-amber-400 hover:bg-amber-900/20 transition-all text-[11px] font-bold text-center cursor-pointer"
                    >
                      🟡 Difícil
                    </button>
                    <button
                      onClick={() => handleSrsAction('medium')}
                      className="px-3 py-2.5 rounded-xl border border-blue-500/20 bg-blue-950/10 text-blue-400 hover:bg-blue-900/20 transition-all text-[11px] font-bold text-center cursor-pointer"
                    >
                      🔵 Medio
                    </button>
                    <button
                      onClick={() => handleSrsAction('easy')}
                      className="px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 text-emerald-400 hover:bg-emerald-900/20 transition-all text-[11px] font-bold text-center cursor-pointer"
                    >
                      🟢 Fácil
                    </button>
                  </div>
                </div>
              )}

              {!isFlipped && (
                <button
                  onClick={() => setIsFlipped(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 rounded-xl font-bold text-xs text-white shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all border border-white/5 uppercase tracking-wider"
                >
                  <RotateCcw className="w-4 h-4 animate-spin-slow" />
                  Revelar traducción
                </button>
              )}

            </div>
          )}

        </div>

        {/* CSS Personalizado para giros 3D en Next.js */}
        <style jsx global>{`
          .perspective-1000 {
            perspective: 1000px;
          }
          .transform-style-3d {
            transform-style: preserve-3d;
          }
          .backface-hidden {
            backface-visibility: hidden;
          }
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
          .animate-spin-slow {
            animation: spin 6s linear infinite;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 999px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.15);
          }
        `}</style>
      </main>

    </div>
  );
}

function UserIcon({ industry }: { industry: string }) {
  if (industry === 'construccion') {
    return <svg className="w-4.5 h-4.5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
  }
  return <svg className="w-4.5 h-4.5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
