@echo off
echo Starting Portfolio Generator Application...

:: Kill any running Node.js processes
taskkill /F /IM node.exe > nul 2>&1

:: Start the server
echo Starting the server...
start cmd /k "cd server && node server.js"

:: Wait for the server to start
timeout /t 5

:: Start the client
echo Starting the client...
start cmd /k "cd client && npm start"

echo Both server and client are starting up.
echo Server running at: http://localhost:5000
echo Client running at: http://localhost:3000
echo Network access at: http://%COMPUTERNAME%:3000 or use your local IP address 