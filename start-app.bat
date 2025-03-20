@echo off
echo Starting Portfolio Generator Application...

:: Kill any running Node.js processes
taskkill /F /IM node.exe > nul 2>&1

:: Make sure MongoDB is running - uncomment if needed
:: echo Checking MongoDB status...
:: where mongod >nul 2>&1 && (
::   echo MongoDB found, ensuring a data directory exists...
::   if not exist "C:\data\db" mkdir "C:\data\db"
::   start "" "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath="C:\data\db"
::   timeout /t 3
:: )

:: Start the server
echo Starting the server...
start cmd /k "cd server && node server.js"

:: Wait for the server to start
timeout /t 5

:: Start the client
echo Starting the client...
start cmd /k "cd client && npm start"

echo Both server and client are starting up.
echo ------------------------------------------------------
echo Server running at: http://localhost:5000
echo Client running at: http://localhost:3000
echo Network access at: http://%COMPUTERNAME%:3000
echo ------------------------------------------------------
echo MongoDB should be running at: mongodb://localhost:27017
echo To check MongoDB status: http://localhost:5000/api/db-status
echo ------------------------------------------------------ 