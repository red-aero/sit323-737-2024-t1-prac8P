@echo off
echo MongoDB Setup Script for Task Manager Application
echo.

REM Check if MongoDB is installed
where mongod >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: MongoDB is not installed or not in your PATH.
    echo Please install MongoDB or make sure it's in your system PATH.
    exit /b 1
)

REM Create data directory if it doesn't exist
if not exist ".\data\db" mkdir ".\data\db"

echo Checking if MongoDB service is running...
mongo --eval "db.version()" localhost:27017 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo MongoDB is not running. Starting MongoDB service...
    start "MongoDB" /b mongod --dbpath=./data/db
    echo Waiting for MongoDB to start...
    timeout /t 5 /nobreak >nul
)

echo Creating MongoDB database and sample data...
mongo setup-mongodb.js

echo.
echo MongoDB setup complete!
echo You can now run the application using one of these methods:
echo.
echo 1. Node.js: npm install && npm start
echo 2. Docker Compose: docker-compose up -d
echo 3. Kubernetes: Follow the instructions in README.md
echo.
echo Access the application at: http://localhost:3000
echo.