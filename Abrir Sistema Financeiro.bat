@echo off
title Sistema Financeiro
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0financeiro"

echo Iniciando Sistema Financeiro...
start "" cmd /k "npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173/"
