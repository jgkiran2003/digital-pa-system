@echo off
echo Launching Node.js application (Windows) with error checks
echo.

:: 1) Check if Node.js is installed by checking "node -v"
node -v >nul 2>&1
IF ERRORLEVEL 1 (
    echo [Error] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org and try again.
    pause
    goto :EOF
)

echo Node.js is installed. Proceeding...

:: 2) Check if "node_modules" folder exists (basic check)
IF NOT EXIST "node_modules" (
    echo "node_modules" not found. Running "npm install"...
    npm install
    IF ERRORLEVEL 1 (
        echo [Error] "npm install" failed.
        pause
        goto :EOF
    )
)

:: Optional check if the "sqlite3" module is installed
npm list sqlite3 >nul 2>&1
IF ERRORLEVEL 1 (
    echo "sqlite3" module not found. Attempting to install...
    npm install sqlite3
    IF ERRORLEVEL 1 (
        echo [Error] sqlite3 module could not be installed.
        pause
        goto :EOF
    )
)

echo.
echo All checks passed. Starting application...
echo.

:: 3) Launch index.js
node index.js
IF ERRORLEVEL 1 (
    echo [Error] The application exited with an error.
    pause
    goto :EOF
)

echo.
echo Application exited successfully.
pause
