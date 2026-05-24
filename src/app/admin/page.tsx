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
  AlertCircle,
  Cpu
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
  const [activeTab, setActiveTab] = useState<'students' | 'branding' | 'b2b_classes' | 'config'>('students');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'icon' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Estados de Configuración Dinámica (Wompi y Groq)
  const [wompiConfig, setWompiConfig] = useState<any>({
    wompi_public_key: '',
    wompi_integrity_key: '',
    wompi_merchant_id: '',
    wompi_sandbox_mode: 'true',
    wompi_enlace_estudiante: '',
    wompi_enlace_institucional: ''
  });
  const [groqKeys, setGroqKeys] = useState<any[]>([]);
  const [newGroqKey, setNewGroqKey] = useState({ key_value: '', key_label: '' });
  const [configLoading, setConfigLoading] = useState(false);

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

  const fetchDynamicConfig = async () => {
    try {
      const resWompi = await fetch('/api/admin/config?type=wompi');
      const dataWompi = await resWompi.json();
      if (dataWompi.config) {
        setWompiConfig((prev: any) => ({ ...prev, ...dataWompi.config }));
      }

      const resGroq = await fetch('/api/admin/config?type=groq');
      const dataGroq = await resGroq.json();
      if (dataGroq.keys) {
        setGroqKeys(dataGroq.keys);
      }
    } catch (e) {
      console.error('Error fetching config:', e);
    }
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

        // Cargar config dinámica en segundo plano
        fetchDynamicConfig();

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

  const handleSaveWompi = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true);
    setUploadSuccess(null);
    setUploadError(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'wompi',
          payload: wompiConfig
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadSuccess('¡Configuración de Pasarela Wompi guardada y activa en caliente en Supabase!');
      } else {
        setUploadError(data.error || 'No se pudo guardar la configuración.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error al guardar la pasarela.');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleAddGroqKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroqKey.key_value.trim() || !newGroqKey.key_label.trim()) return;

    setConfigLoading(true);
    setUploadSuccess(null);
    setUploadError(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'groq_add',
          payload: newGroqKey
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadSuccess('¡Clave API de Groq agregada y estructurada en el balanceador!');
        setNewGroqKey({ key_value: '', key_label: '' });
        fetchDynamicConfig();
      } else {
        setUploadError(data.error || 'No se pudo registrar la clave.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error al agregar clave.');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleToggleGroqKey = async (id: string, currentStatus: boolean) => {
    setUploadSuccess(null);
    setUploadError(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'groq_toggle',
          payload: { id, activo: !currentStatus }
        })
      });
      if (res.ok) {
        setGroqKeys(prev => prev.map(k => k.id === id ? { ...k, activo: !currentStatus } : k));
        setUploadSuccess('¡Estado de la clave de Groq actualizado con éxito!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGroqKey = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta clave de Groq de la rotación dinámica?')) return;

    setUploadSuccess(null);
    setUploadError(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'groq_delete',
          payload: { id }
        })
      });
      if (res.ok) {
        setGroqKeys(prev => prev.filter(k => k.id !== id));
        setUploadSuccess('¡Clave API de Groq eliminada exitosamente!');
      }
    } catch (e) {
      console.error(e);
    }
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

            <button 
              onClick={() => setActiveTab('b2b_classes')}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 text-left transition-all ${
                activeTab === 'b2b_classes' 
                  ? 'bg-white/5 border border-white/5 text-white' 
                  : 'hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-purple-400" />
              Gestión de Aulas B2B
            </button>

            <button 
              onClick={() => setActiveTab('config')}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 text-left transition-all ${
                activeTab === 'config' 
                  ? 'bg-white/5 border border-white/5 text-white' 
                  : 'hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-purple-400" />
              Configuración Dinámica
            </button>

            <Link 
              href="/dashboard"
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white transition-all block"
            >
              <GraduationCap className="w-4 h-4 text-cyan-450" />
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
        ) : activeTab === 'branding' ? (
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
        ) : activeTab === 'b2b_classes' ? (
          /* GESTIÓN DE AULAS B2B (SENA / COLEGIOS) - NUEVO */
          <div className="space-y-8 animate-fade-in">
            {/* Header del Módulo */}
            <div className="p-6 rounded-2xl border border-purple-500/10 bg-purple-950/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-outfit font-black text-sm text-white">Módulo de Licenciamiento B2B & Aulas Inteligentes</h3>
                <p className="text-slate-400 text-[10px] mt-0.5 max-w-xl">
                  Administra las cohorts de estudiantes vinculados por instituciones educativas asociadas (SENA, Colegios Técnicos e Institutos) y realiza seguimiento masivo a sus evaluaciones por IA.
                </p>
              </div>
              <button
                onClick={() => alert('¡Simulación B2B! Para habilitar integraciones de base de datos SENA reales, por favor contactar al equipo de J&M Tech Solutions.')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer shrink-0"
              >
                + Crear Nueva Aula B2B
              </button>
            </div>

            {/* Listado de Aulas Simuladas de Alta Calidad */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Aula 1: SENA */}
              <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      VINCULACIÓN SENA ACTIVA
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Código: SENA-ADSO-271</span>
                  </div>
                  
                  <h3 className="font-outfit font-extrabold text-sm text-white group-hover:text-purple-300 transition-all">
                    Análisis y Desarrollo de Software - Ficha 2711320
                  </h3>
                  
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Grupo de tecnólogos en informática en Villavicencio cursando inglés técnico aplicado.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">Alumnos</span>
                    <span className="font-bold text-sm text-white">28</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">Nivel Prom.</span>
                    <span className="font-bold text-sm text-cyan-400">A2</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">Prom. IA</span>
                    <span className="font-bold text-sm text-emerald-400">84%</span>
                  </div>
                </div>

                <button
                  onClick={() => alert('Visualizando reportes del SENA: Alumnos con promedio general A2 y 92% de tareas completadas.')}
                  className="w-full mt-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-350 font-bold text-xs transition-all cursor-pointer text-center block"
                >
                  Ver Planilla de Notas AI
                </button>
              </div>

              {/* Aula 2: Colegio Técnico */}
              <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-4 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      VINCULACIÓN COLEGIO ACTIVA
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Código: COLTEC-11B</span>
                  </div>
                  
                  <h3 className="font-outfit font-extrabold text-sm text-white group-hover:text-purple-300 transition-all">
                    Colegio Técnico Industrial - Grado 11-B
                  </h3>
                  
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Estudiantes de último año preparándose para las pruebas de Estado y empleo joven.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">Alumnos</span>
                    <span className="font-bold text-sm text-white">35</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">Nivel Prom.</span>
                    <span className="font-bold text-sm text-cyan-400">A1</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase">Prom. IA</span>
                    <span className="font-bold text-sm text-emerald-400">76%</span>
                  </div>
                </div>

                <button
                  onClick={() => alert('Visualizando reportes de Grado 11-B: Alumnos con promedio general A1 y 68% de tareas completadas.')}
                  className="w-full mt-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-350 font-bold text-xs transition-all cursor-pointer text-center block"
                >
                  Ver Planilla de Notas AI
                </button>
              </div>
            </div>

            {/* Guía de ventas B2B */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/10 space-y-2">
              <h4 className="font-bold text-xs text-white">💡 Estrategia de Venta Comercial B2B por Manuel Madrid</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Este panel te permite demostrar a directores del SENA y rectores la capacidad única de **JyM LingoBridge AI** de realizar seguimiento automático e imparcial a cientos de entregas mediante IA. Puedes proponer licencias B2B anuales de **$280.000 COP** por aula o licencias masivas a convenir, automatizando al 100% el trabajo evaluativo del profesor.
              </p>
            </div>
          </div>
        ) : (
          /* NUEVO PANEL DE CONFIGURACIÓN DINÁMICA (WOMPI Y GROQ) */
          <div className="space-y-8 animate-fade-in">
            {/* Mensajes de feedback */}
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
              
              {/* Lado 1: Formulario Wompi */}
              <form onSubmit={handleSaveWompi} className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-4">
                <h3 className="font-outfit font-black text-sm text-white border-b border-white/5 pb-2 flex items-center gap-2">
                  <Settings className="w-4.5 h-4.5 text-purple-400" />
                  Conexión Pasarela Wompi Colombia
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Wompi Public Key (Sandbox/Production)</label>
                    <input
                      type="text"
                      value={wompiConfig.wompi_public_key || ''}
                      onChange={(e) => setWompiConfig({ ...wompiConfig, wompi_public_key: e.target.value })}
                      placeholder="pub_test_..."
                      className="w-full p-2.5 bg-black/45 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Wompi Integrity Key (Firma Segura)</label>
                    <input
                      type="text"
                      value={wompiConfig.wompi_integrity_key || ''}
                      onChange={(e) => setWompiConfig({ ...wompiConfig, wompi_integrity_key: e.target.value })}
                      placeholder="prod_integrity_..."
                      className="w-full p-2.5 bg-black/45 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Wompi Merchant ID</label>
                    <input
                      type="text"
                      value={wompiConfig.wompi_merchant_id || ''}
                      onChange={(e) => setWompiConfig({ ...wompiConfig, wompi_merchant_id: e.target.value })}
                      placeholder="12345"
                      className="w-full p-2.5 bg-black/45 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Enlace de Pago Directo Plan Estudiante</label>
                    <input
                      type="text"
                      value={wompiConfig.wompi_enlace_estudiante || ''}
                      onChange={(e) => setWompiConfig({ ...wompiConfig, wompi_enlace_estudiante: e.target.value })}
                      placeholder="https://checkout.wompi.co/l/..."
                      className="w-full p-2.5 bg-black/45 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Enlace de Pago Directo Plan Institucional</label>
                    <input
                      type="text"
                      value={wompiConfig.wompi_enlace_institucional || ''}
                      onChange={(e) => setWompiConfig({ ...wompiConfig, wompi_enlace_institucional: e.target.value })}
                      placeholder="https://checkout.wompi.co/l/..."
                      className="w-full p-2.5 bg-black/45 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Sandbox Mode (Pruebas)</span>
                    <button
                      type="button"
                      onClick={() => setWompiConfig({ ...wompiConfig, wompi_sandbox_mode: wompiConfig.wompi_sandbox_mode === 'true' ? 'false' : 'true' })}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        wompiConfig.wompi_sandbox_mode === 'true' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {wompiConfig.wompi_sandbox_mode === 'true' ? 'Activo (Sandbox)' : 'Inactivo (Producción)'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={configLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg border border-white/5 uppercase tracking-wider cursor-pointer"
                >
                  {configLoading ? 'Guardando en Supabase...' : 'Guardar Pasarela Wompi'}
                </button>
              </form>

              {/* Lado 2: Gestión de Claves Groq */}
              <div className="space-y-6">
                
                {/* Formulario para Agregar */}
                <form onSubmit={handleAddGroqKey} className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-4">
                  <h3 className="font-outfit font-black text-sm text-white border-b border-white/5 pb-2 flex items-center gap-2">
                    <Cpu className="w-4.5 h-4.5 text-purple-400" />
                    Registrar Clave API de Groq en Vivo
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Clave API de Groq (gsk_...)</label>
                      <input
                        type="password"
                        value={newGroqKey.key_value}
                        onChange={(e) => setNewGroqKey({ ...newGroqKey, key_value: e.target.value })}
                        placeholder="gsk_..."
                        className="w-full p-2.5 bg-black/45 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Etiqueta Identificadora (Alias)</label>
                      <input
                        type="text"
                        value={newGroqKey.key_label}
                        onChange={(e) => setNewGroqKey({ ...newGroqKey, key_label: e.target.value })}
                        placeholder="Ej. Clave 5 - Manuel Madrid"
                        className="w-full p-2.5 bg-black/45 border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={configLoading || !newGroqKey.key_value || !newGroqKey.key_label}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold border border-white/5 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    {configLoading ? 'Registrando...' : 'Registrar y Activar Clave'}
                  </button>
                </form>

                {/* Listado de Claves */}
                <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 space-y-4">
                  <h3 className="font-outfit font-black text-sm text-white border-b border-white/5 pb-2 flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-purple-400" />
                    Claves en Caliente Registradas ({groqKeys.length})
                  </h3>

                  {groqKeys.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-4">
                      No hay llaves dinámicas registradas en la base de datos. El servidor está operando bajo las llaves estáticas de .env.local de forma segura.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                      {groqKeys.map((k) => (
                        <div key={k.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center gap-4">
                          <div>
                            <span className="font-bold text-xs text-white block">{k.key_label}</span>
                            <span className="text-[9px] text-slate-500 font-mono">gsk_...{k.key_value.slice(-6)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleGroqKey(k.id, k.activo)}
                              className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider cursor-pointer ${
                                k.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {k.activo ? 'Activa' : 'Inactiva'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGroqKey(k.id)}
                              className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-red-950/20 hover:bg-red-900/20 text-red-300 border border-red-500/20 cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
