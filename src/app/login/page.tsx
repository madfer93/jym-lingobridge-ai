'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Loader2,
  ChevronLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [nombre, setNombre] = useState('');
  const [industry, setIndustry] = useState<'construccion' | 'tecnologia' | 'negocios'>('construccion');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (authMode === 'login') {
        // 1. Iniciar sesión en Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // 2. Consultar rol en perfiles_usuario para redireccionar
        const { data: profile, error: profileError } = await supabase
          .from('perfiles_usuario')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          // Si el perfil no existe pero el auth sí, por defecto es estudiante
          router.push('/dashboard');
          return;
        }

        if (profile?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }

      } else {
        // Registrar Nuevo Estudiante
        if (!nombre) {
          throw new Error('El nombre completo es obligatorio.');
        }

        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden. Por favor, verifícalas.');
        }

        // 1. Crear usuario en Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // 2. Crear registro en la tabla de perfiles
          const { error: insertError } = await supabase
            .from('perfiles_usuario')
            .insert([
              {
                id: data.user.id,
                email,
                nombre,
                enfoque_industria: industry,
                role: 'student'
              }
            ]);

          if (insertError) throw insertError;

          // Redireccionar al dashboard
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      setErrorMsg(err.message || 'Ocurrió un error inesperado al intentar acceder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center p-6 relative">
      
      {/* Resplandores decorativos de fondo */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-purple-900/10 rounded-full blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-950/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Botón de Retorno a la Landing */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a la página principal
      </Link>

      <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-2xl relative">
        
        {/* Cabecera del Formulario */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-600/20 mx-auto mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-outfit text-2xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {authMode === 'login' ? 'Acceder a mi Aula Virtual' : 'Crear mi Cuenta de Estudiante'}
          </h1>
          <p className="text-slate-400 text-xs mt-1.5">
            {authMode === 'login' 
              ? 'Ingresa tus credenciales para continuar tu aprendizaje activo' 
              : 'Únete hoy y empieza a deconstruir inglés de forma real'}
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="p-4 mb-6 rounded-xl bg-red-950/30 border border-red-500/20 text-red-300 text-xs flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleAuth} className="space-y-5">
          {authMode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nombre Completo</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="Tu nombre y apellido"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-600 text-white font-medium"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-600 text-white font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-600 text-white font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authMode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-600 text-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {authMode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Especialidad de Estudio</label>
              <select 
                value={industry}
                onChange={(e) => setIndustry(e.target.value as any)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-purple-500 focus:outline-none text-slate-200 font-medium"
              >
                <option value="construccion" className="bg-[#070913]">Construcción y Obras Civiles (SENA)</option>
                <option value="tecnologia" className="bg-[#070913]">Tecnología e Informática</option>
                <option value="negocios" className="bg-[#070913]">Administración y Negocios</option>
              </select>
            </div>
          )}

          {/* Botón de Envío */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-600/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : authMode === 'login' ? (
              <>
                Ingresar al Aula
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Comenzar mi Aprendizaje
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Cambio de modo Auth */}
        <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs">
          {authMode === 'login' ? (
            <p className="text-slate-400">
              ¿No tienes una cuenta aún?{' '}
              <button 
                onClick={() => setAuthMode('register')} 
                className="text-purple-400 font-bold hover:underline"
              >
                Crea una cuenta aquí
              </button>
            </p>
          ) : (
            <p className="text-slate-400">
              ¿Ya dispones de una cuenta?{' '}
              <button 
                onClick={() => setAuthMode('login')} 
                className="text-purple-400 font-bold hover:underline"
              >
                Inicia sesión aquí
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
