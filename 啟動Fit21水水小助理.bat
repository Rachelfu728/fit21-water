@echo off
chcp 65001 >nul
title Fit21 水水小助理
echo ==============================================
echo 💧 正在啟動 Fit21 水水小助理...
echo 每天兩次，剛剛好的提醒。
echo ==============================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
