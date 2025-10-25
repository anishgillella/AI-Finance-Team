# Finance Database Data Scripts

This folder contains scripts for managing the finance database schema and mock data.

## Scripts

### `insert-mock-data.ts`
Inserts sample financial data into the database for testing and development.

**Usage:**
```bash
npx ts-node src/data/insert-mock-data.ts
```

**What it inserts:**
- 5 sample users with realistic names and contact info
- 5 securities (stocks, ETFs, crypto)
- 3 accounts per user (checking, savings, investment)
- Portfolio holdings
- Sample transactions (deposits, withdrawals, trades)
- Monthly budgets for different spending categories
- Financial goals (savings, retirement, debt payoff)
- Expense categories with colors and icons

## Database Schema

The finance database includes the following main tables:

- **users** - User profiles
- **accounts** - Financial accounts (checking, savings, investment, retirement, credit card)
- **securities** - Investment instruments (stocks, bonds, ETFs, mutual funds, crypto)
- **transactions** - All financial transactions
- **portfolio_holdings** - Current securities held in investment accounts
- **price_history** - Historical price data (OHLCV)
- **dividends** - Dividend payment records
- **budgets** - Monthly spending budgets
- **financial_goals** - User financial goals and targets
- **expense_categories** - Custom expense category definitions

## Setup

Before running scripts, ensure:

1. `.env` file is configured with Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Database schema has been created (via migrations)

3. Dependencies are installed:
   ```bash
   npm install
   ```

## Data Volume

Each script is designed for development/testing purposes with moderate data volumes:
- Mock data script: ~200 records across all tables
- For larger datasets, modify the scripts accordingly

## Notes

- All mock data uses realistic names, transaction types, and financial scenarios
- Timestamps are automatically generated relative to "now"
- Use `SUPABASE_SERVICE_ROLE_KEY` for admin operations like bulk inserts
