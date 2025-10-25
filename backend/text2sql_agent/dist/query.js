/**
 * TEXT-TO-SQL AGENT - MAIN ENTRY POINT
 * Converts natural language questions into SQL queries and executes them
 * Supports all SQL query types: COUNT, SELECT, JOIN, GROUP BY, WHERE, ORDER BY, etc.
 */
import { runFinanceAgent } from "./agent/finance-agent.js";
async function main() {
    const query = process.argv[2];
    if (!query) {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║          📊 TEXT-TO-SQL AGENT - QUERY INTERFACE               ║
╚════════════════════════════════════════════════════════════════╝

📝 Usage: npm run query "Your natural language question"

💡 Supported Query Types:
  ✓ COUNT - npm run query "How many accounts do we have?"
  ✓ SELECT - npm run query "Show top 10 accounts"
  ✓ ORDER BY - npm run query "Show top 5 securities by market cap"
  ✓ WHERE - npm run query "Show budgets where spent > 100000"
  ✓ GROUP BY - npm run query "Show spending by category"
  ✓ JOIN - npm run query "Show portfolio holdings with security names"
  ✓ AGGREGATE - npm run query "Calculate portfolio performance with gains"
  ✓ DATE - npm run query "Get transactions from last 30 days"
`);
        process.exit(1);
    }
    try {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║              📊 TEXT-TO-SQL AGENT - QUERY EXECUTION           ║
╚════════════════════════════════════════════════════════════════╝
`);
        console.log(`📝 Natural Language Query: "${query}\n`);
        const response = await runFinanceAgent(query);
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
║              🔍 GENERATED SQL QUERY                            ║
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
        }
        else {
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
    }
    catch (error) {
        console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=query.js.map