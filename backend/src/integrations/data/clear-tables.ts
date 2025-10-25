import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

export async function clearETFsTable() {
  console.log('🗑️  Clearing ETFs table...');
  
  const { error } = await supabase
    .from('etfs')
    .delete()
    .neq('id', 0); // Delete all rows
  
  if (error) {
    console.error('❌ Error clearing ETFs table:', error);
    return false;
  }
  
  console.log('✅ ETFs table cleared');
  return true;
}

export async function clearMutualFundsTable() {
  console.log('🗑️  Clearing Mutual Funds table...');
  
  const { error } = await supabase
    .from('mutual_funds')
    .delete()
    .neq('id', 0); // Delete all rows
  
  if (error) {
    console.error('❌ Error clearing Mutual Funds table:', error);
    return false;
  }
  
  console.log('✅ Mutual Funds table cleared');
  return true;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Clearing Mutual Funds & ETFs Tables                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  try {
    const etfsCleared = await clearETFsTable();
    const fundsCleared = await clearMutualFundsTable();
    
    if (etfsCleared && fundsCleared) {
      console.log('\n✅ All tables cleared successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tables failed to clear');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
