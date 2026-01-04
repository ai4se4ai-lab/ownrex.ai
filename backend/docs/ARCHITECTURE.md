# Ownrex.ai Backend Architecture

This document describes the system architecture and design decisions.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                         │
│                   (Ownrex.ai Client)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ownrex Backend                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Express Server                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │   CORS      │ │   Helmet    │ │ Compression │       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                     Middleware                          │ │
│  │  ┌────────┐ ┌──────────────┐ ┌───────────┐ ┌────────┐  │ │
│  │  │ Auth   │ │ Rate Limiter │ │  Logger   │ │Validate│  │ │
│  │  └────────┘ └──────────────┘ └───────────┘ └────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                       Routes                            │ │
│  │  ┌──────────────┐ ┌─────────────┐ ┌───────────────┐    │ │
│  │  │ /chat/       │ │ /completions│ │  /embeddings  │    │ │
│  │  │ completions  │ │             │ │               │    │ │
│  │  └──────────────┘ └─────────────┘ └───────────────┘    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                      Services                           │ │
│  │  ┌─────────┐ ┌───────┐ ┌────────┐ ┌─────────┐          │ │
│  │  │ OpenAI  │ │ Cache │ │ Prompt │ │Telemetry│          │ │
│  │  │ Service │ │Service│ │ Engine │ │ Service │          │ │
│  │  └─────────┘ └───────┘ └────────┘ └─────────┘          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      OpenAI API                              │
└─────────────────────────────────────────────────────────────┘
```

## Layer Architecture

### 1. Entry Point (`src/index.ts`)

- Initializes configuration
- Creates Express server
- Handles graceful shutdown
- Global error handling

### 2. Server Layer (`src/server.ts`)

- Express application setup
- Middleware configuration
- Route mounting
- Error handlers

### 3. Middleware Layer (`src/middleware/`)

| Middleware | Purpose |
|------------|---------|
| `auth.ts` | API key validation |
| `rateLimiter.ts` | Request rate limiting |
| `requestLogger.ts` | Request/response logging |
| `validator.ts` | Request body validation |
| `errorHandler.ts` | Global error handling |

### 4. Routes Layer (`src/routes/`)

- Handles HTTP endpoints
- Request parsing
- Response formatting
- Streaming support

### 5. Services Layer (`src/services/`)

| Service | Responsibility |
|---------|----------------|
| `openai.service.ts` | OpenAI API client wrapper |
| `cache.service.ts` | In-memory caching |
| `prompt.service.ts` | Prompt engineering |
| `token.service.ts` | API key management |
| `telemetry.service.ts` | Usage tracking |

### 6. Utilities (`src/utils/`)

- `logger.ts`: Winston logging
- `errors.ts`: Custom error classes
- `helpers.ts`: Helper functions

## Design Patterns

### Singleton Pattern

Services use singleton pattern for shared state:

```typescript
class CacheService {
  private static instance: CacheService;
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
}
```

### Middleware Chain

Requests flow through middleware chain:

```
Request → CORS → Helmet → Auth → RateLimit → Logger → Validate → Route → Response
```

### Factory Pattern

Server and logger use factory functions:

```typescript
export function createServer(): Application {
  const app = express();
  // ... setup
  return app;
}
```

## Data Flow

### Chat Completion Flow

```
1. Client sends POST /v1/chat/completions
2. Auth middleware validates API key
3. Rate limiter checks request quota
4. Validator validates request body
5. Chat route handles request:
   a. Check cache for identical request
   b. If cached, return cached response
   c. Enhance messages with system prompt
   d. Call OpenAI API
   e. Cache response
   f. Return response
6. Error handler catches any errors
```

### Streaming Flow

```
1. Request with stream: true
2. Response headers set for SSE
3. OpenAI stream created
4. Chunks sent as SSE events
5. [DONE] sent on completion
```

## Error Handling

### Error Hierarchy

```
AppError (base)
├── ValidationError (400)
├── AuthenticationError (401)
├── PermissionError (403)
├── NotFoundError (404)
├── RateLimitError (429)
├── OpenAIError (5xx)
└── ServiceUnavailableError (503)
```

### Error Response Format

```json
{
  "error": {
    "message": "Human-readable message",
    "type": "error_type",
    "code": "error_code",
    "param": "affected_param"
  }
}
```

## Caching Strategy

### Cache Key Generation

```typescript
function createCacheKey(request) {
  // Hash of model + messages + parameters
  return `chat:${sha256(JSON.stringify(sortedRequest))}`;
}
```

### Cache Invalidation

- TTL-based expiration (default: 1 hour)
- Automatic cleanup every minute
- Manual invalidation via API

## Scalability Considerations

### Horizontal Scaling

- Stateless design (except cache)
- External cache (Redis) for multi-instance
- Load balancer compatible

### Performance Optimizations

- Response compression
- Connection pooling
- Efficient JSON serialization
- Streaming for large responses

## Security

### Authentication

- Bearer token authentication
- API key validation
- Optional auth for development

### Request Validation

- Joi schema validation
- Input sanitization
- Size limits

### Headers

- Helmet security headers
- CORS configuration
- Rate limiting

