# Docker Quick Start

## Setup

1. **Create environment file**:
   ```bash
   cp env.docker.example .env
   ```

2. **Edit `.env` and set your OpenAI API key**:
   ```bash
   OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   ```

3. **Build and start**:
   ```bash
   docker-compose up -d
   ```

4. **Test**:
   ```bash
   curl http://localhost:8000/health
   ```

## Commands

- **Start**: `docker-compose up -d`
- **Stop**: `docker-compose down`
- **Logs**: `docker-compose logs -f`
- **Rebuild**: `docker-compose up -d --build`

## Configuration

Edit `.env` file to configure:
- OpenAI API key (required)
- Port, caching, rate limiting, etc.

See `docs/DOCKER.md` for full documentation.

## Using with VS Code Extension

Configure the extension to point to your Docker backend:

In VS Code settings (settings.json):
```json
{
  "ownrex.backendUrl": "http://localhost:8000",
  "ownrex.apiKey": "your-ownrex-api-key"
}
```

