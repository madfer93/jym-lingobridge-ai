import { NextResponse } from 'next/server';
import { getGroqClient } from '@/lib/groq';
import { supabase } from '@/lib/supabase';
import { challenges } from '@/data/challenges';

export async function POST(request: Request) {
  try {
    const { userId, challengeId, submissionText, userProfile } = await request.json();

    if (!userId || !challengeId || !submissionText) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios (userId, challengeId, submissionText).' }, { status: 400 });
    }

    // 1. Encontrar el reto correspondiente
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'El reto técnico especificado no existe.' }, { status: 404 });
    }

    const { nombre = 'Estudiante', nivel_cefr = 'A1', enfoque_industria = 'general' } = userProfile || {};

    const groq = await getGroqClient('edu'); // Rotación Round-Robin socrática

    // Prompt del sistema para evaluación de tareas contundentes
    const promptSystem = `Eres el Evaluador Técnico y Coach de Inglés de J&M Tech Solutions para la plataforma "JyM LingoBridge AI".
Tu tarea es evaluar la entrega de una tarea/desafío escrito en inglés que ha realizado el estudiante "${nombre}".

DETALLES DEL RETO SELECCIONADO:
- Título: "${challenge.title}"
- Escenario: "${challenge.scenario}"
- Requisitos: ${JSON.stringify(challenge.requirements)}
- Vocabulario sugerido: ${JSON.stringify(challenge.vocabulary)}
- Nivel de dificultad esperado: "${challenge.level}"
- Industria o Enfoque: "${challenge.industry}"

DIRECTRICES DE EVALUACIÓN:
1. **Calificación Contundente (Score 0-100):** Otorga un puntaje del 0 al 100 basado en el cumplimiento de los requisitos del reto, la gramática, la ortografía, la coherencia del texto y el uso del vocabulario técnico. Sé justo pero riguroso pedagógicamente:
   - >= 60 es Aprobado.
   - < 60 es Corregido (requiere rehacer).
2. **Análisis detallado de errores:** Identifica errores gramaticales, ortográficos, de preposiciones o de sintaxis. Para cada error provee:
   - La parte errónea del texto original.
   - La corrección exacta.
   - La explicación amigable de POR QUÉ es un error en español (isonomía gramatical, orden del adjetivo, uso de preposiciones, etc.).
3. **Retroalimentación Socrática de Mejora (Feedback):** Escribe un comentario empático, cercano y sumamente motivador en español. Destaca lo que el estudiante hizo bien, anímalo en su proceso (especialmente si es un adulto reincorporado al estudio) y dale 2 consejos específicos para mejorar en su próximo escrito.
4. **Versión Pulida y Premium (Polished Version):** Reescribe el texto completo del estudiante en un inglés perfecto, formal e idiomático correspondiente al nivel "${challenge.level}" para que sirva de modelo de aprendizaje ideal, resaltando en mayúsculas o negrita los términos de vocabulario técnico.
5. **Evaluación de Nivel MCER:** Estima si el escrito cumple con el nivel esperado (${challenge.level}).

Responde ÚNICAMENTE con un objeto JSON válido, sin textos introductorios, bloques de markdown ni explicaciones fuera del JSON.

ESTRUCTURA EXACTA DEL JSON DE RETORNO:
{
  "score": 85,
  "cefr_assessment": "B1",
  "feedback": "Retroalimentación en español...",
  "errors": [
    {
      "original": "texto con error",
      "correction": "texto corregido",
      "reason": "Explicación amigable en español de por qué es un error..."
    }
  ],
  "polished_version": "Texto completo del estudiante reescrito con elegancia premium...",
  "xp_earned": 85
}`;

    // Llamar a Groq con el modelo Llama-3.3-70b-versatile
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: promptSystem },
        { role: 'user', content: `Aquí está mi entrega del reto:\n\n"${submissionText}"` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) {
      return NextResponse.json({ error: 'La IA no pudo procesar la evaluación de la tarea.' }, { status: 500 });
    }

    const evaluationResult = JSON.parse(reply);

    // 2. Insertar el registro en la base de datos Supabase en 'historial_practicas'
    const isApproved = evaluationResult.score >= 60;
    
    // Para simplificar, insertamos en la tabla original 'historial_practicas'
    const { error: insertError } = await supabase
      .from('historial_practicas')
      .insert([
        {
          user_id: userId,
          tipo_practica: 'chat_tutor', // clasificado como práctica asistida
          ejercicio: challengeId,
          resultado: isApproved ? 'aprobado' : 'corregido',
          retroalimentacion: reply // Guardar todo el JSON de evaluación como texto
        }
      ]);

    if (insertError) {
      console.error('Error al registrar práctica en Supabase:', insertError);
      // Continuamos de todas formas para no arruinar la experiencia del usuario
    }

    // 3. Obtener el número total de tareas aprobadas del estudiante para calcular nivel y XP
    const { data: approvedList, error: countError } = await supabase
      .from('historial_practicas')
      .select('id')
      .eq('user_id', userId)
      .eq('resultado', 'aprobado');

    const totalApproved = approvedList ? approvedList.length : 1;
    
    // XP acumulada calculada dinámicamente = total de aprobadas * 50 + score actual
    const calculatedXP = (totalApproved * 50) + evaluationResult.score;

    // Calcular el nivel dinámico correspondiente
    let newLevel = nivel_cefr;
    if (calculatedXP >= 300) {
      newLevel = 'B2';
    } else if (calculatedXP >= 180) {
      newLevel = 'B1';
    } else if (calculatedXP >= 80) {
      newLevel = 'A2';
    } else {
      newLevel = 'A1';
    }

    // Si el nivel aumentó, actualizar el perfil del usuario en la base de datos
    let levelUpTriggered = false;
    if (newLevel !== nivel_cefr) {
      levelUpTriggered = true;
      const { error: updateError } = await supabase
        .from('perfiles_usuario')
        .update({ nivel_cefr: newLevel })
        .eq('id', userId);

      if (updateError) {
        console.error('Error al actualizar nivel del estudiante en Supabase:', updateError);
      }
    }

    return NextResponse.json({
      ...evaluationResult,
      total_xp: calculatedXP,
      new_level: newLevel,
      level_up: levelUpTriggered
    });

  } catch (error: any) {
    console.error('Error en el endpoint de calificación de tarea:', error);
    return NextResponse.json({ error: error.message || 'Error Interno del Servidor' }, { status: 500 });
  }
}
