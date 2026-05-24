import { NextResponse } from 'next/server';
import { getGroqClient } from '@/lib/groq';

export async function POST(request: Request) {
  try {
    const { idea, userProfile } = await request.json();

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({ error: 'La idea en borrador es obligatoria.' }, { status: 400 });
    }

    const { level = 'A1', industry = 'general', name = 'Estudiante' } = userProfile || {};

    const groq = await getGroqClient('edu'); // Rotación Round-Robin

    const promptSystem = `Eres el Redactor de Correos y Coach de Inglés Comercial de J&M Tech Solutions para "JyM LingoBridge AI".
Tu tarea es ayudar a "${name}" (quien trabaja en la industria "${industry}" y tiene un nivel de inglés "${level}") a traducir su borrador o idea de correo al inglés comercial perfecto.

Debes traducir y estructurar la idea del estudiante en 3 tonos diferentes bien definidos:
1. **Formal (Tono Formal/Corporativo):** Adecuado para clientes, gerentes, arquitectos, interventores o correos de presentación oficial.
2. **Casual (Tono Casual/Compañero):** Adecuado para compañeros de equipo directos, chats de Slack/WhatsApp laboral, y coordinación interna del día a día.
3. **Urgent (Tono Urgente/Directo):** Adecuado cuando se requieren acciones urgentes (ej. vencimiento de plazos de concreto, entrega de planos, bugs críticos de despliegue, etc.), de forma clara, directa y asertiva sin ser descortés.

Requisitos:
- Adapta los ejemplos y vocabulario técnico comercial al sector "${industry}" y nivel de gramática de la plataforma.
- Responde estrictamente con un objeto JSON válido. No agregues texto introductorio, explicaciones fuera del JSON ni bloques de Markdown.

ESTRUCTURA EXACTA DEL JSON DE RETORNO:
{
  "formal": "Texto completo del correo formal, incluyendo línea de asunto (Subject:) y saludo inicial/despedida formal.",
  "casual": "Texto completo en tono casual, incluyendo línea de asunto (Subject: o Chat:) y saludo/despedida amigable.",
  "urgent": "Texto completo en tono urgente/directo, incluyendo asunto (URGENT - Subject:) y cuerpo directo, claro y con plazos."
}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: promptSystem },
        { role: 'user', content: `Traduce la siguiente idea/borrador a los 3 tonos en inglés:\n\n"${idea}"` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) {
      return NextResponse.json({ error: 'La IA no pudo procesar la redacción del correo.' }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(reply));

  } catch (error: any) {
    console.error('Error en el endpoint de SaaS Mailer:', error);
    return NextResponse.json({ error: error.message || 'Error Interno del Servidor' }, { status: 500 });
  }
}
