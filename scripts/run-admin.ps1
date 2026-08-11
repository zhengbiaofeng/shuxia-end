[CmdletBinding()]
param(
  [ValidateSet('dev', 'build', 'test', 'preview')]
  [string]$Command = 'dev',

  [string]$RuntimeRoot = 'E:\shuxia-runtime',

  [string]$HostAddress = '127.0.0.1',

  [ValidateRange(1, 65535)]
  [int]$Port = 5173,

  [switch]$Background
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtimePath = [System.IO.Path]::GetFullPath($RuntimeRoot).TrimEnd('\')
$runtimeDrive = [System.IO.Path]::GetPathRoot($runtimePath)

if ($runtimeDrive.Equals('C:\', [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Shuxia runtime root cannot be located on drive C: $runtimePath"
}

$paths = [ordered]@{
  Temp = Join-Path $runtimePath 'temp'
  Logs = Join-Path $runtimePath 'logs\admin'
  NpmCache = Join-Path $runtimePath 'cache\npm'
  PnpmStore = Join-Path $runtimePath 'cache\pnpm'
  Playwright = Join-Path $runtimePath 'cache\playwright'
}

foreach ($path in $paths.Values) {
  [System.IO.Directory]::CreateDirectory($path) | Out-Null
}

$env:SHUXIA_RUNTIME_ROOT = $runtimePath
$env:TEMP = $paths.Temp
$env:TMP = $paths.Temp
$env:npm_config_cache = $paths.NpmCache
$env:PLAYWRIGHT_BROWSERS_PATH = $paths.Playwright

$npmArguments = switch ($Command) {
  'dev' { @('run', 'dev', '--', '--host', $HostAddress, '--port', [string]$Port, '--strictPort') }
  'preview' { @('run', 'preview', '--', '--host', $HostAddress, '--port', [string]$Port, '--strictPort') }
  default { @('run', $Command) }
}

if ($Background) {
  if ($Command -notin @('dev', 'preview')) {
    throw 'Only dev and preview support background mode.'
  }

  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  if ($null -ne $listener) {
    throw "Port $Port is already used by process $($listener.OwningProcess -join ', ')."
  }

  $argumentText = ($npmArguments | ForEach-Object {
      '"' + (($_ -replace '"', '""')) + '"'
    }) -join ' '
  $commandLine = "npm.cmd $argumentText >NUL 2>&1"
  $startParameters = @{
    FilePath = $env:ComSpec
    ArgumentList = @('/d', '/s', '/c', $commandLine)
    WorkingDirectory = $repoRoot
    WindowStyle = 'Hidden'
    PassThru = $true
  }
  $process = Start-Process @startParameters

  [PSCustomObject]@{
    ProcessId = $process.Id
    Command = $Command
    Address = "http://${HostAddress}:$Port"
    RuntimeRoot = $runtimePath
    PersistentLog = 'disabled'
  } | Format-List
  return
}

Push-Location $repoRoot
try {
  & npm.cmd @npmArguments
  if ($LASTEXITCODE -ne 0) {
    throw "npm $($npmArguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}
finally {
  Pop-Location
}
