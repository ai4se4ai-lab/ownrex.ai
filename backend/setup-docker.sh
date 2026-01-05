#!/bin/bash
# Quick setup script for Docker deployment

set -e

echo "🐳 Ownrex.ai Backend - Docker Setup"
echo "===================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "   Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed"
    echo "   Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.docker.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and set your OPENAI_API_KEY"
    echo ""
    read -p "Do you want to edit .env now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔨 Building Docker image..."
docker compose build

echo ""
echo "🚀 Starting backend..."
docker compose up -d

echo ""
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check health
if curl -f http://localhost:8000/health/live > /dev/null 2>&1; then
    echo "✅ Backend is running!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "📊 Status:"
    docker compose ps
    echo ""
    echo "🔗 API: http://localhost:8000"
    echo "📖 Documentation: http://localhost:8000/"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs:    docker compose logs -f"
    echo "   Stop:         docker compose down"
    echo "   Restart:      docker compose restart"
    echo ""
else
    echo "⚠️  Backend started but health check failed"
    echo "   Check logs: docker compose logs"
    echo ""
    echo "   Common issues:"
    echo "   - OPENAI_API_KEY not set in .env"
    echo "   - Port 8000 already in use"
fi

