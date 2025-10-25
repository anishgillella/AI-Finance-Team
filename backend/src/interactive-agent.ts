/**
 * INTERACTIVE AGENT CLI
 * Takes natural language queries and returns database answers
 */

import * as readline from "readline";
import { runFinanceAgent, type ConversationMessage, type AgentResponse } from "./agent/finance-agent.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let conversationHistory: ConversationMessage[] = [];

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function runAgent(query: string): Promise<void> {
  try {
    console.log("\n🔄 Processing your query...\n");
    
    const response: AgentResponse = await runFinanceAgent(query, conversationHistory);

    // Update conversation history
    conversationHistory.push({
      role: "user",
      content: query,
      timestamp: new Date(),
    });

    conversationHistory.push({
      role: "assistant",
      content: response.summary,
      timestamp: new Date(),
    });

    // Display results
    console.log("\n" + "=".repeat(80));
    console.log("📋 AGENT RESPONSE");
    console.log("=".repeat(80) + "\n");

    console.log(`📝 Reasoning:\n${response.reasoning}\n`);
    console.log(`🔍 Generated SQL:\n${response.sql}\n`);
    console.log(`✅ Validation Status: ${response.isValid ? "PASSED" : "FAILED"}`);
    
    if (response.errors && response.errors.length > 0) {
      console.log(`\n❌ Errors: ${response.errors.join(", ")}`);
    }

    if (response.rawData && response.rawData.length > 0) {
      console.log(`\n📊 Results (${response.rawData.length} rows):\n`);
      console.log(JSON.stringify(response.rawData.slice(0, 5), null, 2));
      if (response.rawData.length > 5) {
        console.log(`\n... and ${response.rawData.length - 5} more rows`);
      }
    } else if (response.isValid) {
      console.log("\n📊 No results returned");
    }

    if (response.summary) {
      console.log(`\n💡 Summary:\n${response.summary}`);
    }

    if (response.insights && response.insights.length > 0) {
      console.log(`\n🎯 Key Insights:`);
      response.insights.forEach((insight, i) => {
        console.log(`   ${i + 1}. ${insight}`);
      });
    }

    console.log(`\n📈 Token Usage: Total=${response.tokens.totalTokens}, Cost=${response.tokens.totalCost.toFixed(6)}`);
    console.log(`\n🚀 Semantic Context: Est. ${response.semanticContext?.tokensEstimated || 0} tokens, ${response.semanticContext?.modelsUsed || 0} models, ${response.semanticContext?.columnsUsed || 0} columns`);
    
    console.log("\n" + "=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
    console.log("\n");
  }
}

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log("🤖 AI FINANCE AGENT - INTERACTIVE QUERY INTERFACE");
  console.log("=".repeat(80));
  console.log("\n📝 Ask natural language questions about your data.");
  console.log("💡 Examples:");
  console.log("   - How many customers do we have?");
  console.log("   - Show me customers and their conversation count");
  console.log("   - What are the top analysis scores?");
  console.log("   - List all conversations from October 2025");
  console.log("\n⌨️  Type 'exit' or 'quit' to end the session.\n");

  // Load schema at startup
  try {
    console.log("⏳ Initializing agent...\n");
    await runAgent("SELECT 1"); // Dummy query to warm up the system
    console.log("✅ Agent ready!\n");
  } catch (error) {
    console.log("⚠️  Agent initialized with warnings\n");
  }

  // Main loop
  while (true) {
    const query = await prompt("🔹 Your query: ");

    if (!query) {
      console.log("Please enter a query.\n");
      continue;
    }

    if (query.toLowerCase() === "exit" || query.toLowerCase() === "quit") {
      console.log("\n👋 Goodbye!\n");
      rl.close();
      process.exit(0);
    }

    if (query.toLowerCase() === "clear") {
      conversationHistory = [];
      console.log("✓ Conversation history cleared\n");
      continue;
    }

    if (query.toLowerCase() === "history") {
      console.log("\n📜 Conversation History:\n");
      conversationHistory.forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.role.toUpperCase()}] ${msg.content.substring(0, 80)}`);
      });
      console.log("\n");
      continue;
    }

    await runAgent(query);
  }
}

main().catch(console.error);
