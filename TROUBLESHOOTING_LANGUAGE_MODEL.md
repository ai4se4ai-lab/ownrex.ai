# Troubleshooting: Language Model Unavailable

If you're seeing "Language model unavailable" in VS Code, follow these steps to diagnose and fix the issue.

## Quick Checks

### 1. Verify Backend is Running

The backend should be running on port 8000. Check with:

```bash
# Windows PowerShell
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000
```

You should see the backend listening on port 8000. If not, start it:

```bash
cd backend
npm start
```

### 2. Test Backend Endpoints

Test if the backend is responding:

```bash
# Health check
curl http://localhost:8000/health

# Models endpoint (should return model list)
curl http://localhost:8000/v1/models
```

### 3. Configure VS Code Settings

Open VS Code Settings (File > Preferences > Settings) and configure:

1. **Backend URL**:
   - Setting: `ownrex.backendUrl`
   - Value: `http://localhost:8000` (or your backend URL)

2. **API Key** (if authentication is enabled):
   - Setting: `ownrex.apiKey`
   - Value: Your API key (default: `ownrex-default-key` if auth is disabled)

3. **Default Model**:
   - Setting: `ownrex.defaultModel`
   - Value: `gpt-4`, `gpt-4-turbo`, or `gpt-3.5-turbo`

You can also edit `settings.json` directly:

```json
{
  "ownrex.backendUrl": "http://localhost:8000",
  "ownrex.apiKey": "ownrex-default-key",
  "ownrex.defaultModel": "gpt-4"
}
```

### 4. Check Extension Logs

1. Open VS Code Developer Tools: `Help > Toggle Developer Tools`
2. Go to the **Console** tab
3. Look for errors related to:
   - `[ModelMetadataFetcher]` - Model fetching errors
   - `[OwnrexTokenManager]` - Authentication errors
   - `[LanguageModelAccess]` - Language model registration errors

Common error patterns:
- `Failed to fetch from backend` - Backend connection issue
- `Failed to create model from configuration` - Fallback model creation failed
- `Authentication failed` - Token/API key issue

### 5. Verify Authentication

The extension needs to authenticate with the backend. Check if authentication is working:

1. In VS Code Developer Console, look for:
   - `[OwnrexTokenManager] Fetching token info from backend`
   - `[OwnrexTokenManager] Token info fetched successfully`

2. If you see authentication errors, verify:
   - Backend is running
   - `ownrex.backendUrl` is correct
   - `ownrex.apiKey` matches backend configuration (if auth is enabled)

### 6. Force Model Refresh

Sometimes models need to be refreshed. Try:

1. Restart VS Code
2. Reload the extension window: `Ctrl+Shift+P` > "Developer: Reload Window"
3. Check logs for model fetching attempts

### 7. Check Backend Configuration

Verify your backend `.env` file has:

```env
PORT=8000
OPENAI_API_KEY=sk-your-key-here
AUTH_ENABLED=false
OWNREX_API_KEY=ownrex-default-key
```

If `AUTH_ENABLED=true`, make sure `ownrex.apiKey` in VS Code matches `OWNREX_API_KEY` in backend.

## Common Issues and Solutions

### Issue: Backend is running but models aren't loading

**Solution**:
1. Check VS Code settings for `ownrex.backendUrl`
2. Verify the backend `/v1/models` endpoint returns data
3. Check extension logs for fetch errors
4. Try restarting VS Code

### Issue: Authentication errors

**Solution**:
1. If `AUTH_ENABLED=false` in backend, you can use any API key or `ownrex-default-key`
2. If `AUTH_ENABLED=true`, ensure `ownrex.apiKey` matches backend `OWNREX_API_KEY`
3. Check backend logs for authentication failures

### Issue: Fallback model not working

**Solution**:
1. Check VS Code setting `ownrex.defaultModel` is set
2. Verify the model name is valid (e.g., `gpt-4`, `gpt-3.5-turbo`)
3. Check extension logs for `[ModelMetadataFetcher] Failed to create model from configuration`

### Issue: CORS errors

**Solution**:
1. Ensure backend CORS is configured to allow VS Code origin
2. Check backend `.env` has `CORS_ORIGIN=*` (for development)
3. Verify backend is accessible from VS Code

## Manual Testing

Test the backend connection manually:

```bash
# Test token endpoint
curl -H "Authorization: Bearer ownrex-default-key" http://localhost:8000/v1/token

# Test models endpoint
curl -H "Authorization: Bearer ownrex-default-key" http://localhost:8000/v1/models
```

Both should return JSON responses. If they don't, the backend has an issue.

## Still Not Working?

1. **Check all logs**: VS Code Developer Console, backend logs, extension host logs
2. **Verify configuration**: All settings are correct in VS Code and backend
3. **Test backend directly**: Use curl/Postman to verify backend endpoints work
4. **Restart everything**: Backend server and VS Code
5. **Check for conflicts**: Ensure no other extensions are interfering

## Getting Help

If the issue persists:
1. Collect logs from VS Code Developer Console
2. Collect backend logs
3. Note your VS Code and extension versions
4. Check the [GitHub Issues](https://github.com/ai4se4ai-lab/ownrex.ai/issues) for similar problems

