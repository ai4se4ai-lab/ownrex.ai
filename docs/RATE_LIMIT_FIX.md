# Rate Limit Error Fix

## Problem

The extension was hitting rate limits (429 errors) when fetching tokens from the backend `/v1/token` endpoint. This caused the "Language model unavailable" error.

## Root Cause

1. **Multiple concurrent requests**: Multiple parts of the extension were making simultaneous token requests
2. **No retry logic**: When rate limited, the extension immediately failed without retrying
3. **Short cache timeout**: 5-minute cache caused frequent token refreshes
4. **No request deduplication**: Multiple concurrent requests for the same token weren't deduplicated

## Solution

### Changes Made

#### 1. `BackendTokenServiceImpl` (`src/platform/authentication/node/backendTokenServiceImpl.ts`)

**Improvements:**
- ✅ **Request deduplication**: Added `TaskSingler` to prevent concurrent requests for the same token
- ✅ **Retry logic with exponential backoff**: Automatically retries failed requests up to 3 times
- ✅ **Rate limit handling**: Special handling for 429 errors with exponential backoff and `Retry-After` header support
- ✅ **Extended cache timeout**: Increased from 5 minutes to 10 minutes to reduce requests
- ✅ **Grace period for expired tokens**: Uses cached tokens even if expired (up to 5 minutes) when rate limited
- ✅ **Fallback to cached tokens**: If all retries fail but a cached token exists, uses the cached token

**Key Features:**
- Retries up to 3 times with exponential backoff (1s, 2s, 4s)
- Respects `Retry-After` header from 429 responses
- Caps retry delay at 30 seconds
- Uses cached tokens as fallback when rate limited

#### 2. `OwnrexTokenManager` (`src/platform/authentication/node/ownrexTokenManager.ts`)

**Improvements:**
- ✅ **Extended grace period**: Uses cached tokens even if expired (up to 1 hour) when rate limited
- ✅ **Fallback to cached tokens**: If token fetch fails but cached token exists, uses cached token instead of throwing error

## How It Works

1. **First Request**: Fetches token from backend and caches it for 10 minutes
2. **Subsequent Requests**:
   - Uses cached token if still valid
   - If expired but within grace period, uses cached token
   - If expired, fetches new token with retry logic
3. **Rate Limit Handling**:
   - On 429 error, waits for `Retry-After` header or uses exponential backoff
   - Uses cached token if available during rate limit
   - Retries up to 3 times before failing
4. **Request Deduplication**: Multiple concurrent requests for the same token share a single backend request

## Testing

To verify the fix works:

1. **Check logs** in VS Code Developer Console:
   - Look for `[BackendTokenService]` messages
   - Should see retry attempts on rate limits
   - Should see cached token usage

2. **Monitor rate limit errors**:
   - Rate limit errors should be handled gracefully
   - Extension should continue working with cached tokens

3. **Verify token refresh**:
   - Tokens should refresh automatically when cache expires
   - Multiple requests should be deduplicated

## Backend Configuration

The backend rate limit is configured in `.env`:
- `RATE_LIMIT_WINDOW_MS`: 900000 (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: 100 requests per window

To increase limits for development, update `.env`:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200  # Increase for development
```

## Future Improvements

1. **Configurable retry settings**: Make retry count and delays configurable
2. **Rate limit monitoring**: Track rate limit usage and warn before hitting limits
3. **Adaptive caching**: Adjust cache timeout based on token expiration from backend
4. **Request queuing**: Queue requests when rate limited instead of failing

## Related Files

- `src/platform/authentication/node/backendTokenServiceImpl.ts` - Main token fetching service
- `src/platform/authentication/node/ownrexTokenManager.ts` - Token manager with caching
- `backend/src/middleware/rateLimiter.ts` - Backend rate limiting middleware
- `backend/src/config/index.ts` - Backend rate limit configuration

