FROM alpine:3.19

LABEL maintainer="TFM Evaluacion Platform"
LABEL description="C++17 sandbox for secure code execution"

# Instalar compilador C++ y herramientas
RUN apk add --no-cache \
    g++ \
    gcc \
    make \
    cmake \
    libc-dev

# Crear usuario sin privilegios
RUN addgroup -g 1000 sandbox && \
    adduser -D -u 1000 -G sandbox -s /bin/sh sandbox

# Crear directorio de trabajo
WORKDIR /workspace
RUN chown sandbox:sandbox /workspace

# Cambiar a usuario
USER sandbox

# Punto de entrada para bash (permite compilar + ejecutar)
ENTRYPOINT ["/bin/sh"]
