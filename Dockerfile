# Etapa 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar la aplicación
RUN npm run build

# Etapa 2: Production
FROM node:24-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar el código compilado desde la etapa de build
COPY --from=builder /app/dist ./dist

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/main"]
