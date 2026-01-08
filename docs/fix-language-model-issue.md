# Fix: Language Model Unavailable Error

## Quick Diagnosis

Your backend is running correctly on port 8000. The issue is likely in VS Code configuration.

## Step-by-Step Fix

### 1. Open VS Code Settings

Press `Ctrl+,` (or `Cmd+,` on Mac) to open Settings, or go to:
- **File > Preferences > Settings** (Windows/Linux)
- **Code > Preferences > Settings** (Mac)

### 2. Configure Ownrex Settings

Search for "ownrex" in the settings search bar and configure:

#### a. Backend URL
- **Setting**: `ownrex.backendUrl`
- **Value**: `http://localhost:8000`
- **Verify**: This should match your backend URL

#### b. API Key
- **Setting**: `ownrex.apiKey`
- **Value**: `ownrex-default-key` (or your API key if auth is enabled)
- **Note**: If your backend has `AUTH_ENABLED=false`, use `ownrex-default-key`

#### c. Default Model
- **Setting**: `ownrex.defaultModel`
- **Value**: Choose one:
  - `gpt-4` (recommended)
  - `gpt-4-turbo`
  - `gpt-3.5-turbo`

### 3. Edit settings.json Directly (Alternative)

If you prefer editing the JSON file directly:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Preferences: Open User Settings (JSON)"
3. Add or update these settings:

```json
{
  "ownrex.backendUrl": "http://localhost:8000",
  "ownrex.apiKey": "ownrex-default-key",
  "ownrex.defaultModel": "gpt-4"
}
```

### 4. Reload VS Code Window

After updating settings:
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Developer: Reload Window"
3. Press Enter

### 5. Check Extension Logs

If the issue persists:

1. Open Developer Tools: `Help > Toggle Developer Tools`
2. Go to the **Console** tab
3. Look for these log messages:
   - `[ModelMetadataFetcher] Fetching models from Ownrex backend`
   - `[OwnrexTokenManager] Fetching token info from backend`
   - `[LanguageModelAccess]` - Any errors here

### 6. Verify Backend Authentication

If your backend has authentication enabled (`AUTH_ENABLED=true`):

1. Check your backend `.env` file for `OWNREX_API_KEY`
2. Make sure `ownrex.apiKey` in VS Code matches `OWNREX_API_KEY` in backend

### 7. Common Issues

#### Issue: Settings not taking effect
**Solution**:
- Restart VS Code completely
- Check for typos in settings (especially the backend URL)

#### Issue: Authentication errors in logs
**Solution**:
- Verify `ownrex.apiKey` matches backend `OWNREX_API_KEY`
- If `AUTH_ENABLED=false`, use `ownrex-default-key`

#### Issue: Backend connection timeout
**Solution**:
- Verify backend is running: `netstat -ano | findstr :8000`
- Check firewall settings
- Try accessing `http://localhost:8000/health` in a browser

## Verification

After following these steps, you should see:
- No "Language model unavailable" error
- Chat features working
- Models available in the model picker

## Still Not Working?

1. **Check all logs** in VS Code Developer Console
2. **Verify backend is accessible**: Open `http://localhost:8000/health` in browser
3. **Test backend directly**:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8000/v1/models" -Headers @{"Authorization"="Bearer ownrex-default-key"}
   ```
4. **Restart everything**: Close VS Code, restart backend, reopen VS Code

