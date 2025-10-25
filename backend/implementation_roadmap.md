# AI Finance Agent - Semantic Layers Implementation Roadmap

## 🎯 Overview

This document outlines the comprehensive implementation strategy for integrating semantic layers (dbt-style) with Qdrant vector database to optimize token usage and query accuracy for the AI Finance Agent.

**Core Goal**: Enable the LLM to generate accurate SQL queries against 100+ tables without loading the entire schema, using only 500 tokens instead of 2000+.

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Query                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              [1] Semantic Retriever                              │
├─────────────────────────────────────────────────────────────────┤
│  • Query Qdrant for semantic models                              │
│  • Query Qdrant for schema metadata                              │
│  • Expand via relationship graph from Supabase                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│            [2] Context Window Builder                            │
├─────────────────────────────────────────────────────────────────┤
│  • Semantic models (as in-context examples)                      │
│  • Relevant schema (only matched columns)                        │
│  • Relationship info (from Supabase)                             │
│  • Calculated token budget                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│           [3] Enhanced LLM Prompt                                │
├─────────────────────────────────────────────────────────────────┤
│  • System prompt with query patterns                             │
│  • Semantic models as executable examples                        │
│  • Relevant schema subset only                                   │
│  • User query                                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│        [4] SQL Generation (Existing)                             │
├─────────────────────────────────────────────────────────────────┤
│  • LLM generates SQL (openai/gpt-4o-mini via OpenRouter)        │
│  • Query validation                                              │
│  • Database execution                                            │
│  • Result formatting with insights                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Storage Strategy

### Supabase (Authoritative Schema)
- **What**: Database schema metadata, table definitions, relationships
- **Why**: Single source of truth, already integrated
- **Storage**: `schema_registry` table with full schema information

### Qdrant (Vector Search)
- **What**: Embeddings for semantic models and schema metadata
- **Why**: Fast semantic search, retrieve only relevant information
- **Collections**:
  - `semantic_models` - SQL patterns with embeddings
  - `schema_metadata` - Table/column descriptions with embeddings

---

## 🧠 Embedding Strategy

### Embedding Model: HuggingFace Open-Source
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Why**: 
  - ✅ Lightweight (22MB, runs locally)
  - ✅ Fast inference (< 100ms)
  - ✅ Good semantic understanding for technical text
  - ✅ 384-dimensional embeddings (optimal for Qdrant)
  - ✅ No API costs, fully open-source
  - ✅ Production-ready quality

- **Installation**:
  ```bash
  npm install @xenova/transformers
  ```

### What Gets Embedded

#### A. Semantic Models
```json
{
  "id": "model_account_summary",
  "type": "semantic_model",
  "text": "Calculate total balance and count by account type using aggregation on accounts table",
  "embedding": [0.123, 0.456, ...],
  "metadata": {
    "model_name": "account_summary",
    "tables": ["accounts"],
    "operations": ["GROUP BY", "SUM", "COUNT"],
    "use_cases": ["financial_summary", "account_analysis"]
  },
  "sql": "SELECT account_type, COUNT(*) as account_count, SUM(balance) as total_balance FROM accounts GROUP BY account_type"
}
```

#### B. Schema Metadata
```json
{
  "id": "col_accounts_balance",
  "type": "column",
  "text": "accounts.balance - Current account balance in USD, numeric type, aggregatable with SUM and AVG",
  "embedding": [0.789, 0.012, ...],
  "metadata": {
    "table": "accounts",
    "column": "balance",
    "data_type": "numeric",
    "aggregatable": ["SUM", "AVG", "MIN", "MAX"],
    "unit": "USD",
    "description": "Current balance"
  }
}
```

---

## 📚 Semantic Models (Comprehensive Coverage)

### 1. **Aggregation Patterns** (~5 models)

#### Model: account_summary
```sql
SELECT 
  account_type,
  COUNT(*) as account_count,
  SUM(balance) as total_balance,
  AVG(balance) as avg_balance
FROM accounts 
GROUP BY account_type
ORDER BY total_balance DESC;
```

#### Model: transaction_statistics
```sql
SELECT 
  category, 
  SUM(amount) as total, 
  COUNT(*) as count, 
  AVG(amount) as average
FROM transactions 
GROUP BY category;
```

#### Model: holdings_market_value
```sql
SELECT 
  security_id, 
  SUM(market_value) as total_value, 
  COUNT(*) as holding_count
FROM portfolio_holdings 
GROUP BY security_id
ORDER BY total_value DESC;
```

#### Model: dividend_analysis
```sql
SELECT 
  security_id, 
  SUM(total_amount) as total_dividends, 
  AVG(amount_per_share) as avg_per_share,
  COUNT(*) as dividend_count
FROM dividends 
GROUP BY security_id;
```

#### Model: budget_tracking
```sql
SELECT 
  category, 
  SUM(limit_amount) as total_budget, 
  SUM(spent_amount) as total_spent,
  SUM(limit_amount) - SUM(spent_amount) as remaining
FROM budgets 
GROUP BY category;
```

### 2. **Join Patterns** (~6 models)

#### Model: user_account_summary
```sql
SELECT 
  u.id, 
  u.name, 
  COUNT(a.id) as account_count, 
  SUM(a.balance) as total_balance
FROM users u 
LEFT JOIN accounts a ON u.id = a.user_id
GROUP BY u.id, u.name;
```

#### Model: account_transactions
```sql
SELECT 
  a.id, 
  a.account_name, 
  t.transaction_type, 
  t.amount, 
  t.transaction_date
FROM accounts a 
JOIN transactions t ON a.id = t.account_id
WHERE t.status = 'completed';
```

#### Model: security_holdings
```sql
SELECT 
  s.ticker, 
  s.name, 
  ph.quantity, 
  ph.current_price, 
  ph.market_value
FROM securities s 
JOIN portfolio_holdings ph ON s.id = ph.security_id
ORDER BY ph.market_value DESC;
```

#### Model: transaction_security_details
```sql
SELECT 
  t.id, 
  t.amount, 
  s.ticker, 
  s.name, 
  t.transaction_date
FROM transactions t 
LEFT JOIN securities s ON t.security_id = s.id;
```

#### Model: user_portfolio_value
```sql
SELECT 
  u.name, 
  a.account_name, 
  SUM(ph.market_value) as portfolio_value
FROM users u 
  JOIN accounts a ON u.id = a.user_id
  JOIN portfolio_holdings ph ON a.id = ph.account_id
GROUP BY u.id, a.id;
```

#### Model: user_budget_status
```sql
SELECT 
  u.name, 
  b.category, 
  b.limit_amount, 
  b.spent_amount, 
  (b.limit_amount - b.spent_amount) as remaining
FROM users u 
JOIN budgets b ON u.id = b.user_id;
```

### 3. **Time-Based Queries** (~5 models)

#### Model: recent_transactions
```sql
SELECT * 
FROM transactions 
WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY transaction_date DESC;
```

#### Model: monthly_spending
```sql
SELECT 
  DATE_TRUNC('month', transaction_date) as month, 
  category, 
  SUM(amount) as total
FROM transactions 
WHERE transaction_type = 'withdrawal'
GROUP BY DATE_TRUNC('month', transaction_date), category;
```

#### Model: price_history_range
```sql
SELECT 
  security_id, 
  history_date, 
  open_price, 
  close_price, 
  high_price, 
  low_price
FROM price_history
WHERE history_date BETWEEN CURRENT_DATE - INTERVAL '90 days' AND CURRENT_DATE;
```

#### Model: dividend_recent
```sql
SELECT 
  security_id, 
  payment_date, 
  dividend_amount, 
  amount_per_share
FROM dividends
WHERE payment_date >= CURRENT_DATE - INTERVAL '365 days'
ORDER BY payment_date DESC;
```

#### Model: goal_progress_over_time
```sql
SELECT 
  id, 
  goal_name, 
  target_amount, 
  current_amount, 
  target_date,
  ROUND(100.0 * current_amount / target_amount) as progress_percent
FROM financial_goals
WHERE status = 'active';
```

### 4. **Filtering & Ranking** (~6 models)

#### Model: top_accounts_by_balance
```sql
SELECT 
  id, 
  account_name, 
  balance, 
  account_type
FROM accounts
ORDER BY balance DESC
LIMIT 10;
```

#### Model: largest_holdings
```sql
SELECT 
  ph.id, 
  s.ticker, 
  s.name, 
  ph.quantity, 
  ph.market_value, 
  ph.current_price
FROM portfolio_holdings ph
JOIN securities s ON ph.security_id = s.id
ORDER BY ph.market_value DESC;
```

#### Model: high_value_transactions
```sql
SELECT * 
FROM transactions
WHERE amount > (SELECT AVG(amount) * 2 FROM transactions)
ORDER BY amount DESC;
```

#### Model: budget_overspent
```sql
SELECT 
  user_id, 
  category, 
  limit_amount, 
  spent_amount, 
  (spent_amount - limit_amount) as overage
FROM budgets
WHERE spent_amount > limit_amount
ORDER BY overage DESC;
```

#### Model: accounts_by_institution
```sql
SELECT 
  institution_name, 
  account_type, 
  COUNT(*) as account_count, 
  SUM(balance) as total_balance
FROM accounts
GROUP BY institution_name, account_type
ORDER BY SUM(balance) DESC;
```

#### Model: inactive_goals
```sql
SELECT 
  id, 
  goal_name, 
  goal_type, 
  target_amount, 
  current_amount, 
  target_date
FROM financial_goals
WHERE status != 'active'
ORDER BY updated_at DESC;
```

### 5. **Calculations & Metrics** (~5 models)

#### Model: account_performance
```sql
SELECT 
  a.id, 
  a.account_name, 
  a.balance,
  ROUND(100.0 * a.balance / (SELECT SUM(balance) FROM accounts)) as percent_of_total
FROM accounts a;
```

#### Model: portfolio_allocation
```sql
SELECT 
  s.sector, 
  SUM(ph.market_value) as sector_value,
  ROUND(100.0 * SUM(ph.market_value) / (SELECT SUM(market_value) FROM portfolio_holdings)) as allocation_percent
FROM portfolio_holdings ph
JOIN securities s ON ph.security_id = s.id
GROUP BY s.sector;
```

#### Model: holding_gain_loss
```sql
SELECT 
  ph.id, 
  s.ticker, 
  ph.quantity, 
  ph.average_cost, 
  ph.current_price,
  ROUND(ph.quantity * (ph.current_price - ph.average_cost)) as unrealized_gain,
  ROUND(100.0 * (ph.current_price - ph.average_cost) / ph.average_cost) as gain_percent
FROM portfolio_holdings ph
JOIN securities s ON ph.security_id = s.id;
```

#### Model: monthly_net_cash_flow
```sql
SELECT 
  DATE_TRUNC('month', transaction_date) as month,
  SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as deposits,
  SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END) as withdrawals,
  SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE -amount END) as net_flow
FROM transactions
GROUP BY DATE_TRUNC('month', transaction_date);
```

#### Model: goal_completion_rate
```sql
SELECT 
  goal_type, 
  COUNT(*) as total_goals,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*)) as completion_rate
FROM financial_goals
GROUP BY goal_type;
```

### 6. **Complex Multi-Table Patterns** (~4 models)

#### Model: user_financial_snapshot
```sql
SELECT 
  u.id, 
  u.name, 
  u.country,
  COUNT(DISTINCT a.id) as account_count,
  SUM(a.balance) as total_cash,
  SUM(ph.market_value) as portfolio_value,
  SUM(a.balance) + COALESCE(SUM(ph.market_value), 0) as net_worth
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id
LEFT JOIN portfolio_holdings ph ON a.id = ph.account_id
GROUP BY u.id;
```

#### Model: transaction_security_analysis
```sql
SELECT 
  s.ticker, 
  s.sector, 
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_traded,
  AVG(t.price_per_unit) as avg_price,
  MIN(t.transaction_date) as first_trade,
  MAX(t.transaction_date) as last_trade
FROM transactions t
LEFT JOIN securities s ON t.security_id = s.id
WHERE t.transaction_type IN ('buy', 'sell')
GROUP BY s.id, s.ticker, s.sector;
```

#### Model: comprehensive_account_analysis
```sql
SELECT 
  a.id, 
  a.account_name, 
  a.balance,
  COUNT(DISTINCT t.id) as transaction_count,
  COUNT(DISTINCT ph.security_id) as holding_count,
  SUM(ph.market_value) as holdings_value,
  SUM(t.amount) as total_transaction_volume
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
LEFT JOIN portfolio_holdings ph ON a.id = ph.account_id
GROUP BY a.id;
```

#### Model: dividend_and_holdings_summary
```sql
SELECT 
  s.ticker, 
  s.name, 
  ph.quantity, 
  ph.current_price, 
  ph.market_value,
  SUM(d.total_amount) as total_dividends,
  COUNT(d.id) as dividend_count,
  ROUND(100.0 * SUM(d.total_amount) / ph.market_value) as dividend_yield_percent
FROM portfolio_holdings ph
JOIN securities s ON ph.security_id = s.id
LEFT JOIN dividends d ON s.id = d.security_id
GROUP BY s.id, ph.id;
```

### 7. **Schema & Metadata Queries** (~2 models)

#### Model: column_metadata
```sql
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

#### Model: relationship_map
```sql
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

**Total**: **33 semantic models** covering all query patterns

---

## 🔄 Retrieval Process

### Step 1: Embedding User Query
```
User: "What's my total portfolio value by sector?"
    ↓
[Embed using HuggingFace sentence-transformers/all-MiniLM-L6-v2]
    ↓
Vector: [0.234, 0.567, 0.891, ...] (384 dimensions)
```

### Step 2: Semantic Search in Qdrant
```
Query Qdrant collections:
├─ semantic_models collection
│  ├─ Top 3-5 matching models
│  └─ Example: portfolio_allocation, holding_gain_loss
│
└─ schema_metadata collection
   ├─ Top 5-10 matching columns
   └─ Example: portfolio_holdings.market_value, securities.sector
```

### Step 3: Expand via Relationships (Supabase)
```
From Supabase schema_registry:
├─ Get table relationships
├─ Expand to related tables
└─ Example: portfolio_holdings → securities → price_history
```

### Step 4: Build Context Window
```
Selected for LLM:
├─ Semantic models (3-5 examples with SQL)
├─ Relevant schema (only matched columns)
├─ Relationships (how to join)
├─ Token count: ~500 tokens total
└─ Actual query: 100 tokens
```

---

## 🚀 Implementation Phases

### **Phase 1: Foundation (Day 1)**

#### 1.1 Setup Qdrant
```bash
# Start Qdrant Docker
docker run -d \
  -p 6333:6333 \
  -p 6334:6334 \
  --name qdrant \
  qdrant/qdrant

# Verify
curl http://localhost:6333/health
```

#### 1.2 Install Dependencies
```bash
npm install @xenova/transformers @qdrant/js-client
```

#### 1.3 Create Semantic Models File
File: `backend/src/data/semantic-models.ts`
- Export all 33 models with metadata
- Each model has: id, sql, tables, operations, use_cases, description

---

### **Phase 2: Embedding Pipeline (Day 1-2)**

#### 2.1 Create HuggingFace Embedder
File: `backend/src/agent/embedder.ts`

**Features**:
- Load `sentence-transformers/all-MiniLM-L6-v2` locally
- Batch embed semantic models
- Batch embed schema metadata from Supabase
- Cache embeddings locally

**Code Structure**:
```typescript
export class SemanticEmbedder {
  private extractor: any; // Xenova pipeline
  
  async initialize(): Promise<void>
  async embedText(text: string): Promise<number[]>
  async embedSemanticModels(): Promise<QdrantPoint[]>
  async embedSchemaMetadata(): Promise<QdrantPoint[]>
}
```

#### 2.2 Create Qdrant Collections
File: `backend/src/agent/qdrant-client.ts`

**Collections**:
1. `semantic_models` (33 documents)
   - Size: ~10 KB each
   - Total: ~330 KB
   
2. `schema_metadata` (100+ columns)
   - Size: ~2 KB each
   - Total: ~200 KB

---

### **Phase 3: Semantic Retriever (Day 2)**

#### 3.1 Create Retriever
File: `backend/src/agent/semantic-retriever.ts`

**Features**:
- Query Qdrant for relevant models
- Query Qdrant for relevant schema
- Expand via Supabase relationships
- Build formatted context

**Code Structure**:
```typescript
export class SemanticRetriever {
  async retrieveSemanticModels(query: string, topK: number = 5): Promise<Model[]>
  async retrieveSchemaMetadata(query: string, topK: number = 10): Promise<Column[]>
  async expandRelationships(tables: string[]): Promise<Relationship[]>
  async buildContext(models: Model[], schema: Column[], rels: Relationship[]): Promise<string>
}
```

---

### **Phase 4: Integration (Day 3)**

#### 4.1 Update Finance Agent
File: `backend/src/agent/finance-agent.ts`

**Changes**:
- Before SQL generation: call semantic retriever
- Pass retrieved models + schema to LLM prompt
- Calculate token budget: user query + context
- Rest remains the same

**Pseudo-code**:
```typescript
export async function runFinanceAgent(query: string) {
  // ... existing code ...
  
  // NEW: Get semantic context
  const models = await retriever.retrieveSemanticModels(query);
  const schema = await retriever.retrieveSchemaMetadata(query);
  const relationships = await retriever.expandRelationships([...]);
  const context = await retriever.buildContext(models, schema, relationships);
  
  // Pass context to SQL generator
  const sqlResult = await generateSQL(query, context);
  
  // ... rest remains the same ...
}
```

---

### **Phase 5: Testing & Validation (Day 3-4)**

#### 5.1 Unit Tests
- Test embedder with sample text
- Test Qdrant retrieval
- Test context building

#### 5.2 Integration Tests
- End-to-end query flow
- Verify token counts
- Compare results (before/after optimization)

#### 5.3 Performance Benchmarks
- Query latency
- Token usage
- Embedding cache hit rates

---

## 📊 Token Optimization

### Before (Schema Dump)
```
User Query: 100 tokens
Full Schema: 1900 tokens
Total: 2000 tokens
```

### After (Semantic Retrieval)
```
User Query: 100 tokens
Semantic Models (3-5): 200 tokens
Relevant Schema: 150 tokens
Relationships: 50 tokens
Total: 500 tokens
```

**Savings**: **75% token reduction** (2000 → 500)

---

## 📈 Scalability

| Metric | Value | Justification |
|--------|-------|----------------|
| **Max Tables** | 100+ | Qdrant handles 1M+ documents |
| **Max Columns** | 2000+ | Each embedded separately |
| **Embedding Time** | < 1s per query | HuggingFace model is fast |
| **Search Time** | < 100ms | Qdrant is optimized |
| **Memory Usage** | < 500MB | HuggingFace + Qdrant |
| **Token Savings** | 75% | Selective context |

---

## 🔧 File Structure

```
backend/
├── src/
│   ├── agent/
│   │   ├── finance-agent.ts (MODIFIED)
│   │   ├── embedder.ts (NEW)
│   │   ├── qdrant-client.ts (NEW)
│   │   ├── semantic-retriever.ts (NEW)
│   │   ├── sql-generator.ts (existing)
│   │   ├── query-validator.ts (existing)
│   │   └── schema-registry.ts (existing)
│   ├── data/
│   │   ├── semantic-models.ts (NEW)
│   │   └── insert-mock-data.ts (existing)
│   └── ...
├── docker-compose.yml (NEW - Qdrant)
├── package.json (MODIFIED - add @xenova/transformers, @qdrant/js-client)
└── ...
```

---

## 🎯 Success Metrics

- ✅ Semantic models cover 100% of query patterns
- ✅ Token usage < 600 per query
- ✅ Query latency < 2 seconds
- ✅ Retrieval accuracy > 95%
- ✅ No hallucinated schema references

---

## 📝 Implementation Checklist

- [ ] Qdrant Docker setup and verification
- [ ] Dependencies installed (@xenova/transformers, @qdrant/js-client)
- [ ] 33 semantic models created and documented
- [ ] Embedder module implemented and tested
- [ ] Qdrant collections created and populated
- [ ] Semantic retriever implemented
- [ ] Finance agent integrated with retriever
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Token metrics verified
- [ ] Documentation complete
- [ ] Ready for production

---

## 🚀 Next Steps

1. **Review** this roadmap
2. **Confirm** you want to proceed
3. **Start implementation** Phase 1
4. **Verify each phase** before moving to next
5. **Complete end-to-end testing**

---

**Created**: 2025-10-25  
**Status**: Ready for Implementation  
**Estimated Duration**: 3-4 hours  
**Team Size**: 1 developer