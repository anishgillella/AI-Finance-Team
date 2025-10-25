import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { validateQuery, type ValidationResult } from "./query-validator.js";
import { getSchemaDescription } from "./schema-registry.js";

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
 * Generate SQL from natural language using LLM
 */
export async function generateSQL(userQuery: string): Promise<GeneratedSQL> {
  const llm = initializeLLM();

  try {
    // Get schema context
    const schemaDescription = await getSchemaDescription();

    // System prompt with schema context
    const systemPrompt = `You are a SQL expert for a financial database. Generate ONLY valid SELECT queries based on user requests.

IMPORTANT RULES:
1. Only generate SELECT queries - NO DELETE, DROP, ALTER, etc.
2. Always add LIMIT to prevent large result sets
3. Use proper SQL syntax
4. Reference the schema provided below

FINANCE DATABASE SCHEMA:
${schemaDescription}

When generating queries:
- Use table names exactly as shown in schema
- Use column names exactly as shown in schema
- Include appropriate JOINs when needed
- Add GROUP BY for aggregations
- Use aliases for clarity (e.g., a.id, ph.market_value)

RESPOND WITH ONLY:
1. Your reasoning (one line)
2. The SQL query (one line, starting with "SELECT")

Format your response as:
REASONING: [your explanation]
SQL: [the query]`;

    // Call LLM
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userQuery),
    ]);

    // Parse response
    const responseText = response.content.toString();
    const reasoningMatch = responseText.match(/REASONING:\s*(.+?)(?=SQL:|$)/s);
    const sqlMatch = responseText.match(/SQL:\s*(.+?)(?=\n|$)/s);

    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "Generated SQL query";
    const sql = sqlMatch
      ? sqlMatch[1].trim()
      : "SELECT * FROM accounts LIMIT 100";

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
    throw new Error(
      `Failed to generate SQL: ${error instanceof Error ? error.message : String(error)}`
    );
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
