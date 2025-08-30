#!/bin/bash

# Test Script for Minimal Templum Backend
# This script starts the backend, tests connectivity, and runs basic commands

echo "================================================"
echo "Testing Minimal Templum Backend"
echo "================================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js detected: $(node --version)"
echo

# Navigate to the backend directory
cd "$(dirname "$0")/minimal-backend" || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo
fi

echo "Starting minimal backend server..."
echo "(Press Ctrl+C to stop the server when done testing)"
echo

# Start the backend server in background
node server.js > backend.log 2>&1 &
BACKEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo
    echo "Stopping backend server (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    echo "Backend stopped."
    echo "Test complete."
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Wait a moment for server to start
sleep 3

# Test health endpoint
echo "Testing health endpoint..."
if ! curl -s http://localhost:3001/health; then
    echo "ERROR: Backend server is not responding"
    echo "Check backend.log for error details:"
    cat backend.log
    exit 1
fi

echo
echo

# Test skin definition endpoint
echo "Testing skin definition endpoint..."
curl -s http://localhost:3001/getSkinDefinition | jq . 2>/dev/null || curl -s http://localhost:3001/getSkinDefinition
echo
echo

# Test hello command
echo "Testing hello command..."
curl -s -X POST http://localhost:3001/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.hello", "args": {"name": "Tester"}}' | \
  jq . 2>/dev/null || curl -s -X POST http://localhost:3001/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.hello", "args": {"name": "Tester"}}'
echo
echo

# Test status command
echo "Testing status command..."
curl -s -X POST http://localhost:3001/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.status"}' | \
  jq . 2>/dev/null || curl -s -X POST http://localhost:3001/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.status"}'
echo
echo

echo "================================================"
echo "Basic tests completed successfully!"
echo "================================================"
echo
echo "Backend is running at: http://localhost:3001"
echo "You can now:"
echo "  1. Use the minimal CLI: npx ts-node ../minimal-cli.ts"
echo "  2. Start full Templum and it will discover this backend"
echo "  3. Test commands manually with curl"
echo
echo "Backend log is in: minimal-backend/backend.log"
echo "Press Ctrl+C to stop the backend server..."

# Keep the script running until interrupted
wait $BACKEND_PID