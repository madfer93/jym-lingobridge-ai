export interface Challenge {
  id: string;
  title: string;
  description: string;
  scenario: string;
  requirements: string[];
  vocabulary: string[];
  industry: 'construccion' | 'tecnologia' | 'negocios';
  level: 'A1' | 'A2' | 'B1' | 'B2';
  xp: number;
  hint?: string;
}

export const challenges: Challenge[] = [
  // --- CONSTRUCCIÓN ---
  {
    id: 'cons-a1-report',
    title: 'Reporte de Materiales en Obra (A1)',
    description: 'Escribe un reporte simple sobre la llegada de materiales de construcción a la obra.',
    scenario: 'Eres el encargado de almacén en una obra de Villavicencio. Acaba de llegar un camión con ladrillos y cemento. Redacta un reporte en inglés para el ingeniero a cargo informando la recepción.',
    requirements: [
      'Usa al menos 30 palabras.',
      'Informa que recibiste los ladrillos (bricks) y el concreto/cemento (concrete).',
      'Confirma que estás usando tu casco de seguridad (safety helmet).'
    ],
    vocabulary: ['bricks', 'concrete', 'safety helmet', 'received', 'on site'],
    industry: 'construccion',
    level: 'A1',
    xp: 40,
    hint: 'Pista del Coach 👷‍♂️ (Puedes guiarte con esta plantilla de ayuda):\n"Hi engineer, I received the concrete and bricks on site. Everything is good. I am wearing my safety helmet. Thank you!"\n(¡Tiene 24 palabras! Solo agrégale algo más como "have a good day" para pasar de las 30 palabras).'
  },
  {
    id: 'cons-a2-inspection',
    title: 'Informe Rápido de Inspección de Andamios (A2)',
    description: 'Redacta una nota de seguridad informando el estado de los andamios antes del inicio de labores.',
    scenario: 'Antes de iniciar el turno de la mañana, debes inspeccionar los andamios de la torre norte. Redacta un correo electrónico corto en inglés al supervisor de seguridad informando que los andamios están listos y seguros.',
    requirements: [
      'Escribe al menos 40-50 palabras.',
      'Menciona el andamio (scaffolding).',
      'Menciona las normas de seguridad (safety).',
      'Indica que todo está listo para comenzar.'
    ],
    vocabulary: ['scaffolding', 'safety', 'ready', 'inspect', 'secure'],
    industry: 'construccion',
    level: 'A2',
    xp: 60,
    hint: 'Pista del Coach 👷‍♂️ (Guíate con esta plantilla de ayuda):\n"Hello supervisor, I inspected the scaffolding today. The safety is perfect and all blocks are secure. We are ready to start the construction work now. Have a nice morning!"'
  },
  {
    id: 'cons-b1-delay',
    title: 'Correo de Demora de Cimientos y Nueva Fecha Límite (B1)',
    description: 'Escribe un correo formal al cliente explicando un retraso por lluvias en los cimientos.',
    scenario: 'Debido a fuertes lluvias en Villavicencio, el vaciado de los cimientos se ha retrasado. Escribe un correo formal en inglés al cliente explicando la situación, asegurando que se mantiene la seguridad y proponiendo una nueva fecha límite de entrega.',
    requirements: [
      'Redacta un texto formal de mínimo 70 palabras.',
      'Usa términos técnicos como cimientos (foundation) y fecha límite (deadline).',
      'Explica la causa del retraso (heavy rains) y los pasos a seguir.'
    ],
    vocabulary: ['foundation', 'deadline', 'delay', 'due to', 'postpone', 'schedule'],
    industry: 'construccion',
    level: 'B1',
    xp: 80,
    hint: 'Pista del Coach 👷‍♂️ (Estructura de apoyo):\n"Dear client, I am writing to inform you about a delay in our schedule due to heavy rains. We must postpone the concrete pouring for the foundation to ensure absolute safety. Consequently, the new deadline for the project will be adjusted. Thank you for your understanding."'
  },
  {
    id: 'cons-b2-incident',
    title: 'Reporte Técnico de Incidente y Plan de Mitigación (B2)',
    description: 'Redacta un reporte técnico de incidente en la estructura de soporte de la obra.',
    scenario: 'Ocurrió un fallo menor en un andamio de carga que detuvo las labores en el sector este. Como ingeniero residente, debes redactar un reporte técnico contundente en inglés dirigido a la junta técnica de la constructora describiendo el incidente, las medidas tomadas y el plan para no comprometer los cimientos del edificio.',
    requirements: [
      'Escribe un reporte profesional y detallado de mínimo 100-120 palabras.',
      'Menciona andamiaje (scaffolding), cimientos (foundation), y medidas de mitigación.',
      'Escribe con un tono formal y técnico de ingeniería.'
    ],
    vocabulary: ['scaffolding', 'foundation', 'mitigation plan', 'failure', 'structural integrity', 'corrective actions'],
    industry: 'construccion',
    level: 'B2',
    xp: 100,
    hint: 'Pista del Coach 👷‍♂️ (Guía de redacción):\nInicia con un resumen ejecutivo ("This report details the failure occurred in..."). Luego explica el incidente en el "scaffolding", confirma que la integridad estructural de la "foundation" no se vio comprometida, y finaliza presentando las "corrective actions" del "mitigation plan" para reanudar operaciones de forma segura.'
  },

  // --- TECNOLOGÍA ---
  {
    id: 'tech-a1-db',
    title: 'Reporte de Fallo en Base de Datos (A1)',
    description: 'Escribe una nota corta en Slack informando un problema para conectar con la base de datos.',
    scenario: 'Estás desarrollando y el servidor no conecta con la base de datos. Redacta un mensaje en inglés para tus compañeros de equipo pidiendo ayuda.',
    requirements: [
      'Usa al menos 25 palabras.',
      'Menciona base de datos (database) y conexión (connection).',
      'Indica que necesitas ayuda.'
    ],
    vocabulary: ['database', 'connection', 'error', 'help', 'not working'],
    industry: 'tecnologia',
    level: 'A1',
    xp: 40,
    hint: 'Pista del Coach 💻 (Puedes guiarte con esta plantilla de ayuda):\n"Hi team, I have a big error in the project. The database connection is not working. The local server is down. Please help me with this issue. Thanks!"'
  },
  {
    id: 'tech-a2-compile',
    title: 'Error de Compilación en Servidor Local (A2)',
    description: 'Escribe un correo corto informando que el código no compila en tu máquina local.',
    scenario: 'Acabas de bajar los últimos cambios del repositorio, pero el proyecto no compila. Redacta un reporte en inglés para el líder técnico describiendo el fallo.',
    requirements: [
      'Escribe al menos 40 palabras.',
      'Menciona compilar (compile) y código (code).',
      'Describe qué comando corriste.'
    ],
    vocabulary: ['compile', 'code', 'repository', 'local server', 'failed'],
    industry: 'tecnologia',
    level: 'A2',
    xp: 60,
    hint: 'Pista del Coach 💻 (Puedes guiarte con esta plantilla de ayuda):\n"Hello team, I downloaded the new changes from the repository. However, the code does not compile on my local server. The command failed during the build process. Can you help me review the packages? Thank you."'
  },
  {
    id: 'tech-b1-deploy',
    title: 'Documentación de Despliegue en Vercel (B1)',
    description: 'Escribe una guía rápida documentando los pasos para el despliegue del proyecto.',
    scenario: 'El proyecto ya está listo para producción. Escribe una documentación técnica en inglés en el README explicándole al equipo los pasos para realizar el despliegue en Vercel, y cómo se configuran las variables de entorno para la base de datos.',
    requirements: [
      'Redacta un texto técnico y claro de mínimo 70 palabras.',
      'Usa palabras como despliegue (deployment), framework y base de datos (database).',
      'Detalla los pasos de forma lógica y ordenada.'
    ],
    vocabulary: ['deployment', 'database', 'framework', 'environment variables', 'live', 'production'],
    industry: 'tecnologia',
    level: 'B1',
    xp: 80,
    hint: 'Pista del Coach 💻 (Estructura de apoyo):\n"To prepare the deployment for production, follow these steps. First, ensure the framework configuration is correct. Second, configure the database environment variables in Vercel. Finally, run the build command to trigger the deployment. Once completed, the local server code will be live on production."'
  },
  {
    id: 'tech-b2-postmortem',
    title: 'Reporte Técnico Post-Mortem de Caída de Servidores (B2)',
    description: 'Escribe un análisis post-mortem formal detallando un incidente en producción.',
    scenario: 'Ayer los servidores de producción estuvieron caídos por 20 minutos debido a una sobrecarga de consultas en la base de datos que bloqueó la compilación de caché. Redacta un reporte post-mortem profesional en inglés para el Director de TI explicando la causa raíz y las acciones preventivas implementadas.',
    requirements: [
      'Redacta un reporte riguroso de mínimo 100-120 palabras.',
      'Usa terminología técnica: database, framework, deployment, query optimization, downtime.',
      'Mantén una estructura profesional: Incident, Root Cause, Mitigation.'
    ],
    vocabulary: ['root cause', 'database bottleneck', 'downtime', 'cache compilation', 'query optimization', 'preventive measures'],
    industry: 'tecnologia',
    level: 'B2',
    xp: 100,
    hint: 'Pista del Coach 💻 (Estructura de apoyo):\nOrganiza tu reporte en tres subtítulos técnicos:\n1. **Incident Summary:** Describe los 20 minutos de "downtime" en producción.\n2. **Root Cause Analysis:** Explica el "database bottleneck" ocasionado por la sobrecarga y el bloqueo de "cache compilation".\n3. **Preventive Actions:** Presenta la "query optimization" y el monitoreo adicional implementados como "preventive measures" de alto nivel.'
  },

  // --- NEGOCIOS ---
  {
    id: 'biz-a1-email',
    title: 'Correo de Saludo y Presentación (A1)',
    description: 'Escribe un correo electrónico corto presentándote con un nuevo cliente.',
    scenario: 'Acabas de recibir la asignación de una nueva cuenta. Escribe un correo en inglés saludando al cliente, presentándote con tu nombre y tu rol.',
    requirements: [
      'Usa al menos 25 palabras.',
      'Saluda formalmente (Hello / Dear).',
      'Preséntate y di que estás para servirle.'
    ],
    vocabulary: ['Dear', 'my name is', 'assistant', 'nice to meet you', 'contact me'],
    industry: 'negocios',
    level: 'A1',
    xp: 40,
    hint: 'Pista del Coach 💼 (Puedes guiarte con esta plantilla de ayuda):\n"Dear client, my name is Manuel. I am your business assistant for J&M Tech Solutions. Nice to meet you. Please contact me if you have any questions. Best regards!"'
  },
  {
    id: 'biz-a2-meeting',
    title: 'Convocatoria de Reunión de Avance (A2)',
    description: 'Escribe un correo corto invitando a tu equipo a una reunión urgente de seguimiento.',
    scenario: 'Necesitas revisar los avances comerciales de la semana. Escribe un correo en inglés convocando a una reunión rápida, indicando el día, la hora y el tema a tratar.',
    requirements: [
      'Escribe al menos 40 palabras.',
      'Menciona reunión (meeting) y agenda.',
      'Indica que la asistencia es importante.'
    ],
    vocabulary: ['meeting', 'schedule', 'agenda', 'update', 'discuss'],
    industry: 'negocios',
    level: 'A2',
    xp: 60,
    hint: 'Pista del Coach 💼 (Puedes guiarte con esta plantilla de ayuda):\n"Hi team, I want to schedule a brief meeting tomorrow morning. The agenda is to discuss the commercial updates of the week. Please check your schedule and attend. Your presence is very important for the team. Thank you!"'
  },
  {
    id: 'biz-b1-proposal',
    title: 'Propuesta Comercial y Cotización de SaaS (B1)',
    description: 'Redacta una propuesta comercial preliminar detallando precios y alcances.',
    scenario: 'Un cliente en Colombia está interesado en adquirir una licencia comercial de automatización de LingoBridge. Escribe un correo formal en inglés detallando la propuesta de precios ($65.000 COP individual, $280.000 COP institucional) y los plazos de entrega.',
    requirements: [
      'Escribe un correo de ventas persuasivo de mínimo 70 palabras.',
      'Usa términos como acuerdo (agreement) y fecha límite (deadline).',
      'Presenta los costos de suscripción de forma clara.'
    ],
    vocabulary: ['agreement', 'deadline', 'subscription model', 'pricing options', 'proposal', 'deliverables'],
    industry: 'negocios',
    level: 'B1',
    xp: 80,
    hint: 'Pista del Coach 💼 (Estructura de apoyo):\n"Dear client, I am sending you our official commercial proposal for JyM LingoBridge. We offer flexible pricing options: an individual subscription model for $65,000 COP monthly, and an institutional plan for $280,000 COP. We aim to sign the agreement this week, and our team will deliver the software before the requested deadline. Please let me know your thoughts."'
  },
  {
    id: 'biz-b2-negotiation',
    title: 'Carta Formal de Negociación y Cierre de Contrato (B2)',
    description: 'Redacta un correo electrónico formal negociando las cláusulas de responsabilidad de un acuerdo.',
    scenario: 'El equipo legal de un cliente ha solicitado modificar la cláusula de penalidad por demoras. Como gerente comercial, redacta un correo formal en inglés negociando un balance razonable, defendiendo la fecha límite original, y proponiendo redactar el acuerdo de forma de beneficio mutuo.',
    requirements: [
      'Redacta una carta de negocios formal y persuasiva de mínimo 120 palabras.',
      'Usa conceptos comerciales: agreement, deadline, liability, mutual benefit, penalty clauses.',
      'Emplea lenguaje diplomático y de alta negociación.'
    ],
    vocabulary: ['agreement', 'deadline', 'liability clause', 'mutual agreement', 'terms and conditions', 'mitigate risks'],
    industry: 'negocios',
    level: 'B2',
    xp: 100,
    hint: 'Pista del Coach 💼 (Estructura de apoyo):\nUtiliza una estructura de negociación diplomática:\n1. **Acknowledge:** Agradece su interés y valida la preocupación de sus abogados respecto a la "liability clause".\n2. **Counter-proposal:** Propón un tope de penalidad razonable que mitigue riesgos para ambos ("mitigate risks") pero manteniendo la "deadline" original como base.\n3. **Close:** Enfatiza que firmar este "agreement" será de beneficio mutuo ("mutual benefit") y solicita una breve llamada para definir los "terms and conditions" finales.'
  }
];
