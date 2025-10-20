#!/bin/bash

# MindMesh+ Development Setup Script
echo "🚀 Setting up MindMesh+ development environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the server directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up environment..."
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update with your credentials."
else
    echo "✅ .env file already exists"
fi

echo "🗄️ Checking MongoDB..."
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️ MongoDB is installed but not running"
        echo "   Start with: mongod --dbpath /var/lib/mongodb"
    fi
else
    echo "⚠️ MongoDB not found"
    echo "   Install: https://docs.mongodb.com/manual/installation/"
    echo "   Or use MongoDB Atlas (cloud)"
fi

echo "🔴 Checking Redis..."
if command -v redis-server &> /dev/null; then
    if pgrep -x "redis-server" > /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️ Redis is installed but not running"
        echo "   Start with: redis-server"
        echo "   Or run: ./scripts/start-redis.sh"
    fi
else
    echo "⚠️ Redis not found"
    echo "   Install: sudo apt-get install redis-server"
    echo "   Or use Docker: docker run -d -p 6379:6379 redis:alpine"
fi

echo ""
echo "🎯 Development Setup Complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env with your credentials"
echo "2. Start MongoDB: mongod"
echo "3. Start Redis: redis-server"
echo "4. Start server: npm run dev"
echo ""
echo "🔗 Health check: http://localhost:4000/healthz"
echo "📚 API docs: http://localhost:4000/api"
