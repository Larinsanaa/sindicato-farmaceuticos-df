import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_KEY?.trim();
const demoModeRequested = process.env.USE_DEMO_MODE === 'true';
const demoMode = demoModeRequested && (!supabaseUrl || !supabaseKey);

if (demoMode) {
  console.warn('AVISO: USE_DEMO_MODE=true e SUPABASE não configurado. O backend vai usar o modo demonstração.');
} else if (!supabaseUrl || !supabaseKey) {
  console.warn('AVISO: SUPABASE_URL/SUPABASE_KEY não encontrados. Defina o ambiente real ou ative USE_DEMO_MODE=true apenas para testes.');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    'AVISO: SUPABASE_SERVICE_ROLE_KEY não definido. O backend está usando SUPABASE_KEY anon, o que pode falhar se Row Level Security estiver habilitado.'
  );
}

export const jwtSecret = process.env.JWT_SECRET?.trim() || 'SUA_CHAVE_SECRETA_SUPER_SEGURA';

if (!process.env.JWT_SECRET) {
  console.warn(
    'AVISO: JWT_SECRET não definido. Usando segredo padrão para desenvolvimento. Defina JWT_SECRET em backend/.env.'
  );
}

export const isDemoMode = demoMode;
export const supabase = demoMode ? null : createClient(supabaseUrl, supabaseKey);
