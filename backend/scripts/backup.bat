@echo off
cd /d "%~dp0.."
node scripts/backup.js >> logs\backup.log 2>&1