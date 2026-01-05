# Docker Quick Reference

## 🚀 Quick Start
```bash
cd backend
cp env.docker.example .env
# Edit .env: Set OPENAI_API_KEY
docker-compose up -d
```

## 📋 Common Commands

| Action | Command |
|--------|---------|
| Start | `docker-compose up -d` |
| Stop | `docker-compose down` |
| Restart | `docker-compose restart` |
| Logs (live) | `docker-compose logs -f` |
| Logs (last 50) | `docker-compose logs --tail=50` |
| Status | `docker-compose ps` |
| Rebuild | `docker-compose up -d --build` |
| Shell | `docker-compose exec backend sh` |
| Stats | `docker stats ownrex-backend` |

## 🔍 Health Checks

| Endpoint | Purpose |
|----------|---------|
| `http://localhost:8000/` | API info |
| `http://localhost:8000/health` | Full health |
| `http://localhost:8000/health/live` | Liveness |
| `http://localhost:8000/health/ready` | Readiness |
| `http://localhost:8000/health/stats` | Statistics |

## ⚙️ Configuration (.env)

**Required:**
```bash
OPENAI_API_KEY=sk-your-key-here
```

**Security:**
```bash
AUTH_ENABLED=true
OWNREX_API_KEY=your-secure-key
CORS_ORIGIN=https://your-domain.com
```

**Performance:**
```bash
CACHE_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
```

## 🐛 Troubleshooting

**Container won't start:**
```bash
docker-compose logs backend
```

**Port already in use:**
```bash
# Change in docker-compose.yml:
ports:
  - "9000:8000"  # Use port 9000
```

**Can't connect:**
```bash
docker-compose ps  # Check if running
curl http://localhost:8000/health/live
```

## 🔄 Update & Cleanup

**Update:**
```bash
git pull
docker-compose up -d --build
```

**Cleanup:**
```bash
docker-compose down -v --rmi all
```

## 📖 Full Documentation

See `docs/DOCKER.md` for complete guide.

