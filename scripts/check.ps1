# check.ps1 — Run all frontend checks (lint + typecheck)
# Usage: .\scripts\check.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$failed = $false

Write-Host ""
Write-Host "Running frontend checks..." -ForegroundColor Yellow
Write-Host ""

# 1. Lint (oxlint)
Write-Host "[1/2] Frontend lint (oxlint)..." -ForegroundColor Yellow
Push-Location $root
npm run lint --silent 2>&1
if ($LASTEXITCODE -ne 0) { $failed = $true }
Pop-Location
if (-not $failed) { Write-Host "  OK Frontend lint" -ForegroundColor Green }

# 2. Typecheck (vite build in dev mode)
Write-Host ""
Write-Host "[2/2] Frontend typecheck (vite build)..." -ForegroundColor Yellow
Push-Location $root
npx vite build --mode development 2>&1 | Select-Object -Last 5
if ($LASTEXITCODE -ne 0) { $failed = $true }
Pop-Location

Write-Host ""
if ($failed) {
    Write-Host "Frontend checks FAILED." -ForegroundColor Red
    exit 1
} else {
    Write-Host "All frontend checks passed!" -ForegroundColor Green
    exit 0
}
