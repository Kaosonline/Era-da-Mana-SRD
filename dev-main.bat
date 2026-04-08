@echo off
start "Dev Main" cmd /k "cd /d C:\Users\Administrator\Desktop\PROJETO\Era-da-Mana-SRD && npm run dev"
ping localhost -n 6 >nul
start http://localhost:5173
