# Ownrex.ai Backend Development Guide

This guide covers the development workflow, testing, and debugging.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 8+
- VS Code (recommended)

### Getting Started

```bash
# Install dependencies
npm install

# Copy environment config
cp env.example .env

# Start development server
npm run dev
```

The server runs on `http://localhost:8000` with hot reload enabled.

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # Express setup
│   ├── config/               # Configuration
│   ├── middleware/           # Express middleware
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── types/                # TypeScript types
│   └── utils/                # Utilities
├── test/
│   ├── setup.ts              # Test setup
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── docs/                     # Documentation
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

## Testing

### Unit Tests

Test individual functions and classes in isolation:

```bash
npm run test:unit
```

### Integration Tests

Test API endpoints with supertest:

```bash
npm run test:integration
```

### Test Coverage

```bash
npm test -- --coverage
```

Coverage report in `coverage/` directory.

### Writing Tests

```typescript
// test/unit/services/myservice.test.ts
import { MyService } from '../../../src/services/myservice';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('should do something', () => {
    const result = service.doSomething();
    expect(result).toBe(expected);
  });
});
```

## Debugging

### VS Code Launch Config

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

### Logging

Use the logger for debugging:

```typescript
import { getLogger } from '../utils/logger';

const logger = getLogger();
logger.debug('Debug message', { context: 'data' });
```

Set `LOG_LEVEL=debug` in `.env` for verbose output.

### Request Debugging

All requests are logged with:
- Request ID
- Method and path
- Duration
- Status code

Check logs or use `/health/stats` endpoint.

## Adding New Features

### Adding a New Endpoint

1. Create route file in `src/routes/`
2. Add validation schema in `src/middleware/validator.ts`
3. Import and mount in `src/routes/index.ts`
4. Add tests
5. Update documentation

### Adding a New Service

1. Create service in `src/services/`
2. Use singleton pattern if needed
3. Add unit tests
4. Export from service file

### Adding Middleware

1. Create in `src/middleware/`
2. Mount in `src/server.ts`
3. Test thoroughly

## Code Style

- TypeScript strict mode
- ESLint for linting
- Prettier for formatting
- Consistent error handling
- Comprehensive logging

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>
```

### TypeScript Errors

```bash
# Check types
npx tsc --noEmit
```

### Test Failures

```bash
# Run specific test
npm test -- --testPathPattern=mytest

# Verbose output
npm test -- --verbose
```

## Contributing

1. Create feature branch
2. Make changes with tests
3. Run full test suite
4. Submit pull request

