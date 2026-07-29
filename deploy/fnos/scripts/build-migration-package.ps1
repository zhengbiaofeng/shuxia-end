[CmdletBinding()]
param(
    [string]$Version = "20260729",
    [string]$SourceMySqlPassword = "123456",
    [string]$OutputRoot
)

$ErrorActionPreference = "Stop"

if ($SourceMySqlPassword -match "['\s]") {
    throw "SourceMySqlPassword cannot contain quotes or whitespace."
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$Executable,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $Executable $($Arguments -join ' ')"
    }
}

function Wait-ContainerHealthy {
    param(
        [Parameter(Mandatory = $true)][string]$Container,
        [int]$TimeoutSeconds = 180
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $status = docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}" $Container 2>$null
        if ($LASTEXITCODE -eq 0 -and ($status -eq "healthy" -or $status -eq "running")) {
            return
        }
        Start-Sleep -Seconds 3
    } while ((Get-Date) -lt $deadline)

    throw "Container did not become healthy: $Container"
}

function Copy-DirectoryContent {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        throw "Source directory does not exist: $Source"
    }

    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Get-ChildItem -Force -LiteralPath $Source | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $Destination -Recurse -Force
    }
}

$frontendRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$workspaceRoot = Split-Path -Parent $frontendRoot
$readerRoot = Join-Path $workspaceRoot "shuxia"
$dockerRoot = Join-Path $workspaceRoot "boot-box\server\docker"
$deployRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if (-not $OutputRoot) {
    $OutputRoot = Join-Path $frontendRoot ("output\fnos-migration-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
}

$packageRoot = [System.IO.Path]::GetFullPath($OutputRoot)
$projectRoot = Join-Path $packageRoot "project"
$imagesRoot = Join-Path $packageRoot "images"
$buildRoot = Join-Path $packageRoot "build"
$initDbRoot = Join-Path $projectRoot "initdb"
$libraryRoot = Join-Path $projectRoot "library"

New-Item -ItemType Directory -Force -Path $projectRoot, $imagesRoot, $buildRoot, $initDbRoot, $libraryRoot | Out-Null
Copy-Item -LiteralPath (Join-Path $deployRoot "docker-compose.yml") -Destination $projectRoot -Force
Copy-Item -LiteralPath (Join-Path $deployRoot "README.md") -Destination $projectRoot -Force
Copy-Item -LiteralPath (Join-Path $deployRoot "config") -Destination $projectRoot -Recurse -Force
Copy-Item -LiteralPath (Join-Path $deployRoot "initdb\02-fnos-adjustments.sql") -Destination $initDbRoot -Force

$mysqlPassword = [Guid]::NewGuid().ToString("N")
$minioPassword = [Guid]::NewGuid().ToString("N")
@(
    "MYSQL_ROOT_PASSWORD=$mysqlPassword"
    "MINIO_ROOT_USER=shuxiaadmin"
    "MINIO_ROOT_PASSWORD=$minioPassword"
) | Set-Content -LiteralPath (Join-Path $projectRoot ".env") -Encoding ascii

$oldApiBaseUrl = $env:VITE_API_BASE_URL
try {
    $env:VITE_API_BASE_URL = "/jeecg-boot"

    Push-Location $frontendRoot
    try {
        Invoke-Checked npm run build
    } finally {
        Pop-Location
    }

    Push-Location $readerRoot
    try {
        Invoke-Checked npm run build
    } finally {
        Pop-Location
    }
} finally {
    $env:VITE_API_BASE_URL = $oldApiBaseUrl
}

foreach ($app in @(
    @{ Name = "admin"; Dist = (Join-Path $frontendRoot "dist") },
    @{ Name = "reader"; Dist = (Join-Path $readerRoot "dist") }
)) {
    $context = Join-Path $buildRoot $app.Name
    New-Item -ItemType Directory -Force -Path $context | Out-Null
    Copy-Item -LiteralPath $app.Dist -Destination (Join-Path $context "dist") -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $deployRoot "config\nginx.conf") -Destination (Join-Path $context "nginx.conf") -Force
    Copy-Item -LiteralPath (Join-Path $deployRoot "images\Dockerfile.frontend") -Destination (Join-Path $context "Dockerfile") -Force
    Invoke-Checked docker build --platform linux/amd64 -t ("shuxia/{0}:{1}" -f $app.Name, $Version) $context
}

Invoke-Checked docker image inspect command-jeecg-system-start:latest
Invoke-Checked docker image inspect mysql:8.0
Invoke-Checked docker image inspect redis:7-alpine
Invoke-Checked docker image inspect minio/minio:latest

Invoke-Checked docker tag command-jeecg-system-start:latest ("shuxia/backend:{0}" -f $Version)
Invoke-Checked docker tag mysql:8.0 mysql:8.0.46
Invoke-Checked docker tag redis:7-alpine redis:7.4.9-alpine
Invoke-Checked docker tag minio/minio:latest minio/minio:RELEASE.2025-09-07T16-13-09Z

$backendWasStopped = $false
$minioWasStopped = $false
try {
    Invoke-Checked docker stop jeecg-system-start
    $backendWasStopped = $true

    $dumpCommand = "mysqldump -uroot -p$SourceMySqlPassword --single-transaction --routines --triggers --events --hex-blob --default-character-set=utf8mb4 --set-gtid-purged=OFF --databases jeecg-boot > /tmp/01-jeecg-boot.sql"
    Invoke-Checked docker exec mysql sh -lc $dumpCommand
    Invoke-Checked docker cp mysql:/tmp/01-jeecg-boot.sql (Join-Path $initDbRoot "01-jeecg-boot.sql")
    Invoke-Checked docker exec mysql rm -f /tmp/01-jeecg-boot.sql

    Invoke-Checked docker stop minio
    $minioWasStopped = $true

    Copy-DirectoryContent (Join-Path $dockerRoot "volumes\minio") (Join-Path $libraryRoot "minio")
    Copy-DirectoryContent (Join-Path $dockerRoot "volumes\jeecg-system-start-data") (Join-Path $libraryRoot "backend-data")
    Copy-DirectoryContent (Join-Path $dockerRoot "volumes\upFiles") (Join-Path $libraryRoot "upFiles")
} finally {
    if ($minioWasStopped) {
        Invoke-Checked docker start minio
        Wait-ContainerHealthy minio
    }
    if ($backendWasStopped) {
        Invoke-Checked docker start jeecg-system-start
        Wait-ContainerHealthy jeecg-system-start
    }
}

$images = @(
    @{ Tag = "shuxia/backend:$Version"; File = "shuxia-backend-$Version-amd64.tar" },
    @{ Tag = "shuxia/admin:$Version"; File = "shuxia-admin-$Version-amd64.tar" },
    @{ Tag = "shuxia/reader:$Version"; File = "shuxia-reader-$Version-amd64.tar" },
    @{ Tag = "mysql:8.0.46"; File = "mysql-8.0.46-amd64.tar" },
    @{ Tag = "redis:7.4.9-alpine"; File = "redis-7.4.9-alpine-amd64.tar" },
    @{ Tag = "minio/minio:RELEASE.2025-09-07T16-13-09Z"; File = "minio-2025-09-07-amd64.tar" }
)

foreach ($image in $images) {
    Invoke-Checked docker save -o (Join-Path $imagesRoot $image.File) $image.Tag
}

Remove-Item -LiteralPath $buildRoot -Recurse -Force

$manifestPath = Join-Path $packageRoot "SHA256SUMS.txt"
Get-ChildItem -LiteralPath $packageRoot -Recurse -File |
    Where-Object { $_.FullName -ne $manifestPath } |
    Sort-Object FullName |
    ForEach-Object {
        $relativePath = $_.FullName.Substring($packageRoot.TrimEnd("\").Length + 1).Replace("\", "/")
        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
        "$hash  $relativePath"
    } | Set-Content -LiteralPath $manifestPath -Encoding ascii

Write-Host "Migration package created: $packageRoot"
Write-Host "Local services were restarted after the consistent export."
