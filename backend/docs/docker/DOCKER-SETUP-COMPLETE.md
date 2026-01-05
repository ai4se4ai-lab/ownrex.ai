# Docker Deployment - Complete Setup

## ✅ What Was Created

### Docker Configuration Files

1. **`Dockerfile`** - Multi-stage Docker build
   - Stage 1: Build TypeScript to JavaScript
   - Stage 2: Production image with only runtime dependencies
   - Security: Non-root user, health checks included
   - Optimized: ~200MB final image size

2. **`docker-compose.yml`** - Service orchestration
   - Backend service configuration
   - Environment variable management
   - Volume mounts for logs
   - Optional Redis cache service (commented out)
   - Health checks and restart policies

3. **`.dockerignore`** - Build optimization
   - Excludes unnecessary files from Docker context
   - Reduces build time and image size

4. **`env.docker.example`** - Environment template
   - All configuration options documented
   - Safe defaults for development
   - Production-ready security options

### Documentation

5. **`docs/DOCKER.md`** - Complete Docker guide (350+ lines)
   - Installation and setup
   - Docker commands reference
   - Production deployment best practices
   - Security configuration
   - Redis cache setup
   - Troubleshooting guide
   - CI/CD integration examples

6. **`DOCKER.md`** - Quick start guide
   - Fast setup instructions
   - Essential commands
   - VS Code extension integration

7. **`README.md`** - Updated main README
   - Docker as primary deployment method
   - Quick start for both Docker and direct installation

### Setup Scripts

8. **`setup-docker.sh`** - Linux/Mac automated setup
   - Checks Docker installation
   - Creates .env from template
   - Builds and starts services
   - Verifies deployment

9. **`setup-docker.bat`** - Windows automated setup
   - Same features as bash script
   - Windows-compatible commands

## 🚀 How to Use

### Method 1: Automated Setup (Easiest)

**Windows:**
```cmd
cd backend
setup-docker.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x setup-docker.sh
./setup-docker.sh
```

### Method 2: Manual Setup

```bash
cd backend

# 1. Create environment file
cp env.docker.example .env

# 2. Edit .env and set your OpenAI API key
# OPENAI_API_KEY=sk-your-actual-key-here

# 3. Build and start
docker-compose up -d

# 4. Verify
curl http://localhost:8000/health
```

## 📋 Essential Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# Check status
docker-compose ps

# Execute commands in container
docker-compose exec backend sh
```

## 🔧 Configuration

### Required Configuration

Edit `.env` file:
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Optional Configuration

```bash
# Change host port (default: 8000)
HOST_PORT=9000

# Enable authentication
AUTH_ENABLED=true
OWNREX_API_KEY=your-secure-api-key

# Configure caching
CACHE_ENABLED=true
CACHE_TYPE=memory  # or 'redis' with Redis service

# Set logging level
LOG_LEVEL=debug  # debug, info, warn, error

# CORS configuration
CORS_ORIGIN=https://your-domain.com
```

## 🐳 Docker Architecture

```
┌─────────────────────────────────────┐
│        Docker Host                  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Ownrex Backend Container    │  │
│  │  - Node.js 20 Alpine         │  │
│  │  - Express Server            │  │
│  │  - Non-root user (nodejs)    │  │
│  │  - Port 8000                 │  │
│  └──────────────────────────────┘  │
│           │                         │
│           │ (optional)              │
│           ▼                         │
│  ┌──────────────────────────────┐  │
│  │  Redis Container (optional)  │  │
│  │  - Redis 7 Alpine           │  │
│  │  - Port 6379                │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         │ Port 8000:8000
         ▼
    localhost:8000
         │
         ▼
  VS Code Extension
```

## 🔒 Production Deployment

### Security Best Practices

1. **Enable Authentication**:
   ```bash
   AUTH_ENABLED=true
   OWNREX_API_KEY=<generate-strong-key>
   ```

2. **Restrict CORS**:
   ```bash
   CORS_ORIGIN=https://your-domain.com
   ```

3. **Use Redis for Caching**:
   - Uncomment Redis service in `docker-compose.yml`
   - Set `CACHE_TYPE=redis`

4. **Set Resource Limits**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 1G
   ```

5. **Use Environment Secrets**:
   ```bash
   # Don't commit .env file
   # Use Docker secrets or cloud provider secrets management
   ```

### Deployment Checklist

- [ ] OpenAI API key configured
- [ ] Authentication enabled
- [ ] CORS restricted to your domain
- [ ] Rate limiting configured
- [ ] Resource limits set
- [ ] Logs directory mounted
- [ ] Health checks configured
- [ ] Backup strategy in place
- [ ] Monitoring set up

## 🔍 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Missing OPENAI_API_KEY
# - Port 8000 already in use
# - Invalid configuration
```

### Can't Connect to Backend

```bash
# Verify container is running
docker-compose ps

# Test from inside container
docker-compose exec backend wget -qO- http://localhost:8000/health

# Check port mapping
docker-compose port backend 8000
```

### High Memory Usage

```bash
# Monitor resources
docker stats ownrex-backend

# Set memory limits in docker-compose.yml
```

## 📊 Monitoring

### Health Checks

```bash
# Liveness (is server running?)
curl http://localhost:8000/health/live

# Readiness (is server ready?)
curl http://localhost:8000/health/ready

# Full health check
curl http://localhost:8000/health

# Statistics
curl http://localhost:8000/health/stats
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs backend

# With timestamps
docker-compose logs -t
```

## 🔄 Updates and Maintenance

### Update Backend Code

```bash
# Pull latest changes
git pull

# Rebuild and restart
cd backend
docker-compose up -d --build
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove images
docker rmi ownrex-backend:latest

# Complete cleanup
docker-compose down -v --rmi all
```

## 📦 Image Details

- **Base Image**: node:20-alpine
- **Final Size**: ~200MB (optimized)
- **User**: nodejs (non-root)
- **Port**: 8000
- **Health Check**: Automated every 30s
- **Build Time**: ~25-30s

## 🌐 VS Code Extension Configuration

After starting the backend, configure the extension:

**File**: `.vscode/settings.json` or User Settings

```json
{
  "ownrex.backendUrl": "http://localhost:8000",
  "ownrex.apiKey": "your-ownrex-api-key",
  "ownrex.defaultModel": "gpt-4"
}
```

## 📚 Additional Resources

- **Full Docker Guide**: `docs/DOCKER.md`
- **API Documentation**: `docs/API.md`
- **Configuration Options**: `docs/CONFIGURATION.md`
- **Architecture Overview**: `docs/ARCHITECTURE.md`

## ✅ Verification Steps

After deployment, verify everything works:

```bash
# 1. Check container is running
docker-compose ps
# Should show: ownrex-backend (healthy)

# 2. Check health endpoint
curl http://localhost:8000/health
# Should return: {"status":"healthy",...}

# 3. Check API root
curl http://localhost:8000/
# Should return: {"name":"Ownrex.ai Backend",...}

# 4. Test chat endpoint (with your API key in .env)
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 10
  }'
# Should return a chat completion

# 5. Check logs for errors
docker-compose logs --tail=50
# Should see no error messages
```

## 🎉 Success!

If all verification steps pass, your Docker deployment is successful!

The backend is now running at `http://localhost:8000` and ready to be used with the Ownrex.ai VS Code extension.

