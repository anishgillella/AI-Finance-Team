/**
 * SIMPLE QUERY AGENT
 * Takes a natural language query and returns the result
 */

import { runFinanceAgent } from "./agent/finance-agent";

async function main() {
  const query = process.argv[2];

  if (!query) {
    console.log("\n❌ Error: Please provide a query as an argument");
    console.log("\nUsage: npm run query 'Your natural language query here'");
    console.log("\nExamples:");
    console.log("  npm run query 'How many customers do we have?'");
    console.log("  npm run query 'Show me all customers'");
    console.log("  npm run query 'List conversations from October'");
    process.exit(1);
  }

  try {
    console.log("\n" + "=".repeat(80));
    console.log("🤖 FINANCE AGENT - QUERY EXECUTION");
    console.log("=".repeat(80));
    console.log(`\n📝 Query: ${query}\n`);

    const response = await runFinanceAgent(query);

    console.log("\n" + "=".repeat(80));
    console.log("📋 RESULT");
    console.log("=".repeat(80) + "\n");

    console.log(`🔍 Generated SQL:\n${response.sql}\n`);
    console.log(`✅ Valid: ${response.isValid}`);

    if (response.errors && response.errors.length > 0) {
      console.log(`\n❌ Errors:\n${response.errors.join("\n")}\n`);
    }

    if (response.rawData && response.rawData.length > 0) {
      console.log(`\n📊 Results (${response.rawData.length} rows):\n`);
      console.table(response.rawData);
    } else {
      console.log("\n📊 No results returned");
    }

    if (response.summary) {
      console.log(`\n💡 Summary:\n${response.summary}`);
    }

    console.log(`\n📈 Tokens Used: ${response.tokens.totalTokens}`);
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
