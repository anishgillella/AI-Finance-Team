// backend/data/sample-import.ts
import 'dotenv/config';
import { runETL } from './polygon-etl';

// Default stocks to import (100 stocks across all sectors)
const DEFAULT_SYMBOLS = [
  // Technology (15)
  'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'META', 'AMZN', 'NFLX', 'ADBE', 'CSCO',
  'INTC', 'AMD', 'CRM', 'INTU', 'AVGO',
  
  // Finance (15)
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'SCHW', 'CME', 'ICE', 'CBOE',
  'AXP', 'V', 'MA', 'DFS', 'PNC',
  
  // Healthcare (15)
  'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRNA', 'LILM', 'AMGN', 'GILD', 'REGN',
  'CVS', 'CI', 'ANTM', 'MRK', 'VRTX',
  
  // Energy (15)
  'XOM', 'CVX', 'COP', 'SLB', 'MPC', 'PSX', 'VLO', 'OXY', 'EOG', 'MUR',
  'DVN', 'FANG', 'CTRA', 'HAL', 'EQT',
  
  // Consumer (15)
  'PG', 'KO', 'PEP', 'WMT', 'TJX', 'MCD', 'SBUX', 'NKE', 'LULU', 'HD',
  'LOW', 'DRI', 'YUM', 'CMG', 'RCL',
  
  // Industrials (15)
  'BA', 'GE', 'CAT', 'LMT', 'RTX', 'HON', 'MMM', 'ITW', 'PH', 'URI',
  'NOC', 'ETN', 'VRSK', 'RHI', 'FLS',
  
  // Utilities & Real Estate (10)
  'NEE', 'DUK', 'SO', 'EXC', 'PEG', 'WELL', 'SPG', 'O', 'EQIX', 'PSA'
];

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║       Polygon.io Data Import to Supabase (Finance Schema)        ║
║                   Importing 100 Companies                         ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  // Check environment variables
  if (!process.env.POLYGON_API_KEY) {
    console.error('❌ POLYGON_API_KEY not set in .env file');
    console.error('Get your key from: https://polygon.io/dashboard');
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Supabase credentials not set in .env file');
    process.exit(1);
  }

  try {
    // Get symbols from command line args or use defaults
    const symbols = process.argv[2] 
      ? [process.argv[2]]
      : [
          // Technology (20)
          'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'META', 'AMZN', 'NFLX', 'ADBE', 'CSCO',
          'INTC', 'AMD', 'CRM', 'INTU', 'AVGO', 'PYPL', 'ASML', 'NOW', 'UBER', 'SPOT',
          // Finance (20)
          'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'SCHW', 'CME', 'ICE', 'CBOE',
          'AXP', 'V', 'MA', 'DFS', 'PNC', 'COF', 'SYF', 'SOFI', 'UPST', 'FISV',
          // Healthcare (20)
          'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRNA', 'AMGN', 'GILD', 'REGN', 'CVS',
          'CI', 'ANTM', 'MRK', 'VRTX', 'BIIB', 'CELG', 'ILMN', 'VEEV', 'DXCM', 'OKTA',
          // Energy (15)
          'XOM', 'CVX', 'COP', 'SLB', 'MPC', 'PSX', 'VLO', 'OXY', 'EOG', 'MUR',
          'DVN', 'FANG', 'CTRA', 'HAL', 'EQT',
          // Consumer (20)
          'PG', 'KO', 'PEP', 'WMT', 'TJX', 'MCD', 'SBUX', 'NKE', 'LULU', 'HD',
          'LOW', 'DRI', 'YUM', 'CMG', 'RCL', 'LVS', 'MAR', 'H', 'ABNB', 'EXPE',
          // Industrials (20)
          'BA', 'GE', 'CAT', 'LMT', 'RTX', 'HON', 'MMM', 'ITW', 'PH', 'URI',
          'NOC', 'ETN', 'VRSK', 'RHI', 'FLS', 'EMR', 'RSG', 'MSCI', 'ORCL', 'SHOP',
          // Utilities & Real Estate (15)
          'NEE', 'DUK', 'SO', 'EXC', 'PEG', 'WELL', 'SPG', 'O', 'EQIX', 'PSA',
          'ARE', 'VTR', 'VICI', 'PLD', 'DLR',
          // Additional Sectors (30+)
          'T', 'VZ', 'TMUS', 'CHTR', 'CMCSA', 'DISH', 'FOX', 'FOXA', 'FVRR', 'CRWD',
          'NET', 'FTNT', 'PANW', 'ZM', 'SNAP', 'PINS', 'TWTR', 'RBLX', 'U', 'COIN',
          'SQ', 'HOOD', 'PLTR', 'SNOW', 'DDOG', 'ESTC', 'FIVN', 'CCI', 'AMT', 'EQUINIX'
        ];

    console.log(`📋 Importing data for ${symbols.length} companies`);
    console.log(`📊 Limit: 100 rows per table\n`);

    // Run ETL
    const results = await runETL(symbols, 100);

    console.log(`\n╔═══════════════════════════════════════════════════════════════════╗`);
    console.log(`║                     ✅ IMPORT SUCCESSFUL!                         ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════════╝\n`);

    console.log(`📊 Final Results:`);
    console.log(`  ✅ Companies: ${results.companiesImported}`);
    console.log(`  ✅ Stock Prices: ${results.pricesImported}`);
    console.log(`  ✅ Dividends: ${results.dividendsImported}`);
    console.log(`  ✅ Stock Splits: ${results.splitsImported}`);
    console.log(`  ✅ News Articles: ${results.newsImported}`);

    console.log(`\n🔗 View your data in Supabase:`);
    console.log(`   ${process.env.SUPABASE_URL}/project/explorer`);

    console.log(`\n📚 Next Steps:`);
    console.log(`   1. Test queries: SELECT * FROM finance.companies LIMIT 5;`);
    console.log(`   2. Build semantic router on the schema`);
    console.log(`   3. Implement SQL generation from natural language`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();