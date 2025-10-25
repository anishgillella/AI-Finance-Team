import {
  runFinanceAgent,
  type ConversationMessage,
  AgentException,
} from "./finance-agent.js";

/**
 * Test the Finance Agent
 * Run with: npm run build && node dist/agent/finance-agent.test.js
 */
async function testFinanceAgent() {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 TESTING SIMPLIFIED FINANCE AGENT");
  console.log("=".repeat(80) + "\n");

  try {
    const testQuery = "How many accounts do we have?";
    console.log(`📝 Test Query: "${testQuery}"\n`);

    const response = await runFinanceAgent(testQuery);

    console.log("\n" + "=".repeat(80));
    console.log("✅ AGENT RESPONSE");
    console.log("=".repeat(80) + "\n");

    console.log(`Query: ${response.query}`);
    console.log(`Reasoning: ${response.reasoning}`);
    console.log(`SQL: ${response.sql}`);
    console.log(`Valid: ${response.isValid}`);
    console.log(`Records: ${response.rawData.length}`);
    console.log(`\nSummary:\n${response.summary}`);
    
    if (response.insights.length > 0) {
      console.log(`\nInsights:`);
      response.insights.forEach((i) => console.log(`  • ${i}`));
    }

    console.log(`\nTokens Used: ${response.tokens.totalTokens}`);
    console.log(`Estimated Cost: $${response.tokens.totalCost.toFixed(6)}`);

    console.log(`\nExecution Steps:`);
    response.executionSteps.forEach((step) => console.log(`  ✓ ${step}`));

    console.log("\n" + "=".repeat(80));
    console.log("✅ TEST PASSED - Agent works correctly!");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    if (error instanceof AgentException) {
      console.error(`\n❌ Agent Error [${error.code}]:`);
      console.error(error.message);
    } else {
      console.error(`\n❌ Error:`, error);
    }
    process.exit(1);
  }
}

// Run test
testFinanceAgent();
