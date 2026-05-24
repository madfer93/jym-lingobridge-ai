import Groq from 'groq-sdk';

// Contador simple guardado en memoria de ejecución del servidor para rotar de manera Round-Robin
let currentEduIndex = 0;

/**
 * Retorna un cliente de Groq balanceado.
 * @param type 'landing' para la clave de API general o 'edu' para rotar entre las 3 claves de educadores.
 */
export function getGroqClient(type: 'landing' | 'edu' = 'landing'): Groq {
  const landingKey = process.env.GROQ_API_KEY_LANDING;
  const eduKeys = [
    process.env.GROQ_API_KEY_EDU_1,
    process.env.GROQ_API_KEY_EDU_2,
    process.env.GROQ_API_KEY_EDU_3
  ].filter(Boolean) as string[];

  // Validar clave únicamente en tiempo de ejecución (Runtime)
  if (!landingKey) {
    throw new Error('Falta la variable de entorno GROQ_API_KEY_LANDING. Configúrala en la consola de Vercel.');
  }

  if (type === 'landing' || eduKeys.length === 0) {
    // Retorna la llave por defecto de la Landing Page
    return new Groq({ apiKey: landingKey });
  }

  // Rotador Round-Robin inteligente entre las claves de Educador
  const apiKey = eduKeys[currentEduIndex];
  
  // Imprimir en consola la rotación para depuración administrativa en producción
  console.log(`🔄 [Groq Balanceador] Rotando consulta al Educador IA #${currentEduIndex + 1}`);
  
  currentEduIndex = (currentEduIndex + 1) % eduKeys.length;
  
  return new Groq({ apiKey });
}
