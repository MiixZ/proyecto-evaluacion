FROM oven/bun:1 AS base
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias
COPY package.json bun.lock ./

# Instalar dependencias
RUN bun install

# Copiar el código fuente
COPY . .

# Compilar el proyecto (genera la carpeta dist)
RUN bun run build

# Exponer el puerto
EXPOSE 4000

# Comando de inicio
CMD ["bun", "run", "start"]