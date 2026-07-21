#!/usr/bin/env pwsh
# Script to start production static server

Set-Location "C:\Users\vinny\Documents\DevOps\whatsApp-bot\frontend\build"
Write-Host "Starting production server from build directory..."
Write-Host "Current directory: $(Get-Location)"
npx http-server . -p 8080