# Ownrex.ai Backend Documentation

Welcome to the Ownrex.ai Backend documentation. This directory contains comprehensive documentation for setting up, configuring, and developing the backend server.

## Documentation Structure

| Document | Description |
|----------|-------------|
| [API.md](./API.md) | Complete API reference with endpoints, request/response formats |
| [SETUP.md](./SETUP.md) | Installation and configuration guide |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and design decisions |
| [CONFIGURATION.md](./CONFIGURATION.md) | All configuration options explained |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Development workflow, testing, debugging |

## Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp env.example .env
# Edit .env with your OpenAI API key

# 3. Start development server
npm run dev

# 4. Test the server
curl http://localhost:8000/health
```

## Overview

The Ownrex.ai Backend is a Node.js/Express server that provides an OpenAI-compatible API for the Ownrex.ai VS Code extension. It acts as a proxy and enhancement layer between the extension and OpenAI's API.

### Key Features

- **OpenAI-Compatible API**: Drop-in replacement for OpenAI API endpoints
- **Smart Caching**: Reduces API calls and costs
- **Rate Limiting**: Protects against abuse
- **Request Logging**: Full audit trail of all requests
- **Prompt Engineering**: Automatic system prompt enhancement
- **Streaming Support**: Real-time response streaming
- **Error Handling**: Graceful error handling with informative messages

### Supported Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v1/chat/completions` | Chat completions (GPT-4, etc.) |
| `POST /v1/completions` | Text completions (legacy) |
| `POST /v1/embeddings` | Text embeddings |
| `GET /v1/models` | List available models |
| `GET /health` | Health check |

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **AI Provider**: OpenAI API
- **Testing**: Jest + Supertest

## License

Copyright (c) Ai4SE4AI Lab. All rights reserved.
Licensed under the MIT license.

