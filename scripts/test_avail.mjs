import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/web/.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: companies, error } = await supabase.from('companies').select('id, company_name, availability').limit(5);
  if (error) console.error(error);
  else console.log(JSON.stringify(companies, null, 2));
}
run();
