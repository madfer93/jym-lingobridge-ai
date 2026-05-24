-- ====================================================================
-- ESQUEMA DE BASE DE DATOS PARA JYM LINGOBRIDGE AI
-- ====================================================================
-- Ejecuta este script en el editor SQL de Supabase para inicializar las tablas.

-- 1. TABLA DE PERFILES DE USUARIO (Conexión con Supabase Auth)
CREATE TABLE IF NOT EXISTS perfiles_usuario (
    id UUID PRIMARY KEY, -- Debe mapear al auth.uid() de Supabase
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    nivel_cefr TEXT DEFAULT 'A1' CHECK (nivel_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    enfoque_industria TEXT DEFAULT 'general' CHECK (enfoque_industria IN ('general', 'construccion', 'tecnologia', 'negocios')),
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS (Row Level Security) para perfiles
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- Crear políticas para perfiles (idempotente)
DROP POLICY IF EXISTS "Permitir lectura de perfil propio" ON perfiles_usuario;
CREATE POLICY "Permitir lectura de perfil propio" ON perfiles_usuario
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Permitir inserción de perfil propio" ON perfiles_usuario;
CREATE POLICY "Permitir inserción de perfil propio" ON perfiles_usuario
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Permitir modificación de perfil propio" ON perfiles_usuario;
CREATE POLICY "Permitir modificación de perfil propio" ON perfiles_usuario
    FOR UPDATE USING (auth.uid() = id);



-- 2. TABLA DE GLOSARIO DE TÉRMINOS CONTEXTUALIZADO (Cambridge/Oxford)
CREATE TABLE IF NOT EXISTS glosario_terminos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    palabra TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('verbo', 'sustantivo', 'adjetivo', 'adverbio', 'frase')),
    traduccion TEXT NOT NULL,
    pronunciacion TEXT, -- Pronunciación fonética figurada amigable para hispanohablantes (ej. /biy-úte-ful/)
    ejemplo_ingles TEXT NOT NULL,
    ejemplo_espanol TEXT NOT NULL,
    industria TEXT DEFAULT 'general' CHECK (industria IN ('general', 'construccion', 'tecnologia', 'negocios')),
    nivel_cefr TEXT DEFAULT 'A1' CHECK (nivel_cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertar Glosario Inicial de Construcción (Para tu cliente) y Tecnología (Para jóvenes)
INSERT INTO glosario_terminos (palabra, categoria, traduccion, pronunciacion, ejemplo_ingles, ejemplo_espanol, industria, nivel_cefr)
VALUES 
-- Construcción A1-A2
('Blueprint', 'sustantivo', 'Plano o diseño arquitectónico', '/blú-print/', 'The architect modified the blueprint of the building.', 'El arquitecto modificó el plano del edificio.', 'construccion', 'A1'),
('Concrete', 'sustantivo', 'Hormigón o concreto', '/cón-crit/', 'The workers poured concrete for the foundation.', 'Los trabajadores vertieron concreto para los cimientos.', 'construccion', 'A1'),
('Scaffolding', 'sustantivo', 'Andamio o andamiaje', '/scá-fol-ding/', 'Ensure the scaffolding is safe before climbing.', 'Asegúrate de que el andamio sea seguro antes de subir.', 'construccion', 'A2'),
('Brick', 'sustantivo', 'Ladrillo', '/brik/', 'He laid the bricks to build the wall.', 'Él colocó los ladrillos para construir la pared.', 'construccion', 'A1'),
('Foundation', 'sustantivo', 'Cimientos o cimentación', '/faun-déi-shon/', 'A solid building needs a strong foundation.', 'Un edificio sólido necesita cimientos fuertes.', 'construccion', 'A2'),
('Safety helmet', 'sustantivo', 'Casco de seguridad', '/séi-fti hél-mit/', 'You must wear a safety helmet on the construction site.', 'Debes usar un casco de seguridad en la obra de construcción.', 'construccion', 'A1'),
('To build', 'verbo', 'Construir', '/tu bild/', 'They want to build a new shopping center.', 'Ellos quieren construir un nuevo centro comercial.', 'construccion', 'A1'),

-- Tecnología A1-A2
('Database', 'sustantivo', 'Base de datos', '/déi-ta-béis/', 'We store all student records in the database.', 'Guardamos todos los registros de los estudiantes en la base de datos.', 'tecnologia', 'A1'),
('Deployment', 'sustantivo', 'Despliegue o lanzamiento de software', '/di-plói-ment/', 'The deployment on Vercel was successful.', 'El despliegue en Vercel fue exitoso.', 'tecnologia', 'A2'),
('Framework', 'sustantivo', 'Marco de trabajo de desarrollo', '/fréim-uorc/', 'Next.js is a premium frontend framework.', 'Next.js es un framework frontend premium.', 'tecnologia', 'A2'),
('To compile', 'verbo', 'Compilar (código)', '/tu com-páil/', 'Go compiles into a single binary file.', 'Go se compila en un único archivo binario.', 'tecnologia', 'A2')
ON CONFLICT DO NOTHING;


-- 3. TABLA DE ORACIONES GUARDADAS (Tareas escolares o del SENA)
CREATE TABLE IF NOT EXISTS oraciones_guardadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES perfiles_usuario(id) ON DELETE CASCADE,
    oracion_original TEXT NOT NULL,
    oracion_deconstruida JSONB, -- Estructura en bloques sintácticos guardada para re-estudiar
    dificultad TEXT DEFAULT 'media' CHECK (dificultad IN ('baja', 'media', 'alta')),
    completada BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- 4. TABLA DE HISTORIAL DE PRÁCTICAS Y EVALUACIONES
CREATE TABLE IF NOT EXISTS historial_practicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES perfiles_usuario(id) ON DELETE CASCADE,
    tipo_practica TEXT NOT NULL CHECK (tipo_practica IN ('deconstructor', 'chat_tutor', 'glosario')),
    ejercicio TEXT NOT NULL,
    resultado TEXT NOT NULL CHECK (resultado IN ('aprobado', 'corregido')),
    retroalimentacion TEXT, -- Comentarios de corrección pedagógica de la IA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- 5. TABLA DE COMPRAS Y CONTROL DE PLANES COMERCIALES
CREATE TABLE IF NOT EXISTS compras_planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    plan_nombre TEXT NOT NULL CHECK (plan_nombre IN ('estudiante_mensual', 'institucional_anual')),
    monto NUMERIC NOT NULL,
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'cancelado', 'expirado')),
    fecha_compra TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- 6. CONFIGURACIÓN DE PASARELAS DE PAGO (Wompi)
CREATE TABLE IF NOT EXISTS configuracion_pasarela (
    key_name TEXT PRIMARY KEY,
    key_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- 7. CLAVES DE API DE GROQ EN CALIENTE (Para rotación ilimitada)
CREATE TABLE IF NOT EXISTS configuracion_groq_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_value TEXT UNIQUE NOT NULL,
    key_label TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

