[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Version,
    [string]$OutputRoot,
    [string[]]$MigrationFiles = @(),
    [string]$ReleaseNotes,
    [switch]$AllowDirty
)

$ErrorActionPreference = "Stop"

if ($Version -notmatch '^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$') {
    throw "Version must contain only letters, numbers, dot, underscore, or hyphen."
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

function Invoke-Captured {
    param(
        [Parameter(Mandatory = $true)][string]$Executable,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    $output = & $Executable @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $Executable $($Arguments -join ' ')`n$($output -join [Environment]::NewLine)"
    }
    return ($output -join [Environment]::NewLine).Trim()
}

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Get-SourceState {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Path
    )

    $repoRoot = Invoke-Captured git -C $Path rev-parse --show-toplevel
    $prefix = Invoke-Captured git -C $Path rev-parse --show-prefix
    $commit = Invoke-Captured git -C $Path rev-parse HEAD
    $status = Invoke-Captured git -C $Path status --porcelain -- .
    $dirty = -not [string]::IsNullOrWhiteSpace($status)
    $tracked = $status -notmatch '(?m)^\?\?\s+(\./|[^\r\n]+/)$'

    return [PSCustomObject]@{
        name = $Name
        path = [System.IO.Path]::GetFullPath($Path)
        repository = $repoRoot
        prefix = $prefix
        commit = $commit
        dirty = $dirty
        tracked = $tracked
        status = $status
    }
}

function Set-ComposeImageVersion {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$Image,
        [Parameter(Mandatory = $true)][string]$Tag
    )

    $escapedImage = [regex]::Escape($Image)
    $pattern = "(?m)^(\s*image:\s*${escapedImage}:)[^\s#]+(\s*(?:#.*)?)$"
    $matches = [regex]::Matches($Content, $pattern)
    if ($matches.Count -ne 1) {
        throw "Expected exactly one Compose image declaration for $Image, found $($matches.Count)."
    }

    return [regex]::Replace(
        $Content,
        $pattern,
        { param($match) $match.Groups[1].Value + $Tag + $match.Groups[2].Value }
    )
}

function Get-ComposeApplicationVersion {
    param([Parameter(Mandatory = $true)][string]$Content)

    $tags = @()
    foreach ($image in @('shuxia/backend', 'shuxia/admin', 'shuxia/reader')) {
        $match = [regex]::Match($Content, "(?m)^\s*image:\s*$([regex]::Escape($image)):(?<tag>[^\s#]+)")
        if (-not $match.Success) {
            throw "Cannot determine the current Compose tag for $image."
        }
        $tags += $match.Groups['tag'].Value
    }

    if (($tags | Select-Object -Unique).Count -eq 1) {
        return $tags[0]
    }
    return ($tags -join ',')
}

$adminRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$workspaceRoot = Split-Path -Parent $adminRoot
$readerRoot = Join-Path $workspaceRoot 'shuxia'
$backendRoot = Join-Path $workspaceRoot 'boot-box\server\jeecg-boot'
$backendStartRoot = Join-Path $backendRoot 'jeecg-module-system\jeecg-system-start'
$deployRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composeTemplate = Join-Path $deployRoot 'docker-compose.yml'

foreach ($requiredPath in @($readerRoot, $backendRoot, $backendStartRoot, $composeTemplate)) {
    if (-not (Test-Path -LiteralPath $requiredPath)) {
        throw "Required path does not exist: $requiredPath"
    }
}

$sources = @(
    Get-SourceState -Name 'admin' -Path $adminRoot
    Get-SourceState -Name 'reader' -Path $readerRoot
    Get-SourceState -Name 'backend' -Path $backendRoot
)
$dirtySources = @($sources | Where-Object { $_.dirty -or -not $_.tracked })
if ($dirtySources.Count -gt 0 -and -not $AllowDirty) {
    $details = $dirtySources | ForEach-Object {
        $reason = if (-not $_.tracked) { 'untracked source tree' } else { 'uncommitted changes' }
        "  - $($_.name): $reason ($($_.path))"
    }
    throw "Release builds require committed, tracked sources.`n$($details -join [Environment]::NewLine)`nCommit the milestone first, or use -AllowDirty only for a temporary test build."
}

if ($ReleaseNotes -and -not (Test-Path -LiteralPath $ReleaseNotes -PathType Leaf)) {
    throw "Release notes file does not exist: $ReleaseNotes"
}

$resolvedMigrations = @()
foreach ($migration in $MigrationFiles) {
    if (-not (Test-Path -LiteralPath $migration -PathType Leaf)) {
        throw "Migration file does not exist: $migration"
    }
    if ([System.IO.Path]::GetExtension($migration) -ne '.sql') {
        throw "Only .sql database migration files are allowed: $migration"
    }
    $resolvedMigrations += (Resolve-Path -LiteralPath $migration).Path
}

$duplicateMigrationNames = $resolvedMigrations |
    Group-Object { [System.IO.Path]::GetFileName($_) } |
    Where-Object { $_.Count -gt 1 }
if ($duplicateMigrationNames) {
    throw "Migration file names must be unique inside a release package."
}

if (-not $OutputRoot) {
    $OutputRoot = Join-Path $adminRoot ("output\fnos-release-$Version")
}
$finalPackageRoot = [System.IO.Path]::GetFullPath($OutputRoot)
$packageRoot = "$finalPackageRoot.building"
foreach ($candidate in @($finalPackageRoot, $packageRoot)) {
    if (Test-Path -LiteralPath $candidate) {
        throw "Output or staging directory already exists. Use a new version or remove the stale directory explicitly: $candidate"
    }
}

$completed = $false
try {
$imagesRoot = Join-Path $packageRoot 'images'
$projectRoot = Join-Path $packageRoot 'project'
$buildRoot = Join-Path $packageRoot 'build'
$migrationsRoot = Join-Path $packageRoot 'migrations'
New-Item -ItemType Directory -Force -Path $imagesRoot, $projectRoot, $buildRoot | Out-Null

$sourceCompose = Get-Content -Raw -Encoding utf8 -LiteralPath $composeTemplate
$baseVersion = Get-ComposeApplicationVersion -Content $sourceCompose
$releaseCompose = $sourceCompose
$releaseCompose = Set-ComposeImageVersion -Content $releaseCompose -Image 'shuxia/backend' -Tag $Version
$releaseCompose = Set-ComposeImageVersion -Content $releaseCompose -Image 'shuxia/admin' -Tag $Version
$releaseCompose = Set-ComposeImageVersion -Content $releaseCompose -Image 'shuxia/reader' -Tag $Version
Write-Utf8NoBom -Path (Join-Path $projectRoot 'docker-compose.yml') -Content $releaseCompose
Copy-Item -LiteralPath (Join-Path $deployRoot 'config') -Destination $projectRoot -Recurse -Force

if ($resolvedMigrations.Count -gt 0) {
    New-Item -ItemType Directory -Force -Path $migrationsRoot | Out-Null
    $order = @()
    foreach ($migration in $resolvedMigrations) {
        $name = [System.IO.Path]::GetFileName($migration)
        Copy-Item -LiteralPath $migration -Destination (Join-Path $migrationsRoot $name) -Force
        $order += $name
    }
    Write-Utf8NoBom -Path (Join-Path $migrationsRoot 'MIGRATION-ORDER.txt') -Content (($order -join [Environment]::NewLine) + [Environment]::NewLine)
}

$oldApiBaseUrl = $env:VITE_API_BASE_URL
try {
    $env:VITE_API_BASE_URL = '/jeecg-boot'
    Push-Location $adminRoot
    try { Invoke-Checked npm run build } finally { Pop-Location }
    Push-Location $readerRoot
    try { Invoke-Checked npm run build } finally { Pop-Location }
} finally {
    $env:VITE_API_BASE_URL = $oldApiBaseUrl
}

foreach ($app in @(
    @{ Name = 'admin'; Dist = (Join-Path $adminRoot 'dist') },
    @{ Name = 'reader'; Dist = (Join-Path $readerRoot 'dist') }
)) {
    $context = Join-Path $buildRoot $app.Name
    New-Item -ItemType Directory -Force -Path $context | Out-Null
    Copy-Item -LiteralPath $app.Dist -Destination (Join-Path $context 'dist') -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $deployRoot 'config\nginx.conf') -Destination (Join-Path $context 'nginx.conf') -Force
    Copy-Item -LiteralPath (Join-Path $deployRoot 'images\Dockerfile.frontend') -Destination (Join-Path $context 'Dockerfile') -Force
    Invoke-Checked docker build --platform linux/amd64 -t ("shuxia/{0}:{1}" -f $app.Name, $Version) $context
}

Invoke-Checked mvn -f (Join-Path $backendRoot 'pom.xml') -pl ':jeecg-system-start' -am -DskipTests package
$backendJar = Join-Path $backendStartRoot 'target\jeecg-system-start-3.9.2.jar'
if (-not (Test-Path -LiteralPath $backendJar -PathType Leaf)) {
    throw "Backend package was not generated: $backendJar"
}
Invoke-Checked docker build --platform linux/amd64 -t "shuxia/backend:$Version" $backendStartRoot

$images = @(
    @{ Tag = "shuxia/backend:$Version"; File = "shuxia-backend-$Version-amd64.tar" },
    @{ Tag = "shuxia/admin:$Version"; File = "shuxia-admin-$Version-amd64.tar" },
    @{ Tag = "shuxia/reader:$Version"; File = "shuxia-reader-$Version-amd64.tar" }
)
foreach ($image in $images) {
    Invoke-Checked -Executable docker -Arguments @('save', '-o', (Join-Path $imagesRoot $image.File), $image.Tag)
}

if ($ReleaseNotes) {
    Copy-Item -LiteralPath $ReleaseNotes -Destination (Join-Path $packageRoot 'RELEASE-NOTES.md') -Force
}

$productionReady = $dirtySources.Count -eq 0
$releaseMetadata = [ordered]@{
    schemaVersion = 1
    product = 'shuxia'
    version = $Version
    baseVersion = $baseVersion
    createdAt = (Get-Date).ToString('o')
    productionReady = $productionReady
    containsUserData = $false
    databaseMigrationRequired = $resolvedMigrations.Count -gt 0
    migrationFiles = @($resolvedMigrations | ForEach-Object { [System.IO.Path]::GetFileName($_) })
    images = @($images | ForEach-Object { [ordered]@{ tag = $_.Tag; file = $_.File } })
    sources = $sources
}
Write-Utf8NoBom -Path (Join-Path $packageRoot 'release.json') -Content ($releaseMetadata | ConvertTo-Json -Depth 8)

$releaseGuide = @"
# Shuxia fnOS application release $Version

- Base application version: $baseVersion
- Production ready: $productionReady
- Contains user data: false
- Database migration required: $($resolvedMigrations.Count -gt 0)

This is an application-only upgrade package. It must never replace or delete the existing `.env`, `library`, MySQL volume, Redis volume, or MinIO data on the NAS.

## Upgrade order

1. Stop new collection jobs and wait for running jobs to reach a safe terminal state.
2. Back up the NAS Compose file, `.env`, application config, and MySQL database.
3. Verify this package with `verify-upgrade-package.ps1`.
4. Import the three image tar files from `images` in the fnOS Docker UI.
5. If `migrations` exists, execute its SQL files in `MIGRATION-ORDER.txt` order after the database backup. SQL is never executed automatically.
6. Copy `project/docker-compose.yml` and `project/config` into the existing NAS project. Do not replace the whole project directory.
7. Recreate or update the `shuxia` Compose project in fnOS.
8. Verify admin, reader, backend health, login, book reading, novel reading, and collection task behavior.

## Rollback

Restore the previous Compose file and recreate the project with the previous application image tags. If SQL migrations were executed, use their reviewed rollback SQL or restore the pre-release database backup.
"@
Write-Utf8NoBom -Path (Join-Path $packageRoot 'RELEASE.md') -Content $releaseGuide

Remove-Item -LiteralPath $buildRoot -Recurse -Force

$manifestPath = Join-Path $packageRoot 'SHA256SUMS.txt'
$manifestLines = Get-ChildItem -LiteralPath $packageRoot -Recurse -File |
    Where-Object { $_.FullName -ne $manifestPath } |
    Sort-Object FullName |
    ForEach-Object {
        $relativePath = $_.FullName.Substring($packageRoot.TrimEnd('\').Length + 1).Replace('\', '/')
        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
        "$hash  $relativePath"
    }
Write-Utf8NoBom -Path $manifestPath -Content (($manifestLines -join [Environment]::NewLine) + [Environment]::NewLine)

Move-Item -LiteralPath $packageRoot -Destination $finalPackageRoot
$completed = $true
Write-Host "fnOS upgrade package created: $finalPackageRoot"
if (-not $productionReady) {
    Write-Warning "This package was built from dirty or untracked sources and is marked productionReady=false."
}
} finally {
    if (-not $completed -and (Test-Path -LiteralPath $packageRoot)) {
        Remove-Item -LiteralPath $packageRoot -Recurse -Force
    }
}
