// backend/src/integrations/polygon.ts

export interface CompanyData {
  ticker_symbol: string;
  company_name: string;
  sector?: string;
  industry?: string;
  exchange?: string;
  market_cap?: number;
  employees?: number;
  website?: string;
}

export interface StockPriceData {
  ticker_symbol: string;
  price_date: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  adjusted_close?: number;
  volume: number;
}

export interface FinancialData {
  ticker_symbol: string;
  period_ended: string;
  fiscal_quarter: number;
  fiscal_year: number;
  revenue?: number;
  cost_of_revenue?: number;
  gross_profit?: number;
  operating_expenses?: number;
  operating_income?: number;
  net_income?: number;
  earnings_per_share?: number;
  total_assets?: number;
  current_assets?: number;
  total_liabilities?: number;
  current_liabilities?: number;
  shareholders_equity?: number;
  operating_cash_flow?: number;
  investing_cash_flow?: number;
  financing_cash_flow?: number;
  free_cash_flow?: number;
}

export interface NewsData {
  ticker_symbol: string;
  title: string;
  summary?: string;
  published_date: string;
  url: string;
  image_url?: string;
  polygon_article_id: string;
  sentiment?: string;
}

export interface DividendData {
  ticker_symbol: string;
  ex_dividend_date?: string;
  pay_date?: string;
  record_date?: string;
  dividend_amount: number;
  currency?: string;
}

export interface SplitData {
  ticker_symbol: string;
  split_date: string;
  split_from: number;
  split_to: number;
}

export default class PolygonDataFetcher {
  private apiKey: string;
  private baseUrl = 'https://api.polygon.io';

  constructor(apiKey: string = process.env.POLYGON_API_KEY || '') {
    this.apiKey = apiKey;
    if (!this.apiKey) {
      throw new Error('❌ POLYGON_API_KEY not set in environment');
    }
    console.log('✅ Polygon API Key loaded');
  }

  private async fetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('apiKey', this.apiKey);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      console.log(`  🔗 GET ${endpoint}`);
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error ${response.status}: ${error}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      throw new Error(`Polygon API request failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  async getAllData(symbols: string[]) {
    const companies: CompanyData[] = [];
    const prices: StockPriceData[] = [];
    const dividends: DividendData[] = [];
    const splits: SplitData[] = [];
    const news: NewsData[] = [];

    console.log('\n📡 Connecting to Polygon.io REST API...');
    console.log('⏱️  Rate limiting: 5 calls/min (12 second delay)\n');
    console.log(`📊 Importing ${symbols.length} companies over ~${Math.ceil(symbols.length / 5)} minutes\n`);

    for (const symbol of symbols) {
      try {
        console.log(`\n✅ Fetching real data for ${symbol}...`);

        // Fetch company data
        const company = await this.fetchCompanyData(symbol);
        if (company) companies.push(company);
        await this.delay(12000); // 12 seconds = 5 calls/min

        // Fetch stock prices
        const stockPrices = await this.fetchStockPrices(symbol);
        prices.push(...stockPrices);
        await this.delay(12000);

        // Fetch dividends
        const dividendData = await this.fetchDividends(symbol);
        dividends.push(...dividendData);
        await this.delay(12000);

        // Fetch splits
        const splitData = await this.fetchSplits(symbol);
        splits.push(...splitData);
        await this.delay(12000);

        // Fetch news
        const newsData = await this.fetchNewsData(symbol);
        news.push(...newsData);
        await this.delay(12000);

        console.log(`✅ Successfully fetched data for ${symbol}`);
      } catch (error) {
        console.error(`❌ FAILED to fetch ${symbol}:`, error instanceof Error ? error.message : error);
        console.error(`⚠️  Skipping ${symbol} - only using real Polygon data`);
      }
    }

    return { companies, prices, dividends, splits, news };
  }

  private async fetchCompanyData(symbol: string): Promise<CompanyData | null> {
    try {
      console.log(`  📊 Fetching company details for ${symbol}...`);
      const response = await this.fetch<any>(`/v3/reference/tickers/${symbol}`);

      if (!response?.results) {
        console.warn(`  ⚠️  No company data found for ${symbol}`);
        return null;
      }

      const ticker = response.results;
      return {
        ticker_symbol: symbol,
        company_name: ticker.name || symbol,
        sector: ticker.sic_description || 'Unknown',
        industry: ticker.industry || 'Unknown',
        exchange: ticker.primary_exchange || 'Unknown',
        market_cap: ticker.market_cap ? Math.floor(ticker.market_cap) : 0,
        employees: ticker.total_employees || 0,
        website: ticker.homepage_url || ''
      };
    } catch (error) {
      throw new Error(`Failed to fetch company data for ${symbol}: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async fetchStockPrices(symbol: string): Promise<StockPriceData[]> {
    try {
      console.log(`  📈 Fetching stock prices for ${symbol}...`);
      const today = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const fromDate = twoYearsAgo.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];

      const response = await this.fetch<any>(`/v2/aggs/ticker/${symbol}/range/1/day/${fromDate}/${toDate}`, {
        limit: 250,
        sort: 'asc'
      });

      if (!response?.results || response.results.length === 0) {
        console.warn(`  ⚠️  No price data found for ${symbol}`);
        return [];
      }

      const prices = response.results.slice(0, 100).map((bar: any) => ({
        ticker_symbol: symbol,
        price_date: new Date(bar.t).toISOString().split('T')[0],
        open_price: bar.o || 0,
        high_price: bar.h || 0,
        low_price: bar.l || 0,
        close_price: bar.c || 0,
        adjusted_close: bar.vw || bar.c || 0,
        volume: bar.v || 0
      }));

      console.log(`  ✅ Retrieved ${prices.length} price points`);
      return prices;
    } catch (error) {
      throw new Error(`Failed to fetch stock prices for ${symbol}: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async fetchNewsData(symbol: string): Promise<NewsData[]> {
    try {
      console.log(`  📰 Fetching news for ${symbol}...`);
      const response = await this.fetch<any>(`/v2/reference/news`, {
        ticker: symbol,
        limit: 100,
        sort: 'published_utc'
      });

      if (!response?.results || response.results.length === 0) {
        console.warn(`  ⚠️  No news found for ${symbol}`);
        return [];
      }

      const articles = response.results.slice(0, 10).map((article: any) => ({
        ticker_symbol: symbol,
        title: article.title || '',
        summary: article.description || '',
        published_date: article.published_utc || new Date().toISOString(),
        url: article.article_url || '',
        image_url: article.image_url || '',
        polygon_article_id: article.id || `${symbol}-${Math.random()}`,
        sentiment: 'neutral'
      }));

      console.log(`  ✅ Retrieved ${articles.length} news articles`);
      return articles;
    } catch (error) {
      throw new Error(`Failed to fetch news for ${symbol}: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async fetchDividends(symbol: string): Promise<DividendData[]> {
    try {
      console.log(`  💰 Fetching dividends for ${symbol}...`);
      const response = await this.fetch<any>(`/v3/reference/dividends`, {
        ticker: symbol,
        limit: 100,
        sort: 'ex_dividend_date'
      });

      if (!response?.results || response.results.length === 0) {
        console.warn(`  ⚠️  No dividend data found for ${symbol}`);
        return [];
      }

      const dividendData = response.results.slice(0, 100).map((div: any) => ({
        ticker_symbol: symbol,
        ex_dividend_date: div.ex_dividend_date,
        pay_date: div.pay_date,
        record_date: div.record_date,
        dividend_amount: div.amount || 0,
        currency: div.currency || 'USD'
      }));

      console.log(`  ✅ Retrieved ${dividendData.length} dividend records`);
      return dividendData;
    } catch (error) {
      throw new Error(`Failed to fetch dividends for ${symbol}: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async fetchSplits(symbol: string): Promise<SplitData[]> {
    try {
      console.log(`  📊 Fetching stock splits for ${symbol}...`);
      const response = await this.fetch<any>(`/v3/reference/splits`, {
        ticker: symbol,
        limit: 100,
        sort: 'execution_date'
      });

      if (!response?.results || response.results.length === 0) {
        console.warn(`  ⚠️  No split data found for ${symbol}`);
        return [];
      }

      const splitData = response.results.slice(0, 100).map((split: any) => ({
        ticker_symbol: symbol,
        split_date: split.execution_date,
        split_from: split.from || 1,
        split_to: split.to || 1
      }));

      console.log(`  ✅ Retrieved ${splitData.length} split records`);
      return splitData;
    } catch (error) {
      throw new Error(`Failed to fetch splits for ${symbol}: ${error instanceof Error ? error.message : error}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
