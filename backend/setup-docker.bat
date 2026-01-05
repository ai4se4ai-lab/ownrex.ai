@echo off
REM Quick setup script for Docker deployment (Windows)

echo 🐳 Ownrex.ai Backend - Docker Setup
echo ====================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not installed
    echo    Please install Docker from https://docs.docker.com/get-docker/
    exit /b 1
)

REM Check if Docker Compose is installed
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker Compose is not installed
    echo    Please install Docker Compose from https://docs.docker.com/compose/install/
    exit /b 1
)

echo ✅ Docker is installed
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.docker.example .env
    echo ✅ Created .env file
    echo.
    echo ⚠️  IMPORTANT: Edit .env and set your OPENAI_API_KEY
    echo.
    set /p EDIT="Do you want to edit .env now? (y/n) "
    if /i "%EDIT%"=="y" (
        notepad .env
    )
) else (
    echo ✅ .env file already exists
)

echo.
echo 🔨 Building Docker image...
docker compose build

echo.
echo 🚀 Starting backend...
docker compose up -d

echo.
echo ⏳ Waiting for backend to be ready...
timeout /t 5 /nobreak >nul

REM Check health
curl -f http://localhost:8000/health/live >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Backend started but health check failed
    echo    Check logs: docker compose logs
    echo.
    echo    Common issues:
    echo    - OPENAI_API_KEY not set in .env
    echo    - Port 8000 already in use
) else (
    echo ✅ Backend is running!
    echo.
    echo 🎉 Setup complete!
    echo.
    echo 📊 Status:
    docker compose ps
    echo.
    echo 🔗 API: http://localhost:8000
    echo 📖 Documentation: http://localhost:8000/
    echo.
    echo 📝 Useful commands:
    echo    View logs:    docker compose logs -f
    echo    Stop:         docker compose down
    echo    Restart:      docker compose restart
)
echo.
pause

