import 'dotenv/config';
import { runETL } from './mutual-funds-etl.js';

/**
 * Complete Dataset Import Script for Mutual Funds & ETFs
 * 
 * This script downloads the complete dataset from Kaggle and imports
 * ALL records into Supabase (9,495 ETFs + 57,603 Mutual Funds)
 * 
 * Usage: npx ts-node src/integrations/data/sample-import.ts
 * 
 * Environment Variables:
 *   - KAGGLE_USERNAME: Your Kaggle username
 *   - KAGGLE_API_KEY: Your Kaggle API key
 *   - SUPABASE_URL: Your Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY: Supabase credentials
 */

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Mutual Funds & ETFs - Complete Kaggle to Supabase Import ║');
  console.log('║                                                          ║');
  console.log('║  Dataset: Morningstar European Funds                     ║');
  console.log('║  ETFs: ~9,495 | Mutual Funds: ~57,603                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  try {
    console.log('⏱️  Starting import... (this may take several minutes)');
    const startTime = Date.now();
    
    const result = await runETL();
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 IMPORT COMPLETE - STATISTICS');
    console.log('═'.repeat(60));
    console.log(`   ✅ ETFs imported:              ${result.etfsImported.toLocaleString()}`);
    console.log(`   ✅ Mutual Funds imported:      ${result.fundsImported.toLocaleString()}`);
    console.log(`   ✅ Total records imported:     ${(result.etfsImported + result.fundsImported).toLocaleString()}`);
    console.log(`   ⏱️  Duration:                   ${duration} minutes`);
    console.log('═'.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error instanceof Error ? error.message : error);
    console.error('\nTroubleshooting:');
    console.error('1. Verify KAGGLE_USERNAME and KAGGLE_API_KEY are set in .env');
    console.error('2. Verify SUPABASE_URL and credentials are set in .env');
    console.error('3. Ensure the etfs and mutual_funds tables exist in Supabase');
    console.error('4. Check that you have RLS policies allowing inserts');
    process.exit(1);
  }
}

main();
