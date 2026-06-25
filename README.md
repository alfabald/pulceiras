# Passe de Atividades Solidárias

Sistema para substituir pulseiras físicas por passes digitais com QR e confirmação por organizador.

## O que já faz

- Cria inscrições para qualquer atividade/evento.
- Gera um código único para cada participante.
- Mostra um passe digital que pode ser copiado, enviado por WhatsApp ou impresso.
- O passe fica pendente até o organizador confirmar o montante acordado.
- O QR pode ser validado publicamente por comissão no dia da atividade.
- Quando o passe está aberto, o sistema verifica periodicamente e notifica quando for validado.
- Confirma a entrada dos participantes no dia do evento.
- Protege as áreas `Entrada` e `Participantes` com acesso de organizador.
- Guarda os dados no navegador quando aberto diretamente.
- Inclui API em PHP com fallback para `data/participants.json`.
- Suporta PostgreSQL por `DATABASE_URL` e Supabase por variáveis dedicadas.
- Permite exportar a lista em CSV.

## Como usar agora

Abre o ficheiro `index.html` no navegador. Esta forma funciona mesmo sem PHP, mas os dados ficam guardados apenas nesse navegador.

## Como usar com PHP depois

Quando tiveres PHP instalado, abre a pasta do projeto no terminal e executa:

```powershell
php -S localhost:8000
```

Depois abre:

```text
http://localhost:8000
```

Com PHP, as inscrições passam a ser guardadas no ficheiro `data/participants.json`.

## Deploy rápido no Render (com GitHub)

Este projeto já está pronto para deploy no Render com os ficheiros `Dockerfile` e `render.yaml`.

1. Sobe o projeto para o GitHub.
2. No Render, clica em `New +` > `Blueprint`.
3. Seleciona o repositório.
4. Aguarda o deploy.

Sem configuração extra, a app funciona, mas no plano grátis do Render o disco é efémero.

## Persistência real no Render com Supabase

Para não perder dados em reinício/deploy:

1. Cria um projeto no Supabase.
2. Vai em `SQL Editor` e executa o script `supabase/schema.sql`.
3. No Render, em `Environment`, adiciona:
	- `SUPABASE_URL`
	- `SUPABASE_SERVICE_ROLE_KEY`
	- `SUPABASE_TABLE` (valor recomendado: `participants_store`)
4. Faz redeploy do serviço.

Quando estas variáveis existem, a API passa a guardar os participantes no Supabase automaticamente.
Se não existirem, continua a usar `data/participants.json`.

## Persistência com PostgreSQL (recomendado)

Define estas variáveis de ambiente no servidor:

- `DATABASE_URL` (string de conexão PostgreSQL)
- `POSTGRES_TABLE` (opcional, padrão: `participants_store`)

Quando `DATABASE_URL` estiver configurado, a API usa PostgreSQL automaticamente.
Se falhar, cai para Supabase (se configurado) e depois para JSON local.

## Acesso de organizador

A senha inicial para testar é:

```text
gabu2026
```

Usa o botão `Organizador` para ver as abas `Entrada` e `Participantes`.

Antes de partilhar o projeto com outras pessoas, troca a senha em `api/config.php`.

## Validade do passe e confirmação

1. Participante cria o passe (status pendente).
2. Organizador entra na aba `Participantes`.
3. Organizador ajusta e confirma o montante acordado.
4. Passe passa para status válido.
5. Comissão pode escanear QR no dia e validar status.

## Como confirmar entrada

1. Abre a aba `Entrada`.
2. Procura pelo código do passe, nome ou telefone.
3. Confirma se os dados estão certos.
4. Clica em `Confirmar entrada`.

Se estiveres a usar pelo XAMPP, a confirmação fica guardada em `data/participants.json`.

## Endpoint público de validação de QR

`GET api/pass.php?code=CODIGO_DO_PASSE`

Retorna os dados mínimos do passe e o campo `amountConfirmed`, usado para validar se está apto para entrada.

## Próximos passos sugeridos

1. Testar tudo dentro do XAMPP com dados reais de ensaio.
2. Trocar a senha inicial de organizador.
3. Adicionar leitura de QR Code real.
4. Criar uma página pública de transparência dos fundos.
5. Preparar texto oficial para convite no WhatsApp.
