FROM node:20-alpine

WORKDIR /app

# Instalar bun
RUN npm install -g bun

# Copiar archivos de dependencias
COPY package.json bun.lock* ./

# Instalar dependencias
RUN bun install --frozen-lockfile

# Copiar código fuente y configuración TypeScript
COPY src ./src
COPY tsconfig.json ./

# ✅ COMPILAR TYPESCRIPT A JAVASCRIPT
RUN bun run build

# Exponer puerto
EXPOSE 3000

# ✅ Ejecutar archivo compilado
CMD ["bun", "run", "start"]
