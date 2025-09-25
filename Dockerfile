# Multi-stage build para produção

# Stage 1: Build da aplicação
FROM node:18-alpine AS builder

WORKDIR /app

RUN npm install -g @angular/cli

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Build para produção (gera arquivos otimizados)
RUN ng build --configuration=production

# Stage 2: Servir com nginx (otimizado para uploads)
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/dist/ttfdiet-frontend /usr/share/nginx/html

# Configuração nginx para uploads pesados
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]