#!/bin/bash

echo "===================================="
echo "Phoenix Code Lite Update Script"
echo "===================================="
echo

echo "🔧 Building TypeScript project..."
cd "C:\Users\gabri\Documents\Infotopology\Phoenix\phoenix-code-lite"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check for TypeScript errors."
    exit 1
fi

echo
echo "🔗 Updating global npm link..."
npm unlink -g phoenix-code-lite >/dev/null 2>&1
npm link
if [ $? -ne 0 ]; then
    echo "❌ Failed to link package globally!"
    exit 1
fi

echo
echo "✅ Phoenix Code Lite updated successfully!"
echo
echo "📋 Available commands:"
echo "  phoenix-code-lite --help"
echo "  phoenix-code-lite config --edit"
echo "  phoenix-code-lite template"
echo
echo "🎯 Testing installation:"
phoenix-code-lite --version
echo