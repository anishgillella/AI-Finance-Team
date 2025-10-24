import 'dotenv/config';
import { runFinanceAgent } from './agent/graph.js';
import fs from 'fs';
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('📊 AI Finance Agent - LangGraph with GPT-5-Nano\n');
        console.log('Usage: ts-node src/index.ts <csv_file> [query]\n');
        console.log('Examples:');
        console.log('  ts-node src/index.ts data/sample_transactions.csv');
        console.log('  ts-node src/index.ts data/sample_transactions.csv "Show me profit margin"');
        process.exit(1);
    }
    const csvPath = args[0];
    const query = args[1];
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ File not found: ${csvPath}`);
        process.exit(1);
    }
    if (!process.env.OPENROUTER_API_KEY) {
        console.error('❌ OPENROUTER_API_KEY not set in .env');
        process.exit(1);
    }
    try {
        const result = await runFinanceAgent(csvPath, query);
        console.log('\n📈 Analysis Complete!\n');
        console.log(JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}
main().catch(console.error);
//# sourceMappingURL=index.js.map