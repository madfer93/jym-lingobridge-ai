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
  Search,
  Filter,
  User,
  LogOut,
  Construction,
  Cpu,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Star,
  Users,
  BarChart3,
  Mail,
  Mic
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

export default function GlossaryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);

  // Datos de Glosario
  const [words, setWords] = useState<GlossaryWord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Logo Dinámico
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(localStorage.getItem('lingobridge_logo'));
      
      const favs = localStorage.getItem('lingobridge_favorites');
      if (favs) {
        try {
          setFavorites(JSON.parse(favs));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const toggleFavorite = (id: string) => {
    const nextFavs = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    setFavorites(nextFavs);
    localStorage.setItem('lingobridge_favorites', JSON.stringify(nextFavs));
  };

  useEffect(() => {
    const loadGlossaryData = async () => {
      setLoading(true);
      try {
        // 1. Obtener usuario
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // 2. Obtener perfil
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
        // Pre-seleccionar la industria del estudiante por defecto
        setSelectedIndustry(userProfile.enfoque_industria);

        // 3. Obtener Glosario Completo
        const { data: allWords, error: glossaryError } = await supabase
          .from('glosario_terminos')
          .select('*')
          .order('palabra', { ascending: true });

        if (!glossaryError && allWords) {
          setWords(allWords);
        }

        // 4. Calcular XP desde historial
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
        console.error('Error loading glossary view:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGlossaryData();
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

  // Filtrado reactivo en el cliente
  const filteredWords = words.filter(word => {
    const matchesSearch = 
      word.palabra.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.traduccion.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesIndustry = 
      selectedIndustry === 'all' || 
      word.industria === selectedIndustry;
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      word.categoria === selectedCategory;

    const matchesFavorites = !showFavoritesOnly || favorites.includes(word.id);

    return matchesSearch && matchesIndustry && matchesCategory && matchesFavorites;
  });

  const xpProgress = getXPProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Abriendo diccionario técnico contextualizado...</p>
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
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Award className="w-4 h-4 text-cyan-400" />
              Examen & Certificado
            </Link>
            <Link 
              href="/dashboard/glossary" 
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-white/5 border border-white/5 text-white transition-all block"
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
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-900/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Cabecera */}
          <div className="pb-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-outfit text-3xl font-black text-white flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-cyan-400" />
                Glosario Técnico Contextualizado
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Explora y busca todos los términos técnicos programados en la plataforma. Escucha la pronunciación correcta en audio y estudia sus ejemplos de uso laboral.
              </p>
            </div>
            {favorites.length > 0 && (
              <Link 
                href="/dashboard/flashcards"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-purple-500/10 transition-all shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-350 animate-pulse" />
                Estudiar Flashcards ({favorites.length})
              </Link>
            )}
          </div>

          {/* Selector de Vista: Todos vs Favoritos */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFavoritesOnly(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                !showFavoritesOnly 
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                  : 'bg-transparent border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Todos los términos
            </button>
            <button
              onClick={() => setShowFavoritesOnly(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                showFavoritesOnly 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-transparent border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              Favoritos ({favorites.length})
            </button>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTRADO */}
          <div className="grid md:grid-cols-4 gap-4 p-5 rounded-2xl border border-white/5 bg-slate-900/20">
            {/* Buscador */}
            <div className="md:col-span-2 relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar palabra o traducción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-600 text-white font-medium"
              />
            </div>

            {/* Filtrado de Sector */}
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-4 h-4 text-slate-500" />
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs focus:border-cyan-500 focus:outline-none transition-all text-slate-350 font-semibold cursor-pointer appearance-none"
              >
                <option value="all">Todas las Áreas</option>
                <option value="construccion">Construcción / Obra</option>
                <option value="tecnologia">Tecnología / Software</option>
                <option value="negocios">Negocios y Administración</option>
              </select>
            </div>

            {/* Filtrado de Categoría Gramatical */}
            <div className="relative flex items-center">
              <Filter className="absolute left-3 w-4 h-4 text-slate-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs focus:border-cyan-500 focus:outline-none transition-all text-slate-350 font-semibold cursor-pointer appearance-none"
              >
                <option value="all">Todas las categorías</option>
                <option value="sustantivo">Sustantivos</option>
                <option value="verbo">Verbos</option>
                <option value="adjetivo">Adjetivos</option>
                <option value="frase">Frases comunes</option>
              </select>
            </div>
          </div>

          {/* DICCIONARIO GRID */}
          {filteredWords.length === 0 ? (
            <div className="p-12 rounded-2xl border border-white/5 bg-slate-900/10 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-slate-400 text-sm font-semibold">No se encontraron términos técnicos.</p>
              <p className="text-slate-600 text-xs">Intenta modificando tus filtros o ingresando otra búsqueda.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWords.map((word) => (
                <div 
                  key={word.id}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 hover:border-cyan-500/20 hover:bg-slate-900/30 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        word.industria === 'construccion' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' 
                        : word.industria === 'tecnologia'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                      }`}>
                        {word.industria} ({word.nivel_cefr})
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{word.categoria}</span>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-outfit font-black text-base text-white group-hover:text-cyan-400 transition-colors">
                          {word.palabra}
                        </h3>
                        <span className="text-[10px] text-cyan-500/80 font-bold tracking-widest">{word.pronunciacion}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleFavorite(word.id)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-450 hover:text-amber-400 transition-all flex items-center justify-center cursor-pointer shrink-0"
                          title={favorites.includes(word.id) ? "Quitar de Favoritos" : "Marcar como Favorito"}
                        >
                          <Star className={`w-3.5 h-3.5 ${favorites.includes(word.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => playAudio(word.palabra)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-all flex items-center justify-center cursor-pointer shrink-0"
                          title="Escuchar Pronunciación"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs font-semibold">
                      {word.traduccion}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-[10px] text-slate-400 italic leading-relaxed">
                        En: "{word.ejemplo_ingles}"
                      </p>
                      <button
                        onClick={() => playAudio(word.ejemplo_ingles)}
                        className="text-[9px] text-slate-500 hover:text-cyan-400 flex items-center gap-0.5 cursor-pointer shrink-0"
                        title="Escuchar Oración"
                      >
                        <Volume2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-relaxed">
                      Es: "{word.ejemplo_espanol}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
