@echo off
chcp 65001 >nul
title Telegram ro'yxat boti
cd /d "%~dp0"

echo ============================================
echo   Telegram ro'yxat botini ishga tushirish
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [XATO] Node.js topilmadi!
  echo nodejs.org dan Node.js 22.5 yoki yangiroq versiyani yuklab o'rnating.
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [1/3] Node.js: %NODE_VERSION%

if not exist "node_modules" (
  echo [2/3] Kutubxonalar o'rnatilmoqda, bu bir daqiqa davom etishi mumkin...
  call npm install
  if errorlevel 1 (
    echo.
    echo [XATO] Kutubxonalarni o'rnatib bo'lmadi. Internetni tekshiring.
    pause
    exit /b 1
  )
) else (
  echo [2/3] Kutubxonalar allaqachon o'rnatilgan
)

if not exist ".env" (
  echo.
  echo [XATO] .env fayli topilmadi!
  echo .env.example faylini .env ga ko'chiring va ichiga BOT_TOKEN yozing:
  echo     copy .env.example .env
  echo.
  pause
  exit /b 1
)
echo [3/3] Sozlamalar (.env) topildi

echo.
echo Bot ishga tushmoqda... (to'xtatish uchun Ctrl+C)
echo ---------------------------------------------------------------
echo.

node src/index.js

echo.
echo ---------------------------------------------------------------
echo Bot to'xtadi. Xatolar bo'lsa yuqoridagi matnni o'qing.
echo.
pause
