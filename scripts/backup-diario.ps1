param(
  [string]$ProjectRoot = ".",
  [string]$BackupRoot = ".\backups",
  [int]$KeepDays = 30
)

$ErrorActionPreference = "Stop"

$project = Resolve-Path $ProjectRoot
$backupDir = Join-Path $project $BackupRoot
$dataDir = Join-Path $project "data"

if (!(Test-Path $dataDir)) {
  throw "Pasta data nao encontrada em: $dataDir"
}

if (!(Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipName = "pulceiras-backup-$timestamp.zip"
$zipPath = Join-Path $backupDir $zipName

$files = @(
  "participants.json",
  "organizers.json",
  "audit-log.jsonl",
  "event-config.json"
) | ForEach-Object { Join-Path $dataDir $_ } | Where-Object { Test-Path $_ }

if ($files.Count -eq 0) {
  throw "Nenhum ficheiro de dados encontrado para backup."
}

Compress-Archive -Path $files -DestinationPath $zipPath -CompressionLevel Optimal

$limit = (Get-Date).AddDays(-1 * [Math]::Abs($KeepDays))
Get-ChildItem -Path $backupDir -Filter "pulceiras-backup-*.zip" |
  Where-Object { $_.LastWriteTime -lt $limit } |
  Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Backup criado: $zipPath"
