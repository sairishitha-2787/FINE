@echo off
REM FINE Finance Intelligent Ecosystem Setup Script for Windows
REM This script sets up the development environment for the FINE application

echo 🚀 Setting up FINE Finance Intelligent Ecosystem...

REM Check if Docker is installed
echo [INFO] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)
echo [SUCCESS] Docker and Docker Compose are installed

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)
echo [SUCCESS] Node.js is installed

REM Check if Python is installed
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.9+ first.
    exit /b 1
)
echo [SUCCESS] Python is installed

REM Create environment file
echo [INFO] Setting up environment variables...
if not exist .env (
    copy env.example .env
    echo [SUCCESS] Created .env file from template
    echo [WARNING] Please update .env file with your configuration
) else (
    echo [WARNING] .env file already exists, skipping creation
)

REM Install backend dependencies
echo [INFO] Setting up backend dependencies...
cd server
if not exist package.json (
    echo [ERROR] package.json not found in server directory
    exit /b 1
)
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    exit /b 1
)
echo [SUCCESS] Backend dependencies installed
cd ..

REM Install frontend dependencies
echo [INFO] Setting up frontend dependencies...
cd client
if not exist package.json (
    echo [ERROR] package.json not found in client directory
    exit /b 1
)
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    exit /b 1
)
echo [SUCCESS] Frontend dependencies installed
cd ..

REM Install ML service dependencies
echo [INFO] Setting up ML service dependencies...
cd ml_service
if not exist requirements.txt (
    echo [ERROR] requirements.txt not found in ml_service directory
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist venv (
    python -m venv venv
    echo [SUCCESS] Created Python virtual environment
)

REM Activate virtual environment and install dependencies
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install ML service dependencies
    exit /b 1
)
echo [SUCCESS] ML service dependencies installed
deactivate
cd ..

REM Start databases
echo [INFO] Starting databases...
docker-compose up -d mysql mongodb redis
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start databases
    exit /b 1
)
echo [SUCCESS] Databases started

REM Wait for databases to be ready
echo [INFO] Waiting for databases to be ready...
timeout /t 10 /nobreak >nul

REM Run database migrations
echo [INFO] Running database migrations...
cd server
npm run migrate
if %errorlevel% neq 0 (
    echo [WARNING] Database migrations failed, continuing...
)
cd ..

REM Seed database
echo [INFO] Seeding database...
cd server
npm run seed
if %errorlevel% neq 0 (
    echo [WARNING] Database seeding failed, continuing...
)
cd ..

REM Build Docker images
echo [INFO] Building Docker images...
docker-compose build
if %errorlevel% neq 0 (
    echo [WARNING] Docker build failed, continuing...
)

echo ==================================================
echo [SUCCESS] 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Update .env file with your configuration
echo 2. Start the application: docker-compose up -d
echo 3. Access the application at http://localhost:3000
echo.
echo 🔧 Development commands:
echo - Start development: npm run dev
echo - View logs: docker-compose logs -f
echo - Stop services: docker-compose down
echo.
echo 📚 Documentation: README.md
echo 🐛 Issues: Check the issues section in the repository
echo ==================================================

pause
