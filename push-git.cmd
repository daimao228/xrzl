@echo off
setlocal
cd /d "%~dp0"

rem Add common Git install locations to PATH in case it is missing
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%LOCALAPPDATA%\Programs\Git\cmd"

echo ============================================
echo   Push to GitHub: daimao228/xrzl
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0push-git.ps1" %*

echo.
echo --------------------------------------------
echo Done. If push succeeded, redeploy on maoziyun.
echo --------------------------------------------
pause
