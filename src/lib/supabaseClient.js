// src/lib/supabaseClient.js
// ──────────────────────────────────────────────────────────────
// Inicializa y exporta el cliente de Supabase.
// Las credenciales se leen desde las variables de entorno de Vite
// definidas en el archivo .env de la raíz del proyecto.
// ──────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan variables de entorno de Supabase. " +
    "Verifica que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén en tu archivo .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
