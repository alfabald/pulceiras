# 📱 GUIAS POR PLATAFORMA DE HOSPEDAGEM

## 🔵 HOSTINGER (Mais recomendado - barato e fácil)

### 1. Upload
- Painel → **File Manager** ou **FTP/SFTP**
- Pasta: `public_html/`
- Upload: `Pulceiras/`

### 2. Permissões
- Clique direito em `data/` → **Change Permissions**
- Mude para: `755`

### 3. HTTPS
- Painel → **SSL Certificate**
- Clique: **Manage** → **Install**
- Automático com Let's Encrypt ✅

### 4. Testar
```
https://seudominio.com/Pulceiras
```

---

## 🔴 GODADDY

### 1. Upload
- Painel → **Website Builder** → **My Workspace**
- OU **File Manager** se hospedagem tradicional

Para File Manager:
- Painel → **Hosting**
- **File Manager** → `public_html`
- Upload `Pulceiras/`

### 2. Permissões
- File Manager → `data/`
- Direito → **Chmod** → `755`

### 3. HTTPS
- Painel → **SSL Certificates**
- Seu domínio já tem SSL padrão ✅

### 4. Testar
```
https://seudominio.com/Pulceiras
```

---

## 🟢 NAMECHEAP

### 1. Upload
- Painel → **cPanel**
- **File Manager** → `public_html`
- Upload `Pulceiras/`

### 2. Permissões
- File Manager → `data/` → **Change Permissions**
- Mude para: `755`

### 3. HTTPS
- cPanel → **AutoSSL**
- Domínio será configurado automaticamente ✅

### 4. Testar
```
https://seudominio.com/Pulceiras
```

---

## 🟡 BLUEHOST

### 1. Upload
- Painel → **cPanel**
- **File Manager** → `public_html`
- Upload `Pulceiras/`

### 2. Permissões
- File Manager → `data/` → **Change Permissions**
- Mude para: `755`

### 3. HTTPS
- cPanel → **AutoSSL**
- ou cPanel → **Let's Encrypt SSL**
- Automático ✅

### 4. Testar
```
https://seudominio.com/Pulceiras
```

---

## 🔵 LOCAWEB (Brasil)

### 1. Upload
- Painel → **File Manager**
- Pasta: `public_html` ou `www`
- Upload: `Pulceiras/`

### 2. Permissões
- File Manager → `data/`
- Clique direito → **Propriedades**
- Permissão: `755`

### 3. HTTPS
- Painel → **Certificado SSL**
- Let's Encrypt (grátis) ✅

### 4. Testar
```
https://seudominio.com/Pulceiras
```

---

## 🟣 UOLHOST (Brasil)

### 1. Upload
- Painel → **Gerenciador de Arquivos**
- Pasta: `www/`
- Upload: `Pulceiras/`

### 2. Permissões
- Gerenciador → `data/`
- Direito → **Alterar Permissões**
- Mude para: `755`

### 3. HTTPS
- Painel → **Certificados SSL**
- Let's Encrypt automático ✅

### 4. Testar
```
https://seudominio.com/Pulceiras
```

---

## ☁️ HEROKU (Para quem quer serverless)

### 1. Preparar
```bash
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Fazer login
heroku login

# Clonar repositório (ou criar um)
git clone https://seu-repo.git Pulceiras
cd Pulceiras

# Inicializar Heroku
heroku create seu-app-name
```

### 2. Deploy
```bash
# Fazer push
git push heroku main

# Ver logs
heroku logs --tail
```

### 3. URL
```
https://seu-app-name.herokuapp.com
```

**Nota:** Heroku vai parar em Nov/2024. Use Render ou Railway em vez.

---

## 🚀 RENDER (Alternativa a Heroku)

### 1. Conectar GitHub
- Vá em https://render.com
- Clique: **New** → **Web Service**
- Selecione seu repositório

### 2. Configurar
- **Name:** `pulceiras`
- **Environment:** `PHP`
- **Build Command:** `composer install` (se tiver)
- **Start Command:** Leave blank

### 3. Deploy
- Clique: **Deploy**
- Render faz o resto automaticamente

### 4. URL
```
https://pulceiras-xxxx.onrender.com
```

---

## 💻 DIGITAL OCEAN (Mais controle)

### 1. Criar Droplet
- Clique: **Create** → **Droplet**
- Imagem: **Ubuntu 22.04** com **PHP/MySQL**
- Size: **5$/mês é suficiente**
- Click: **Create**

### 2. SSH no servidor
```bash
ssh root@seu-ip

# Instalar Apache se não tiver
apt update && apt install apache2 php php-curl php-mbstring

# Ativar mod_rewrite
a2enmod rewrite
systemctl restart apache2
```

### 3. Upload
```bash
# Na sua máquina
scp -r Pulceiras/ root@seu-ip:/var/www/html/

# Ou via SFTP
```

### 4. Permissões
```bash
chmod 755 /var/www/html/Pulceiras/data/
chown -R www-data:www-data /var/www/html/Pulceiras/
```

### 5. HTTPS
```bash
apt install certbot python3-certbot-apache
certbot --apache -d seudominio.com
```

### 6. URL
```
https://seudominio.com/Pulceiras
```

---

## 📊 COMPARATIVA RÁPIDA

| Plataforma | Preço | Dificuldade | HTTPS | Suporte |
|-----------|-------|-----------|-------|---------|
| **Hostinger** | 3€/mês | ⭐ Fácil | Automático ✅ | Chat 24/7 |
| **GoDaddy** | 6$/mês | ⭐ Fácil | Incluído ✅ | Excelente |
| **Namecheap** | 3€/mês | ⭐ Fácil | Automático ✅ | Bom |
| **Bluehost** | 4$/mês | ⭐ Fácil | Automático ✅ | Muito bom |
| **Locaweb** | 15R$/mês | ⭐ Fácil | Let's Encrypt ✅ | Bom (PT) |
| **Uolhost** | 20R$/mês | ⭐ Fácil | Let's Encrypt ✅ | Bom (PT) |
| **Render** | Grátis* | ⭐⭐ Médio | Automático ✅ | Comunidade |
| **Digital Ocean** | 5$/mês | ⭐⭐⭐ Difícil | Manual | Comunidade |

*Render tem tier grátis, mas com limitações.

---

## 🎯 RECOMENDAÇÃO FINAL

**Para começar rapidinho:**
→ **Hostinger** ou **Namecheap** (melhor custo/benefício)

**Mais preto-no-branco:**
→ **GoDaddy** (excelente suporte)

**Super econômico:**
→ **Namecheap** (hospedagem a partir de €3)

**Grátis (com limite):**
→ **Render** (mas precisa de GitHub)

---

## ❓ DÚVIDAS FREQUENTES

### P: Qual a melhor hospedagem?
R: Hostinger ou Namecheap. Ambas têm boa relação preço/performance para este tipo de projeto.

### P: Posso colocar em servidor próprio?
R: Sim! Mas você precisa gerenciar HTTPS, backups, segurança. Use Digital Ocean ou Linode.

### P: Preciso de banco de dados?
R: Não! Este projeto usa JSON. Se crescer muito (1000+ participantes), aí sim considere SQL.

### P: Posso mudar de hospedagem depois?
R: Sim! É só fazer upload novamente em outro lugar. Os dados em `data/participants.json` vêm com você.

### P: E se a hospedagem cair?
R: Faça backup diário de `data/participants.json` (veja DEPLOYMENT.md para script automático).

---

Tem dúvida de qual escolher? **Pega Hostinger e é sucesso!** ✅
