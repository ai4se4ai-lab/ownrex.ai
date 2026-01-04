# Ownrex.ai Backend Configuration

Complete reference for all configuration options.

## Environment Variables

### Server Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | number | 8000 | Server port |
| `NODE_ENV` | string | development | Environment (development, production, test) |

### OpenAI Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENAI_API_KEY` | string | - | **Required**. Your OpenAI API key |
| `OPENAI_ORGANIZATION` | string | - | OpenAI organization ID (optional) |
| `OPENAI_BASE_URL` | string | https://api.openai.com/v1 | OpenAI API base URL |

### Model Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DEFAULT_CHAT_MODEL` | string | gpt-4 | Default chat model |
| `DEFAULT_COMPLETION_MODEL` | string | gpt-3.5-turbo-instruct | Default completion model |
| `DEFAULT_EMBEDDING_MODEL` | string | text-embedding-3-small | Default embedding model |

### Authentication

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `AUTH_ENABLED` | boolean | false | Enable API key authentication |
| `OWNREX_API_KEY` | string | ownrex-default-key | API key for authentication |

### Rate Limiting

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | number | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | number | 100 | Max requests per window |

### Caching

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CACHE_ENABLED` | boolean | true | Enable response caching |
| `CACHE_TTL` | number | 3600 | Cache TTL in seconds |
| `CACHE_TYPE` | string | memory | Cache type (memory) |

### Logging

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `LOG_LEVEL` | string | info | Log level (error, warn, info, debug) |
| `LOG_FILE_ENABLED` | boolean | true | Enable file logging |
| `LOG_FILE_PATH` | string | ./logs/ownrex.log | Log file path |

### CORS

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CORS_ORIGIN` | string | * | Allowed origins |

### Telemetry

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TELEMETRY_ENABLED` | boolean | false | Enable usage telemetry |

## Example Configurations

### Development

```env
PORT=8000
NODE_ENV=development
OPENAI_API_KEY=sk-your-dev-key

AUTH_ENABLED=false
CACHE_ENABLED=true
LOG_LEVEL=debug
```

### Production

```env
PORT=8000
NODE_ENV=production
OPENAI_API_KEY=sk-your-prod-key

AUTH_ENABLED=true
OWNREX_API_KEY=your-secure-api-key

CACHE_ENABLED=true
CACHE_TTL=3600

LOG_LEVEL=info
LOG_FILE_ENABLED=true

RATE_LIMIT_MAX_REQUESTS=100
```

### Testing

```env
PORT=8001
NODE_ENV=test
OPENAI_API_KEY=sk-test-key

AUTH_ENABLED=false
CACHE_ENABLED=false
LOG_LEVEL=error
```

## Configuration Priority

1. Environment variables
2. `.env` file
3. Default values

## Validation

Configuration is validated on startup. Missing required values will show warnings but allow startup (for development).

## Runtime Configuration

Some settings can be changed at runtime via environment variables. The server does not need restart for:

- Log level changes
- Rate limit adjustments

However, these require restart:

- Port changes
- OpenAI API key changes
- Authentication settings

