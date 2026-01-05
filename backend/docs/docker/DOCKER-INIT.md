# Docker Deployment Guide

This guide explains how to run the Ownrex.ai Backend using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)
- OpenAI API key

## Quick Start

### 1. Configure Environment

Copy the example environment file:

```bash
cp .env.docker .env.docker.local
```

Edit `.env.docker.local` and set your OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 2. Build and Start

**Option A: Using the environment file**

```bash
docker-compose --env-file .env.docker.local up -d
```

**Option B: Set environment variable directly**

```bash
OPENAI_API_KEY=sk-your-key docker-compose up -d
```

**Option C: Use system .env file**

If you already have a `.env` file configured:

```bash
# Link or copy your .env file
cp .env .env.docker.local

# Start with that environment
docker-compose --env-file .env.docker.local up -d
```

### 3. Verify

Check that the backend is running:

```bash
curl http://localhost:8000/health
```

You should see a JSON response with the server status.

## Docker Commands

### Build the Image

```bash
docker-compose build
```

### Start Services

```bash
# Start in foreground (see logs)
docker-compose up

# Start in background (detached)
docker-compose up -d
```

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
# All logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
docker-compose restart
```

### Rebuild and Restart

```bash
docker-compose up -d --build
```

### Check Status

```bash
docker-compose ps
```

## Configuration

### Environment Variables

All configuration is done via environment variables in `docker-compose.yml` or `.env.docker`.

Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | **Required** - Your OpenAI API key |
| `PORT` | 8000 | Server port inside container |
| `AUTH_ENABLED` | false | Enable API key authentication |
| `CACHE_ENABLED` | true | Enable response caching |
| `LOG_LEVEL` | info | Logging level (debug, info, warn, error) |
| `CORS_ORIGIN` | * | CORS allowed origins |

### Port Mapping

By default, the backend is exposed on `http://localhost:8000`.

To change the host port, edit `docker-compose.yml`:

```yaml
ports:
  - "9000:8000"  # Host:Container
```

### Volumes

Logs are persisted to `./logs` directory:

```yaml
volumes:
  - ./logs:/app/logs
```

## Using Redis Cache

For production deployments, you can use Redis for caching:

### 1. Enable Redis Service

Uncomment the Redis service in `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: ownrex-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  networks:
    - ownrex-network
```

Also uncomment the volumes section:

```yaml
volumes:
  redis-data:
```

### 2. Update Backend Configuration

In `docker-compose.yml` or your `.env.docker.local`, add:

```yaml
environment:
  - CACHE_TYPE=redis
  - REDIS_HOST=redis
  - REDIS_PORT=6379
```

### 3. Restart Services

```bash
docker-compose up -d
```

## Production Deployment

### Security Best Practices

1. **Enable Authentication**:
   ```yaml
   environment:
     - AUTH_ENABLED=true
     - OWNREX_API_KEY=your-secure-api-key-here
   ```

2. **Restrict CORS**:
   ```yaml
   environment:
     - CORS_ORIGIN=https://your-domain.com
   ```

3. **Use Secrets Management**:
   ```bash
   # Use Docker secrets or environment variable substitution
   echo "sk-your-key" | docker secret create openai_key -
   ```

4. **Enable Rate Limiting**:
   ```yaml
   environment:
     - RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
     - RATE_LIMIT_MAX_REQUESTS=100
   ```

### Resource Limits

Add resource constraints in `docker-compose.yml`:

```yaml
services:
  backend:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Health Checks

Health checks are configured by default. Monitor them with:

```bash
docker inspect --format='{{json .State.Health}}' ownrex-backend
```

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker-compose logs backend
```

Common issues:
- Missing `OPENAI_API_KEY`
- Port 8000 already in use
- Invalid environment variables

### API Key Not Working

Verify the environment variable is set:
```bash
docker-compose exec backend env | grep OPENAI_API_KEY
```

### Can't Connect to Backend

1. Check if container is running:
   ```bash
   docker-compose ps
   ```

2. Check port binding:
   ```bash
   docker-compose port backend 8000
   ```

3. Test from inside container:
   ```bash
   docker-compose exec backend wget -qO- http://localhost:8000/health
   ```

### High Memory Usage

Enable memory limits and monitor:
```bash
docker stats ownrex-backend
```

## Development with Docker

For development, you can mount the source code:

```yaml
services:
  backend:
    # ... other config ...
    volumes:
      - ./src:/app/src:ro  # Read-only mount
      - ./logs:/app/logs
    command: npm run dev  # If you have a dev script with nodemon
```

**Note**: This requires rebuilding when dependencies change.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          cd backend
          docker build -t ownrex-backend:${{ github.sha }} .
```

### GitLab CI Example

```yaml
docker-build:
  stage: build
  script:
    - cd backend
    - docker build -t ownrex-backend:$CI_COMMIT_SHA .
```

## Multi-Platform Builds

Build for multiple architectures:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t ownrex-backend:latest .
```

## Cleaning Up

Remove containers and networks:
```bash
docker-compose down
```

Remove containers, networks, and volumes:
```bash
docker-compose down -v
```

Remove images:
```bash
docker rmi ownrex-backend:latest
```

Complete cleanup:
```bash
docker-compose down -v --rmi all
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Health check: `curl http://localhost:8000/health`
- Documentation: See `docs/` directory

