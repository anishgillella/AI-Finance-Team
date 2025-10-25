import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "");
/**
 * Insert mock data into the finance database
 * Run with: npx ts-node src/data/insert-mock-data.ts
 */
async function insertMockData() {
    console.log("\n📊 Inserting mock financial data...\n");
    try {
        // 1. Insert users
        console.log("1️⃣  Inserting users...");
        const { error: usersError } = await supabase.from("users").insert([
            {
                email: "john.smith@email.com",
                name: "James Smith",
                phone: "+1-555-1001",
                country: "USA",
            },
            {
                email: "mary.johnson@email.com",
                name: "Mary Johnson",
                phone: "+1-555-1002",
                country: "UK",
            },
            {
                email: "robert.williams@email.com",
                name: "Robert Williams",
                phone: "+1-555-1003",
                country: "Canada",
            },
            {
                email: "patricia.brown@email.com",
                name: "Patricia Brown",
                phone: "+1-555-1004",
                country: "Australia",
            },
            {
                email: "michael.jones@email.com",
                name: "Michael Jones",
                phone: "+1-555-1005",
                country: "Germany",
            },
        ]);
        if (usersError)
            throw usersError;
        console.log("   ✓ Users inserted\n");
        // 2. Insert securities
        console.log("2️⃣  Inserting securities...");
        const { error: securitiesError } = await supabase
            .from("securities")
            .insert([
            {
                ticker: "AAPL",
                name: "Apple Inc.",
                security_type: "stock",
                sector: "Technology",
                industry: "Consumer Electronics",
                market_cap: 2800000000000,
                description: "Leading technology company",
            },
            {
                ticker: "MSFT",
                name: "Microsoft Corporation",
                security_type: "stock",
                sector: "Technology",
                industry: "Software",
                market_cap: 2900000000000,
                description: "Enterprise software leader",
            },
            {
                ticker: "GOOGL",
                name: "Alphabet Inc.",
                security_type: "stock",
                sector: "Technology",
                industry: "Internet",
                market_cap: 1900000000000,
                description: "Search engine leader",
            },
            {
                ticker: "SPY",
                name: "SPDR S&P 500 ETF",
                security_type: "etf",
                sector: "Diversified",
                industry: "Index Fund",
                market_cap: 450000000000,
                description: "Tracks S&P 500 index",
            },
            {
                ticker: "BTC",
                name: "Bitcoin",
                security_type: "crypto",
                sector: "Digital Assets",
                industry: "Cryptocurrency",
                market_cap: 500000000000,
                description: "Digital currency",
            },
        ]);
        if (securitiesError)
            throw securitiesError;
        console.log("   ✓ Securities inserted\n");
        // 3. Get user ID for accounts
        const { data: usersData } = await supabase
            .from("users")
            .select("id")
            .limit(1);
        if (!usersData || usersData.length === 0) {
            throw new Error("No users found");
        }
        const userId = usersData[0].id;
        // 4. Insert accounts
        console.log("3️⃣  Inserting accounts...");
        const { error: accountsError } = await supabase
            .from("accounts")
            .insert([
            {
                user_id: userId,
                account_type: "checking",
                account_name: "Direct Deposit Account",
                balance: 25000,
                currency: "USD",
                account_number: "40111-001-001",
                institution_name: "Chase Bank",
            },
            {
                user_id: userId,
                account_type: "savings",
                account_name: "Emergency Fund",
                balance: 50000,
                currency: "USD",
                account_number: "40111-002-001",
                institution_name: "Chase Bank",
            },
            {
                user_id: userId,
                account_type: "investment",
                account_name: "Brokerage Account",
                balance: 250000,
                currency: "USD",
                account_number: "40111-003-001",
                institution_name: "Charles Schwab",
            },
        ]);
        if (accountsError)
            throw accountsError;
        console.log("   ✓ Accounts inserted\n");
        // 5. Get account and security IDs
        const { data: accountsData } = await supabase
            .from("accounts")
            .select("id")
            .eq("user_id", userId)
            .limit(1);
        const { data: securitiesData } = await supabase
            .from("securities")
            .select("id")
            .eq("ticker", "AAPL")
            .limit(1);
        if (!accountsData || !securitiesData) {
            throw new Error("Failed to retrieve account or security data");
        }
        const accountId = accountsData[0].id;
        const securityId = securitiesData[0].id;
        // 6. Insert portfolio holdings
        console.log("4️⃣  Inserting portfolio holdings...");
        const { error: holdingsError } = await supabase
            .from("portfolio_holdings")
            .insert([
            {
                account_id: accountId,
                security_id: securityId,
                quantity: 10.5,
                average_cost: 150.0,
                current_price: 195.5,
                market_value: 2052.75,
                acquisition_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            },
        ]);
        if (holdingsError)
            throw holdingsError;
        console.log("   ✓ Portfolio holdings inserted\n");
        // 7. Insert transactions
        console.log("5️⃣  Inserting transactions...");
        const { error: transactionsError } = await supabase
            .from("transactions")
            .insert([
            {
                account_id: accountId,
                transaction_type: "deposit",
                amount: 1500,
                transaction_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                description: "Salary Deposit",
                category: "Income",
                merchant: "Employer",
                status: "completed",
            },
            {
                account_id: accountId,
                transaction_type: "withdrawal",
                amount: 50,
                transaction_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
                description: "Grocery Store",
                category: "Groceries",
                merchant: "Whole Foods",
                status: "completed",
            },
            {
                account_id: accountId,
                transaction_type: "withdrawal",
                amount: 120,
                transaction_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                description: "Gas Station",
                category: "Transportation",
                merchant: "Shell",
                status: "completed",
            },
        ]);
        if (transactionsError)
            throw transactionsError;
        console.log("   ✓ Transactions inserted\n");
        // 8. Insert budgets
        console.log("6️⃣  Inserting budgets...");
        const now = new Date();
        const { error: budgetsError } = await supabase
            .from("budgets")
            .insert([
            {
                user_id: userId,
                category: "Groceries",
                limit_amount: 600,
                spent_amount: 245.5,
                budget_month: now.getMonth() + 1,
                budget_year: now.getFullYear(),
            },
            {
                user_id: userId,
                category: "Dining",
                limit_amount: 400,
                spent_amount: 185.75,
                budget_month: now.getMonth() + 1,
                budget_year: now.getFullYear(),
            },
            {
                user_id: userId,
                category: "Transportation",
                limit_amount: 500,
                spent_amount: 320,
                budget_month: now.getMonth() + 1,
                budget_year: now.getFullYear(),
            },
        ]);
        if (budgetsError)
            throw budgetsError;
        console.log("   ✓ Budgets inserted\n");
        // 9. Insert financial goals
        console.log("7️⃣  Inserting financial goals...");
        const { error: goalsError } = await supabase
            .from("financial_goals")
            .insert([
            {
                user_id: userId,
                goal_name: "Emergency Fund",
                goal_type: "savings",
                target_amount: 20000,
                current_amount: 15000,
                target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                priority: "high",
                status: "active",
            },
            {
                user_id: userId,
                goal_name: "House Down Payment",
                goal_type: "savings",
                target_amount: 150000,
                current_amount: 45000,
                target_date: new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000),
                priority: "high",
                status: "active",
            },
            {
                user_id: userId,
                goal_name: "Retirement Fund",
                goal_type: "retirement",
                target_amount: 500000,
                current_amount: 185000,
                target_date: new Date(Date.now() + 7300 * 24 * 60 * 60 * 1000),
                priority: "high",
                status: "active",
            },
        ]);
        if (goalsError)
            throw goalsError;
        console.log("   ✓ Financial goals inserted\n");
        // 10. Insert expense categories
        console.log("8️⃣  Inserting expense categories...");
        const { error: categoriesError } = await supabase
            .from("expense_categories")
            .insert([
            {
                user_id: userId,
                category_name: "Groceries",
                color: "#FFA500",
                icon: "🛒",
                description: "Food and household groceries",
            },
            {
                user_id: userId,
                category_name: "Dining",
                color: "#FF6B6B",
                icon: "🍔",
                description: "Restaurants and takeout",
            },
            {
                user_id: userId,
                category_name: "Transportation",
                color: "#4ECDC4",
                icon: "🚗",
                description: "Gas, parking, and car maintenance",
            },
            {
                user_id: userId,
                category_name: "Entertainment",
                color: "#95E1D3",
                icon: "🎬",
                description: "Movies, games, and hobbies",
            },
        ]);
        if (categoriesError)
            throw categoriesError;
        console.log("   ✓ Expense categories inserted\n");
        console.log("✅ All mock data inserted successfully!\n");
    }
    catch (error) {
        console.error("❌ Error inserting mock data:", error);
        process.exit(1);
    }
}
// Run the insertion
insertMockData();
//# sourceMappingURL=insert-mock-data.js.map