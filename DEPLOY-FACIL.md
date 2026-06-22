# 🚀 DEPLOY PARA PÚBLICO EM 10 MINUTOS

## Pré-requisitos
- Hospedagem com PHP 7.4+ (recomendado 8.0+)
- Acesso SFTP ou cPanel
- Domínio configurado (ex: seudominio.com)

---

## ✅ PASSO 1: Upload dos Arquivos (2 min)

### Via SFTP (WinSCP, Filezilla, etc)
1. Conecte no servidor: `seu-usuario@seu-servidor.com`
2. Navegue até: `/public_html` ou `/www`
3. Faça upload de TODA a pasta `Pulceiras/`

### Via cPanel
1. Vá em: **File Manager**
2. Abra: **public_html**
3. Upload > Choose Files > Selecione `Pulceiras/` (pasta inteira)

### Via Git (recomendado)
```bash
ssh seu-usuario@seu-servidor.com
cd /home/seu-usuario/public_html
git clone https://seu-repo.git Pulceiras
cd Pulceiras
```

---

## ✅ PASSO 2: Ajustar Permissões (1 min)

Execute no terminal do servidor (SSH):
```bash
cd /home/seu-usuario/public_html/Pulceiras
chmod 755 data/
chmod 644 data/participants.json
```

**OU via cPanel File Manager:**
1. Clique direito em `data/` → Properties
2. Mude permissão para `755`

---

## ✅ PASSO 3: Trocar a Senha (2 min)

1. Edite: `api/config.php`
2. Procure: `const ADMIN_PIN_HASH`

**Para gerar novo hash:**

Use esta ferramenta online: https://www.php.net/manual/en/function.hash.php

OU crie arquivo `gerar-hash.php`:
```php
<?php
$salt = 'passe-solidario-gabu-hamburg';
$nova_senha = 'sua-senha-aqui';
$hash = hash('sha256', $salt . $nova_senha);
echo $hash;
?>
```

Acesse no navegador, copie o hash e substitua em `ADMIN_PIN_HASH`

---

## ✅ PASSO 4: Proteger a Pasta data/ (1 min)

Crie arquivo `.htaccess` dentro de `data/`:

```apache
<Files "*.json">
  Order allow,deny
  Deny from all
</Files>
```

**Via SFTP:** Upload o arquivo
**Via cPanel:** Create File → `.htaccess` → Paste acima

---

## ✅ PASSO 5: HTTPS (OBRIGATÓRIO!) (2 min)

### Opção A: cPanel (recomendado)
1. Vá em: **SSL/TLS Status**
2. Clique: **Manage** no seu domínio
3. Clique: **Run AutoSSL**
4. Pronto! ✅

### Opção B: Let's Encrypt (manual)
```bash
sudo certbot certonly --webroot -w /home/seu-usuario/public_html -d seudominio.com
```

### Opção C: Certificado pago
Compre em: GoDaddy, Namecheap, etc e siga instruções de instalação

---

## ✅ PASSO 6: Testar (2 min)

Abra no navegador:
```
https://seudominio.com/Pulceiras
```

**Deverá aparecer:**
- ✅ Formulário de inscrição
- ✅ Aba "Passe"
- ✅ Aba "Transparência"
- ✅ Botão "Organizador"

Se der erro, acesse:
```
https://seudominio.com/Pulceiras/health-check.php
```

---

## 📋 Checklist Final

- [ ] Arquivos fazem upload correto
- [ ] Pasta `data/` com permissão 755
- [ ] Senha de organizador trocada
- [ ] HTTPS ativado
- [ ] `data/.htaccess` criado
- [ ] Home page abre sem erros
- [ ] Teste inscrição
- [ ] Test admin login com nova senha
- [ ] Compartilhamento WhatsApp funciona
- [ ] Aba Transparência aparece

---

## 🔧 Troubleshooting Rápido

| Erro | Solução |
|------|---------|
| "Erro 404 - não encontra" | Verificar path: `/Pulceiras/` está correto |
| "Erro 500" | Verificar log: cPanel > Error Log ou `.htaccess` quebrado |
| "Permissão negada em data/" | Executar `chmod 755 data/` |
| "Senha não funciona" | Verificar se hash foi salvo corretamente em `ADMIN_PIN_HASH` |
| "QR não aparece" | Normal em primeira vez, aparece após inscrição |

---

## 📞 Testes Funcionais

### Teste 1: Inscrição
1. Acesse home
2. Preencha formulário
3. Clique "Confirmar"
4. Deverá aparecer passe com QR

### Teste 2: Admin
1. Clique "Organizador"
2. Digite senha
3. Deverão aparecer abas "Entrada" e "Participantes"

### Teste 3: Transparência
1. Clique aba "Transparência"
2. Deverá mostrar métricas (0 inscrições se é primeira vez)

### Teste 4: Backup
1. Faça algumas inscrições de teste
2. Via SFTP, faça download de `data/participants.json`
3. Pronto! Você tem backup

---

## 🔐 Boas Práticas

1. **Backup diário:**
   ```bash
   # Cron job (execute diariamente)
   0 2 * * * cp /home/seu-usuario/public_html/Pulceiras/data/participants.json /backups/participants-$(date +\%Y-\%m-\%d).json
   ```

2. **Monitorar erros:**
   - cPanel → Logs → Error Log
   - Verificar regularmente

3. **Atualizar senha regularmente:**
   - Alterar a cada 3 meses
   - Mais vezes se há risco de exposição

---

## ✨ Pronto! 

Seu passe solidário está online! 🎉

**URL:** https://seudominio.com/Pulceiras

Aproveite o evento! 🎊
