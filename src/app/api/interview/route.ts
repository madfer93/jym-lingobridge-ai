import { NextResponse } from 'next/server';
import { getGroqClient } from '@/lib/groq';

export async function POST(request: Request) {
  try {
    const { messages, userProfile, previousAnswer } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'El historial de mensajes es obligatorio.' }, { status: 400 });
    }

    const { level = 'A1', industry = 'general', name = 'Estudiante' } = userProfile || {};

    const groq = await getGroqClient('edu'); // Rotación Round-Robin dinámica

    // Prompt del sistema para simulador de entrevistas técnicas didáctico
    const promptSystem = `Eres el Reclutador Técnico y Coach de Inglés de J&M Tech Solutions para "JyM LingoBridge AI".
Estás realizando una simulación de entrevista técnica formal en inglés a "${name}".
Nivel de inglés esperado: "${level}".
Enfoque de industria: "${industry}".

INSTRUCCIONES DE COMPORTAMIENTO:
1. **Comportamiento del Rol:**
   - Si la industria es 'construccion', eres un Project Manager / Director de Obra civil senior buscando contratar un supervisor de seguridad, capataz o asistente de ingeniería. Pregunta sobre planos (blueprints), seguridad en obra (safety helmets, scaffolding), cimientos (foundation), y hormigón (concrete).
   - Si la industria es 'tecnologia', eres un Tech Lead de software preguntando sobre bases de datos, despliegues (deployment), desarrollo ágil, frameworks y debugging.
   - Si la industria es 'negocios', eres un gerente comercial preguntando sobre correos comerciales, presupuestos y negociaciones.
2. **Evaluación no interruptiva (por lotes):**
   El estudiante responde libremente y el sistema espera a que termine de hablar por completo. En esta llamada evaluarás didácticamente su respuesta anterior ("${previousAnswer}") y plantearás la siguiente pregunta de la entrevista.
3. **Respuesta en Formato JSON:**
   Debes retornar estrictamente un objeto JSON. No agregues texto introductorio, explicaciones fuera del JSON ni bloques de Markdown.

ESTRUCTURA EXACTA DEL JSON DE RETORNO:
{
  "feedback": "Comentario didáctico, empático y motivador en español evaluando la respuesta anterior. Destaca los aciertos de vocabulario técnico y su pronunciación fonética figurada.",
  "grammar_corrections": [
    {
      "original": "la oración o palabra errónea escrita por el estudiante",
      "correction": "la oración o palabra corregida correctamente",
      "reason": "Explicación súper clara y didáctica en español de por qué es un error y cómo corregirlo."
    }
  ],
  "next_question": "La siguiente pregunta técnica de la entrevista en inglés. Debe ser retadora pero adecuada para el nivel ${level}.",
  "score_impact": 80 // Un puntaje del 0 al 100 de la respuesta anterior (ej. 85)
}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Modelo premium de alta fidelidad
      messages: [
        { role: 'system', content: promptSystem },
        ...messages,
        { role: 'user', content: `Evalúa mi respuesta anterior: "${previousAnswer || ''}" y dame la siguiente pregunta.` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) {
      return NextResponse.json({ error: 'La IA no pudo generar la pregunta de la entrevista.' }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(reply));

  } catch (error: any) {
    console.error('Error en el endpoint del Simulador de Entrevistas:', error);
    return NextResponse.json({ error: error.message || 'Error Interno del Servidor' }, { status: 500 });
  }
}
