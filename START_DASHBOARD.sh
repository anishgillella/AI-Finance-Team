#!/bin/bash

echo "🚀 Starting AI Finance Dashboard System"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this from the project root directory"
    exit 1
fi

echo "📋 Step 1: Starting Backend Server..."
echo "   Command: cd backend && npm run dev"
echo ""

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!

echo "✓ Backend started (PID: $BACKEND_PID)"
sleep 3

echo ""
echo "📋 Step 2: Starting Frontend Server..."
echo "   Command: cd frontend && npm run dev"
echo ""

# Start frontend in a new terminal (for macOS)
osascript -e 'tell app "Terminal"
    do script "cd \"'"$(pwd)/../frontend"'\" && npm run dev"
end tell' 2>/dev/null || (
    cd ../frontend
    npm run dev &
    FRONTEND_PID=$!
)

echo ""
echo "=========================================="
echo "✨ DASHBOARD SYSTEM STARTING UP"
echo "=========================================="
echo ""
echo "📊 Backend:  http://localhost:5000"
echo "🎨 Frontend: http://localhost:3000/dashboard"
echo ""
echo "Wait 10 seconds for servers to start, then open:"
echo "👉 http://localhost:3000/dashboard"
echo ""
echo "Press Ctrl+C to stop"
echo ""

wait $BACKEND_PID
