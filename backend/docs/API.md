# Ownrex.ai Backend API Reference

This document provides a complete reference for all API endpoints.

## Base URL

```
http://localhost:8000
```

## Authentication

When authentication is enabled (`AUTH_ENABLED=true`), include an API key in the Authorization header:

```
Authorization: Bearer your-api-key
```

## Endpoints

### Chat Completions

Create a chat completion using GPT models.

**Endpoint**: `POST /v1/chat/completions`

**Request Body**:

```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | No | Model ID (default: from config) |
| messages | array | Yes | Array of message objects |
| temperature | number | No | 0-2 (default: 0.7) |
| top_p | number | No | 0-1 (default: 1) |
| n | integer | No | Number of completions (default: 1) |
| stream | boolean | No | Stream responses (default: false) |
| max_tokens | integer | No | Maximum tokens to generate |
| stop | string/array | No | Stop sequences |
| presence_penalty | number | No | -2 to 2 |
| frequency_penalty | number | No | -2 to 2 |
| tools | array | No | Tool definitions for function calling |
| tool_choice | string/object | No | Tool selection strategy |

**Response** (non-streaming):

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

**Streaming Response**:

When `stream: true`, responses are sent as Server-Sent Events (SSE):

```
data: {"id":"chatcmpl-abc","choices":[{"delta":{"content":"Hello"}}]}

data: {"id":"chatcmpl-abc","choices":[{"delta":{"content":"!"}}]}

data: [DONE]
```

---

### Text Completions (Legacy)

Create a text completion using instruct models.

**Endpoint**: `POST /v1/completions`

**Request Body**:

```json
{
  "model": "gpt-3.5-turbo-instruct",
  "prompt": "Say hello in Spanish",
  "max_tokens": 100,
  "temperature": 0.7
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | No | Model ID |
| prompt | string/array | Yes | Text prompt(s) |
| suffix | string | No | Text to append |
| max_tokens | integer | No | Maximum tokens |
| temperature | number | No | 0-2 |
| top_p | number | No | 0-1 |
| n | integer | No | Number of completions |
| stream | boolean | No | Stream responses |
| echo | boolean | No | Echo prompt in response |
| stop | string/array | No | Stop sequences |

**Response**:

```json
{
  "id": "cmpl-abc123",
  "object": "text_completion",
  "created": 1234567890,
  "model": "gpt-3.5-turbo-instruct",
  "choices": [
    {
      "text": "¡Hola!",
      "index": 0,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 5,
    "completion_tokens": 3,
    "total_tokens": 8
  }
}
```

---

### Embeddings

Create embeddings for text.

**Endpoint**: `POST /v1/embeddings`

**Request Body**:

```json
{
  "model": "text-embedding-3-small",
  "input": "Hello world"
}
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | No | Embedding model |
| input | string/array | Yes | Text to embed |
| encoding_format | string | No | "float" or "base64" |
| dimensions | integer | No | Output dimensions |

**Response**:

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.0023, -0.0094, ...],
      "index": 0
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 2,
    "total_tokens": 2
  }
}
```

---

### Models

List and retrieve models.

**List Models**:

```
GET /v1/models
```

**Response**:

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4",
      "object": "model",
      "created": 1234567890,
      "owned_by": "openai"
    }
  ]
}
```

**Retrieve Model**:

```
GET /v1/models/{model_id}
```

---

### Health Check

**Basic Health**:

```
GET /health
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "openai": true,
    "cache": true
  }
}
```

**Liveness Probe**:

```
GET /health/live
```

**Readiness Probe**:

```
GET /health/ready
```

**Statistics**:

```
GET /health/stats
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "message": "Error description",
    "type": "error_type",
    "code": "error_code",
    "param": "affected_parameter"
  }
}
```

**Common Error Types**:

| Type | Status | Description |
|------|--------|-------------|
| invalid_request_error | 400 | Invalid request parameters |
| authentication_error | 401 | Invalid or missing API key |
| permission_error | 403 | Permission denied |
| not_found_error | 404 | Resource not found |
| rate_limit_error | 429 | Rate limit exceeded |
| api_error | 500 | OpenAI API error |
| server_error | 500 | Internal server error |

---

## Rate Limiting

Requests are rate limited per IP or API key:

- **Default**: 100 requests per 15 minutes
- **Chat**: 60 requests per 15 minutes
- **Completions**: 60 requests per 15 minutes
- **Embeddings**: 200 requests per 15 minutes

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

