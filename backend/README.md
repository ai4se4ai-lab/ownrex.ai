# Ownrex.ai Backend

OpenAI-compatible API server for the Ownrex.ai VS Code extension.

## 🚀 Quick Start

### Docker (Recommended)

```bash
# 1. Create environment file
cp env.docker.example .env

# 2. Set your OpenAI API key in .env
OPENAI_API_KEY=sk-your-key-here

# 3. Start with Docker Compose
docker-compose up -d

# 4. Test
curl http://localhost:8000/health
```

**Quick setup script (Windows)**:
```cmd
setup-docker.bat
```

**Quick setup script (Linux/Mac)**:
```bash
chmod +x setup-docker.sh
./setup-docker.sh
```

### Direct Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure
cp env.example .env
# Edit .env with your OpenAI API key

# 3. Start server
npm start

# Development mode with auto-reload:
npm run dev
```

## 📖 Documentation

Full documentation available in [`docs/`](./docs/):

- **[API Reference](./docs/API.md)** - Complete API documentation
- **[Setup Guide](./docs/SETUP.md)** - Installation and configuration
- **[Docker Guide](./docs/DOCKER.md)** - Docker deployment
- **[Architecture](./docs/ARCHITECTURE.md)** - System design
- **[Configuration](./docs/CONFIGURATION.md)** - All config options
- **[Development](./docs/DEVELOPMENT.md)** - Development workflow

## 🔗 API Endpoints

- `POST /v1/chat/completions` - Chat completions
- `POST /v1/completions` - Text completions
- `POST /v1/embeddings` - Embeddings
- `GET /v1/models` - List models
- `GET /health` - Health check

## 🐳 Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build

# Check status
docker-compose ps
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📊 Project Structure

```
backend/
├── src/                    # Source code
│   ├── config/            # Configuration
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities
├── test/                  # Test files
├── docs/                  # Documentation
├── Dockerfile             # Docker image definition
├── docker-compose.yml     # Docker Compose config
└── package.json           # Dependencies
```

## ⚙️ Configuration

Key environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | Your OpenAI API key |
| `PORT` | No | 8000 | Server port |
| `AUTH_ENABLED` | No | false | Enable API key auth |
| `CACHE_ENABLED` | No | true | Enable caching |
| `LOG_LEVEL` | No | info | Logging level |

See [CONFIGURATION.md](./docs/CONFIGURATION.md) for all options.

## 🔒 Security

- Enable authentication: `AUTH_ENABLED=true`
- Set API key: `OWNREX_API_KEY=your-key`
- Configure CORS: `CORS_ORIGIN=https://your-domain.com`
- Enable rate limiting (enabled by default)

## 🤝 VS Code Extension Integration

Configure the Ownrex.ai extension to use this backend:

```json
{
  "ownrex.backendUrl": "http://localhost:8000",
  "ownrex.apiKey": "your-ownrex-api-key"
}
```

## 📝 License

MIT License - Copyright (c) Ai4SE4AI Lab

## 🆘 Support

- Check logs: `docker-compose logs -f` or `npm run dev`
- Health check: `curl http://localhost:8000/health`
- Documentation: See `docs/` directory
- Issues: Check [DOCKER.md](./docs/DOCKER.md#troubleshooting) troubleshooting section

