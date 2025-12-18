FROM node:20-alpine

LABEL maintainer="TFM Evaluacion Platform"
LABEL description="Node.js 20 sandbox for secure code execution"

# Crear usuario sin privilegios (usar UID diferente si 1000 está ocupado)
RUN addgroup -g 1001 sandbox && \
    adduser -D -u 1001 -G sandbox -s /bin/sh sandbox

# Crear directorio de trabajo
WORKDIR /workspace
RUN chown sandbox:sandbox /workspace

# Cambiar a usuario
USER sandbox

# Variables de entorno
ENV NODE_ENV=production

# Punto de entrada
ENTRYPOINT ["node"]
