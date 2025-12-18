FROM node:20-alpine

WORKDIR /app

# Instalar Docker CLI (para usar docker socket)
RUN apk add --no-cache docker-cli docker-cli-buildx

# Instalar bun
RUN npm install -g bun

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN bun install --frozen-lockfile

# Copiar código fuente y configuración TypeScript
COPY src ./src
COPY tsconfig.json ./

# ✅ COMPILAR TYPESCRIPT A JAVASCRIPT
RUN bun run build

# Exponer puerto
EXPOSE 3001

CMD ["bun", "dist/index.js"]
