import Groq from 'groq-sdk';
import { supabase } from './supabase';

// Contador simple guardado en memoria de ejecución del servidor para rotar de manera Round-Robin
let currentEduIndex = 0;

/**
 * Retorna un cliente de Groq balanceado.
 * @param type 'landing' para la clave de API general o 'edu' para rotar entre las claves de educadores.
 */
export async function getGroqClient(type: 'landing' | 'edu' = 'landing'): Promise<Groq> {
  const landingKey = process.env.GROQ_API_KEY_LANDING;

  if (type === 'landing') {
    if (!landingKey) {
      throw new Error('Falta la variable de entorno GROQ_API_KEY_LANDING. Configúrala en la consola de Vercel.');
    }
    return new Groq({ apiKey: landingKey });
  }

  // Si es tipo 'edu', intentamos consultar claves dinámicas activas en Supabase
  try {
    const { data: dbKeys, error } = await supabase
      .from('configuracion_groq_keys')
      .select('key_value')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (!error && dbKeys && dbKeys.length > 0) {
      const activeKeys = dbKeys.map((k: any) => k.key_value).filter(Boolean) as string[];
      if (activeKeys.length > 0) {
        const apiKey = activeKeys[currentEduIndex % activeKeys.length];
        console.log(`🔄 [Groq Balanceador Dinámico] Rotando consulta al Educador IA de BD #${(currentEduIndex % activeKeys.length) + 1}`);
        currentEduIndex = (currentEduIndex + 1) % activeKeys.length;
        return new Groq({ apiKey });
      }
    }
  } catch (dbErr) {
    console.warn('⚠️ Error al consultar las llaves de Groq en la base de datos. Usando fallback de env:', dbErr);
  }

  // Fallback: variables de entorno del servidor
  const eduKeys = [
    process.env.GROQ_API_KEY_EDU_1,
    process.env.GROQ_API_KEY_EDU_2,
    process.env.GROQ_API_KEY_EDU_3
  ].filter(Boolean) as string[];

  if (eduKeys.length === 0) {
    if (!landingKey) {
      throw new Error('Falta la variable de entorno GROQ_API_KEY_LANDING o llaves dinámicas.');
    }
    return new Groq({ apiKey: landingKey });
  }

  const apiKey = eduKeys[currentEduIndex % eduKeys.length];
  console.log(`🔄 [Groq Balanceador Env] Rotando consulta al Educador IA del Archivo Env #${(currentEduIndex % eduKeys.length) + 1}`);
  currentEduIndex = (currentEduIndex + 1) % eduKeys.length;
  
  return new Groq({ apiKey });
}
