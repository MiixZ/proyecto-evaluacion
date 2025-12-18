FROM python:3.11-alpine

# Metadatos
LABEL maintainer="TFM Evaluacion Platform"
LABEL description="Python 3.11 sandbox for secure code execution"

# Instalar dependencias del sistema (si necesitas compilar extensiones)
RUN apk add --no-cache \
    gcc \
    musl-dev \
    linux-headers

# Crear usuario sin privilegios
RUN adduser -D -u 1000 -s /bin/sh sandbox

# Crear directorio de trabajo
WORKDIR /workspace
RUN chown sandbox:sandbox /workspace

# Cambiar a usuario sin privilegios
USER sandbox

# Configurar Python
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Punto de entrada
ENTRYPOINT ["python3"]
CMD ["-u"]