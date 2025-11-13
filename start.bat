@echo off
echo Installing dependencies...
call npm install

echo Starting development server...
start npm run dev

echo Opening browser...
timeout /t 5 /nobreak > nul
start http://localhost:5173
