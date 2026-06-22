FROM php:8.2-cli-alpine

WORKDIR /app

# Copia todo o projeto
COPY . .

# Garante que o diretório de dados exista e seja gravável
RUN mkdir -p data \
    && [ -f data/participants.json ] || echo "[]" > data/participants.json \
    && chmod -R 775 data

# Porta padrão usada pelo Render quando PORT não estiver definido
EXPOSE 10000

# Servidor PHP embutido (simples e suficiente para este projeto)
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-10000} -t ."]
