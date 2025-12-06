# Dockerfile para desarrollo con hot-reload
FROM node:24-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN pnpm install

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar en modo desarrollo con hot-reload
CMD ["pnpm", "run", "start:dev"]
