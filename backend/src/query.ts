/**
 * FINANCE AGENT - MAIN QUERY INTERFACE
 * Takes natural language queries and returns results with execution steps
 */

import { runFinanceAgent, type AgentResponse } from "./agent/finance-agent.js";

async function main() {
  const query = process.argv[2];

  if (!query) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║          🤖 AI FINANCE AGENT - QUERY INTERFACE                ║
╚════════════════════════════════════════════════════════════════╝

📝 Usage: npm run query "Your natural language question"

💡 Examples:
  • npm run query "How many accounts do we have?"
  • npm run query "Show top 5 securities by market cap"
  • npm run query "What is spending by category?"
  • npm run query "Show portfolio holdings with security details"
  • npm run query "Get recent transactions from last 30 days"
  • npm run query "Calculate portfolio performance with gains"
  • npm run query "Show users with their account balances"
`);
    process.exit(1);
  }

  try {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    🤖 FINANCE AGENT QUERY                     ║
╚════════════════════════════════════════════════════════════════╝
`);

    console.log(`📝 Query: "${query}\n`);

    const response: AgentResponse = await runFinanceAgent(query);

    // Display Execution Steps
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     📋 EXECUTION STEPS                         ║
╚════════════════════════════════════════════════════════════════╝
`);
    
    response.executionSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });

    // Display Generated SQL
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   🔍 GENERATED SQL QUERY                       ║
╚════════════════════════════════════════════════════════════════╝

${response.sql}
`);

    // Display Validation Status
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  ✅ VALIDATION STATUS                          ║
╚════════════════════════════════════════════════════════════════╝

Status: ${response.isValid ? "✅ PASSED" : "❌ FAILED"}
${response.errors && response.errors.length > 0 ? `Errors: ${response.errors.join(", ")}` : ""}
`);

    // Display Results
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    📊 QUERY RESULTS                            ║
╚════════════════════════════════════════════════════════════════╝

Rows Returned: ${response.rawData.length}
`);

    if (response.rawData && response.rawData.length > 0) {
      console.log("Data:");
      console.table(response.rawData.slice(0, 20));
      
      if (response.rawData.length > 20) {
        console.log(`\n... and ${response.rawData.length - 20} more rows\n`);
      }
    } else {
      console.log("No results returned\n");
    }

    // Display Summary and Insights
    if (response.summary) {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    💡 SUMMARY                                  ║
╚════════════════════════════════════════════════════════════════╝

${response.summary}
`);
    }

    if (response.insights && response.insights.length > 0) {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    🎯 KEY INSIGHTS                             ║
╚════════════════════════════════════════════════════════════════╝
`);
      response.insights.forEach((insight, i) => {
        console.log(`${i + 1}. ${insight}`);
      });
      console.log();
    }

    // Display Performance Metrics
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  📈 PERFORMANCE METRICS                        ║
╚════════════════════════════════════════════════════════════════╝

Total Tokens Used: ${response.tokens.totalTokens}
Estimated Cost: $${response.tokens.totalCost.toFixed(6)}

Semantic Context:
  • Estimated Tokens: ${response.semanticContext?.tokensEstimated || 0}
  • Models Used: ${response.semanticContext?.modelsUsed || 0}
  • Columns Retrieved: ${response.semanticContext?.columnsUsed || 0}
`);

    console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

main();
