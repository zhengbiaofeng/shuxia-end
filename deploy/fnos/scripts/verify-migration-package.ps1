[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$PackageRoot
)

$ErrorActionPreference = "Stop"
$root = [System.IO.Path]::GetFullPath($PackageRoot)
$manifestPath = Join-Path $root "SHA256SUMS.txt"

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "SHA256SUMS.txt was not found in $root"
}

$failed = @()
Get-Content -LiteralPath $manifestPath -Encoding utf8 | ForEach-Object {
    if ($_ -notmatch '^([0-9a-f]{64})  (.+)$') {
        throw "Invalid manifest line: $_"
    }

    $expected = $Matches[1]
    $relativePath = $Matches[2].Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $path = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $path)) {
        $failed += "Missing: $relativePath"
        return
    }

    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
    if ($actual -ne $expected) {
        $failed += "Hash mismatch: $relativePath"
    }
}

if ($failed.Count -gt 0) {
    $failed | ForEach-Object { Write-Error $_ }
    throw "Migration package verification failed."
}

Write-Host "Migration package verification passed: $root"
