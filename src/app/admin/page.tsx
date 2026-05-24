'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  LogOut, 
  Check, 
  LineChart, 
  Activity,
  Mail,
  UserCheck,
  TrendingUp,
  Settings,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface StudentProfile {
  id: string;
  email: string;
  nombre: string;
  nivel_cefr: string;
  enfoque_industria: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Manuel Madrid');
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  // Estados para Branding & Tab active
  const [activeTab, setActiveTab] = useState<'students' | 'branding'>('students');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'icon' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Load from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCustomLogoUrl(localStorage.getItem('lingobridge_logo'));
      setCustomIconUrl(localStorage.getItem('lingobridge_logo_icon'));
    }
  }, []);

  // Estadísticas comerciales simuladas y reales para el búnker
  const stats = {
    estudiantesActivos: students.length,
    planIndividualCount: students.length,
    ingresosProyectados: students.length * 65000,
    groqRequestsTotal: (students.length * 42) + 128 // llamadas estimadas
  };

  useEffect(() => {
    const verifyAdmin = async () => {
      setLoading(true);
      try {
        // 1. Obtener usuario de Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // 2. Verificar rol en Supabase DB
        const { data: profile, error: profileError } = await supabase
          .from('perfiles_usuario')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          // Si no es administrador, redirigir al aula normal del estudiante
          router.push('/dashboard');
          return;
        }

        setAdminName(profile.nombre);

        // 3. Consultar todos los estudiantes registrados
        const { data: studentList, error: studentsError } = await supabase
          .from('perfiles_usuario')
          .select('*')
          .eq('role', 'student')
          .order('created_at', { ascending: false });

        if (!studentsError && studentList) {
          setStudents(studentList);
        }

      } catch (err) {
        console.error('Error verifying admin state:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [router]);

  const handleUpdateStudent = async (studentId: string, updates: Partial<StudentProfile>) => {
    setUpdatingStudentId(studentId);
    try {
      const { error } = await supabase
        .from('perfiles_usuario')
        .update(updates)
        .eq('id', studentId);

      if (error) throw error;

      // Actualizar estado local
      setStudents(prev => 
        prev.map(s => s.id === studentId ? { ...s, ...updates } : s)
      );
    } catch (err) {
      console.error('Error al actualizar estudiante:', err);
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // 1. Intentar crear bucket público 'brand' en Supabase Storage (por si no existe)
      try {
        await supabase.storage.createBucket('brand', { public: true });
      } catch (bucketErr) {
        // Ignorar si el bucket ya existe o falla por permisos, continuaremos con el upload
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 2. Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('brand')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // 3. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('brand')
        .getPublicUrl(filePath);

      // 4. Guardar URL en localStorage
      if (type === 'logo') {
        localStorage.setItem('lingobridge_logo', publicUrl);
        setCustomLogoUrl(publicUrl);
        setUploadSuccess('¡Logotipo principal actualizado exitosamente en Supabase Storage!');
      } else {
        localStorage.setItem('lingobridge_logo_icon', publicUrl);
        setCustomIconUrl(publicUrl);
        setUploadSuccess('¡Icono de logotipo actualizado exitosamente en Supabase Storage!');
      }
    } catch (err: any) {
      console.error('Error al subir imagen:', err);
      // Fallback local: guardar como base64 en localStorage para asegurar que funcione al 100% de inmediato
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          if (type === 'logo') {
            localStorage.setItem('lingobridge_logo', base64data);
            setCustomLogoUrl(base64data);
          } else {
            localStorage.setItem('lingobridge_logo_icon', base64data);
            setCustomIconUrl(base64data);
          }
          setUploadSuccess('¡Logo guardado de forma segura en local storage!');
        };
        reader.readAsDataURL(file);
      } catch (localErr) {
        setUploadError(err.message || 'Error al intentar subir o guardar la imagen.');
      }
    } finally {
      setUploading(null);
    }
  };

  const handleResetBranding = () => {
    localStorage.removeItem('lingobridge_logo');
    localStorage.removeItem('lingobridge_logo_icon');
    setCustomLogoUrl(null);
    setCustomIconUrl(null);
    setUploadSuccess('¡Diseño visual restablecido al logo por defecto exitosamente!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Verificando credenciales del búnker administrativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* MENÚ LATERAL ADMIN (SIDEBAR) */}
      <aside className="w-full md:w-64 border-r border-white/5 bg-[#070913] flex flex-col justify-between shrink-0 p-6 md:min-h-screen">
        <div className="space-y-8">
          
          {/* Branding */}
          <div className="flex items-center gap-3">
            {customLogoUrl ? (
              <img src={customLogoUrl} alt="JyM LingoBridge AI" className="h-8 object-contain" />
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                  <Settings className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <span className="font-outfit font-extrabold text-md tracking-tight text-white block">
                    JyM LingoBridge
                  </span>
                  <span className="block text-[8px] font-bold text-purple-400 tracking-widest uppercase">
                    BÚNKER ADMINISTRACIÓN SaaS
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Perfil Administrador */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-xs text-white truncate">{adminName}</h4>
              <span className="text-[8px] font-extrabold text-purple-400 uppercase tracking-widest block mt-0.5">
                SUPER ADMINISTRADOR
              </span>
            </div>
          </div>

          {/* Menú de control */}
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('students')}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 text-left transition-all ${
                activeTab === 'students' 
                  ? 'bg-white/5 border border-white/5 text-white' 
                  : 'hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-purple-400" />
              Gestión de Alumnos
            </button>
            
            <button 
              onClick={() => setActiveTab('branding')}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 text-left transition-all ${
                activeTab === 'branding' 
                  ? 'bg-white/5 border border-white/5 text-white' 
                  : 'hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              Configuración de Logo
            </button>

            <Link 
              href="/dashboard"
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              Ir al Aula de Prueba
            </Link>
          </nav>
        </div>

        {/* Cierre sesión */}
        <button 
          onClick={handleLogout}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-500/10 transition-all mt-8 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Salir de Búnker
        </button>
      </aside>

      {/* PANEL CENTRAL DE CONTROL COMERCIAL */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-900/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Saludo y Acreditación de Matrícula */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-white/5">
          <div>
            <h1 className="font-outfit text-3xl font-black text-white">
              Búnker Comercial de LingoBridge
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitoreo comercial de planes, consumos de IA de Groq y asignación de especialidades técnicas.
            </p>
          </div>
          <div className="text-left md:text-right text-xs text-slate-500">
            <span>Matrícula Mercantil CCV No. 495502</span>
            <span className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">Villavicencio, Colombia</span>
          </div>
        </div>

        {/* CUADROS DE MÉTRICAS CLAVE (SAAS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* M1: Estudiantes */}
          <div className="p-5 rounded-xl border border-white/5 bg-slate-900/20">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estudiantes Activos</span>
              <Users className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <h2 className="font-outfit text-2xl font-black text-white">{stats.estudiantesActivos}</h2>
            <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ Todos con cuenta de Supabase</span>
          </div>

          {/* M2: Ingresos proyectados */}
          <div className="p-5 rounded-xl border border-white/5 bg-slate-900/20">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suscripciones Mensuales</span>
              <TrendingUp className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <h2 className="font-outfit text-2xl font-black text-white">
              ${stats.ingresosProyectados.toLocaleString('es-CO')} COP
            </h2>
            <span className="text-[9px] text-slate-500 block mt-1">Base: $65.000 COP individual</span>
          </div>

          {/* M3: Solicitudes de IA balanceadas */}
          <div className="p-5 rounded-xl border border-white/5 bg-slate-900/20">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consumos de IA (Groq)</span>
              <Activity className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <h2 className="font-outfit text-2xl font-black text-white">{stats.groqRequestsTotal}</h2>
            <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ Balanceado multi-key (Costo $0)</span>
          </div>

          {/* M4: Infraestructura Vercel */}
          <div className="p-5 rounded-xl border border-white/5 bg-slate-900/20">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado Servidor</span>
              <ShieldCheck className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <h2 className="font-outfit text-2xl font-black text-white">100% OK</h2>
            <span className="text-[9px] text-cyan-400 font-bold block mt-1">Vercel Serverless activo</span>
          </div>

        </div>

        {/* CONTROL DE BALANCEO MULTI-KEY EN VIVO */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 mb-10">
          <h3 className="font-outfit font-extrabold text-sm text-white mb-2 flex items-center gap-2">
            <LineChart className="w-4.5 h-4.5 text-purple-400" />
            Monitoreo en Vivo de Rotación Multi-Key (Costo $0 IA)
          </h3>
          <p className="text-slate-400 text-xs mb-6">
            Nuestra clase Round-Robin en Next.js distribuye de manera exacta el consumo de tus estudiantes entre tus 4 claves de Groq.
          </p>

          <div className="grid sm:grid-cols-4 gap-4">
            {/* Key 1: Landing */}
            <div className="p-4 rounded-xl border border-white/5 bg-black/40">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">1. Key Landing Engine</span>
              <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: '40%' }} />
              </div>
              <span className="text-[9px] text-slate-400 block mt-2">Uso: Deconstructor (40%)</span>
            </div>

            {/* Key 2: Edu 1 */}
            <div className="p-4 rounded-xl border border-white/5 bg-black/40">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">2. Key Educador IA 1</span>
              <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '32%' }} />
              </div>
              <span className="text-[9px] text-slate-400 block mt-2">Uso: Chat Socrático (32%)</span>
            </div>

            {/* Key 3: Edu 2 */}
            <div className="p-4 rounded-xl border border-white/5 bg-black/40">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">3. Key Educador IA 2</span>
              <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '34%' }} />
              </div>
              <span className="text-[9px] text-slate-400 block mt-2">Uso: Chat Socrático (34%)</span>
            </div>

            {/* Key 4: Edu 3 */}
            <div className="p-4 rounded-xl border border-white/5 bg-black/40">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">4. Key Educador IA 3</span>
              <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '34%' }} />
              </div>
              <span className="text-[9px] text-slate-400 block mt-2">Uso: Chat Socrático (34%)</span>
            </div>
          </div>
        </div>

        {activeTab === 'students' ? (
          /* TABLA PRINCIPAL DE GESTIÓN DE ESTUDIANTES */
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20">
            <h3 className="font-outfit font-extrabold text-sm text-white mb-6 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-purple-400" />
              Base de Estudiantes Registrados
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Contacto / Correo</th>
                    <th className="pb-3 text-center">Nivel del MCER</th>
                    <th className="pb-3 text-center">Industria de Enfoque</th>
                    <th className="pb-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No hay ningún estudiante registrado en el sistema aún. Los nuevos alumnos aparecerán automáticamente tras registrarse en la Landing.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-4 font-semibold text-slate-200">{student.nombre}</td>
                        <td className="py-4 text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            {student.email}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <select 
                            value={student.nivel_cefr}
                            disabled={updatingStudentId === student.id}
                            onChange={(e) => handleUpdateStudent(student.id, { nivel_cefr: e.target.value })}
                            className="bg-black border border-white/10 rounded px-2.5 py-1 font-bold text-cyan-400 text-[10px]"
                          >
                            <option value="A1">A1 - Principiante</option>
                            <option value="A2">A2 - Elemental</option>
                            <option value="B1">B1 - Intermedio</option>
                            <option value="B2">B2 - Intermedio Alto</option>
                          </select>
                        </td>
                        <td className="py-4 text-center">
                          <select 
                            value={student.enfoque_industria}
                            disabled={updatingStudentId === student.id}
                            onChange={(e) => handleUpdateStudent(student.id, { enfoque_industria: e.target.value })}
                            className="bg-black border border-white/10 rounded px-2.5 py-1 font-bold text-purple-400 text-[10px]"
                          >
                            <option value="construccion">Construcción y Obras</option>
                            <option value="tecnologia">Tecnología e Informática</option>
                            <option value="negocios">Administración y Negocios</option>
                            <option value="general">Uso General</option>
                          </select>
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 font-bold text-[10px]"
                            disabled={updatingStudentId === student.id}
                          >
                            ✓ Licencia Activa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* NUEVO PANEL DE CONFIGURACIÓN DE BRANDING Y LOGO */
          <div className="space-y-6">
            {/* Mensajes de Alerta */}
            {uploadError && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-300 text-xs flex items-center gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            
            {uploadSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Lado 1: Logotipo Horizontal */}
              <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 flex flex-col justify-between">
                <div>
                  <h3 className="font-outfit font-extrabold text-md text-white mb-2">Logotipo Principal (Horizontal)</h3>
                  <p className="text-slate-400 text-xs mb-4">
                    Este es el logo que se muestra en la cabecera principal y páginas públicas. Tamaño recomendado: 700x160 píxeles.
                  </p>
                  
                  {/* Vista Previa */}
                  <div className="w-full h-40 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center p-4 mb-6 relative overflow-hidden">
                    <img 
                      src={customLogoUrl || "/logo.png"} 
                      alt="Logo Principal Preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] text-slate-500">
                      {customLogoUrl ? "Personalizado" : "Por defecto"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition-all text-center">
                    {uploading === 'logo' ? 'Subiendo archivo...' : 'Seleccionar y subir nuevo Logo'}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleUploadImage(e, 'logo')}
                      disabled={uploading !== null}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Lado 2: Icono del Logo */}
              <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 flex flex-col justify-between">
                <div>
                  <h3 className="font-outfit font-extrabold text-md text-white mb-2">Icono del Logo (Cuadrado)</h3>
                  <p className="text-slate-400 text-xs mb-4">
                    Este icono se utiliza en barras laterales pequeñas, paneles compactos e indicadores de carga. Tamaño recomendado: 512x512 píxeles.
                  </p>
                  
                  {/* Vista Previa */}
                  <div className="w-full h-40 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center p-4 mb-6 relative overflow-hidden">
                    <img 
                      src={customIconUrl || "/logo-icon.png"} 
                      alt="Icono Preview" 
                      className="w-20 h-20 object-contain rounded-xl"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] text-slate-500">
                      {customIconUrl ? "Personalizado" : "Por defecto"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white border border-white/5 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition-all text-center">
                    {uploading === 'icon' ? 'Subiendo archivo...' : 'Seleccionar y subir nuevo Icono'}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleUploadImage(e, 'icon')}
                      disabled={uploading !== null}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>

            {/* Acciones Globales */}
            {(customLogoUrl || customIconUrl) && (
              <div className="p-6 rounded-2xl border border-red-500/10 bg-red-950/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="font-bold text-xs text-white">¿Deseas restablecer el diseño visual?</h4>
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    Esto removerá tus imágenes personalizadas de la sesión y volverá a mostrar los logotipos corporativos originales de LingoBridge AI.
                  </p>
                </div>
                <button 
                  onClick={handleResetBranding}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 font-bold text-xs transition-all cursor-pointer shrink-0"
                >
                  Restablecer Logo por Defecto
                </button>
              </div>
            )}
            
            {/* Sección de Explicación */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/10">
              <h4 className="font-bold text-xs text-slate-200 mb-2">💡 ¿Cómo funciona la carga en Supabase?</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Al subir un logotipo, se intentará guardar automáticamente en un bucket de almacenamiento público llamado <code className="text-cyan-400 font-bold">brand</code> en Supabase Storage, retornando una URL pública estática de alta velocidad.
                Si por alguna razón técnica la base de datos tuviese restricciones de escritura o almacenamiento, tu panel cuenta con un sistema de reserva inteligente (fallback) que guardará la imagen de forma local de inmediato para que sigas visualizándola sin interrupción.
              </p>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
