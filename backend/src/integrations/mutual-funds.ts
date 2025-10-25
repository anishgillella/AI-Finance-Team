import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';
import { promises as fsPromises } from 'fs';

const CACHE_DIR = path.join(os.tmpdir(), 'kaggle-cache');
const API_URL = 'https://www.kaggle.com/api/v1/datasets/download/stefanoleone992/mutual-funds-and-etfs';

export interface FundData {
  [key: string]: any;
}

class MutualFundsDataFetcher {
  private kaggleApiKey: string;
  private kaggleUsername: string;
  private cacheDir: string;

  constructor() {
    this.kaggleUsername = process.env.KAGGLE_USERNAME || '';
    this.kaggleApiKey = process.env.KAGGLE_API_KEY || '';
    this.cacheDir = CACHE_DIR;

    if (!this.kaggleUsername || !this.kaggleApiKey) {
      throw new Error('KAGGLE_USERNAME and KAGGLE_API_KEY environment variables are required');
    }

    // Ensure cache directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Download dataset from Kaggle
   */
  private async downloadDataset(): Promise<Buffer> {
    console.log('📥 Downloading dataset from Kaggle...');

    try {
      const auth = Buffer.from(`${this.kaggleUsername}:${this.kaggleApiKey}`).toString('base64');
      
      const response = await axios.get(API_URL, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        responseType: 'arraybuffer',
        timeout: 60000
      });

      console.log('✓ Dataset downloaded successfully');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download dataset: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Extract CSV files from the downloaded data
   */
  private async extractCSVFiles(zipBuffer: Buffer): Promise<Map<string, string>> {
    const JSZip = (await import('jszip')).default;
    const csvFiles = new Map<string, string>();

    try {
      const zip = new JSZip();
      await zip.loadAsync(zipBuffer);

      for (const filename in zip.files) {
        if (filename.endsWith('.csv') && !filename.includes('__MACOSX')) {
          const file = zip.files[filename];
          const content = await file.async('string');
          csvFiles.set(filename, content);
        }
      }

      console.log(`✓ Extracted ${csvFiles.size} CSV files`);
      return csvFiles;
    } catch (error) {
      throw new Error(`Failed to extract CSV files: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Parse CSV content into objects
   */
  private parseCSV(csvContent: string): FundData[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: FundData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      
      if (values.length === headers.length) {
        const obj: FundData = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        data.push(obj);
      }
    }

    return data;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Normalize column names to lowercase with underscores
   */
  private normalizeKey(key: string): string {
    return key
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '');
  }

  /**
   * Normalize fund data for database insertion
   */
  private normalizeFundData(funds: FundData[]): FundData[] {
    return funds.map(fund => {
      const normalized: FundData = {};
      
      for (const [key, value] of Object.entries(fund)) {
        const normalizedKey = this.normalizeKey(key);
        normalized[normalizedKey] = value === '' ? null : value;
      }

      return normalized;
    });
  }

  /**
   * Fetch all data - downloads from Kaggle and parses CSV files
   */
  async getAllData(): Promise<{
    etfs: FundData[];
    mutualFunds: FundData[];
  }> {
    try {
      console.log('\n🔍 Fetching Mutual Funds & ETFs data...');

      // Download dataset
      const zipBuffer = await this.downloadDataset();

      // Extract CSV files
      const csvFiles = await this.extractCSVFiles(zipBuffer);

      let etfs: FundData[] = [];
      let mutualFunds: FundData[] = [];

      // Parse CSV files
      for (const [filename, content] of csvFiles) {
        const data = this.parseCSV(content);
        const normalizedData = this.normalizeFundData(data);

        console.log(`\n📊 File: ${filename}`);
        console.log(`   Rows: ${normalizedData.length}`);

        // Classify based on filename
        if (filename.toLowerCase().includes('etf')) {
          etfs = normalizedData;
          console.log(`   Type: ETFs`);
        } else if (filename.toLowerCase().includes('mutual')) {
          mutualFunds = normalizedData;
          console.log(`   Type: Mutual Funds`);
        }
      }

      console.log(`\n✅ Data fetch complete:`);
      console.log(`   - ETFs: ${etfs.length}`);
      console.log(`   - Mutual Funds: ${mutualFunds.length}`);

      return { etfs, mutualFunds };
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      throw error;
    }
  }
}

export default MutualFundsDataFetcher;
