# 🚀 Guia de Deployment e Produção

Instruções para preparar o Passe Solidário Gabú Hamburg para produção e deixar disponível publicamente.

## 📋 Checklist Pré-Deployment

### 1. Segurança

- [ ] **Trocar senha de organizador**
  - Alterar em `api/config.php`
  - Gerar novo hash SHA-256: `hash('sha256', 'passe-solidario-gabu-hamburg' + NOVA_SENHA)`

- [ ] **Configurar HTTPS**
  - Descomente as linhas 22-27 no `.htaccess`
  - Ou configure certificado SSL no servidor

- [ ] **Variáveis de ambiente** (Opcional para futuro)
  - Mover dados sensíveis para variáveis PHP env

- [ ] **Backup de dados**
  - Fazer backup do arquivo `data/participants.json` regularmente
  - Implementar backup automático (scripts/backup.sh)

### 2. Performance

- [ ] **Compressão habilitada** (no `.htaccess`)
- [ ] **Cache habilitado** (no `.htaccess`)
- [ ] **CDN para bibliotecas externas** (já configurado)
  - QRCode.js via CDN: ✅ Configurado
  - Intl formatters: ✅ Nativo do navegador

### 3. Configuração do Servidor

#### PHP (7.4+)

```php
; php.ini settings
post_max_size = 10M
upload_max_filesize = 10M
max_execution_time = 30
session.cookie_secure = On      ; HTTPS only
session.cookie_httponly = On    ; Sem acesso JavaScript
session.cookie_samesite = Strict
```

#### Apache

```apache
# Ativar mod_rewrite
a2enmod rewrite

# Ativar mod_headers
a2enmod headers

# Ativar mod_deflate
a2enmod deflate

# Ativar mod_expires
a2enmod expires

# Restartar Apache
systemctl restart apache2
```

#### NGINX (alternativa)

```nginx
server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    # SSL
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root
    root /var/www/html/Pulceiras;
    index index.html index.php;

    # Compressão
    gzip on;
    gzip_types text/html text/css application/javascript application/json;

    # Rotas PHP
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # Bloquear acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
    }
    location ~ /(config|\.env)\.php$ {
        deny all;
    }
}
```

## 📊 Estrutura de Dados Esperada

### participants.json

```json
[
  {
    "code": "GABU-2026-ABC123",
    "fullName": "Nome da Pessoa",
    "phone": "+49 ...",
    "email": "email@example.com",
    "city": "Hamburg",
    "guests": 1,
    "contribution": 10.00,
    "paymentStatus": "Prometido|Recebido em dinheiro|Transferência confirmada",
    "note": "Observação opcional",
    "checkedInAt": "2026-06-22T14:30:00Z ou vazio",
    "createdAt": "2026-06-22T14:30:00Z"
  }
]
```

## 🗂️ Estrutura de Diretórios (Produção)

```
/var/www/html/Pulceiras/
├── index.html
├── README.md
├── DEPLOYMENT.md (este arquivo)
├── .htaccess
├── api/
│   ├── config.php
│   ├── helpers.php
│   ├── session.php
│   ├── login.php
│   ├── logout.php
│   ├── register.php
│   ├── participants.php
│   └── checkin.php
├── assets/
│   ├── css/styles.css
│   └── js/app.js
├── data/
│   ├── participants.json
│   └── backups/
│       ├── participants-2026-06-22.json
│       └── participants-2026-06-23.json
└── scripts/
    ├── backup.sh
    └── stats.php
```

## 🔄 Backup Automático

### Script Bash (Linux/macOS)

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/var/www/html/Pulceiras/data/backups"
DATA_FILE="/var/www/html/Pulceiras/data/participants.json"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/participants-$DATE.json"

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

# Copiar com preservação de permissões
cp "$DATA_FILE" "$BACKUP_FILE"

# Remover backups com mais de 30 dias
find "$BACKUP_DIR" -name "participants-*.json" -mtime +30 -delete

echo "Backup criado: $BACKUP_FILE"
```

### Cron Job (executar diariamente às 2:00 AM)

```bash
0 2 * * * /bin/bash /var/www/html/Pulceiras/scripts/backup.sh >> /var/log/pulceiras-backup.log 2>&1
```

## 📈 Monitoramento

### Métricas Importantes

- Total de inscrições
- Taxa de conversão (pagamentos recebidos)
- Pessoas confirmadas
- Erros da API

### Logs (Apache)

```
/var/log/apache2/access.log
/var/log/apache2/error.log
```

### Logs (PHP)

```
/var/log/php-fpm.log
```

## 🔐 Proteção de Dados

### GDPR Compliance (EU)

- ✅ Dados armazenados localmente (sem cloud)
- ⚠️ TODO: Política de privacidade
- ⚠️ TODO: Direito de apagar dados
- ⚠️ TODO: Auditoria de acesso

### Segurança de Senha

- Usar bcrypt em produção (em vez de SHA-256 simples)
- Implementar 2FA para organizadores
- Rate limiting já implementado

## 🧪 Teste de Produção

### 1. Testar localmente em XAMPP

```bash
cd c:\xampp\htdocs\Pulceiras
php -S localhost:8000
# Acesse http://localhost:8000
```

### 2. Testar em servidor de staging

```bash
# Upload via SFTP ou git clone
scp -r * user@staging.example.com:/var/www/html/Pulceiras/

# Testar endpoints da API
curl -X POST http://staging.example.com/Pulceiras/api/register.php \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Test", "phone": "+49123456789"}'
```

### 3. Testes Funcionais

- [ ] Inscrição de novo participante
- [ ] Geração de passe com QR code
- [ ] Compartilhamento por WhatsApp
- [ ] Impressão de passe
- [ ] Login de organizador
- [ ] Check-in de entrada
- [ ] Exportação CSV
- [ ] Página de transparência
- [ ] Resposta a requisições inválidas (erro 400, 422, 429)

## 📞 Suporte e Troubleshooting

### Problema: "QR Code não aparece"

**Solução:**
1. Verificar console (F12) para erros de JavaScript
2. Verificar se CDN está acessível: https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
3. Se CDN bloqueado, implementar fallback local

### Problema: "Dados desaparecem após atualizar"

**Solução:**
1. Verificar permissões de arquivo: `ls -l data/participants.json`
2. Deverá ser: `-rw-r--r-- www-data:www-data`
3. Se necessário: `chmod 644 data/participants.json`

### Problema: "Erro 429 - Rate Limit"

**Esperado:** Proteção contra brute force funcionando
- Aguardar 1 minuto após 5 tentativas de login falhadas

### Problema: "HTTPS não redireciona"

**Solução:**
1. Descomente as linhas 22-27 no `.htaccess`
2. Certifique-se de que `mod_rewrite` está ativado
3. Teste: `a2enmod rewrite && systemctl restart apache2`

## 📚 Recursos Adicionais

- [Documentação Apache .htaccess](https://httpd.apache.org/docs/current/howto/htaccess.html)
- [Guia OWASP: Securing PHP](https://owasp.org/www-community/attacks/PHP_File_Inclusion)
- [Mozilla Security Headers](https://securityheaders.com/)
- [GDPR Compliance Checklist](https://gdpr-info.eu/)

## 🎉 Próximos Passos (Futuro)

- [ ] Migrar para banco de dados SQL
- [ ] Implementar API RESTful com versionamento
- [ ] App mobile (React Native/Flutter)
- [ ] Dashboard avançado com gráficos
- [ ] Leitor de QR code real (câmera)
- [ ] Notificações por email/SMS
- [ ] Autenticação com 2FA (TOTP)
- [ ] Auditoria de logs
- [ ] Análise de dados com BI tools
