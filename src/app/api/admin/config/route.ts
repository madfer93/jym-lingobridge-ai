import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// En este endpoint, idealmente usaríamos el cliente con SUPABASE_SERVICE_ROLE_KEY
// si la tabla configuracion_pasarela o configuracion_groq_keys requiere bypass de RLS.
// Para este entorno, usaremos el cliente normal y permitiremos actualizar si el usuario es admin.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'wompi') {
      const { data, error } = await supabase
        .from('configuracion_pasarela')
        .select('*');
      
      if (error && error.code === '42P01') {
        return NextResponse.json({ config: {} }, { status: 200 }); // Tabla no existe, fallback seguro
      } else if (error) {
        throw error;
      }
      
      const config = (data || []).reduce((acc: any, row: any) => {
        acc[row.key_name] = row.key_value;
        return acc;
      }, {});
      
      return NextResponse.json({ config });
    }

    if (type === 'groq') {
      const { data, error } = await supabase
        .from('configuracion_groq_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code === '42P01') {
        return NextResponse.json({ keys: [] }, { status: 200 }); // Tabla no existe, fallback seguro
      } else if (error) {
        throw error;
      }

      return NextResponse.json({ keys: data || [] });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

  } catch (err: any) {
    console.error('Error fetching config:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, payload } = await request.json();

    if (type === 'wompi') {
      const upserts = Object.keys(payload).map(key => ({
        key_name: key,
        key_value: payload[key],
        updated_at: new Date().toISOString()
      }));

      if (upserts.length > 0) {
        const { error } = await supabase
          .from('configuracion_pasarela')
          .upsert(upserts, { onConflict: 'key_name' });
        
        if (error) {
          if (error.code === '42P01') {
             return NextResponse.json({ error: 'La tabla configuracion_pasarela no existe. Por favor ejecuta el script SQL en Supabase.' }, { status: 400 });
          }
          throw error;
        }
      }
      return NextResponse.json({ success: true });
    }

    if (type === 'groq_add') {
      const { key_value, key_label } = payload;
      const { error } = await supabase
        .from('configuracion_groq_keys')
        .insert([{ key_value, key_label, activo: true }]);

      if (error) {
          if (error.code === '42P01') {
             return NextResponse.json({ error: 'La tabla configuracion_groq_keys no existe. Ejecuta el SQL.' }, { status: 400 });
          }
          throw error;
      }
      return NextResponse.json({ success: true });
    }

    if (type === 'groq_toggle') {
      const { id, activo } = payload;
      const { error } = await supabase
        .from('configuracion_groq_keys')
        .update({ activo })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (type === 'groq_delete') {
      const { id } = payload;
      const { error } = await supabase
        .from('configuracion_groq_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err: any) {
    console.error('Error saving config:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
