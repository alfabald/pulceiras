param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [string]$OwnerUsername = "dono.gabu",
  [string]$OwnerName = "Dono do Sistema",
  [string]$OwnerPin = "Dono2026"
)

$ErrorActionPreference = "Stop"

function Invoke-Api {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [object]$Body,
    [Microsoft.PowerShell.Commands.WebRequestSession]$Session
  )

  $params = @{
    Method      = $Method
    Uri         = $Uri
    ContentType = "application/json"
  }

  if ($null -ne $Body) {
    $params.Body = ($Body | ConvertTo-Json -Depth 8)
  }

  if ($null -ne $Session) {
    $params.WebSession = $Session
  }

  return Invoke-RestMethod @params
}

$base = $BaseUrl.TrimEnd("/")
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "[1/5] Verificando bootstrap do dono..."
$bootstrapState = Invoke-RestMethod -Method Get -Uri "$base/api/bootstrap-owner.php"

if ($bootstrapState.needsBootstrap -eq $true) {
  Write-Host "Bootstrap necessario. Criando dono inicial..."
  Invoke-Api -Method Post -Uri "$base/api/bootstrap-owner.php" -Body @{
    username = $OwnerUsername
    name     = $OwnerName
    pin      = $OwnerPin
  } | Out-Null
} else {
  Write-Host "Bootstrap ja foi concluido."
}

Write-Host "[2/5] Fazendo login como dono..."
Invoke-Api -Method Post -Uri "$base/api/login.php" -Session $session -Body @{
  username = $OwnerUsername
  pin      = $OwnerPin
} | Out-Null

$defaultOrganizers = @(
  @{
    username          = "entrada.turno1"
    name              = "Equipe Entrada Turno 1"
    role              = "entry"
    pin               = "Entrada2026"
    allowedActivities = @("Workshop", "Torneio Infantil")
  },
  @{
    username          = "financeiro.turno1"
    name              = "Equipe Financeiro Turno 1"
    role              = "finance"
    pin               = "Finance2026"
    allowedActivities = @("Workshop", "Torneio Infantil", "Feira Solidaria")
  },
  @{
    username          = "auditoria.leitura"
    name              = "Equipe Auditoria Leitura"
    role              = "viewer"
    pin               = "Viewer2026"
    allowedActivities = @("Workshop", "Torneio Infantil", "Feira Solidaria")
  },
  @{
    username          = "admin.backup"
    name              = "Administrador Backup"
    role              = "admin"
    pin               = "Backup2026"
    allowedActivities = @()
  }
)

Write-Host "[3/5] Criando/atualizando organizadores padrao..."
foreach ($org in $defaultOrganizers) {
  try {
    Invoke-Api -Method Post -Uri "$base/api/organizers.php" -Session $session -Body @{
      action            = "create"
      username          = $org.username
      name              = $org.name
      role              = $org.role
      pin               = $org.pin
      allowedActivities = $org.allowedActivities
    } | Out-Null

    Write-Host "  + Criado: $($org.username)"
  } catch {
    $message = $_.Exception.Message
    if ($message -match "409" -or $message -match "Já existe") {
      Invoke-Api -Method Post -Uri "$base/api/organizers.php" -Session $session -Body @{
        action            = "update"
        username          = $org.username
        name              = $org.name
        role              = $org.role
        active            = $true
        allowedActivities = $org.allowedActivities
      } | Out-Null

      Invoke-Api -Method Post -Uri "$base/api/organizers.php" -Session $session -Body @{
        action   = "resetPin"
        username = $org.username
        pin      = $org.pin
      } | Out-Null

      Write-Host "  * Atualizado: $($org.username)"
    } else {
      throw
    }
  }
}

Write-Host "[4/5] Validando sessao e lista de organizadores..."
$sessionInfo = Invoke-RestMethod -Method Get -Uri "$base/api/session.php" -WebSession $session
$organizers = Invoke-RestMethod -Method Get -Uri "$base/api/organizers.php" -WebSession $session

Write-Host "Sessao ativa: role=$($sessionInfo.role) user=$($sessionInfo.organizerUsername)"
Write-Host "Organizadores ativos cadastrados: $($organizers.organizers.Count)"

Write-Host "[5/5] Concluido. Credenciais padrao criadas:"
$defaultOrganizers | ForEach-Object {
  Write-Host "  - $($_.username) / $($_.pin) / perfil=$($_.role)"
}

Write-Host "IMPORTANTE: altere as senhas padrao apos o primeiro acesso."
