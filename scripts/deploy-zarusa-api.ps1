# Deploy Zarusa region API (index.php + regions.php) via SCP/SFTP.
# Usage:
#   1. Copy scripts/deploy-zarusa-api.env.example -> scripts/deploy-zarusa-api.local.env
#   2. Fill in SSH + optional DB credentials
#   3. npm run deploy:zarusa-api
#
# Flags:
#   -SkipMigration   Upload PHP only, do not run SQL
#   -SkipVerify      Skip post-deploy smoke test
#   -DryRun          Show planned actions only

param(
  [switch]$SkipMigration,
  [switch]$SkipVerify,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$EnvFile = Join-Path $Root "scripts\deploy-zarusa-api.local.env"
$BundleDir = Join-Path $Root "deploy\zarusa-api-upload"

function Load-DeployEnv {
  if (-not (Test-Path $EnvFile)) {
    Write-Host ""
    Write-Host "Missing $EnvFile" -ForegroundColor Red
    Write-Host "Copy scripts/deploy-zarusa-api.env.example -> scripts/deploy-zarusa-api.local.env"
    Write-Host "Fill SSH host, user, remote dir, and key path (or password)."
    exit 1
  }
  Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $name = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    Set-Item -Path "env:$name" -Value $value
  }
}

function Require-Env([string]$Name) {
  $val = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($val)) {
    throw "Missing required env: $Name (set in scripts/deploy-zarusa-api.local.env)"
  }
  return $val.Trim()
}

function Get-ScpBaseArgs {
  $hostName = Require-Env "ZARUSA_DEPLOY_HOST"
  $port = $env:ZARUSA_DEPLOY_PORT
  if ([string]::IsNullOrWhiteSpace($port)) { $port = "22" }
  $args = @("-P", $port, "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new")
  $key = $env:ZARUSA_DEPLOY_SSH_KEY
  if (-not [string]::IsNullOrWhiteSpace($key)) {
    if (-not (Test-Path $key)) { throw "SSH key not found: $key" }
    $args += @("-i", $key)
  } elseif (-not [string]::IsNullOrWhiteSpace($env:ZARUSA_DEPLOY_PASSWORD)) {
    throw "Password-only SCP is not supported in this script. Use ZARUSA_DEPLOY_SSH_KEY or add your key to cPanel SSH."
  } else {
    throw "Set ZARUSA_DEPLOY_SSH_KEY in deploy-zarusa-api.local.env"
  }
  return @{ Host = $hostName; Port = $port; Args = $args }
}

function Invoke-ScpUpload([string]$LocalFile, [string]$RemoteFile) {
  $user = Require-Env "ZARUSA_DEPLOY_USER"
  $remoteDir = Require-Env "ZARUSA_DEPLOY_REMOTE_DIR"
  $remoteDir = $remoteDir.TrimEnd("/")
  $scp = Get-ScpBaseArgs
  $dest = "${user}@$($scp.Host):$remoteDir/$RemoteFile"
  $local = (Resolve-Path $LocalFile).Path
  Write-Host "  SCP $RemoteFile -> $dest" -ForegroundColor Cyan
  if ($DryRun) { return }
  & scp.exe @($scp.Args) $local $dest
  if ($LASTEXITCODE -ne 0) { throw "SCP failed for $RemoteFile (exit $LASTEXITCODE)" }
}

function Invoke-RemoteMigration {
  if ($SkipMigration) {
    Write-Host "Skipping MySQL migration (-SkipMigration)" -ForegroundColor Yellow
    return
  }
  $dbHost = $env:ZARUSA_DB_HOST
  $dbName = $env:ZARUSA_DB_NAME
  $dbUser = $env:ZARUSA_DB_USER
  $dbPass = $env:ZARUSA_DB_PASSWORD
  if ([string]::IsNullOrWhiteSpace($dbName) -or [string]::IsNullOrWhiteSpace($dbUser) -or [string]::IsNullOrWhiteSpace($dbPass)) {
    Write-Host "DB credentials not set - skipping migration (run SQL manually in phpMyAdmin)" -ForegroundColor Yellow
    return
  }
  if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "127.0.0.1" }

  $user = Require-Env "ZARUSA_DEPLOY_USER"
  $remoteDir = Require-Env "ZARUSA_DEPLOY_REMOTE_DIR"
  $remoteDir = $remoteDir.TrimEnd("/")
  $scp = Get-ScpBaseArgs
  $migrationLocal = Join-Path $BundleDir "migration_region_dmv_mvp.sql"
  if (-not (Test-Path $migrationLocal)) { throw "Missing $migrationLocal" }

  $remoteSql = "$remoteDir/migration_region_dmv_mvp.sql"
  Write-Host "  Upload migration SQL..." -ForegroundColor Cyan
  if (-not $DryRun) {
    Invoke-ScpUpload $migrationLocal "migration_region_dmv_mvp.sql"
  }

  $escPass = $dbPass.Replace("'", "'\''")
  $mysqlCmd = "mysql -h '$dbHost' -u '$dbUser' -p'$escPass' '$dbName'"
  Write-Host "  Run migration on server via SSH..." -ForegroundColor Cyan
  if ($DryRun) { return }

  Get-Content -Raw $migrationLocal | & ssh.exe @($scp.Args) "${user}@$($scp.Host)" $mysqlCmd
  if ($LASTEXITCODE -ne 0) { throw "Remote migration failed (exit $LASTEXITCODE)" }

  if (-not $DryRun) {
    & ssh.exe @($scp.Args) "${user}@$($scp.Host)" "rm -f '$remoteSql'"
  }
  Write-Host "  Migration OK" -ForegroundColor Green
}

Push-Location $Root
try {
  Write-Host ""
  Write-Host "=== Zarusa API deploy ===" -ForegroundColor Cyan
  Load-DeployEnv

  Write-Host ""
  Write-Host "1. Package bundle" -ForegroundColor Yellow
  if (-not $DryRun) {
    & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\package-zarusa-api-upload.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }

  Write-Host ""
  Write-Host "2. Pre-deploy registry check" -ForegroundColor Yellow
  if (-not $DryRun) {
    & node (Join-Path $Root "scripts\verify-zarusa-region-registry.mjs")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }

  foreach ($f in @("index.php", "regions.php")) {
    $path = Join-Path $BundleDir $f
    if (-not (Test-Path $path)) { throw "Missing bundle file: $path" }
  }

  Write-Host ""
  Write-Host "3. Upload PHP to api.zarkorea.com" -ForegroundColor Yellow
  Invoke-ScpUpload (Join-Path $BundleDir "index.php") "index.php"
  Invoke-ScpUpload (Join-Path $BundleDir "regions.php") "regions.php"

  Write-Host ""
  Write-Host "4. MySQL migration" -ForegroundColor Yellow
  Invoke-RemoteMigration

  if (-not $SkipVerify) {
    Write-Host ""
    Write-Host "5. Post-deploy smoke test" -ForegroundColor Yellow
    if ($DryRun) {
      Write-Host "  (skipped in dry run)"
    } else {
      Start-Sleep -Seconds 2
      & node (Join-Path $Root "scripts\smoke-zarusa-dmv-api.mjs")
      exit $LASTEXITCODE
    }
  }

  Write-Host ""
  Write-Host "Deploy complete." -ForegroundColor Green
} finally {
  Pop-Location
}
