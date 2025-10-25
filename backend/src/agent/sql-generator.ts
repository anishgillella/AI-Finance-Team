import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { validateQuery, type ValidationResult } from "./query-validator.js";
import { getSchemaDescription, getCoreSchemaDescription } from "./schema-registry.js";

export interface GeneratedSQL {
  sql: string;
  reasoning: string;
  isValid: boolean;
  validationResult?: ValidationResult;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface TokenUsage {
  totalTokens: number;
  totalCost: number;
}

let totalTokenUsage: TokenUsage = {
  totalTokens: 0,
  totalCost: 0,
};

/**
 * Initialize OpenRouter LLM client
 */
function initializeLLM() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  return new ChatOpenAI({
    modelName: "openai/gpt-4o-mini",
    temperature: 0,
    maxTokens: 1000,
    apiKey: apiKey,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
  });
}

/**
 * Generate SQL from natural language using LLM with optional semantic context
 */
export async function generateSQL(userQuery: string, semanticContext: string = ""): Promise<GeneratedSQL> {
  const llm = initializeLLM();

  try {
    // Use semantic context if available, otherwise fall back to core schema
    let contextForPrompt = semanticContext;
    let contextType = "semantic";

    if (!contextForPrompt) {
      console.log("   📝 Using core schema (optimized, 60% token savings vs full schema)");
      contextForPrompt = await getCoreSchemaDescription();
      contextType = "core";
    } else {
      console.log("   📝 Using optimized semantic context (75% token savings)");
    }

    // Few-shot examples specific to the schema
    const fewShotExamples = `
## EXAMPLES:

Example 1: "How many customers do we have?"
SQL: SELECT COUNT(*) as total_customers FROM customers;

Example 2: "Show me conversations with their customer companies"
SQL: SELECT c.company_name, conv.call_id, SUBSTRING(conv.transcript, 1, 100) as preview FROM customers c JOIN conversations conv ON c.id = conv.customer_id LIMIT 20;

Example 3: "What are the top customers by conversation volume?"
SQL: SELECT c.company_name, COUNT(conv.id) as conversation_count FROM customers c LEFT JOIN conversations conv ON c.id = conv.customer_id GROUP BY c.id, c.company_name ORDER BY conversation_count DESC LIMIT 10;

Example 4: "Show me all conversations from the last 30 days"
SQL: SELECT customer_id, call_id, created_at FROM conversations WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' ORDER BY created_at DESC LIMIT 100;`;

    // System prompt with schema context and few-shot examples
    const systemPrompt = `You are a SQL expert for a financial database. Generate ONLY valid SELECT queries based on user requests.

IMPORTANT RULES:
1. Only generate SELECT queries - NO DELETE, DROP, ALTER, etc.
2. Always add LIMIT to prevent large result sets (max 100)
3. Use proper SQL syntax and column names exactly as shown in schema
4. Reference the schema provided below
5. Use table aliases (e.g., c.id, conv.call_id) for clarity
6. Join tables using the relationships shown in schema

${contextForPrompt}
${fewShotExamples}

When generating queries:
- Use exact table and column names from schema
- Include appropriate JOINs when needed (prefer LEFT JOIN)
- Add GROUP BY for aggregations
- Use aliases for multi-table queries
- Always add LIMIT to results
- Reference the examples above for similar patterns

RESPOND WITH ONLY:
1. Your reasoning (one line)
2. The SQL query (one line, starting with "SELECT")

Format your response as:
REASONING: [your explanation]
SQL: [the query]`;

    // Call LLM
    const response = await llm.invoke([new SystemMessage(systemPrompt), new HumanMessage(userQuery)]);

    // Parse response
    const responseText = response.content.toString();
    const reasoningMatch = responseText.match(/REASONING:\s*(.+?)(?=SQL:|$)/s);
    const sqlMatch = responseText.match(/SQL:\s*(.+?)(?=\n|$)/s);

    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "Generated SQL query";
    const sql = sqlMatch ? sqlMatch[1].trim() : "SELECT * FROM accounts LIMIT 100";

    // Extract token usage
    const promptTokens = response.response_metadata?.usage?.prompt_tokens || 0;
    const completionTokens = response.response_metadata?.usage?.completion_tokens || 0;
    const totalTokens = promptTokens + completionTokens;

    // Update total token usage
    totalTokenUsage.totalTokens += totalTokens;
    // Approximate cost: GPT-4o-mini: $0.15/1M input, $0.60/1M output
    const promptCost = (promptTokens / 1000000) * 0.15;
    const completionCost = (completionTokens / 1000000) * 0.60;
    totalTokenUsage.totalCost += promptCost + completionCost;

    // Validate the generated SQL
    const validationResult = await validateQuery(sql);

    return {
      sql,
      reasoning,
      isValid: validationResult.valid,
      validationResult,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens,
      },
    };
  } catch (error) {
    throw new Error(`Failed to generate SQL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get total token usage and cost
 */
export function getTokenUsage(): TokenUsage {
  return { ...totalTokenUsage };
}

/**
 * Reset token usage
 */
export function resetTokenUsage(): void {
  totalTokenUsage = {
    totalTokens: 0,
    totalCost: 0,
  };
}

/**
 * Format generated SQL result for display
 */
export function formatGeneratedSQL(result: GeneratedSQL): string {
  let output = "";

  output += "📝 Generated SQL:\n";
  output += `\`\`\`sql\n${result.sql}\n\`\`\`\n\n`;

  output += `💭 Reasoning: ${result.reasoning}\n`;

  output += `📊 Tokens Used:\n`;
  output += `  • Prompt: ${result.tokens.prompt}\n`;
  output += `  • Completion: ${result.tokens.completion}\n`;
  output += `  • Total: ${result.tokens.total}\n\n`;

  if (result.isValid) {
    output += "✅ Query is valid and ready to execute\n";
  } else {
    output += "❌ Validation errors:\n";
    for (const error of result.validationResult?.errors || []) {
      output += `  • ${error}\n`;
    }
  }

  return output;
}

/**
 * Format token usage summary
 */
export function formatTokenUsageSummary(): string {
  const usage = getTokenUsage();
  return `\n📊 Session Token Usage:\n  • Total Tokens: ${usage.totalTokens}\n  • Estimated Cost: $${usage.totalCost.toFixed(6)}\n`;
}
