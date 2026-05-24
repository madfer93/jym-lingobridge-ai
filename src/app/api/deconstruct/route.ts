import { NextResponse } from 'next/server';
import { getGroqClient } from '@/lib/groq';

export async function POST(request: Request) {
  try {
    const { sentence } = await request.json();

    if (!sentence || typeof sentence !== 'string') {
      return NextResponse.json({ error: 'La oración es obligatoria y debe ser un texto.' }, { status: 400 });
    }

    const groq = getGroqClient('landing');

    const promptSystem = `Eres un experto lingüista y coach educativo de inglés como segundo idioma (ESL) bajo el Marco Común Europeo de Referencia (MCER).
Tu tarea es deconstruir sintácticamente la oración en inglés provista por el usuario y retornar un objeto JSON estructurado que desglose cada parte de forma visual y pedagógica.

El JSON DEBE tener estrictamente la siguiente estructura:
{
  "words": [
    { "word": "Word", "category": "subject | verb | adjective | auxiliary | object | connector" }
  ],
  "english_order": "oración limpia y correcta en inglés",
  "spanish_literal": "traducción literal en español palabra por palabra (con el orden de sintaxis en inglés, para evidenciar la diferencia lógica)",
  "spanish_natural": "traducción natural, fluida y correcta al español",
  "explanation": "Explicación didáctica, cercana, clara y motivadora (máximo 3 líneas) sobre por qué se ordena así la oración en inglés y cuál es la diferencia mental clave con el español."
}

Categorías permitidas para cada objeto en el arreglo "words" (usar únicamente estas etiquetas exactas):
- "subject": Sujetos, pronombres o sustantivos principales (ej. "I", "you", "the workers", "blueprints").
- "verb": Acciones o verbos principales (ej. "build", "built", "mix", "pour", "poured").
- "adjective": Adjetivos calificativos, posesivos o determinativos (ej. "big", "new", "blue", "safety", "strong").
- "auxiliary": Verbos auxiliares o de ayuda (ej. "does", "do", "did", "will", "is", "are", "have").
- "object": Objetos directos/indirectos o complementos (ej. "house", "concrete", "scaffolding").
- "connector": Artículos, preposiciones, conjunciones (ej. "the", "a", "to", "under", "before", "and").

Responde ÚNICAMENTE con el objeto JSON, sin ningún texto introductorio, explicaciones fuera del JSON o bloques de Markdown.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // Modelo súper rápido para deconstrucción instantánea
      messages: [
        { role: 'system', content: promptSystem },
        { role: 'user', content: `Deconstruye la siguiente oración: "${sentence}"` }
      ],
      response_format: { type: 'json_object' } // Forzar formato JSON en Groq
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'La IA no devolvió contenido para deconstruir.' }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(content));
  } catch (error: any) {
    console.error('Error en el endpoint de deconstrucción:', error);
    return NextResponse.json({ error: error.message || 'Error Interno del Servidor' }, { status: 500 });
  }
}
