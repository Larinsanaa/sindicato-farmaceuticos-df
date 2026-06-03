import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY) precisam estar definidos em backend/.env'
  );
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

export const supabase = createClient(supabaseUrl, supabaseKey);
