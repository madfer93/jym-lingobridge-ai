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
  Trophy,
  Shield,
  Zap,
  ArrowUp
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  nivel_cefr: string;
  enfoque_industria: 'general' | 'construccion' | 'tecnologia' | 'negocios';
}

interface LeaderboardUser {
  id: string;
  nombre: string;
  xp: number;
  nivel_cefr: string;
  enfoque_industria: string;
  isCurrentUser?: boolean;
}

export default function GlobalLeaderboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);

  // Estados de Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [activeLeague, setActiveLeague] = useState<'all' | 'concrete' | 'binary' | 'platinum'>('all');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(localStorage.getItem('lingobridge_logo'));
    }
  }, []);

  // Cargar perfil y calcular ranking
  useEffect(() => {
    const loadLeaderboardData = async () => {
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

        // 3. Calcular XP del estudiante actual
        const { data: practices } = await supabase
          .from('historial_practicas')
          .select('resultado, retroalimentacion, user_id');

        let currentUserXP = 0;
        const xpMap: Record<string, number> = {};

        if (practices) {
          practices.forEach(p => {
            if (p.resultado === 'aprobado') {
              let practiceXP = 50;
              if (p.retroalimentacion) {
                try {
                  const parsed = JSON.parse(p.retroalimentacion);
                  if (parsed && parsed.score) {
                    practiceXP = parsed.score;
                  }
                } catch (e) {
                  practiceXP = 80;
                }
              }
              xpMap[p.user_id] = (xpMap[p.user_id] || 0) + practiceXP;
            }
          });
          currentUserXP = xpMap[user.id] || 0;
          setXp(currentUserXP);
        }

        // 4. Obtener todos los perfiles registrados
        const { data: allProfiles } = await supabase
          .from('perfiles_usuario')
          .select('id, nombre, nivel_cefr, enfoque_industria');

        // 5. Mapear y complementar con mock-ups si hay pocos estudiantes (para que se sienta competitivo)
        let dbLeaderboard: LeaderboardUser[] = (allProfiles || []).map(p => ({
          id: p.id,
          nombre: p.nombre,
          xp: xpMap[p.id] || 25, // XP base
          nivel_cefr: p.nivel_cefr,
          enfoque_industria: p.enfoque_industria,
          isCurrentUser: p.id === user.id
        }));

        // Garantizar estudiantes mock para la tabla de clasificación interactiva
        const mockUsers: LeaderboardUser[] = [
          { id: 'm1', nombre: 'Ing. Carlos Gómez 🏗️', xp: 420, nivel_cefr: 'B2', enfoque_industria: 'construccion' },
          { id: 'm2', nombre: 'Laura Dev 💻', xp: 350, nivel_cefr: 'B2', enfoque_industria: 'tecnologia' },
          { id: 'm3', nombre: 'Manuel Madrid 🧠', xp: 280, nivel_cefr: 'B1', enfoque_industria: 'tecnologia' },
          { id: 'm4', nombre: 'SENA Apprentice 🦾', xp: 140, nivel_cefr: 'A2', enfoque_industria: 'construccion' },
          { id: 'm5', nombre: 'Esteban Sales 📈', xp: 90, nivel_cefr: 'A2', enfoque_industria: 'negocios' }
        ];

        // Mezclar y ordenar
        let combined = [...dbLeaderboard];
        mockUsers.forEach(mu => {
          if (!combined.some(c => c.nombre === mu.nombre)) {
            combined.push(mu);
          }
        });

        // Asegurar que el usuario actual tenga su XP calculada correctamente
        combined = combined.map(c => {
          if (c.isCurrentUser) {
            return { ...c, xp: currentUserXP };
          }
          return c;
        });

        combined.sort((a, b) => b.xp - a.xp);
        setLeaderboard(combined);

      } catch (err) {
        console.error('Error loading leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboardData();
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

  // Clasificación por Ligas
  const filteredUsers = leaderboard.filter(user => {
    if (activeLeague === 'concrete') return user.xp <= 100;
    if (activeLeague === 'binary') return user.xp > 100 && user.xp < 300;
    if (activeLeague === 'platinum') return user.xp >= 300;
    return true;
  });

  const xpProgress = getXPProgress();

  // Encontrar rango actual del estudiante
  const currentRank = leaderboard.findIndex(u => u.isCurrentUser) + 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Calculando clasificaciones en vivo...</p>
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
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 bg-white/5 border border-white/5 text-white transition-all block"
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

        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Cabecera */}
          <div className="pb-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-outfit text-3xl font-black text-white flex items-center gap-2">
                <Trophy className="w-8 h-8 text-amber-400 fill-amber-400 animate-bounce" />
                Ranquin Global de Aprendizaje
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Compite constructivamente con otros estudiantes de J&M Tech Solutions. Gana XP deconstruyendo oraciones y dominando retos conversacionales por IA.
              </p>
            </div>

            {/* Posición del usuario actual */}
            {profile && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-cyan-950/40 border border-purple-500/20 shrink-0 flex items-center gap-3 shadow-lg shadow-purple-500/5">
                <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
                <div>
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Tu Posición</span>
                  <span className="font-outfit font-black text-base text-white">Puesto #{currentRank}</span>
                </div>
              </div>
            )}
          </div>

          {/* SELECTOR DE LIGAS (TABS GAMIFICADAS) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveLeague('all')}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeLeague === 'all' 
                  ? 'bg-purple-600/10 border-purple-500/30 text-purple-300 font-bold shadow-lg shadow-purple-500/5' 
                  : 'bg-slate-900/10 border-white/5 text-slate-450 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Clasificación General</span>
            </button>
            
            <button
              onClick={() => setActiveLeague('concrete')}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeLeague === 'concrete' 
                  ? 'bg-amber-600/10 border-amber-500/30 text-amber-300 font-bold shadow-lg shadow-amber-500/5' 
                  : 'bg-slate-900/10 border-white/5 text-slate-450 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Liga Cemento (0-100 XP)</span>
            </button>

            <button
              onClick={() => setActiveLeague('binary')}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeLeague === 'binary' 
                  ? 'bg-cyan-600/10 border-cyan-500/30 text-cyan-300 font-bold shadow-lg shadow-cyan-500/5' 
                  : 'bg-slate-900/10 border-white/5 text-slate-450 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Liga Binaria (101-299 XP)</span>
            </button>

            <button
              onClick={() => setActiveLeague('platinum')}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeLeague === 'platinum' 
                  ? 'bg-teal-600/10 border-teal-500/30 text-teal-300 font-bold shadow-lg shadow-teal-500/5' 
                  : 'bg-slate-900/10 border-white/5 text-slate-450 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-teal-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Liga Platino (&gt;= 300 XP)</span>
            </button>
          </div>

          {/* TABLA DE POSICIONES */}
          <div className="rounded-3xl border border-white/5 bg-slate-900/15 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    <th className="py-4 px-6 text-center w-16">Puesto</th>
                    <th className="py-4 px-6">Estudiante</th>
                    <th className="py-4 px-6 text-center w-28">Área / Enfoque</th>
                    <th className="py-4 px-6 text-center w-24">Nivel MCER</th>
                    <th className="py-4 px-6 text-right w-32">Experiencia (XP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user, index) => {
                    const originalIndex = leaderboard.findIndex(u => u.id === user.id) + 1;
                    
                    return (
                      <tr 
                        key={user.id}
                        className={`transition-colors hover:bg-white/2 ${
                          user.isCurrentUser ? 'bg-purple-950/20 border-y border-purple-500/20' : ''
                        }`}
                      >
                        {/* Puesto */}
                        <td className="py-4 px-6 text-center font-outfit font-black text-sm">
                          {originalIndex === 1 ? (
                            <span className="inline-flex w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 items-center justify-center text-amber-400" title="1er Puesto Oro">
                              🥇
                            </span>
                          ) : originalIndex === 2 ? (
                            <span className="inline-flex w-7 h-7 rounded-full bg-slate-500/10 border border-slate-500/20 items-center justify-center text-slate-400" title="2do Puesto Plata">
                              🥈
                            </span>
                          ) : originalIndex === 3 ? (
                            <span className="inline-flex w-7 h-7 rounded-full bg-amber-700/10 border border-amber-700/20 items-center justify-center text-amber-600" title="3er Puesto Bronce">
                              🥉
                            </span>
                          ) : (
                            <span className="text-slate-500">#{originalIndex}</span>
                          )}
                        </td>

                        {/* Estudiante */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                              user.isCurrentUser 
                                ? 'bg-gradient-to-br from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20' 
                                : 'bg-slate-800 text-slate-400 border border-white/5'
                            }`}>
                              {user.nombre.charAt(0)}
                            </div>
                            <div>
                              <span className="font-outfit font-bold text-xs text-white flex items-center gap-1.5">
                                {user.nombre}
                                {user.isCurrentUser && (
                                  <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-purple-500/25 border border-purple-500/40 text-purple-300 uppercase tracking-widest animate-pulse">
                                    Tú
                                  </span>
                                )}
                              </span>
                              <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                                {user.xp >= 300 ? 'Rango Élite Platino' : user.xp > 100 ? 'Rango Técnico Binario' : 'Rango Inicial Cemento'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Área */}
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            user.enfoque_industria === 'construccion'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                              : user.enfoque_industria === 'tecnologia'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                          }`}>
                            {user.enfoque_industria}
                          </span>
                        </td>

                        {/* Nivel CEFR */}
                        <td className="py-4 px-6 text-center font-mono font-black text-xs text-cyan-400">
                          {user.nivel_cefr}
                        </td>

                        {/* Experiencia XP */}
                        <td className="py-4 px-6 text-right font-outfit font-black text-sm text-white">
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{user.xp}</span>
                            <span className="text-[10px] text-cyan-500 font-bold">XP</span>
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
