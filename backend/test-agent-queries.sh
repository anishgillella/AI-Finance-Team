#!/bin/bash

echo "=========================================="
echo "🧪 AI Finance Agent - Test Suite"
echo "=========================================="
echo ""

# Test 1: Basic analysis
echo "�� TEST 1: Running basic financial analysis..."
npm run start data/sample_transactions.csv 2>&1 | grep -E "^(✅|🔍|📤|📊|🚀|💡|✨|❌)" | head -10
echo ""

# Test 2: Query test
echo "📊 TEST 2: Running query-based analysis..."
npm run start data/sample_transactions.csv "What are my top expenses?" 2>&1 | grep -E "^(✅|💬|💡|🚀)" | head -10
echo ""

echo "=========================================="
echo "✅ Test Suite Complete!"
echo "=========================================="
