# Package api/index.php + api/regions.php for cPanel upload
# Output: deploy/zarusa-api-upload/
# Usage: .\scripts\package-zarusa-api-upload.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Out = Join-Path $Root "deploy\zarusa-api-upload"

New-Item -ItemType Directory -Force -Path $Out | Out-Null

Copy-Item (Join-Path $Root "api\index.php") (Join-Path $Out "index.php") -Force
Copy-Item (Join-Path $Root "api\regions.php") (Join-Path $Out "regions.php") -Force
Copy-Item (Join-Path $Root "api\sql\migration_region_dmv_mvp.sql") (Join-Path $Out "migration_region_dmv_mvp.sql") -Force
Copy-Item (Join-Path $Root "api\sql\migration_admin_rbac_phase2.sql") (Join-Path $Out "migration_admin_rbac_phase2.sql") -Force

@"
Zarusa API upload bundle
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')

Upload to cPanel (api.zarkorea.com document root):
  index.php   -> replace existing index.php
  regions.php -> NEW file (required)

Run on STAGING MySQL first:
  migration_region_dmv_mvp.sql
  migration_admin_rbac_phase2.sql

Then verify from repo root:
  npm run staging:zarusa
"@ | Set-Content (Join-Path $Out "README.txt") -Encoding UTF8

Write-Host "Packaged to: $Out" -ForegroundColor Green
Get-ChildItem $Out | Format-Table Name, Length
