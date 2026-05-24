export interface ExamQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SectorExam {
  questions: ExamQuestion[];
}

export const examsData: Record<string, Record<string, SectorExam>> = {
  construccion: {
    A1: {
      questions: [
        {
          question: '¿Qué significa el término técnico "Blueprint" en una obra?',
          options: ['Un casco de color azul', 'El plano o diseño arquitectónico', 'Un bloque de cemento curado'],
          correctIndex: 1,
          explanation: '"Blueprint" es el plano o diseño de construcción que guía la obra.'
        },
        {
          question: 'Completa la oración: "The operator is wearing a safety __________ on site."',
          options: ['helmet', 'computer', 'brick'],
          correctIndex: 0,
          explanation: 'En las obras se debe usar obligatoriamente el "safety helmet" (casco de seguridad).'
        },
        {
          question: '¿Cuál es la traducción correcta de "Concrete" en el sector de la construcción?',
          options: ['Ladrillo macizo', 'Cimientos del edificio', 'Concreto u hormigón'],
          correctIndex: 2,
          explanation: '"Concrete" es concreto u hormigón, el material básico para estructuras.'
        },
        {
          question: 'Completa la entrega: "Hi boss, we __________ the bricks on site today."',
          options: ['poured', 'received', 'wore'],
          correctIndex: 1,
          explanation: '"Received" (recibimos) es la acción de recibir los ladrillos en la obra.'
        },
        {
          question: '¿Cómo se dice "El andamio está listo" en inglés?',
          options: ['The foundation is ready.', 'The concrete is ready.', 'The scaffolding is ready.'],
          correctIndex: 2,
          explanation: '"Scaffolding" es andamio o andamiaje en inglés.'
        }
      ]
    },
    A2: {
      questions: [
        {
          question: '¿Qué significa "Foundation" en la construcción de una torre?',
          options: ['El andamio metálico', 'Los cimientos o cimentación', 'La instalación eléctrica'],
          correctIndex: 1,
          explanation: '"Foundation" representa los cimientos que soportan toda la estructura de la edificación.'
        },
        {
          question: 'Completa: "Before climbing, make sure the scaffolding is __________."',
          options: ['wet', 'secure', 'heavy'],
          correctIndex: 1,
          explanation: 'Por normas de seguridad, el andamiaje debe estar "secure" (seguro/fijo) antes de subir.'
        },
        {
          question: '¿Qué traduce "Safety norms" en un proyecto civil?',
          options: ['Herramientas manuales', 'Cascos y guantes', 'Normas o regulaciones de seguridad'],
          correctIndex: 2,
          explanation: '"Safety norms" son las regulaciones obligatorias de seguridad en el trabajo.'
        },
        {
          question: 'Completa: "The crew will __________ concrete for the main columns tomorrow."',
          options: ['pour', 'build', 'inspect'],
          correctIndex: 0,
          explanation: '"Pour concrete" es la expresión técnica para verter o vaciar concreto.'
        },
        {
          question: '¿Qué elemento de protección personal es "Safety goggles"?',
          options: ['Botas con puntera de acero', 'Gafas de seguridad', 'Arnés de cuerpo completo'],
          correctIndex: 1,
          explanation: '"Safety goggles" son las gafas de protección para los ojos.'
        }
      ]
    },
    B1: {
      questions: [
        {
          question: '¿Qué significa "Due to heavy rains, we must postpone the concrete pouring"?',
          options: [
            'Debido a fuertes lluvias, debemos verter más concreto rápido.',
            'Debido a fuertes lluvias, debemos posponer el vaciado de concreto.',
            'Por el calor pesado, debemos enfriar el concreto con agua.'
          ],
          correctIndex: 1,
          explanation: '"Due to" significa debido a, "postpone" posponer y "concrete pouring" vaciado de concreto.'
        },
        {
          question: 'Completa la oración: "We need to adjust the __________ to meet the client\'s new deadline."',
          options: ['bricks', 'helmet', 'schedule'],
          correctIndex: 2,
          explanation: '"Schedule" es el cronograma o calendario del proyecto que debe ajustarse.'
        },
        {
          question: '¿Qué traduce "Structural failure"?',
          options: ['Fallo estructural en el soporte o cimientos', 'Despido de trabajadores de obra', 'Demora en la entrega del cemento'],
          correctIndex: 0,
          explanation: '"Structural failure" es la falla o colapso estructural de algún elemento de la obra.'
        },
        {
          question: 'Completa: "The engineers inspected the columns and confirmed they are __________."',
          options: ['delayed', 'stable', 'postponed'],
          correctIndex: 1,
          explanation: '"Stable" (estables) describe la condición estructural segura de las columnas tras ser inspeccionadas.'
        },
        {
          question: '¿Qué significa "Mitigation plan" en un informe de incidente?',
          options: ['Plan de mitigación o medidas para reducir riesgos', 'El presupuesto de compra de ladrillos', 'El diseño estético de los planos'],
          correctIndex: 0,
          explanation: 'Un "mitigation plan" contiene las acciones técnicas para minimizar un riesgo o problema.'
        }
      ]
    },
    B2: {
      questions: [
        {
          question: '¿Qué significa "Ensure the structural integrity of the foundation is not compromised"?',
          options: [
            'Verificar que el andamio soporte el peso de los ladrillos.',
            'Asegurar que la integridad estructural de los cimientos no esté comprometida.',
            'Planificar el vaciado de concreto en los niveles superiores del edificio.'
          ],
          correctIndex: 1,
          explanation: '"Structural integrity" es integridad estructural y "foundation" son los cimientos.'
        },
        {
          question: 'Completa técnicamente: "To mitigate risks, we will perform a load-bearing __________ on the columns."',
          options: ['calculation', 'analysis', 'pouring'],
          correctIndex: 1,
          explanation: '"Load-bearing analysis" es el análisis de soporte de carga técnica de una estructura.'
        },
        {
          question: '¿Qué significa "Corrective actions" en un reporte de interventoría?',
          options: ['Las multas de dinero al contratista', 'Acciones correctivas ante incidentes o no conformidades', 'El manual de uso del casco y arnés'],
          correctIndex: 1,
          explanation: '"Corrective actions" son las medidas técnicas obligatorias tomadas para solucionar un fallo o desviación.'
        },
        {
          question: 'Completa: "We need to reinforce the retaining walls to withstand the soil __________."',
          options: ['safety', 'pressure', 'alignment'],
          correctIndex: 1,
          explanation: '"Soil pressure" es la presión de empuje de tierra que soportan los muros de contención.'
        },
        {
          question: '¿Qué significa "Liability clause" en un contrato de obra civil?',
          options: ['Cláusula de responsabilidad legal por daños o retrasos', 'La sección que describe la mezcla de concreto', 'El seguro de salud de los albañiles'],
          correctIndex: 0,
          explanation: 'La "liability clause" define la responsabilidad legal y penalidades en contratos de ingeniería.'
        }
      ]
    }
  },
  tecnologia: {
    A1: {
      questions: [
        {
          question: '¿Qué significa "Database" en el desarrollo de software?',
          options: ['Un computador lento', 'Una base de datos para guardar información', 'El cable de red de internet'],
          correctIndex: 1,
          explanation: '"Database" es base de datos, el lugar donde se almacenan registros.'
        },
        {
          question: 'Completa: "The server is down because there is a database __________ error."',
          options: ['connection', 'helmet', 'scaffolding'],
          correctIndex: 0,
          explanation: 'Un "connection error" representa una falla para conectar con la base de datos.'
        },
        {
          question: '¿Qué significa "Help me, the server is not working"?',
          options: ['El servidor funciona bien.', 'Ayúdame, el servidor no está funcionando.', 'El código ya compiló correctamente.'],
          correctIndex: 1,
          explanation: '"Help me" es ayúdame y "not working" es no funciona.'
        },
        {
          question: 'Completa la nota: "Hi team, please help. The local __________ is down."',
          options: ['concrete', 'server', 'layout'],
          correctIndex: 1,
          explanation: 'En desarrollo local, nos referimos al "local server" (servidor local).'
        },
        {
          question: '¿Qué significa "Error" en un reporte de consola?',
          options: ['Compilación correcta', 'Un fallo o error en el programa', 'Una alerta de éxito'],
          correctIndex: 1,
          explanation: '"Error" representa una anomalía o falla detectada en el software.'
        }
      ]
    },
    A2: {
      questions: [
        {
          question: '¿Qué significa "To compile the code" en el ámbito de desarrollo?',
          options: ['Subir el código a GitHub', 'Compilar el código (traducirlo a binario)', 'Borrar el código erróneo'],
          correctIndex: 1,
          explanation: '"To compile" es compilar, traducir el código fuente escrito por el humano a lenguaje máquina.'
        },
        {
          question: 'Completa: "I downloaded the new changes from the Git __________."',
          options: ['repository', 'concrete', 'foundation'],
          correctIndex: 0,
          explanation: 'Los cambios se descargan desde el "repository" (repositorio) de Git.'
        },
        {
          question: '¿Qué es "Deployment" en el ciclo de vida del software?',
          options: ['El diseño de las pantallas', 'El despliegue o lanzamiento de la aplicación a producción', 'La reunión diaria del equipo'],
          correctIndex: 1,
          explanation: '"Deployment" es el despliegue de código para que esté en vivo en internet.'
        },
        {
          question: 'Completa: "The build command __________ on the cloud server today."',
          options: ['poured', 'failed', 'secured'],
          correctIndex: 1,
          explanation: '"Failed" (falló) describe un comando de compilación que generó un error.'
        },
        {
          question: '¿Qué significa "Framework"?',
          options: ['El marco de trabajo o entorno de desarrollo', 'La pantalla de mi computador', 'La base de datos relacional'],
          correctIndex: 0,
          explanation: 'Un "framework" es una estructura o marco de desarrollo de código (como Next.js o React).'
        }
      ]
    },
    B1: {
      questions: [
        {
          question: '¿Qué significa "We need to configure the database environment variables"?',
          options: [
            'Necesitamos borrar las variables del computador.',
            'Necesitamos configurar las variables de entorno de la base de datos.',
            'Debemos mudar la base de datos a un servidor local.'
          ],
          correctIndex: 1,
          explanation: '"Environment variables" son las variables de entorno donde se guardan claves secretas.'
        },
        {
          question: 'Completa: "Once the pipeline finishes, the software will be __________ on production."',
          options: ['delayed', 'live', 'wore'],
          correctIndex: 1,
          explanation: '"Live" (en vivo) significa que la aplicación está funcionando y activa para usuarios.'
        },
        {
          question: '¿Qué es "Production environment"?',
          options: ['El computador del programador', 'El entorno de producción real para usuarios finales', 'La base de datos de pruebas'],
          correctIndex: 1,
          explanation: '"Production" es el entorno real de cara al público general en internet.'
        },
        {
          question: 'Completa: "We had a severe server __________ that lasted for 10 minutes."',
          options: ['downtime', 'scaffolding', 'pouring'],
          correctIndex: 0,
          explanation: '"Downtime" es el tiempo de caída o inactividad no planificada de un servidor.'
        },
        {
          question: '¿Qué significa "Root cause" en un reporte post-mortem?',
          options: ['El código más importante del proyecto', 'La causa raíz o el origen del problema', 'Las variables que se borraron'],
          correctIndex: 1,
          explanation: '"Root cause" es el origen primario de la falla técnica analizada.'
        }
      ]
    },
    B2: {
      questions: [
        {
          question: '¿Qué significa "We experienced a database bottleneck due to unoptimized queries"?',
          options: [
            'Tuvimos un cuello de botella en la base de datos debido a consultas no optimizadas.',
            'El servidor local se cayó porque el andamio estructural falló.',
            'La base de datos se borró por un script de pruebas ejecutado en producción.'
          ],
          correctIndex: 0,
          explanation: '"Database bottleneck" es cuello de botella y "unoptimized queries" son consultas mal optimizadas.'
        },
        {
          question: 'Completa técnicamente: "To improve performance, we must implement query __________."',
          options: ['pouring', 'optimization', 'compilation'],
          correctIndex: 1,
          explanation: '"Query optimization" es la optimización de consultas SQL para agilizar las respuestas.'
        },
        {
          question: '¿Qué es "Cache compilation"?',
          options: ['Guardar variables de entorno en Git', 'Compilación u organización de datos en caché para carga veloz', 'Borrar la memoria RAM del servidor'],
          correctIndex: 1,
          explanation: '"Cache compilation" es almacenar consultas procesadas en memoria de lectura rápida.'
        },
        {
          question: 'Completa: "We must implement preventive __________ to avoid future bottlenecks."',
          options: ['variables', 'measures', 'failures'],
          correctIndex: 1,
          explanation: '"Preventive measures" son medidas preventivas que se aplican para evitar futuras caídas.'
        },
        {
          question: '¿Qué significa "Scalability analysis" en un diseño de software cloud?',
          options: ['El cálculo de costos de las APIs', 'El análisis de escalabilidad para soportar millones de usuarios', 'El plano de andamios del servidor'],
          correctIndex: 1,
          explanation: 'La "scalability" es la capacidad del software de crecer ante el aumento masivo de demanda.'
        }
      ]
    }
  },
  negocios: {
    A1: {
      questions: [
        {
          question: '¿Qué significa "Dear client" en el encabezado de un correo?',
          options: ['Estimado cliente', 'Querido amigo', 'Hola a todos'],
          correctIndex: 0,
          explanation: '"Dear client" es el saludo formal estándar para dirigirse a un cliente por escrito.'
        },
        {
          question: 'Completa: "Nice to meet you, my __________ is Manuel Madrid."',
          options: ['role', 'name', 'assistant'],
          correctIndex: 1,
          explanation: '"My name is" es la forma más común para presentarse formalmente.'
        },
        {
          question: '¿Qué significa "Please contact me if you have any questions"?',
          options: ['Por favor, llámame mañana temprano.', 'Por favor, contáctame si tienes alguna pregunta.', 'Por favor, firma el contrato hoy.'],
          correctIndex: 1,
          explanation: '"Contact me" es contáctame y "questions" son preguntas.'
        },
        {
          question: 'Completa la despedida formal: "Best __________, Manuel Madrid."',
          options: ['regards', 'meet', 'client'],
          correctIndex: 0,
          explanation: '"Best regards" significa atentamente o cordiales saludos.'
        },
        {
          question: '¿Qué es "Business assistant"?',
          options: ['Gerente comercial', 'Asistente de negocios o comercial', 'El cliente del proyecto'],
          correctIndex: 1,
          explanation: '"Business assistant" es asistente comercial o de negocios.'
        }
      ]
    },
    A2: {
      questions: [
        {
          question: '¿Qué significa "To schedule a meeting"?',
          options: ['Cancelar una reunión', 'Agendar o programar una reunión', 'Grabar una llamada'],
          correctIndex: 1,
          explanation: '"Schedule" es agendar/programar y "meeting" es reunión.'
        },
        {
          question: 'Completa: "The __________ of the meeting is to discuss the weekly updates."',
          options: ['agenda', 'helmet', 'server'],
          correctIndex: 0,
          explanation: '"Agenda" es el orden del día o los puntos a tratar en una reunión.'
        },
        {
          question: '¿Qué significa "Your presence is very important"?',
          options: ['El proyecto ya terminó.', 'Tu presencia es muy importante.', 'Debes enviar el correo hoy.'],
          correctIndex: 1,
          explanation: '"Presence" es presencia y "important" es importante.'
        },
        {
          question: 'Completa: "We need to __________ the weekly sales report tomorrow."',
          options: ['discuss', 'compile', 'pour'],
          correctIndex: 0,
          explanation: '"Discuss" significa discutir, analizar o debatir sobre el reporte.'
        },
        {
          question: '¿Qué es "Weekly updates"?',
          options: ['Actualizaciones o novedades de la semana', 'El salario quincenal', 'La lista de precios'],
          correctIndex: 0,
          explanation: '"Weekly" es semanal y "updates" son actualizaciones o novedades.'
        }
      ]
    },
    B1: {
      questions: [
        {
          question: '¿Qué significa "We offer flexible pricing options and subscription models"?',
          options: [
            'Ofrecemos andamios flexibles para arriendo de obra.',
            'Ofrecemos opciones flexibles de precios y modelos de suscripción.',
            'Debemos negociar el contrato de soporte local.'
          ],
          correctIndex: 1,
          explanation: '"Pricing options" son opciones de precios y "subscription models" son modelos de suscripción.'
        },
        {
          question: 'Completa: "We are ready to sign the official commercial __________ today."',
          options: ['proposal', 'agreement', 'deadline'],
          correctIndex: 1,
          explanation: 'El documento oficial que se firma es el "agreement" (acuerdo/contrato).'
        },
        {
          question: '¿Qué son "Deliverables" en una propuesta comercial?',
          options: ['Las entregas físicas o entregables del proyecto', 'Los vehículos de reparto de material', 'Los correos enviados al cliente'],
          correctIndex: 0,
          explanation: '"Deliverables" representa los productos o servicios finales pactados a entregar.'
        },
        {
          question: 'Completa la fecha límite: "Please submit the proposal before the __________."',
          options: ['deadline', 'pricing', 'schedule'],
          correctIndex: 0,
          explanation: '"Deadline" es la fecha límite obligatoria de entrega.'
        },
        {
          question: '¿Qué significa "Commercial proposal"?',
          options: ['Una propuesta comercial o cotización de ventas', 'El contrato firmado por abogados', 'La lista de empleados de la agencia'],
          correctIndex: 0,
          explanation: '"Commercial proposal" es la cotización o propuesta comercial enviada a un prospecto.'
        }
      ]
    },
    B2: {
      questions: [
        {
          question: '¿Qué significa "We need to mitigate risks in the liability clause of the agreement"?',
          options: [
            'Necesitamos eliminar las penalidades del contrato comercial.',
            'Necesitamos mitigar riesgos en la cláusula de responsabilidad del acuerdo.',
            'Debemos firmar el acuerdo de beneficio mutuo antes de la fecha límite.'
          ],
          correctIndex: 1,
          explanation: '"Mitigate risks" es mitigar riesgos y "liability clause" es cláusula de responsabilidad legal.'
        },
        {
          question: 'Completa diplomáticamente: "Signing this contract will bring mutual __________ to both companies."',
          options: ['liability', 'benefit', 'penalty'],
          correctIndex: 1,
          explanation: '"Mutual benefit" representa un beneficio mutuo o ganancia para ambas partes.'
        },
        {
          question: '¿Qué significa "Terms and conditions" en un acuerdo legal?',
          options: ['Términos y condiciones o cláusulas contractuales', 'El manual técnico de la base de datos', 'La dirección física de las oficinas'],
          correctIndex: 0,
          explanation: '"Terms and conditions" son los términos y condiciones que rigen el contrato.'
        },
        {
          question: 'Completa la negociación: "To reach a mutual __________, we proposed a cap on delay penalties."',
          options: ['liability', 'agreement', 'pressure'],
          correctIndex: 1,
          explanation: '"Mutual agreement" es un acuerdo mutuo aceptado por las dos partes.'
        },
        {
          question: '¿Qué significa "Penalty clauses" en una negociación B2B?',
          options: ['Cláusulas de penalización o multas por incumplimiento', 'Las firmas de los gerentes', 'El tiempo de garantía del software'],
          correctIndex: 0,
          explanation: '"Penalty clauses" estipulan las multas económicas o sanciones si no se cumple el contrato.'
        }
      ]
    }
  }
};
