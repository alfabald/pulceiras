# 🚀 Quick Start: Deixar Público em 5 Minutos

Se você quer apenas fazer o projeto funcionar num servidor público, siga estes 5 passos:

## Passo 1: Preparar o Servidor

Requisitos mínimos:
- PHP 7.4+ com extensões: json, mbstring
- Apache ou NGINX
- Acesso SFTP ou SSH

## Passo 2: Upload dos Arquivos

Faça upload de TODA a pasta `Pulceiras/` para seu servidor:

**Opção A - SFTP (recomendado)**
```bash
sftp usuario@seu-servidor.com
cd /public_html  # ou /www ou /html
put -r Pulceiras/ .
exit
```

**Opção B - Git**
```bash
cd /var/www/html
git clone https://seu-repositorio.com/Pulceiras.git
```

## Passo 3: Ajustar Permissões

```bash
# SSH no servidor
ssh usuario@seu-servidor.com

# Navegar até o projeto
cd /public_html/Pulceiras

# Permitir escrita na pasta data/ para armazenar participantes
chmod 755 data/
chmod 644 data/participants.json

# Pronto!
```

## Passo 4: Trocar a Senha

1. Conecte via SFTP
2. Edite: `api/config.php`
3. Gere novo hash SHA-256 online ou use:

```php
<?php
$salt = 'passe-solidario-gabu-hamburg';
$password = 'sua-nova-senha-aqui';
$hash = hash('sha256', $salt . $password);
echo $hash;
?>
```

4. Substitua em `ADMIN_PIN_HASH`

## Passo 5: Testar

Acesse: `https://seu-dominio.com/Pulceiras`

✅ Se vir o formulário de inscrição, está funcionando!

## ⚠️ Segurança Mínima (IMPORTANTE!)

Antes de abrir ao público:

1. **HTTPS obrigatório**
   - Peça ao seu host para ativar SSL/TLS
   - Ou use Let's Encrypt (grátis): `certbot`

2. **Ocultar pasta data/**
   - Criar `.htaccess` no diretório `data/`:
   ```
   <FilesMatch "\.json$">
     Order allow,deny
     Deny from all
   </FilesMatch>
   ```

3. **Rate limiting funcionando?**
   - Testar: 5 tentativas de login rápidas deverão bloquear
   - Se não funcionar, checar permissões de escrita em `/tmp`

## 🔗 URLs Importantes

- **Aplicação:** https://seu-dominio.com/Pulceiras
- **Inscrição:** https://seu-dominio.com/Pulceiras (aba "Inscrição")
- **Transparência:** https://seu-dominio.com/Pulceiras (aba "Transparência")
- **Admin:** https://seu-dominio.com/Pulceiras (botão "Organizador")

## 📞 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Erro 404 | Verificar path está correto: `/Pulceiras/` |
| Erro 500 | Verificar logs: cPanel → Logs ou `/var/log/error_log` |
| Participantes não salvam | Verificar permissão: `chmod 755 data/` |
| QR code não aparece | Normal, será gerado quando participante confirmar |
| WhatsApp não abre | Testar em mobile, desktop pode bloquear |

## 🎯 Próximas Etapas

Após alguns dias do evento:

1. Fazer backup de `data/participants.json`
2. Gerar relatório: exportar CSV
3. Compartilhar dados de transparência
4. Arquivar dados

---

**Dúvidas?** Ver `DEPLOYMENT.md` para instruções detalhadas.
