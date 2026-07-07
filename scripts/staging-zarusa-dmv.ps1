# Staging helper — Zarusa DC/DMV MVP
# Usage: .\scripts\staging-zarusa-dmv.ps1 [-SmokeOnly]

param([switch]$SmokeOnly)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not $SmokeOnly) {
  Write-Host ""
  Write-Host "=== Zarusa staging deploy checklist ===" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "1. Run SQL on STAGING DB:" -ForegroundColor Yellow
  Write-Host "   api/sql/migration_region_dmv_mvp.sql"
  Write-Host ""
  Write-Host "2. Upload to cPanel (api.zarkorea.com):" -ForegroundColor Yellow
  Write-Host "   api/index.php  -> index.php"
  Write-Host "   api/regions.php -> regions.php  (NEW - required)"
  Write-Host ""
  Write-Host "Full guide: docs/ZARUSA_STAGING_DEPLOY.md"
  Write-Host ""
}

Push-Location $Root
try {
  Write-Host "=== Registry parity ===" -ForegroundColor Cyan
  node scripts/verify-zarusa-region-registry.mjs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host ""
  Write-Host "=== API smoke (production URL) ===" -ForegroundColor Cyan
  node scripts/smoke-zarusa-dmv-api.mjs
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
