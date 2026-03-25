
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Usando ANON_KEY que parece ser SERVICE_ROLE no JWT

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTags() {
    const { data, error } = await supabase.from('services').select('category_tag, subcategory');
    if (error) {
        console.error(error);
        return;
    }
    const cats = new Set(data.map(d => d.category_tag));
    const subcats = new Set(data.map(d => d.subcategory));
    console.log('Categorias no DB:', Array.from(cats));
    console.log('Subcategorias no DB:', Array.from(subcats));
}

checkTags();
