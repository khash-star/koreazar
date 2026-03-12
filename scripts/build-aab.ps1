# Build TWA AAB using Java 17 (required by Android Gradle Plugin 8.x)
# Run from project root: .\scripts\build-aab.ps1

$bubblewrapJdk = "$env:USERPROFILE\.bubblewrap\jdk\jdk-17.0.11+9"
if (-not (Test-Path "$bubblewrapJdk\bin\java.exe")) {
    Write-Error "Bubblewrap JDK not found at $bubblewrapJdk. Run 'npx @bubblewrap/cli build' instead (it uses its own JDK)."
    exit 1
}

$env:JAVA_HOME = $bubblewrapJdk
Push-Location $PSScriptRoot\..
try {
    .\gradlew.bat assembleRelease bundleRelease --no-daemon
    if ($LASTEXITCODE -eq 0) {
        Write-Host "AAB/APK output: app\build\outputs\"
    }
} finally {
    Pop-Location
}
