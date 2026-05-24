'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, 
  Layers, 
  MessageSquare, 
  ChevronLeft, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  HelpCircle,
  Lightbulb,
  Sparkles,
  Play
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  nivel_cefr: string;
  enfoque_industria: string;
}

interface WordBlock {
  word: string;
  category: 'subject' | 'verb' | 'adjective' | 'auxiliary' | 'object' | 'connector';
}

interface DeconstructResult {
  words: WordBlock[];
  english_order: string;
  spanish_literal: string;
  spanish_natural: string;
  explanation: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function DeconstructorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTask = searchParams.get('task') || '';
  const initialTab = searchParams.get('tab') || 'deconstruct';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deconstruct' | 'chat'>(initialTab as any);

  // ESTADOS DEL DECONSTRUCTOR
  const [sentenceInput, setSentenceInput] = useState(initialTask);
  const [analyzing, setAnalyzing] = useState(false);
  const [deconstructData, setDeconstructData] = useState<DeconstructResult | null>(null);
  const [shuffledWords, setShuffledWords] = useState<WordBlock[]>([]);
  const [orderedSentence, setOrderedSentence] = useState<WordBlock[]>([]);
  const [checkStatus, setCheckStatus] = useState<'untested' | 'success' | 'failed'>('untested');
  const [deconstructError, setDeconstructError] = useState('');

  // ESTADOS DEL CHAT SOCRÁTICO
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Cargar usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push('/login');
          return;
        }

        const { data: userProfile } = await supabase
          .from('perfiles_usuario')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userProfile) {
          setProfile(userProfile);
          
          // Saludo inicial del tutor basado en su industria
          const initialGreeting = userProfile.enfoque_industria === 'construccion' 
            ? `¡Hola ${userProfile.nombre.split(' ')[0]}! Soy tu Coach de inglés para la obra. 👷‍♂️ ¿Tienes alguna duda de tu clase del SENA o quieres traducir un término de construcción? Cuéntame y lo resolvemos juntos paso a paso.`
            : `¡Hola ${userProfile.nombre.split(' ')[0]}! Soy tu Coach de inglés interactivo. 🧠 ¿Tienes alguna duda sintáctica o quieres que analicemos una oración? ¡Escríbeme!`;
          
          setMessages([
            { role: 'assistant', content: initialGreeting }
          ]);
        }
      } catch (err) {
        console.error('Error cargando usuario:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [router]);

  // Ejecutar deconstrucción automática si viene task por la URL
  useEffect(() => {
    if (initialTask && profile) {
      handleDeconstruct();
    }
  }, [initialTask, profile]);

  // Hacer scroll automático al final del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lógica de Deconstrucción
  const handleDeconstruct = async () => {
    if (!sentenceInput.trim()) return;
    setAnalyzing(true);
    setDeconstructError('');
    setDeconstructData(null);
    setOrderedSentence([]);
    setCheckStatus('untested');

    try {
      const response = await fetch('/api/deconstruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: sentenceInput })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setDeconstructData(data);
      
      // Desordenar palabras de forma aleatoria para el rompecabezas
      const shuffled = [...data.words].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffled);

    } catch (err: any) {
      console.error(err);
      setDeconstructError(err.message || 'Ocurrió un error al intentar analizar la oración.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleWordBlockClick = (block: WordBlock) => {
    setOrderedSentence([...orderedSentence, block]);
  };

  const removeWordFromOrder = (index: number) => {
    const updated = [...orderedSentence];
    updated.splice(index, 1);
    setOrderedSentence(updated);
    setCheckStatus('untested');
  };

  const resetOrder = () => {
    setOrderedSentence([]);
    setCheckStatus('untested');
  };

  const checkSentenceSyntax = async () => {
    if (!deconstructData) return;
    
    const userOrderedText = orderedSentence.map(w => w.word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')).join(' ');
    const correctText = deconstructData.english_order.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

    if (userOrderedText === correctText) {
      setCheckStatus('success');

      // Guardar práctica exitosa en la base de datos de Supabase si aplica
      if (profile) {
        await supabase.from('historial_practicas').insert([
          {
            user_id: profile.id,
            tipo_practica: 'deconstructor',
            ejercicio: deconstructData.english_order,
            resultado: 'aprobado',
            retroalimentacion: 'Oración ordenada correctamente por el estudiante'
          }
        ]);
        
        // Actualizar oraciones_guardadas a completada
        await supabase
          .from('oraciones_guardadas')
          .update({ completada: true })
          .eq('user_id', profile.id)
          .eq('oracion_original', sentenceInput);
      }
    } else {
      setCheckStatus('failed');
    }
  };

  // Lógica del Chat Socrático
  const handleSendChat = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const textToSend = customPrompt || chatInput;
    if (!textToSend.trim() || !profile) return;

    const userMessage: ChatMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setChatInput('');
    setSendingChat(true);

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          userProfile: {
            name: profile.nombre,
            level: profile.nivel_cefr,
            industry: profile.enfoque_industria
          }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Lo siento, ocurrió un error: ${err.message || 'No pude contactar al tutor.'}` }]);
    } finally {
      setSendingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Abriendo módulo de práctica activa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans">
      
      {/* HEADER DE MÓDULO */}
      <header className="border-b border-white/5 bg-[#070913]/90 backdrop-blur-md px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-outfit font-extrabold text-sm text-white block">JyM LingoBridge AI</span>
              <span className="block text-[8px] font-bold text-cyan-400 tracking-widest uppercase">Laboratorio de Sintaxis</span>
            </div>
          </div>
        </div>

        {/* TABS NAVEGACIÓN INTERNA */}
        <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('deconstruct')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'deconstruct' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            Deconstructor Visual
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'chat' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Tutor IA Socrático
          </button>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-900/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* ==================================================================== */}
        {/* PESTAÑA: DECONSTRUCTOR VISUAL */}
        {/* ==================================================================== */}
        {activeTab === 'deconstruct' && (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-start">
            <div className="w-full max-w-3xl space-y-8">
              
              {/* Barra de Entrada de Oración */}
              <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20">
                <h3 className="font-outfit font-extrabold text-sm text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Deconstruir Nueva Oración
                </h3>
                <p className="text-slate-500 text-xs mb-4">Ingresa la oración en inglés de tu clase del SENA u otra fuente y desármala.</p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text"
                    placeholder="Ej: The safety helmet is required on site"
                    value={sentenceInput}
                    onChange={(e) => setSentenceInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-600 text-white font-medium"
                  />
                  <button 
                    onClick={handleDeconstruct}
                    disabled={analyzing}
                    className="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        Desarmar Oración
                        <Layers className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
                {deconstructError && (
                  <p className="text-red-400 text-xs mt-3 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {deconstructError}</p>
                )}
              </div>

              {/* Módulo de Rompecabezas Sintáctico */}
              {deconstructData && (
                <div className="space-y-6">
                  
                  {/* Caja de Oración Ordenada por el Estudiante */}
                  <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-black/30">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3 text-center">Zona de Armado Lógico</span>
                    
                    <div className="w-full min-h-[70px] p-4 rounded-xl border border-white/5 bg-black/40 flex flex-wrap gap-3 items-center justify-center">
                      {orderedSentence.length === 0 ? (
                        <span className="text-slate-500 text-xs">Haz clic en los bloques de abajo en el orden gramatical correcto...</span>
                      ) : (
                        orderedSentence.map((block, i) => (
                          <button 
                            key={i} 
                            onClick={() => removeWordFromOrder(i)}
                            className={`px-3 py-1.5 rounded-lg border font-semibold text-xs shadow-md flex items-center gap-1.5 hover:scale-95 transition-all cursor-pointer ${
                              block.category === 'subject' ? 'bg-blue-900/30 border-blue-500/30 text-blue-200' :
                              block.category === 'verb' ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-200' :
                              block.category === 'adjective' ? 'bg-amber-900/30 border-amber-500/30 text-amber-200' :
                              block.category === 'auxiliary' ? 'bg-violet-900/30 border-violet-500/30 text-violet-200' :
                              block.category === 'connector' ? 'bg-slate-800 border-slate-700 text-slate-300' :
                              'bg-rose-900/30 border-rose-500/30 text-rose-200'
                            }`}
                            title="Quitar bloque"
                          >
                            {block.word}
                            <span className="text-[8px] opacity-40">×</span>
                          </button>
                        ))
                      )}
                    </div>

                    {orderedSentence.length > 0 && (
                      <div className="flex justify-center gap-4 mt-4">
                        <button 
                          onClick={resetOrder}
                          className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Limpiar
                        </button>
                        <button 
                          onClick={checkSentenceSyntax}
                          disabled={orderedSentence.length !== deconstructData.words.length}
                          className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-purple-600/10 hover:scale-[1.01] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Comprobar Sintaxis
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bloques de Categorías para Seleccionar */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">Selecciona las palabras</span>
                    
                    <div className="flex flex-wrap justify-center gap-3">
                      {shuffledWords.map((block, idx) => {
                        const countSelected = orderedSentence.filter(w => w.word === block.word).length;
                        const totalInShuffled = shuffledWords.filter(w => w.word === block.word).length;
                        const isSelected = countSelected >= totalInShuffled;

                        return (
                          <button
                            key={idx}
                            disabled={isSelected}
                            onClick={() => handleWordBlockClick(block)}
                            className={`px-4 py-2.5 rounded-xl font-bold text-xs border shadow-sm transition-all duration-200 ${
                              isSelected 
                              ? 'bg-slate-950/20 border-white/5 text-slate-700 scale-95 cursor-not-allowed' 
                              : block.category === 'subject' 
                              ? 'bg-blue-900/30 border-blue-500/30 hover:border-blue-400 text-blue-200' 
                              : block.category === 'adjective'
                              ? 'bg-amber-900/30 border-amber-500/30 hover:border-amber-400 text-amber-200'
                              : block.category === 'auxiliary'
                              ? 'bg-violet-900/30 border-violet-500/30 hover:border-violet-400 text-violet-200'
                              : block.category === 'connector'
                              ? 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300'
                              : 'bg-emerald-900/30 border-emerald-500/30 hover:border-emerald-400 text-emerald-200'
                            }`}
                          >
                            {block.word}
                            <span className="block text-[8px] font-bold opacity-30 mt-0.5 uppercase">
                              {block.category === 'subject' ? 'Sujeto' :
                               block.category === 'verb' ? 'Verbo' :
                               block.category === 'adjective' ? 'Adjetivo' :
                               block.category === 'auxiliary' ? 'Auxiliar' :
                               block.category === 'connector' ? 'Conector' : 'Objeto'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Panel de Resultados del Análisis */}
                  {checkStatus === 'success' && (
                    <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>¡Oración Sintácticamente Correcta!</span>
                      </div>
                      
                      {/* Disonancia lingüística */}
                      <div className="grid md:grid-cols-2 gap-4 text-xs pt-2 border-t border-emerald-500/10">
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-widest block text-[9px] mb-1">Pensamiento en Inglés</span>
                          <p className="font-semibold text-white">"{deconstructData.english_order}"</p>
                          <span className="text-[10px] text-slate-400 italic block mt-0.5">({deconstructData.spanish_literal})</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-widest block text-[9px] mb-1">Pensamiento en Español</span>
                          <p className="font-semibold text-emerald-300">"{deconstructData.spanish_natural}"</p>
                        </div>
                      </div>

                      {/* Explicación gramatical */}
                      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/10 text-xs text-slate-300 flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p>{deconstructData.explanation}</p>
                      </div>
                    </div>
                  )}

                  {checkStatus === 'failed' && (
                    <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-300 text-xs flex items-center gap-3 animate-shake">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <div>
                        <span className="font-bold block">⚠️ ¡Estuviste cerca!</span>
                        <span>El orden sintáctico no es exacto en inglés. Recuerda las reglas de adjetivos o auxiliares y vuelve a intentarlo.</span>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA: TUTOR SOCRÁTICO (CHAT) */}
        {/* ==================================================================== */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-black/20">
            {/* Historial de Chat */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-600/15 text-white shrink-0 text-xs font-bold">
                      IA
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl max-w-xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-none shadow-md' 
                    : 'bg-slate-900/60 border border-white/5 text-slate-200 rounded-bl-none'
                  }`}>
                    {/* Renderizado básico para separar por saltos de línea */}
                    {msg.content.split('\n').map((line, idx) => (
                      <p key={idx} className={idx > 0 ? 'mt-2' : ''}>{line}</p>
                    ))}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0 text-xs font-bold">
                      TÚ
                    </div>
                  )}
                </div>
              ))}
              {sendingChat && (
                <div className="flex items-start gap-4 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin text-white text-xs shrink-0 font-bold">
                    IA
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 text-slate-400 text-xs rounded-bl-none flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    El Coach de IA está pensando tu pista...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* PISTAS INTERACTIVAS RÁPIDAS */}
            <div className="px-6 py-2 border-t border-white/5 bg-slate-950/20 flex flex-wrap gap-2.5 items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ayudas rápidas:</span>
              <button 
                onClick={() => handleSendChat(undefined, 'Dame una pista para resolver mi tarea')} 
                disabled={sendingChat}
                className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                💡 Dame una pista
              </button>
              <button 
                onClick={() => handleSendChat(undefined, 'Explícame la regla de adjetivos en inglés de forma sencilla')} 
                disabled={sendingChat}
                className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                📘 Regla de adjetivos
              </button>
              {profile?.enfoque_industria === 'construccion' && (
                <button 
                  onClick={() => handleSendChat(undefined, 'Dame un vocabulario de 5 palabras sobre herramientas de construcción con su pronunciación')} 
                  disabled={sendingChat}
                  className="px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-950/20 text-purple-300 hover:text-purple-200 text-xs font-bold transition-all cursor-pointer"
                >
                  👷‍♂️ Vocabulario de Obra
                </button>
              )}
            </div>

            {/* Input del Chat */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 bg-[#070913]/90 flex gap-3">
              <input 
                type="text"
                placeholder="Escribe tu duda, pídele una pista o cuéntale tu tarea..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={sendingChat}
                className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-600 text-white font-medium"
              />
              <button 
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="p-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </main>

    </div>
  );
}

export default function DeconstructorModule() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center animate-spin">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-xs mt-4">Abriendo laboratorio de sintaxis...</p>
      </div>
    }>
      <DeconstructorContent />
    </React.Suspense>
  );
}
