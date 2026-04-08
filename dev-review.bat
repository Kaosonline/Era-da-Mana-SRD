@echo off
start "Review Tool" cmd /k "cd /d C:\Users\Administrator\Desktop\PROJETO\Era-da-Mana-SRD\review-tool && npm start"
ping localhost -n 6 >nul
start http://localhost:3001
