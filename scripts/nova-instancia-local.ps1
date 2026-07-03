param(
  [Parameter(Mandatory = $true)]
  [string]$TargetPath,

  [string]$SourcePath = ".",
  [switch]$RunSetup,
  [string]$BaseUrl = "",
  [string]$OwnerUsername = "dono.novo",
  [string]$OwnerName = "Admin Principal",
  [string]$OwnerPin = "Dono2026"
)

$ErrorActionPreference = "Stop"

$source = (Resolve-Path $SourcePath).Path
$target = [System.IO.Path]::GetFullPath($TargetPath)

if (Test-Path $target) {
  throw "TargetPath ja existe: $target"
}

New-Item -ItemType Directory -Path $target | Out-Null

Write-Host "[1/4] Copiando projeto para nova instancia..."
$excludeDirs = @(".git", "backups", "node_modules")
$excludeFiles = @("participants.json", "organizers.json", "audit-log.jsonl")

$roboArgs = @(
  $source,
  $target,
  "/E",
  "/R:1",
  "/W:1",
  "/XD"
) + $excludeDirs + @("/XF") + $excludeFiles

$null = & robocopy @roboArgs

Write-Host "[2/4] Inicializando dados limpos da nova instancia..."
$dataDir = Join-Path $target "data"
if (!(Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}

Set-Content -Path (Join-Path $dataDir "participants.json") -Value "[]`n" -Encoding UTF8
Set-Content -Path (Join-Path $dataDir "organizers.json") -Value "[]`n" -Encoding UTF8
Set-Content -Path (Join-Path $dataDir "audit-log.jsonl") -Value "" -Encoding UTF8

Write-Host "[3/4] Preparando .env da nova instancia..."
$envExample = Join-Path $target ".env.example"
$envFile = Join-Path $target ".env"
if ((Test-Path $envExample) -and !(Test-Path $envFile)) {
  Copy-Item $envExample $envFile
}

Write-Host "Nova instancia criada em: $target"
Write-Host "IMPORTANTE: ajustar dominio/base URL e OWNER_USERNAME no .env da nova instancia."

if ($RunSetup.IsPresent) {
  if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    throw "BaseUrl obrigatorio quando usar -RunSetup"
  }

  Write-Host "[4/4] Executando setup inicial na nova instancia..."
  Push-Location $target
  try {
    powershell -ExecutionPolicy Bypass -File .\scripts\setup-completo.ps1 -BaseUrl $BaseUrl -OwnerUsername $OwnerUsername -OwnerName $OwnerName -OwnerPin $OwnerPin
  } finally {
    Pop-Location
  }
} else {
  Write-Host "[4/4] Setup inicial nao executado (use -RunSetup para automatizar)."
}
