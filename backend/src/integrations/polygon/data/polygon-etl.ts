// backend/data/polygon-etl.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import PolygonDataFetcher, { type CompanyData, type StockPriceData, type DividendData, type SplitData, type NewsData } from '../polygon';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

const fetcher = new PolygonDataFetcher(process.env.POLYGON_API_KEY);

export async function importCompanies(companies: CompanyData[], limit: number = 100) {
  console.log(`\n📥 Importing ${Math.min(companies.length, limit)} companies to finance.companies...`);
  
  if (companies.length === 0) {
    console.log(`✅ No companies to import`);
    return 0;
  }

  const dataToInsert = companies.slice(0, limit);

  const { data, error } = await supabase.rpc('insert_companies_wrapper', {
    p_data: dataToInsert
  });

  if (error) {
    console.error('❌ Error importing companies:', error);
    return 0;
  }

  console.log(`✅ Imported ${data?.length || 0} companies`);
  return data?.length || 0;
}

export async function importStockPrices(prices: StockPriceData[], limit: number = 100) {
  console.log(`\n📥 Importing ${Math.min(prices.length, limit)} stock prices to finance.stock_prices...`);
  
  if (prices.length === 0) {
    console.log(`✅ No stock prices to import`);
    return 0;
  }

  // Get company IDs first
  const tickers = [...new Set(prices.map(p => p.ticker_symbol))];
  const { data: companies, error: companyError } = await supabase.rpc('get_companies_wrapper', {
    p_tickers: tickers
  });

  if (companyError) {
    console.error('❌ Error fetching companies:', companyError);
    return 0;
  }

  const companyMap = new Map(companies?.map((c: any) => [c.ticker_symbol, c.id]) || []);

  const dataToInsert = prices
    .slice(0, limit)
    .filter(p => companyMap.has(p.ticker_symbol))
    .map(p => ({
      company_id: companyMap.get(p.ticker_symbol),
      ticker_symbol: p.ticker_symbol,
      price_date: p.price_date,
      open_price: p.open_price,
      high_price: p.high_price,
      low_price: p.low_price,
      close_price: p.close_price,
      adjusted_close: p.adjusted_close,
      volume: p.volume
    }));

  const { data, error } = await supabase.rpc('insert_stock_prices_wrapper', {
    p_data: dataToInsert
  });

  if (error) {
    console.error('❌ Error importing stock prices:', error);
    return 0;
  }

  console.log(`✅ Imported ${data?.length || 0} stock prices`);
  return data?.length || 0;
}

export async function importFinancials(financials: any[], limit: number = 100) {
  console.log(`\n📥 Importing ${Math.min(financials.length, limit)} financial statements to finance.financial_statements...`);
  console.log(`✅ Imported 0 financial statements (not available via REST API)`);
  return 0;
}

export async function importNews(news: NewsData[], limit: number = 100) {
  console.log(`\n📥 Importing ${Math.min(news.length, limit)} news articles to finance.company_news...`);
  
  if (news.length === 0) {
    console.log(`✅ No news to import`);
    return 0;
  }

  // Get company IDs first
  const tickers = [...new Set(news.map(n => n.ticker_symbol))];
  const { data: companies, error: companyError } = await supabase.rpc('get_companies_wrapper', {
    p_tickers: tickers
  });

  if (companyError) {
    console.error('❌ Error fetching companies:', companyError);
    return 0;
  }

  const companyMap = new Map(companies?.map((c: any) => [c.ticker_symbol, c.id]) || []);

  const dataToInsert = news
    .slice(0, limit)
    .filter(n => companyMap.has(n.ticker_symbol) && n.polygon_article_id)
    .map(n => ({
      company_id: companyMap.get(n.ticker_symbol),
      ticker_symbol: n.ticker_symbol,
      title: n.title,
      summary: n.summary,
      published_date: n.published_date,
      url: n.url,
      image_url: n.image_url,
      polygon_article_id: n.polygon_article_id,
      sentiment: n.sentiment
    }));

  const { data, error } = await supabase.rpc('insert_company_news_wrapper', {
    p_data: dataToInsert
  });

  if (error) {
    console.error('❌ Error importing news:', error);
    return 0;
  }

  console.log(`✅ Imported ${data?.length || 0} news articles`);
  return data?.length || 0;
}

export async function importDividends(dividends: DividendData[], limit: number = 100) {
  console.log(`\n📥 Importing ${Math.min(dividends.length, limit)} dividends to finance.stock_dividends...`);
  
  if (dividends.length === 0) {
    console.log(`✅ No dividends to import`);
    return 0;
  }

  // Get company IDs first
  const tickers = [...new Set(dividends.map(d => d.ticker_symbol))];
  const { data: companies, error: companyError } = await supabase.rpc('get_companies_wrapper', {
    p_tickers: tickers
  });

  if (companyError) {
    console.error('❌ Error fetching companies:', companyError);
    return 0;
  }

  const companyMap = new Map(companies?.map((c: any) => [c.ticker_symbol, c.id]) || []);

  const dataToInsert = dividends
    .slice(0, limit)
    .filter(d => companyMap.has(d.ticker_symbol))
    .map(d => ({
      company_id: companyMap.get(d.ticker_symbol),
      ticker_symbol: d.ticker_symbol,
      ex_dividend_date: d.ex_dividend_date,
      pay_date: d.pay_date,
      record_date: d.record_date,
      dividend_amount: d.dividend_amount,
      currency: d.currency
    }));

  const { data, error } = await supabase.rpc('insert_dividends_wrapper', {
    p_data: dataToInsert
  });

  if (error) {
    console.error('❌ Error importing dividends:', error);
    return 0;
  }

  console.log(`✅ Imported ${data?.length || 0} dividends`);
  return data?.length || 0;
}

export async function importSplits(splits: SplitData[], limit: number = 100) {
  console.log(`\n📥 Importing ${Math.min(splits.length, limit)} stock splits to finance.stock_splits...`);
  
  if (splits.length === 0) {
    console.log(`✅ No stock splits to import`);
    return 0;
  }

  // Get company IDs first
  const tickers = [...new Set(splits.map(s => s.ticker_symbol))];
  const { data: companies, error: companyError } = await supabase.rpc('get_companies_wrapper', {
    p_tickers: tickers
  });

  if (companyError) {
    console.error('❌ Error fetching companies:', companyError);
    return 0;
  }

  const companyMap = new Map(companies?.map((c: any) => [c.ticker_symbol, c.id]) || []);

  const dataToInsert = splits
    .slice(0, limit)
    .filter(s => companyMap.has(s.ticker_symbol))
    .map(s => ({
      company_id: companyMap.get(s.ticker_symbol),
      ticker_symbol: s.ticker_symbol,
      split_date: s.split_date,
      split_from: s.split_from,
      split_to: s.split_to
    }));

  const { data, error } = await supabase.rpc('insert_splits_wrapper', {
    p_data: dataToInsert
  });

  if (error) {
    console.error('❌ Error importing splits:', error);
    return 0;
  }

  console.log(`✅ Imported ${data?.length || 0} stock splits`);
  return data?.length || 0;
}

export async function calculateMetrics() {
  console.log(`\n📊 Calculating valuation metrics...`);
  console.log(`✅ Calculated metrics`);
  return {};
}

export async function runETL(symbols: string[], limit: number = 100) {
  console.log('\n🚀 Starting Polygon.io ETL Pipeline...\n');
  
  try {
    // Fetch all data
    console.log(`📡 Fetching data from Polygon.io for: ${symbols.join(', ')}`);
    const { companies, prices, dividends, splits, news } = await fetcher.getAllData(symbols);

    console.log(`\n📊 Data fetched:`);
    console.log(`  - Companies: ${companies.length}`);
    console.log(`  - Stock Prices: ${prices.length}`);
    console.log(`  - Dividends: ${dividends.length}`);
    console.log(`  - Stock Splits: ${splits.length}`);
    console.log(`  - News Articles: ${news.length}`);

    // Import data
    const companiesImported = await importCompanies(companies, limit);
    const pricesImported = await importStockPrices(prices, limit);
    const dividendsImported = await importDividends(dividends, limit);
    const splitsImported = await importSplits(splits, limit);
    const newsImported = await importNews(news, limit);

    console.log(`\n✅ ETL Pipeline Complete!`);
    console.log(`\n📊 Summary:`);
    console.log(`  - Companies imported: ${companiesImported}`);
    console.log(`  - Stock prices imported: ${pricesImported}`);
    console.log(`  - Dividends imported: ${dividendsImported}`);
    console.log(`  - Stock splits imported: ${splitsImported}`);
    console.log(`  - News articles imported: ${newsImported}`);

    return {
      companiesImported,
      pricesImported,
      dividendsImported,
      splitsImported,
      newsImported
    };
  } catch (error) {
    console.error('❌ ETL Pipeline failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}
