[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$PackageRoot
)

$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PackageRoot)
$manifestPath = Join-Path $root 'SHA256SUMS.txt'
$metadataPath = Join-Path $root 'release.json'
$composePath = Join-Path $root 'project\docker-compose.yml'

foreach ($requiredPath in @($manifestPath, $metadataPath, $composePath)) {
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "Required release file was not found: $requiredPath"
    }
}

$failed = @()
Get-Content -LiteralPath $manifestPath -Encoding utf8 | ForEach-Object {
    if ([string]::IsNullOrWhiteSpace($_)) { return }
    if ($_ -notmatch '^([0-9a-f]{64})  (.+)$') {
        throw "Invalid manifest line: $_"
    }

    $expected = $Matches[1]
    $relativePath = $Matches[2].Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $path = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $failed += "Missing: $relativePath"
        return
    }

    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
    if ($actual -ne $expected) {
        $failed += "Hash mismatch: $relativePath"
    }
}

$metadata = Get-Content -Raw -Encoding utf8 -LiteralPath $metadataPath | ConvertFrom-Json
if ($metadata.containsUserData -ne $false) {
    $failed += 'Release metadata must declare containsUserData=false.'
}

foreach ($forbidden in @('.env', 'project\library', 'project\initdb')) {
    if (Test-Path -LiteralPath (Join-Path $root $forbidden)) {
        $failed += "Forbidden data or secret path exists: $forbidden"
    }
}

$expectedImages = @(
    "images\shuxia-backend-$($metadata.version)-amd64.tar",
    "images\shuxia-admin-$($metadata.version)-amd64.tar",
    "images\shuxia-reader-$($metadata.version)-amd64.tar"
)
foreach ($relativeImage in $expectedImages) {
    $imagePath = Join-Path $root $relativeImage
    if (-not (Test-Path -LiteralPath $imagePath -PathType Leaf)) {
        $failed += "Missing application image archive: $relativeImage"
        continue
    }
    $firstEntry = & tar -tf $imagePath 2>$null | Select-Object -First 1
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($firstEntry)) {
        $failed += "Invalid Docker image archive: $relativeImage"
    }
}

$compose = Get-Content -Raw -Encoding utf8 -LiteralPath $composePath
foreach ($image in @('shuxia/backend', 'shuxia/admin', 'shuxia/reader')) {
    $pattern = "(?m)^\s*image:\s*$([regex]::Escape($image)):$([regex]::Escape([string]$metadata.version))\s*$"
    if ($compose -notmatch $pattern) {
        $failed += "Compose does not pin $image to release version $($metadata.version)."
    }
}

$oldMysqlPassword = $env:MYSQL_ROOT_PASSWORD
$oldMinioUser = $env:MINIO_ROOT_USER
$oldMinioPassword = $env:MINIO_ROOT_PASSWORD
try {
    $env:MYSQL_ROOT_PASSWORD = 'release-verification-only'
    $env:MINIO_ROOT_USER = 'release-verification-only'
    $env:MINIO_ROOT_PASSWORD = 'release-verification-only'
    & docker compose -f $composePath config --quiet
    if ($LASTEXITCODE -ne 0) {
        $failed += 'docker compose config validation failed.'
    }
} finally {
    $env:MYSQL_ROOT_PASSWORD = $oldMysqlPassword
    $env:MINIO_ROOT_USER = $oldMinioUser
    $env:MINIO_ROOT_PASSWORD = $oldMinioPassword
}

if ($failed.Count -gt 0) {
    $failed | ForEach-Object { Write-Error $_ }
    throw 'fnOS upgrade package verification failed.'
}

Write-Host "fnOS upgrade package verification passed: $root"
Write-Host "Version: $($metadata.version); productionReady: $($metadata.productionReady); databaseMigrationRequired: $($metadata.databaseMigrationRequired)"
