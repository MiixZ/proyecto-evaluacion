FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="TFM Evaluacion Platform"
LABEL description="Java 17 sandbox for secure code execution"

# Instalar JDK completo (necesario para javac)
RUN apk add --no-cache openjdk17

# Crear usuario sin privilegios
RUN addgroup -g 1000 sandbox && \
    adduser -D -u 1000 -G sandbox -s /bin/sh sandbox

# Crear directorio de trabajo
WORKDIR /workspace
RUN chown sandbox:sandbox /workspace

# Cambiar a usuario
USER sandbox

# Variables de entorno
ENV JAVA_TOOL_OPTIONS="-Xmx512m"

# Punto de entrada
ENTRYPOINT ["java"]
