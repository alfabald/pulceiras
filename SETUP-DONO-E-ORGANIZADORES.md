# Setup do Dono e Organizadores (Pronto para Colar)

Este guia tem blocos diretos para copiar e colar no terminal.

## Execucao unica (recomendado)

Se quiser deixar tudo pronto de uma vez (bootstrap dono + 4 contas padrao + validacao), execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-completo.ps1 -BaseUrl "https://SEU-DOMINIO/Pulceiras" -OwnerUsername "dono.gabu" -OwnerName "Dono do Sistema" -OwnerPin "Dono2026"
```

Contas padrao criadas pelo script:

- entrada.turno1 (entry)
- financeiro.turno1 (finance)
- auditoria.leitura (viewer)
- admin.backup (admin)

## 1) Bootstrap do dono (primeira vez)

Use apenas quando ainda nao existe conta em data/organizers.json.

PowerShell:

```powershell
$base = "https://SEU-DOMINIO/Pulceiras"
$payload = @{
  username = "dono.gabu"
  name = "Dono do Sistema"
  pin = "Dono2026"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$base/api/bootstrap-owner.php" -ContentType "application/json" -Body $payload
```

Verificar se ainda precisa bootstrap:

```powershell
Invoke-RestMethod -Method Get -Uri "https://SEU-DOMINIO/Pulceiras/api/bootstrap-owner.php"
```

## 2) Login do dono

No sistema web:
- Clicar em Organizador
- Utilizador: dono.gabu
- Senha: Dono2026

Importante:

- Apenas a conta dona principal pode gerir organizadores.
- Defina no servidor: OWNER_USERNAME=dono.gabu (ou o utilizador que deseja como dono).

## 3) Criar organizador (pronto para colar)

PowerShell:

```powershell
$base = "https://SEU-DOMINIO/Pulceiras"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Login do dono
$login = @{ username = "dono.gabu"; pin = "Dono2026" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/login.php" -WebSession $session -ContentType "application/json" -Body $login | Out-Null

# Criar conta de entrada
$newOrg = @{
  action = "create"
  username = "entrada.turno1"
  name = "Equipe Entrada Turno 1"
  role = "entry"
  pin = "Entrada2026"
  allowedActivities = @("Workshop", "Torneio Infantil")
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri "$base/api/organizers.php" -WebSession $session -ContentType "application/json" -Body $newOrg
```

## 4) Redefinir senha de organizador

```powershell
$base = "https://SEU-DOMINIO/Pulceiras"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$login = @{ username = "dono.gabu"; pin = "Dono2026" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/login.php" -WebSession $session -ContentType "application/json" -Body $login | Out-Null

$reset = @{ action = "resetPin"; username = "entrada.turno1"; pin = "NovaEntrada2026" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/organizers.php" -WebSession $session -ContentType "application/json" -Body $reset
```

## 5) Ativar/Desativar organizador

```powershell
$base = "https://SEU-DOMINIO/Pulceiras"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$login = @{ username = "dono.gabu"; pin = "Dono2026" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/login.php" -WebSession $session -ContentType "application/json" -Body $login | Out-Null

$toggle = @{ action = "update"; username = "entrada.turno1"; active = $false } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/organizers.php" -WebSession $session -ContentType "application/json" -Body $toggle
```

## 6) Excluir organizador

```powershell
$base = "https://SEU-DOMINIO/Pulceiras"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$login = @{ username = "dono.gabu"; pin = "Dono2026" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/login.php" -WebSession $session -ContentType "application/json" -Body $login | Out-Null

$delete = @{ action = "delete"; username = "entrada.turno1" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/organizers.php" -WebSession $session -ContentType "application/json" -Body $delete
```

## 7) Politica de senha recomendada

- Minimo 6 caracteres
- Pelo menos 1 letra e 1 numero
- Evitar senha igual ao nome de utilizador
- Trocar senha a cada 90 dias

## 8) Endpoints novos

- GET api/bootstrap-owner.php
- POST api/bootstrap-owner.php
- POST api/change-pin.php
- GET api/organizers.php
- POST api/organizers.php

## 9) Checklist rapido

- Dono criado via bootstrap
- Login do dono confirmado
- Organizadores criados por perfil
- Escopo por atividade definido em cada conta
- Troca obrigatoria de senha testada
- Auditoria filtrada por utilizador e acao

## 10) Hardening rapido (copiar e colar)

No ficheiro de variaveis de ambiente do servidor, adicione:

```env
ADMIN_ALLOWED_IPS=SEU_IP_FIXO_AQUI
```

Exemplo com dois IPs:

```env
ADMIN_ALLOWED_IPS=203.0.113.10,198.51.100.22
```

Depois do deploy/restart:

- Logins e operacoes administrativas so funcionam a partir desses IPs.
- Se deixar vazio, o sistema aceita qualquer IP (comportamento atual).

## 11) Rotacao automatica de senha (copiar e colar)

No ficheiro de variaveis de ambiente do servidor, adicione:

```env
ORGANIZER_PIN_MAX_AGE_DAYS=90
```

Com isso, senhas de organizador expiram automaticamente por tempo.

- `90` = exige troca a cada 90 dias.
- `0` = desativa expiracao por prazo.

## 12) Backup diario automatico

### Linux (cron)

Dar permissao e testar:

```bash
chmod +x /caminho/Pulceiras/scripts/backup-diario.sh
/caminho/Pulceiras/scripts/backup-diario.sh /caminho/Pulceiras /caminho/Pulceiras/backups 30
```

Agendar para 02:00 todos os dias:

```bash
crontab -e
```

Adicionar linha:

```cron
0 2 * * * /caminho/Pulceiras/scripts/backup-diario.sh /caminho/Pulceiras /caminho/Pulceiras/backups 30 >> /caminho/Pulceiras/backups/backup.log 2>&1
```

### Windows (Task Scheduler)

Teste manual:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-diario.ps1 -ProjectRoot "." -BackupRoot ".\backups" -KeepDays 30
```

Criar tarefa diaria (02:00):

```powershell
schtasks /Create /SC DAILY /ST 02:00 /TN "PulceirasBackupDiario" /TR "powershell -ExecutionPolicy Bypass -File C:\xampp\htdocs\Pulceiras\scripts\backup-diario.ps1 -ProjectRoot C:\xampp\htdocs\Pulceiras -BackupRoot C:\xampp\htdocs\Pulceiras\backups -KeepDays 30" /F
```

## 13) Como passar o sistema para outra atividade

Tem duas formas recomendadas:

### A) Reutilizar o mesmo sistema (multiatividade)

- Mantem o mesmo deploy.
- Cria novas atividades no catálogo do evento.
- Cria contas de organizador com escopo apenas dessas atividades.
- Vantagem: tudo centralizado e sem duplicar infraestrutura.

### B) Entregar uma instância separada para outro organizador

- Cria novo repositório/clone e novo deploy (outro domínio/subdomínio).
- Executa bootstrap do dono dessa nova instância.
- Mantém base de dados/arquivos separados.
- Vantagem: isolamento total de dados e gestão independente.

Checklist rápido para instância separada:

1. Novo domínio/subdomínio.
2. Novo storage (Postgres/Supabase ou pasta data dedicada).
3. Definir OWNER_USERNAME da nova organização.
4. Executar scripts/setup-completo.ps1 com credenciais da nova organização.
5. Ativar ADMIN_ALLOWED_IPS para a equipa deles.

## 14) Instancia separada pronta (copy/paste)

### A) Criar nova instancia local sem dados antigos

Executar na instancia atual:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\nova-instancia-local.ps1 -TargetPath "C:\xampp\htdocs\Pulceiras-ClienteA"
```

Esse comando:

- copia o projeto para novo caminho,
- limpa participantes/organizadores/auditoria,
- gera .env a partir de .env.example.

### B) Publicar nova instancia e fazer setup inicial automatico

Depois de colocar a nova instancia num novo dominio/subdominio, execute dentro da pasta dela:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-completo.ps1 -BaseUrl "https://cliente-a.seudominio.com" -OwnerUsername "dono.clientea" -OwnerName "Dono Cliente A" -OwnerPin "DonoClienteA2026"
```

### C) Variaveis minimas recomendadas na nova instancia (.env)

```env
OWNER_USERNAME=dono.clientea
ADMIN_ALLOWED_IPS=IP_DA_EQUIPE_CLIENTE_A
ORGANIZER_PIN_MAX_AGE_DAYS=90
```

### D) Entrega segura para o novo organizador

1. Enviar URL da nova instancia.
2. Enviar apenas credencial do dono inicial.
3. Pedir troca imediata da senha no primeiro acesso.
4. Validar que eles conseguem criar os proprios organizadores.
