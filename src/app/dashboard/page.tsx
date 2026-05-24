'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, 
  User, 
  BookOpen, 
  Sparkles, 
  Layers, 
  MessageSquare, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  Lightbulb, 
  Play,
  HelpCircle,
  Construction,
  Cpu,
  LineChart,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  nivel_cefr: string;
  enfoque_industria: 'general' | 'construccion' | 'tecnologia' | 'negocios';
  role: string;
}

interface GlossaryWord {
  id: string;
  palabra: string;
  categoria: string;
  traduccion: string;
  pronunciacion: string;
  ejemplo_ingles: string;
  ejemplo_espanol: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [glossary, setGlossary] = useState<GlossaryWord[]>([]);
  const [tasks, setTasks] = useState<{ id: string; original: string; completed: boolean }[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLogoUrl(localStorage.getItem('lingobridge_logo'));
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // 1. Obtener usuario de Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // 2. Consultar perfil en Supabase DB
        const { data: userProfile, error: profileError } = await supabase
          .from('perfiles_usuario')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !userProfile) {
          // Si el perfil falla, forzar creación o logout
          router.push('/login');
          return;
        }

        setProfile(userProfile);

        // 3. Consultar glosario específico de la industria del estudiante
        const { data: words, error: glossaryError } = await supabase
          .from('glosario_terminos')
          .select('*')
          .eq('industria', userProfile.enfoque_industria)
          .limit(3);

        if (!glossaryError && words) {
          setGlossary(words);
        }

        // 4. Consultar oraciones de tarea del estudiante
        const { data: savedTasks, error: tasksError } = await supabase
          .from('oraciones_guardadas')
          .select('id, oracion_original, completada')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!tasksError && savedTasks) {
          setTasks(
            savedTasks.map(t => ({
              id: t.id,
              original: t.oracion_original,
              completed: t.completada
            }))
          );
        }

      } catch (err) {
        console.error('Error fetching student data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput || !profile) return;
    setAddingTask(true);

    try {
      const { data, error } = await supabase
        .from('oraciones_guardadas')
        .insert([
          {
            user_id: profile.id,
            oracion_original: newTaskInput,
            dificultad: 'media',
            completada: false
          }
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setTasks([
          { id: data[0].id, original: data[0].oracion_original, completed: false },
          ...tasks
        ]);
        setNewTaskInput('');
      }
    } catch (err) {
      console.error('Error al guardar oración de tarea:', err);
    } finally {
      setAddingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Cargando tu aula digital premium...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* MENÚ LATERAL PERSISTENTE (SIDEBAR) */}
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
                    AULA DIGITAL ESTUDIANTE
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Tarjeta Perfil Rápido */}
          {profile && (
            <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                {profile.enfoque_industria === 'construccion' ? (
                  <Construction className="w-5 h-5 text-purple-300" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-xs text-white truncate">{profile.nombre}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-cyan-500/20 border border-cyan-400/20 text-cyan-300">
                    Nivel {profile.nivel_cefr}
                  </span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate">
                    {profile.enfoque_industria}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Enlaces de Navegación */}
          <nav className="space-y-2">
            <Link 
              href="/dashboard" 
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 bg-white/5 border border-white/5 text-white transition-all"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              Panel de Control
            </Link>
            <Link 
              href="/deconstructor" 
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              Deconstructor Visual
            </Link>
            
            <Link 
              href="/dashboard/challenges" 
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              Tareas Evaluadas por IA
            </Link>
          </nav>
        </div>

        {/* Botón Logout */}
        <button 
          onClick={handleLogout}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-500/10 transition-all mt-8 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </aside>

      {/* PANEL CENTRAL PRINCIPAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
        {/* Resplandores decorativos */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-900/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Saludo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-white/5">
          <div>
            <h1 className="font-outfit text-3xl font-black text-white">
              ¡Hola, {profile?.nombre.split(' ')[0]}!
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Bienvenido de nuevo a tu aula virtual. Tienes glosarios de **{profile?.enfoque_industria === 'construccion' ? 'Construcción' : profile?.enfoque_industria}** listos para practicar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Estado de tu cuenta:</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-400/20 text-emerald-300 flex items-center gap-1.5 animate-pulse">
              <Check className="w-3.5 h-3.5" /> Estudiante Activo
            </span>
          </div>
        </div>

        {/* TARJETAS DE MÓDULOS CORE */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          
          {/* Tarjeta Deconstructor sintáctico */}
          <div className="p-6 rounded-2xl border border-purple-500/20 bg-purple-950/5 hover:border-purple-500/30 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-300">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Actividad Interactiva</span>
              </div>
              <h3 className="font-outfit font-extrabold text-lg text-white mb-2 group-hover:text-purple-300 transition-colors">
                Deconstructor Visual de Sintaxis
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Ingresa oraciones de tu tarea o de tus clases del SENA. El sistema las deconstruirá visualmente en bloques de colores para que las desarmes, juegues a reordenarlas y entiendas de verdad su gramática sin trucos fáciles de traductores.
              </p>
            </div>
            <Link 
              href="/deconstructor"
              className="py-3 px-4 rounded-xl bg-purple-600 text-white font-bold text-sm text-center hover:bg-purple-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/10"
            >
              Abrir Deconstructor
              <Play className="w-3.5 h-3.5 fill-white" />
            </Link>
          </div>

          {/* Tarjeta Tutor Socrático */}
          <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/5 hover:border-cyan-500/30 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center text-cyan-300">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Coach IA Socrático</span>
              </div>
              <h3 className="font-outfit font-extrabold text-lg text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Tutor Socrático de Conversación
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                ¿Tienes dudas sobre alguna tarea o quieres practicar inglés aplicado a tu sector? Chatea con tu Coach IA. Te guiará socráticamente dándote pistas y ejemplos adaptados a tu ritmo sin darte la solución de una vez.
              </p>
            </div>
            <Link 
              href="/deconstructor?tab=chat"
              className="py-3 px-4 rounded-xl bg-cyan-600 text-white font-bold text-sm text-center hover:bg-cyan-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/10"
            >
              Hablar con mi Tutor
              <MessageSquare className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

        {/* SECCIÓN GLOSARIO E HILO DE TAREAS */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Mis Oraciones/Tareas a Deconstruir (2/3 de ancho en lg) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20">
              <h3 className="font-outfit font-extrabold text-md text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Registrar mis Tareas Escolares (SENA)
              </h3>
              
              {/* Formulario rápido para añadir tarea */}
              <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
                <input 
                  type="text"
                  required
                  placeholder="Ej: El contratista necesita el concreto mañana"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-600 text-white font-medium"
                />
                <button 
                  type="submit"
                  disabled={addingTask}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {addingTask ? 'Registrando...' : 'Registrar'}
                </button>
              </form>

              {/* Listado de Oraciones */}
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No has registrado ninguna tarea aún. Escribe arriba una oración para desarmarla.</p>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="p-4 rounded-xl border border-white/5 bg-black/20 flex justify-between items-center gap-4"
                    >
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-slate-200 truncate">"{task.original}"</p>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Ingresado por ti</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.completed ? (
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/10 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Completada
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/10 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Pendiente
                          </span>
                        )}
                        <Link 
                          href={`/deconstructor?task=${encodeURIComponent(task.original)}`}
                          className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 border border-purple-500/20 transition-all flex items-center justify-center"
                          title="Deconstruir Oración"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Glosario de Oficio Técnico */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-900/10 rounded-full blur-2xl -z-10" />
              
              <h3 className="font-outfit font-extrabold text-md text-white mb-1 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-cyan-400" />
                Vocabulario del Día
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {profile?.enfoque_industria === 'construccion' ? 'CONSTRUCCIÓN (SENA)' : 'TECNOLOGÍA'}
              </p>

              <div className="mt-5 space-y-4">
                {glossary.map((word) => (
                  <div key={word.id} className="pb-3 border-b border-white/5 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{word.palabra}</span>
                      <span className="text-[9px] text-cyan-400 font-bold px-1.5 py-0.2 bg-cyan-950/20 border border-cyan-500/10 rounded">{word.pronunciacion}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{word.traduccion}</span>
                    <span className="text-[10px] text-slate-500 italic block mt-1">Ex: "{word.ejemplo_ingles}"</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
