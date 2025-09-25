# Multi-stage build para produção

# Stage 1: Build da aplicação
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g @angular/cli

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Build para produção
RUN ng build --configuration=production

# Debug: listar conteúdo da pasta dist para ver o nome correto
RUN ls -la dist/

# Stage 2: Servir com nginx (otimizado para uploads)
FROM nginx:alpine

# Remover configurações padrão do nginx
RUN rm -rf /usr/share/nginx/html/*
RUN rm -f /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados (usando wildcard para pegar qualquer nome)
COPY --from=builder /app/dist/* /usr/share/nginx/html/

# Configuração nginx para uploads pesados
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]