import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: `${__dirname}/../.env` });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

async function clearTables() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  console.log('🗑️  Clearing finance schema tables...\n');
  
  try {
    const tables = ['company_news', 'stock_splits', 'stock_dividends', 'stock_prices', 'companies'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .neq('id', -999999);
      
      if (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    }
    
    console.log('\n📊 Verifying tables are empty...\n');
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`  ${table}: ${count} rows`);
    }
    
    console.log('\n✅ All tables cleared successfully!\n');
    
  } catch (error) {
    console.error('Error clearing tables:', error);
    process.exit(1);
  }
}

clearTables();
