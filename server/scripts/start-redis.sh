#!/bin/bash

# Script to start Redis for development
echo "🔧 Starting Redis for MindMesh+ development..."

# Check if Redis is already running
if pgrep -x "redis-server" > /dev/null; then
    echo "✅ Redis is already running"
    exit 0
fi

# Try to start Redis
echo "🚀 Starting Redis server..."

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "❌ Redis is not installed"
    echo "📝 Install Redis:"
    echo "   Ubuntu/Debian: sudo apt-get install redis-server"
    echo "   macOS: brew install redis"
    echo "   Or use Docker: docker run -d -p 6379:6379 redis:alpine"
    exit 1
fi

# Start Redis in background
redis-server --daemonize yes --port 6379

# Wait a moment for Redis to start
sleep 2

# Check if Redis started successfully
if pgrep -x "redis-server" > /dev/null; then
    echo "✅ Redis started successfully on port 6379"
    echo "🔗 Connection: redis://localhost:6379"
else
    echo "❌ Failed to start Redis"
    exit 1
fi
