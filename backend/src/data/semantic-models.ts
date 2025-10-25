/**
 * Semantic Models - Financial Domain Patterns
 * SQL patterns for the Finance Agent covering all common financial queries
 */

export interface SemanticModel {
  id: string;
  name: string;
  description: string;
  sql: string;
  tables: string[];
  operations: string[];
  use_cases: string[];
  text: string; // For embeddings
}

export const SEMANTIC_MODELS: SemanticModel[] = [
  // USER & ACCOUNT MANAGEMENT
  {
    id: "model_user_accounts",
    name: "User Accounts Overview",
    description: "Get all accounts for a user with balances",
    sql: `SELECT u.email, u.name, a.account_name, a.account_type, a.balance, a.currency FROM users u LEFT JOIN accounts a ON u.id = a.user_id ORDER BY u.created_at DESC`,
    tables: ["users", "accounts"],
    operations: ["LEFT JOIN", "ORDER BY"],
    use_cases: ["user_profile", "account_overview"],
    text: "Get user account information with balances and account types",
  },
  {
    id: "model_account_count",
    name: "Total Accounts",
    description: "Count total number of accounts",
    sql: `SELECT COUNT(*) AS total_accounts FROM accounts`,
    tables: ["accounts"],
    operations: ["COUNT"],
    use_cases: ["account_statistics"],
    text: "Count total accounts in the system",
  },
  {
    id: "model_accounts_by_type",
    name: "Accounts by Type",
    description: "Group accounts by type with count and total balance",
    sql: `SELECT account_type, COUNT(*) as account_count, SUM(balance) as total_balance FROM accounts GROUP BY account_type ORDER BY account_count DESC`,
    tables: ["accounts"],
    operations: ["GROUP BY", "COUNT", "SUM"],
    use_cases: ["account_analysis"],
    text: "Analyze account distribution by type with total balances",
  },

  // PORTFOLIO ANALYSIS
  {
    id: "model_portfolio_holdings",
    name: "Portfolio Holdings",
    description: "Get portfolio holdings with security and market values",
    sql: `SELECT ph.account_id, s.name, s.ticker, ph.quantity, ph.current_price, ph.market_value FROM portfolio_holdings ph LEFT JOIN securities s ON ph.security_id = s.id ORDER BY ph.market_value DESC LIMIT 100`,
    tables: ["portfolio_holdings", "securities"],
    operations: ["LEFT JOIN", "ORDER BY", "LIMIT"],
    use_cases: ["portfolio_overview", "holdings_list"],
    text: "Show portfolio holdings with security names, tickers, and current market values",
  },
  {
    id: "model_top_holdings",
    name: "Top Portfolio Holdings",
    description: "Get top holdings by market value",
    sql: `SELECT ph.account_id, s.name, s.ticker, ph.market_value FROM portfolio_holdings ph LEFT JOIN securities s ON ph.security_id = s.id ORDER BY ph.market_value DESC LIMIT 10`,
    tables: ["portfolio_holdings", "securities"],
    operations: ["LEFT JOIN", "ORDER BY", "LIMIT"],
    use_cases: ["top_positions", "concentration_analysis"],
    text: "Get the top 10 portfolio holdings by market value",
  },
  {
    id: "model_portfolio_total_value",
    name: "Total Portfolio Value by Account",
    description: "Calculate total portfolio value for each account",
    sql: `SELECT account_id, SUM(market_value) as total_portfolio_value, COUNT(*) as holding_count FROM portfolio_holdings GROUP BY account_id ORDER BY total_portfolio_value DESC`,
    tables: ["portfolio_holdings"],
    operations: ["GROUP BY", "SUM", "COUNT"],
    use_cases: ["portfolio_valuation", "account_analysis"],
    text: "Get total portfolio value and holding count for each account",
  },

  // TRANSACTION ANALYSIS
  {
    id: "model_transactions",
    name: "Recent Transactions",
    description: "Get recent financial transactions",
    sql: `SELECT t.transaction_date, t.transaction_type, t.amount, t.category, t.merchant, a.account_name FROM transactions t LEFT JOIN accounts a ON t.account_id = a.id ORDER BY t.transaction_date DESC LIMIT 50`,
    tables: ["transactions", "accounts"],
    operations: ["LEFT JOIN", "ORDER BY", "LIMIT"],
    use_cases: ["transaction_history", "activity_log"],
    text: "View recent financial transactions with account and merchant details",
  },
  {
    id: "model_transactions_by_type",
    name: "Transactions by Type",
    description: "Group transactions by type with counts and totals",
    sql: `SELECT transaction_type, COUNT(*) as transaction_count, SUM(amount) as total_amount FROM transactions GROUP BY transaction_type ORDER BY transaction_count DESC`,
    tables: ["transactions"],
    operations: ["GROUP BY", "COUNT", "SUM"],
    use_cases: ["transaction_analysis"],
    text: "Analyze transaction distribution by type (buy, sell, transfer, deposit, withdrawal)",
  },
  {
    id: "model_spending_by_category",
    name: "Spending by Category",
    description: "Analyze spending patterns by category",
    sql: `SELECT category, COUNT(*) as transaction_count, SUM(amount) as total_spent FROM transactions WHERE category IS NOT NULL GROUP BY category ORDER BY total_spent DESC`,
    tables: ["transactions"],
    operations: ["GROUP BY", "COUNT", "SUM", "WHERE"],
    use_cases: ["spending_analysis", "budgeting"],
    text: "Get spending breakdown by transaction category",
  },

  // SECURITIES & MARKET DATA
  {
    id: "model_securities",
    name: "Securities Catalog",
    description: "Get list of all securities with types and sectors",
    sql: `SELECT id, ticker, name, security_type, sector, industry, market_cap FROM securities ORDER BY market_cap DESC LIMIT 100`,
    tables: ["securities"],
    operations: ["ORDER BY", "LIMIT"],
    use_cases: ["security_search", "market_overview"],
    text: "View all securities with ticker, name, type, sector, and market cap",
  },
  {
    id: "model_top_securities",
    name: "Top Securities by Market Cap",
    description: "Get top securities ranked by market capitalization",
    sql: `SELECT ticker, name, security_type, sector, market_cap FROM securities ORDER BY market_cap DESC LIMIT 10`,
    tables: ["securities"],
    operations: ["ORDER BY", "LIMIT"],
    use_cases: ["market_leaders", "top_stocks"],
    text: "Find the top 10 securities by market capitalization",
  },
  {
    id: "model_securities_by_sector",
    name: "Securities by Sector",
    description: "Group securities by sector",
    sql: `SELECT sector, security_type, COUNT(*) as security_count, SUM(market_cap) as total_market_cap FROM securities GROUP BY sector, security_type ORDER BY total_market_cap DESC`,
    tables: ["securities"],
    operations: ["GROUP BY", "COUNT", "SUM"],
    use_cases: ["sector_analysis", "market_composition"],
    text: "Analyze securities distribution across sectors and types",
  },

  // PRICE HISTORY & TRENDS
  {
    id: "model_price_history",
    name: "Price History",
    description: "Get historical price data for securities",
    sql: `SELECT s.name, s.ticker, ph.history_date, ph.open_price, ph.close_price, ph.high_price, ph.low_price, ph.volume FROM price_history ph LEFT JOIN securities s ON ph.security_id = s.id ORDER BY ph.history_date DESC LIMIT 100`,
    tables: ["price_history", "securities"],
    operations: ["LEFT JOIN", "ORDER BY", "LIMIT"],
    use_cases: ["price_trends", "historical_data"],
    text: "View historical price data including OHLC and trading volume",
  },
  {
    id: "model_price_changes",
    name: "Recent Price Changes",
    description: "Calculate price changes for recent dates",
    sql: `SELECT s.name, s.ticker, ph.history_date, (ph.close_price - ph.open_price) as daily_change, ((ph.close_price - ph.open_price) / ph.open_price * 100) as percent_change FROM price_history ph LEFT JOIN securities s ON ph.security_id = s.id ORDER BY ph.history_date DESC LIMIT 100`,
    tables: ["price_history", "securities"],
    operations: ["LEFT JOIN", "ORDER BY"],
    use_cases: ["price_analysis", "volatility"],
    text: "Track daily price changes and percentage movements",
  },

  // DIVIDEND ANALYSIS
  {
    id: "model_dividends",
    name: "Dividend Payments",
    description: "Get dividend payment history",
    sql: `SELECT s.name, s.ticker, d.ex_date, d.payment_date, d.amount_per_share, d.total_amount FROM dividends d LEFT JOIN securities s ON d.security_id = s.id ORDER BY d.payment_date DESC LIMIT 50`,
    tables: ["dividends", "securities"],
    operations: ["LEFT JOIN", "ORDER BY", "LIMIT"],
    use_cases: ["dividend_tracking", "income_analysis"],
    text: "View dividend payment history with dates and amounts",
  },
  {
    id: "model_total_dividends",
    name: "Total Dividends Received",
    description: "Calculate total dividends by account",
    sql: `SELECT account_id, SUM(total_amount) as total_dividends, COUNT(*) as dividend_count FROM dividends GROUP BY account_id ORDER BY total_dividends DESC`,
    tables: ["dividends"],
    operations: ["GROUP BY", "SUM", "COUNT"],
    use_cases: ["income_calculation", "dividend_summary"],
    text: "Calculate total dividends received per account",
  },

  // BUDGET & EXPENSE TRACKING
  {
    id: "model_budgets",
    name: "Budget Overview",
    description: "Get budget status with spending progress",
    sql: `SELECT b.category, b.limit_amount, b.spent_amount, (b.spent_amount / b.limit_amount * 100) as percent_spent, (b.limit_amount - b.spent_amount) as remaining FROM budgets b ORDER BY percent_spent DESC`,
    tables: ["budgets"],
    operations: ["ORDER BY"],
    use_cases: ["budget_tracking", "expense_monitoring"],
    text: "View budget status with spending progress and remaining amounts",
  },
  {
    id: "model_budget_alerts",
    name: "Over Budget Categories",
    description: "Find categories where spending exceeds budget",
    sql: `SELECT category, limit_amount, spent_amount, (spent_amount - limit_amount) as overage FROM budgets WHERE spent_amount > limit_amount ORDER BY overage DESC`,
    tables: ["budgets"],
    operations: ["WHERE", "ORDER BY"],
    use_cases: ["budget_alerts", "expense_control"],
    text: "Identify budget categories that are over the limit",
  },

  // FINANCIAL GOALS
  {
    id: "model_financial_goals",
    name: "Financial Goals",
    description: "Get all financial goals with progress",
    sql: `SELECT goal_name, goal_type, target_amount, current_amount, (current_amount / target_amount * 100) as percent_achieved, target_date, priority, status FROM financial_goals ORDER BY target_date ASC`,
    tables: ["financial_goals"],
    operations: ["ORDER BY"],
    use_cases: ["goal_tracking", "progress_monitoring"],
    text: "Track financial goals with achievement progress and target dates",
  },
  {
    id: "model_active_goals",
    name: "Active Financial Goals",
    description: "Get active financial goals ranked by priority",
    sql: `SELECT goal_name, goal_type, target_amount, current_amount, priority, target_date FROM financial_goals WHERE status = 'active' ORDER BY priority DESC, target_date ASC`,
    tables: ["financial_goals"],
    operations: ["WHERE", "ORDER BY"],
    use_cases: ["goal_prioritization"],
    text: "View active financial goals sorted by priority",
  },

  // ACCOUNT BALANCES
  {
    id: "model_account_balances",
    name: "Account Balances",
    description: "Get all accounts with current balances",
    sql: `SELECT account_name, account_type, balance, currency, created_at FROM accounts ORDER BY balance DESC LIMIT 100`,
    tables: ["accounts"],
    operations: ["ORDER BY", "LIMIT"],
    use_cases: ["balance_overview", "account_status"],
    text: "View all accounts with current balances and currencies",
  },
  {
    id: "model_total_assets",
    name: "Total Assets by Currency",
    description: "Calculate total assets by currency",
    sql: `SELECT currency, COUNT(*) as account_count, SUM(balance) as total_balance FROM accounts GROUP BY currency ORDER BY total_balance DESC`,
    tables: ["accounts"],
    operations: ["GROUP BY", "COUNT", "SUM"],
    use_cases: ["asset_allocation", "currency_exposure"],
    text: "Get total assets broken down by currency",
  },

  // PERFORMANCE METRICS
  {
    id: "model_portfolio_performance",
    name: "Portfolio Performance",
    description: "Calculate gain/loss on portfolio holdings",
    sql: `SELECT s.name, s.ticker, ph.quantity, ph.average_cost, ph.current_price, (ph.current_price - ph.average_cost) as gain_per_share, ((ph.current_price - ph.average_cost) / ph.average_cost * 100) as percent_gain FROM portfolio_holdings ph LEFT JOIN securities s ON ph.security_id = s.id ORDER BY percent_gain DESC`,
    tables: ["portfolio_holdings", "securities"],
    operations: ["LEFT JOIN", "ORDER BY"],
    use_cases: ["performance_analysis", "gain_loss"],
    text: "Analyze portfolio performance with gain/loss calculations",
  },

  // COMPLEX AGGREGATIONS
  {
    id: "model_net_worth",
    name: "Total Net Worth",
    description: "Calculate total net worth from accounts and holdings",
    sql: `SELECT (SUM(a.balance) + SUM(ph.market_value)) as total_net_worth FROM accounts a, portfolio_holdings ph`,
    tables: ["accounts", "portfolio_holdings"],
    operations: ["SUM"],
    use_cases: ["wealth_calculation"],
    text: "Calculate total net worth from cash accounts and portfolio holdings",
  },
  {
    id: "model_monthly_activity",
    name: "Monthly Transaction Activity",
    description: "Get transaction activity by month",
    sql: `SELECT DATE_TRUNC('month', transaction_date) as month, COUNT(*) as transaction_count, SUM(amount) as total_amount FROM transactions GROUP BY DATE_TRUNC('month', transaction_date) ORDER BY month DESC`,
    tables: ["transactions"],
    operations: ["GROUP BY", "DATE_TRUNC", "COUNT", "SUM"],
    use_cases: ["activity_trends", "monthly_analysis"],
    text: "Analyze transaction activity by month",
  },
];

export default SEMANTIC_MODELS;
