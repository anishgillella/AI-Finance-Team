import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import MutualFundsDataFetcher from '../mutual-funds.js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

const fetcher = new MutualFundsDataFetcher();

const BATCH_SIZE = 500; // Insert in batches to avoid memory issues

export async function importETFs(etfs: any[]) {
  console.log(`\n📥 Importing ${etfs.length} ETFs to finance.etfs...`);
  
  if (etfs.length === 0) {
    console.log(`✅ No ETFs to import`);
    return 0;
  }

  let totalImported = 0;
  const batches = Math.ceil(etfs.length / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, etfs.length);
    const batch = etfs.slice(start, end);

    const dataToInsert = batch.map((etf: any) => ({
      isin: etf.isin || null,
      ticker: etf.ticker || null,
      name: etf.name || null,
      fund_family: etf.fund_family || null,
      fund_category: etf.fund_category || null,
      inception_date: etf.inception_date || null,
      expense_ratio: etf.expense_ratio ? parseFloat(etf.expense_ratio) : null,
      rating: etf.rating ? parseFloat(etf.rating) : null,
      return_ytd: etf.return_ytd ? parseFloat(etf.return_ytd) : null,
      return_1y: etf.return_1y ? parseFloat(etf.return_1y) : null,
      return_3y: etf.return_3y ? parseFloat(etf.return_3y) : null,
      return_5y: etf.return_5y ? parseFloat(etf.return_5y) : null,
      return_10y: etf.return_10y ? parseFloat(etf.return_10y) : null,
      nav_per_share: etf.nav_per_share ? parseFloat(etf.nav_per_share) : null,
      assets_under_management: etf.assets_under_management ? parseFloat(etf.assets_under_management) : null,
      stock_allocation: etf.stock_allocation ? parseFloat(etf.stock_allocation) : null,
      bond_allocation: etf.bond_allocation ? parseFloat(etf.bond_allocation) : null,
      cash_allocation: etf.cash_allocation ? parseFloat(etf.cash_allocation) : null,
      other_allocation: etf.other_allocation ? parseFloat(etf.other_allocation) : null,
      sharpe_ratio: etf.sharpe_ratio ? parseFloat(etf.sharpe_ratio) : null,
      standard_deviation: etf.standard_deviation ? parseFloat(etf.standard_deviation) : null,
      data_source: 'morningstar',
      raw_data: etf
    }));

    const { data, error } = await supabase
      .from('etfs')
      .insert(dataToInsert)
      .select();

    if (error) {
      console.error(`❌ Error importing ETFs batch ${i + 1}/${batches}:`, error);
      continue;
    }

    const batchCount = data?.length || 0;
    totalImported += batchCount;
    console.log(`   Batch ${i + 1}/${batches}: ✅ Imported ${batchCount} ETFs (${totalImported}/${etfs.length} total)`);
  }

  console.log(`✅ Total ETFs imported: ${totalImported}`);
  return totalImported;
}

export async function importMutualFunds(funds: any[]) {
  console.log(`\n📥 Importing ${funds.length} mutual funds to finance.mutual_funds...`);
  
  if (funds.length === 0) {
    console.log(`✅ No mutual funds to import`);
    return 0;
  }

  let totalImported = 0;
  const batches = Math.ceil(funds.length / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, funds.length);
    const batch = funds.slice(start, end);

    const dataToInsert = batch.map((fund: any) => ({
      isin: fund.isin || null,
      ticker: fund.ticker || null,
      name: fund.name || null,
      fund_family: fund.fund_family || null,
      fund_category: fund.fund_category || null,
      inception_date: fund.inception_date || null,
      expense_ratio: fund.expense_ratio ? parseFloat(fund.expense_ratio) : null,
      rating: fund.rating ? parseFloat(fund.rating) : null,
      return_ytd: fund.return_ytd ? parseFloat(fund.return_ytd) : null,
      return_1y: fund.return_1y ? parseFloat(fund.return_1y) : null,
      return_3y: fund.return_3y ? parseFloat(fund.return_3y) : null,
      return_5y: fund.return_5y ? parseFloat(fund.return_5y) : null,
      return_10y: fund.return_10y ? parseFloat(fund.return_10y) : null,
      nav_per_share: fund.nav_per_share ? parseFloat(fund.nav_per_share) : null,
      assets_under_management: fund.assets_under_management ? parseFloat(fund.assets_under_management) : null,
      stock_allocation: fund.stock_allocation ? parseFloat(fund.stock_allocation) : null,
      bond_allocation: fund.bond_allocation ? parseFloat(fund.bond_allocation) : null,
      cash_allocation: fund.cash_allocation ? parseFloat(fund.cash_allocation) : null,
      other_allocation: fund.other_allocation ? parseFloat(fund.other_allocation) : null,
      sharpe_ratio: fund.sharpe_ratio ? parseFloat(fund.sharpe_ratio) : null,
      standard_deviation: fund.standard_deviation ? parseFloat(fund.standard_deviation) : null,
      data_source: 'morningstar',
      raw_data: fund
    }));

    const { data, error } = await supabase
      .from('mutual_funds')
      .insert(dataToInsert)
      .select();

    if (error) {
      console.error(`❌ Error importing mutual funds batch ${i + 1}/${batches}:`, error);
      continue;
    }

    const batchCount = data?.length || 0;
    totalImported += batchCount;
    console.log(`   Batch ${i + 1}/${batches}: ✅ Imported ${batchCount} mutual funds (${totalImported}/${funds.length} total)`);
  }

  console.log(`✅ Total mutual funds imported: ${totalImported}`);
  return totalImported;
}

export async function runETL() {
  console.log('\n🚀 Starting Mutual Funds & ETFs ETL Pipeline (FULL DATASET)...\n');
  
  try {
    // Fetch all data
    console.log(`📡 Fetching complete dataset from Kaggle...`);
    const { etfs, mutualFunds } = await fetcher.getAllData();

    console.log(`\n📊 Dataset info:`);
    console.log(`  - ETFs: ${etfs.length}`);
    console.log(`  - Mutual Funds: ${mutualFunds.length}`);
    console.log(`  - Total records: ${etfs.length + mutualFunds.length}`);

    // Import data
    const etfsImported = await importETFs(etfs);
    const fundsImported = await importMutualFunds(mutualFunds);

    console.log(`\n✅ ETL Pipeline Complete!`);
    console.log(`\n📊 Summary:`);
    console.log(`  - ETFs imported: ${etfsImported}`);
    console.log(`  - Mutual funds imported: ${fundsImported}`);
    console.log(`  - Total imported: ${etfsImported + fundsImported}`);

    return {
      etfsImported,
      fundsImported
    };
  } catch (error) {
    console.error('❌ ETL Pipeline failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}
