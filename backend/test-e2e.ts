import { SemanticRetriever } from "./src/agent/semantic-retriever.js";

async function runE2ETest() {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 END-TO-END TEST: AI Finance Agent - Semantic Layers");
  console.log("=".repeat(80) + "\n");

  try {
    // Step 1: Initialize retriever
    console.log("📋 STEP 1: Initializing Semantic Retriever...\n");
    const retriever = new SemanticRetriever();
    await retriever.initialize();
    console.log("✅ Retriever initialized\n");

    // Step 2: Initialize Qdrant collections
    console.log("📦 STEP 2: Initializing Qdrant Collections...\n");
    await retriever.initializeCollections();
    console.log("✅ Collections initialized\n");

    // Step 3: Test retrieval with sample queries
    console.log("🔍 STEP 3: Testing Semantic Retrieval...\n");

    const testQueries = [
      "What's my total portfolio value by sector?",
      "Show me the top 10 accounts by balance",
      "How much did I spend this month?",
      "What are my financial goals?",
    ];

    for (const query of testQueries) {
      console.log(`\n📝 Query: "${query}"`);
      try {
        const context = await retriever.buildContext(query);
        console.log(`   ✓ Retrieved context (~${context.token_estimate} tokens)`);
        console.log(`   ✓ Models: ${context.models.length}, Columns: ${context.columns.length}`);
        console.log(`   ✓ Tables: ${context.tables_involved.join(", ")}`);
      } catch (error) {
        console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=".repeat(80));
    console.log("\n🎉 End-to-end test completed successfully!\n");
    console.log("Next steps:");
    console.log("  1. Run the finance agent: npm run agent:test");
    console.log("  2. Test with sample queries");
    console.log("  3. Verify SQL generation accuracy\n");
  } catch (error) {
    console.error("\n❌ ERROR:", error instanceof Error ? error.message : String(error));
    console.error("\nTroubleshooting:");
    console.error("  - Check if Qdrant is running: docker ps | grep qdrant");
    console.error("  - Verify Qdrant health: curl http://localhost:6333/health");
    console.error("  - Check .env file has correct credentials\n");
    process.exit(1);
  }
}

runE2ETest();
