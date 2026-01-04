# Ownrex.ai Backend Setup Guide

This guide walks you through setting up the Ownrex.ai backend server.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **OpenAI API Key**: Required for AI functionality

## Installation

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Required: Your OpenAI API key
OPENAI_API_KEY=sk-your-api-key-here

# Server port (default: 8000)
PORT=8000

# Environment (development, production, test)
NODE_ENV=development
```

### 4. Start the Server

**Development mode** (with hot reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm run build
npm start
```

### 5. Verify Installation

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## Configuration Options

See [CONFIGURATION.md](./CONFIGURATION.md) for all environment variables.

### Quick Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API key (required) |
| `PORT` | 8000 | Server port |
| `AUTH_ENABLED` | false | Enable API key auth |
| `CACHE_ENABLED` | true | Enable response caching |
| `LOG_LEVEL` | info | Logging level |

## Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 8000

CMD ["node", "dist/index.js"]
```

Build and run:

```bash
npm run build
docker build -t ownrex-backend .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-xxx ownrex-backend
```

## Troubleshooting

### "OpenAI API key not configured"

Ensure `OPENAI_API_KEY` is set in your `.env` file.

### "Cannot connect to OpenAI"

1. Verify your API key is valid
2. Check network connectivity
3. Ensure no firewall blocking

### "Rate limit exceeded"

Wait for the rate limit window to reset, or increase limits in configuration.

## Next Steps

1. Read the [API Reference](./API.md)
2. Configure [all options](./CONFIGURATION.md)
3. Set up [development workflow](./DEVELOPMENT.md)

