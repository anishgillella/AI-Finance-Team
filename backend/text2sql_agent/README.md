# Text-to-SQL Agent

Converts natural language questions into SQL queries for financial database analysis.

## Features

✅ **Natural Language to SQL**: Convert any business question into accurate SQL
✅ **All Query Types**: COUNT, SELECT, WHERE, GROUP BY, JOIN, ORDER BY, DATE filtering, calculations
✅ **Semantic Search**: Vector-based schema retrieval for better context
✅ **Query Validation**: Automatic SQL validation before execution
✅ **Self-Correction**: Fixes queries that fail validation
✅ **Caching**: Embedding and result caching for performance
✅ **Token Optimization**: 75% token savings with semantic retrieval

## Quick Start

```bash
npm run query "Your natural language question"
```

## Examples

```bash
# COUNT queries
npm run query "How many accounts do we have?"

# SELECT with ORDER BY
npm run query "Show top 5 securities by market cap"

# WHERE filtering
npm run query "Show budgets where spent amount > 100000"

# GROUP BY aggregations
npm run query "Show spending by category"

# JOINs
npm run query "Show portfolio holdings with security names"

# Complex queries
npm run query "Calculate portfolio performance with gains"

# Date filtering
npm run query "Get transactions from last 30 days"
```

## Execution Steps

The agent shows:
1. **Schema Loading** - Loads database schema
2. **Semantic Context** - Retrieves relevant tables and columns
3. **SQL Generation** - LLM generates SQL from natural language
4. **Validation** - Validates SQL against schema
5. **Execution** - Runs query against database
6. **Formatting** - Formats results with insights

## Architecture

```
text2sql_agent/
├── src/
│   ├── agent/
│   │   ├── finance-agent.ts       # Main orchestrator
│   │   ├── sql-generator.ts       # LLM SQL generation
│   │   ├── query-validator.ts     # SQL validation
│   │   ├── semantic-retriever.ts  # Vector search
│   │   ├── embedder.ts            # Embedding generation
│   │   ├── qdrant-client.ts       # Vector DB client
│   │   ├── query-cache.ts         # Caching layer
│   │   └── schema-registry.ts     # Schema definitions
│   ├── data/
│   │   └── semantic-models.ts     # 45+ SQL patterns
│   └── types/
│       └── schemas.ts             # TypeScript types
├── dist/                          # Compiled JavaScript
├── query-agent-runner.js          # Entry point
└── README.md
```

## Database Support

**11 Financial Tables:**
- users, accounts, transactions, securities
- portfolio_holdings, price_history, dividends
- budgets, expense_categories, financial_goals
- schema_registry

## Performance

- **Token Usage**: ~1250 tokens per query
- **Cost**: ~$0.0002 per query
- **Cache Hit Rate**: 75% on repeated queries
- **Query Types**: 10+ supported
