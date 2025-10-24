import { DynamicTool } from '@langchain/core/tools';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
export const csvUploadTool = new DynamicTool({
    name: 'upload_csv_financial_data',
    description: 'Uploads and validates a CSV file containing financial data',
    func: async (input) => {
        try {
            const fileContent = fs.readFileSync(input, 'utf-8');
            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                cast: true
            });
            const parsed = records.map((record) => ({
                date: record.date || new Date().toISOString(),
                category: record.category || 'Uncategorized',
                amount: parseFloat(record.amount) || 0,
                description: record.description || '',
                type: (record.type || 'expense').toLowerCase()
            }));
            return JSON.stringify({
                success: true,
                record_count: parsed.length,
                data: parsed,
                date_range: {
                    start: Math.min(...parsed.map(r => new Date(r.date).getTime())),
                    end: Math.max(...parsed.map(r => new Date(r.date).getTime()))
                }
            });
        }
        catch (error) {
            return JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
});
export const calculateKPIsTool = new DynamicTool({
    name: 'calculate_financial_kpis',
    description: 'Calculates key financial indicators from parsed data',
    func: async (input) => {
        const parsed = JSON.parse(input);
        const records = parsed.data;
        const totalIncome = records
            .filter(r => r.type === 'income')
            .reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = records
            .filter(r => r.type === 'expense')
            .reduce((sum, r) => sum + r.amount, 0);
        const netProfit = totalIncome - totalExpenses;
        const avgTransaction = records.reduce((sum, r) => sum + r.amount, 0) / records.length;
        const kpis = [
            {
                name: 'Total Income',
                value: totalIncome,
                unit: 'USD',
                trend: 'stable'
            },
            {
                name: 'Total Expenses',
                value: totalExpenses,
                unit: 'USD',
                trend: 'stable'
            },
            {
                name: 'Net Profit',
                value: netProfit,
                unit: 'USD',
                trend: netProfit > 0 ? 'up' : 'down'
            },
            {
                name: 'Average Transaction',
                value: avgTransaction,
                unit: 'USD',
                trend: 'stable'
            },
            {
                name: 'Profit Margin',
                value: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
                unit: '%',
                trend: 'stable'
            }
        ];
        return JSON.stringify({
            success: true,
            kpis,
            record_count: records.length
        });
    }
});
export const anomalyDetectionTool = new DynamicTool({
    name: 'detect_financial_anomalies',
    description: 'Detects unusual transactions or patterns in financial data',
    func: async (input) => {
        const parsed = JSON.parse(input);
        const records = parsed.data;
        const amounts = records.map(r => r.amount);
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        const threshold = 2;
        const anomalies = records
            .filter(r => Math.abs(r.amount - mean) > threshold * stdDev)
            .map(r => ({
            date: r.date,
            category: r.category,
            amount: r.amount,
            severity: Math.abs(r.amount - mean) > threshold * stdDev * 1.5 ? 'high' : 'medium',
            reason: `Amount ${r.amount} is ${Math.round(Math.abs(r.amount - mean) / stdDev)}σ from mean`
        }));
        return JSON.stringify({
            success: true,
            anomaly_count: anomalies.length,
            anomalies,
            statistics: { mean, stdDev }
        });
    }
});
export const allMCPTools = [
    csvUploadTool,
    calculateKPIsTool,
    anomalyDetectionTool
];
//# sourceMappingURL=mcp-tools.js.map