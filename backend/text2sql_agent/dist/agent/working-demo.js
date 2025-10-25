import { runFinanceAgent, AgentException, } from "./finance-agent.js";
/**
 * Working Demo - Agent with Real Database Queries
 * Run with: npm run build && node dist/agent/working-demo.js
 */
async function demoAgent() {
    console.log("\n" + "=".repeat(80));
    console.log("🎯 FINANCE AGENT - WORKING DEMO");
    console.log("=".repeat(80) + "\n");
    // Test with a real query that will work on the actual database
    const testQuery = "How many customer conversations do we have?";
    try {
        console.log(`📝 Query: "${testQuery}"\n`);
        const response = await runFinanceAgent(testQuery);
        console.log("\n" + "=".repeat(80));
        console.log("✅ COMPLETE AGENT RESPONSE");
        console.log("=".repeat(80) + "\n");
        console.log("🔍 Query Analysis:");
        console.log(`   Input: ${response.query}`);
        console.log(`   Reasoning: ${response.reasoning}\n`);
        console.log("💾 Generated SQL:");
        console.log(`   ${response.sql}\n`);
        console.log("✔️  Validation:");
        console.log(`   Valid: ${response.isValid}\n`);
        console.log("📊 Results:");
        console.log(`   Records returned: ${response.rawData.length}`);
        if (response.rawData.length > 0) {
            console.log(`   Data: ${JSON.stringify(response.rawData[0])}\n`);
        }
        console.log("📋 Summary:");
        console.log(`   ${response.summary}\n`);
        if (response.insights.length > 0) {
            console.log("💡 Insights:");
            response.insights.forEach((i) => console.log(`   • ${i}`));
            console.log("");
        }
        console.log("📊 Token Usage:");
        console.log(`   Total Tokens: ${response.tokens.totalTokens}`);
        console.log(`   Estimated Cost: $${response.tokens.totalCost.toFixed(6)}\n`);
        console.log("🔄 Execution Pipeline:");
        response.executionSteps.forEach((step) => console.log(`   ✓ ${step}`));
        console.log("\n" + "=".repeat(80));
        console.log("✅ AGENT WORKING SUCCESSFULLY!");
        console.log("=".repeat(80) + "\n");
    }
    catch (error) {
        if (error instanceof AgentException) {
            console.error(`\n❌ Agent Error [${error.code}]:`);
            console.error(`   ${error.message}`);
        }
        else {
            console.error(`\n❌ Unexpected Error:`, error);
        }
        process.exit(1);
    }
}
demoAgent();
//# sourceMappingURL=working-demo.js.map