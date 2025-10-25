# Dynamic Dashboard Generation Architecture

## Vision
Transform the hardcoded dashboard system into an **intelligent, prompt-driven dashboard builder** where users describe their desired analytics in natural language and the system automatically generates the dashboard with real-time data.

---

## High-Level Pipeline

```
User Prompt
    ↓
[1. Intent Parser (LLM)] → Extract dashboard requirements
    ↓
[2. Schema Analyzer] → Map to database tables/columns
    ↓
[3. Query Generator (Text-to-SQL Agent)] → Generate SQL queries
    ↓
[4. Data Executor] → Run queries, fetch results
    ↓
[5. Visualization Mapper] → Determine chart types & layouts
    ↓
[6. Dashboard Assembler] → Build dashboard JSON spec
    ↓
[7. Frontend Renderer] → Display to user
    ↓
User sees live dashboard
```

---

## System Architecture

### 1. **INTENT PARSER** (New LLM Layer)
**Purpose**: Parse user's natural language into structured requirements

**Input**: User prompt
```
"Show me my top 5 holdings with their gains, compare them side-by-side, and show trends over the last 3 months"
```

**Output**: Structured intent object
```json
{
  "dashboard_goal": "Compare portfolio holdings performance",
  "metrics_requested": [
    "holdings (top 5 by market value)",
    "gains per holding",
    "price trends (3 months)"
  ],
  "visualizations": [
    { "type": "table", "focus": "holdings_gains" },
    { "type": "bar_chart", "focus": "top_holdings" },
    { "type": "line_chart", "focus": "price_trends" }
  ],
  "filters": [
    { "field": "time_range", "value": "3_months" },
    { "field": "ranking", "value": "top_5" }
  ],
  "dashboard_type": "PORTFOLIO_ANALYSIS_CUSTOM"
}
```

**How to build it**:
- Use OpenAI's structured output (GPT-4 + JSON schema)
- System prompt: Trained on your schema to recognize domain concepts
- Few-shot examples: Dashboard prompts → Intent objects

---

### 2. **SEMANTIC MAPPER** (Schema Bridge)
**Purpose**: Link abstract user concepts to actual database schema

**Logic**:
```
"holdings" + "gains" → portfolio_holdings + securities
  ↓
Link via: holdings.security_id = securities.id
  ↓
Gains = current_price - average_cost
```

**Leverages existing**: You already have `schema_registry` and `SemanticRetriever` from the text2sql agent!

**Integration**: Extend `SemanticRetriever` to:
- Map intent fields → database columns
- Suggest JOIN paths
- Recommend aggregations

---

### 3. **MULTI-QUERY PLANNER** (New)
**Purpose**: Break down dashboard intent into discrete queries

**Input**: Intent object + schema mapping

**Output**: Array of QueryRequirements
```typescript
interface QueryPlan {
  dashboard_id: string;
  queries: Array<{
    query_id: string;
    nl_request: string;        // "Top 5 holdings by value"
    purpose: "kpi" | "table" | "chart_data";
    visualization_hint: string; // "bar_chart"
    temporal_context?: string;  // "3_months"
  }>;
}
```

**Smart features**:
- Detect duplicate queries (avoid redundant DB hits)
- Order queries by dependencies
- Suggest caching strategies

---

### 4. **TEXT-TO-SQL EXECUTOR** (Existing + Extended)
**What you have**: `runFinanceAgent()` already does this!

**How to extend**:
- Batch mode: Execute multiple queries from a plan
- Error handling: If a query fails, offer alternatives
- Cache results within dashboard session

**Usage**:
```typescript
const queryPlan = await generateQueryPlan(intentObject);
const results = await executeBatchQueries(queryPlan, userContext);
```

---

### 5. **VISUALIZATION MAPPER** (New)
**Purpose**: Auto-select chart types based on data shape

**Logic**:
```
If data has:
  - 1 metric, 1 row       → KPI card
  - 1 metric, multiple rows, time-indexed → Line chart
  - 1 metric, multiple categories → Bar chart
  - 2+ metrics, multiple categories → Grouped bar
  - Proportions (sum=100%) → Pie chart
  - Tabular, 10+ rows → Table with sorting
```

**Input**: Query result + visualization hint

**Output**: WidgetConfig
```typescript
interface WidgetConfig {
  widget_id: string;
  type: "kpi" | "chart" | "table";
  visualization_type: "line" | "bar" | "pie" | "table" | "area";
  title: string;
  data: any[];
  config: {
    xAxis?: string;
    yAxis?: string;
    colorScheme?: string;
    aggregation?: "sum" | "avg" | "count";
  };
}
```

---

### 6. **DASHBOARD ASSEMBLER** (Evolution of DashboardOrchestrator)
**Extend the existing `DashboardOrchestrator`**:

```typescript
class DynamicDashboardOrchestrator extends DashboardOrchestrator {
  async buildFromPrompt(userPrompt: string): Promise<DashboardResponse> {
    // 1. Parse intent
    const intent = await this.intentParser.parse(userPrompt);
    
    // 2. Map to schema
    const schemaMap = await this.semanticMapper.map(intent);
    
    // 3. Plan queries
    const queryPlan = this.queryPlanner.plan(intent, schemaMap);
    
    // 4. Execute queries
    const queryResults = await this.executeQueries(queryPlan);
    
    // 5. Map to visualizations
    const widgets = this.visualizationMapper.map(queryResults);
    
    // 6. Build response
    return this.assembleResponse(widgets, intent);
  }
}
```

---

### 7. **FRONTEND INTERACTION LAYER** (New UI)
**Current state**: Hardcoded dashboard buttons

**New state**: 
- **Prompt input box** at the top of the page
- **Chat-like interface** for iterative refinement
- **Widget preview** before generating
- **Edit mode** to adjust visualizations

```
┌─────────────────────────────────────────┐
│ "Create a dashboard showing..."         │
│ [Text input with examples dropdown]     │
│              [Generate]                 │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│ ✓ Parsing your request...               │
│ ✓ Querying database...                  │
│ ✓ Rendering visualizations...           │
└─────────────────────────────────────────┘
        ↓
      [Live Dashboard]
        ↓
   "Not quite right?" [Refine] [Start Over]
```

---

## Data Flow Diagram

```
┌──────────────────┐
│   User Prompt    │
│ "Show my top ... │
└────────┬─────────┘
         │
    [Intent Parser]  ← Uses GPT-4 + schema context
         │
    Intent JSON
         │
    [Semantic Mapper] ← Links to schema registry
         │
    Schema Mapping
         │
    [Query Planner] ← Breaks down into sub-queries
         │
    Query Plan
         │
    [Batch Executor] ← Runs Text-to-SQL agent
         │
    Query Results
         │
    [Viz Mapper] ← Auto-selects chart types
         │
    Widget Configs
         │
    [Dashboard Assembler]
         │
    Dashboard JSON
         │
    Frontend Render
         │
    User sees live dashboard
```

---

## Implementation Roadmap

### Phase 1: Core Intent Parsing
- [ ] Build `IntentParser` class with GPT-4 structured output
- [ ] Define intent schema (TypeScript interface)
- [ ] Test with 10+ diverse prompts
- [ ] Create system prompt with few-shot examples

### Phase 2: Query Planning
- [ ] Extend `QueryPlanner` to break intent into queries
- [ ] Add semantic mapping layer
- [ ] Implement query deduplication

### Phase 3: Batch Execution
- [ ] Extend text-to-SQL agent for batch mode
- [ ] Add error recovery
- [ ] Implement result caching

### Phase 4: Visualization Intelligence
- [ ] Build `VisualizationMapper` with heuristics
- [ ] Support multiple chart libraries (Recharts already in use)
- [ ] Add smart axis/legend generation

### Phase 5: Frontend Integration
- [ ] Create prompt input component
- [ ] Build loading/progress states
- [ ] Implement refinement flow

### Phase 6: Advanced Features
- [ ] Conversation history & context
- [ ] Saved dashboard templates
- [ ] User feedback loop for LLM training

---

## Key Advantages of This Approach

1. **Reuses existing infrastructure**: Your text-to-SQL agent, schema registry, semantic retriever all already exist
2. **Modular**: Each layer can be tested/improved independently
3. **Scalable**: Can handle increasingly complex prompts over time
4. **Explainable**: User can see why certain queries/charts were chosen
5. **Iterative**: Supports refinement ("Add a filter", "Show in USD", etc.)

---

## Deep Research Areas

### To explore further:
1. **LLM-based intent parsing**: How do SOTA systems handle ambiguous user intent?
2. **Schema grounding in RAG**: How to efficiently link text concepts to database schema?
3. **Automated visualization selection**: Research on NL2VIS, VizGPT papers
4. **Multi-agent orchestration**: How to coordinate LLM sub-agents?
5. **Error correction loops**: If a query fails, how to suggest alternatives?

---

## Example User Flows

### Flow 1: Simple KPI Dashboard
```
User: "Create a dashboard with my total portfolio value and percentage gain"

System:
  Intent: { metrics: ["total_value", "percent_gain"], viz: ["kpi", "kpi"] }
  Queries: ["SELECT SUM(...)", "SELECT ((current - cost) / cost * 100)..."]
  Results: [{ value: 320000 }, { value: 6.5 }]
  Viz: [KPI card, KPI card]
  Output: Clean 2-card dashboard
```

### Flow 2: Comparative Analysis
```
User: "Compare my AAPL, MSFT, and GOOGL holdings side by side with gains"

System:
  Intent: { holdings: [AAPL, MSFT, GOOGL], comparison: "gains", viz: ["bar"] }
  Queries: ["SELECT ticker, current_price, avg_cost FROM... WHERE ticker IN (...)"]
  Results: [{ ticker: "AAPL", gain: 2000 }, ...]
  Viz: [Grouped bar chart]
  Output: Single comparative visualization
```

### Flow 3: Time Series Analysis
```
User: "Show me my portfolio performance over the last 6 months as a trend line"

System:
  Intent: { metric: "portfolio_value", time_range: "6_months", viz: ["line"] }
  Queries: ["SELECT date, portfolio_value FROM price_history WHERE date >= ..."]
  Results: [{ date: "2024-04-25", value: 300000 }, ...]
  Viz: [Line chart with date on X, value on Y]
  Output: Interactive trend visualization
```

---

## Next Steps

1. **Validate this architecture** with the team
2. **Pick Phase 1 as first sprint**: Build intent parser + test with 20 prompts
3. **Research LLM structured output** (GPT-4, Claude 3.5, or local Llama)
4. **Design the few-shot examples** for your domain
5. **Define error handling** for ambiguous intents
