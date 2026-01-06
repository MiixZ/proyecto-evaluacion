# Informe de Variables de Entorno

Fecha: 2026-01-06

Resumen exhaustivo de variables de entorno detectadas en el repositorio y su uso.

---

## Backend

Fuente principal: `backend/src/config/environment.ts` (Zod schema)

Variables detectadas:

- `PORT` — puerto del servidor (default 3000)
- `NODE_ENV` — environment (development|production|test)
- `DB_HOST` — host MySQL
- `DB_PORT` — puerto MySQL
- `DB_USER` — usuario MySQL
- `DB_PASSWORD` — contraseña MySQL
- `DB_NAME` — nombre de la BD
- `DB_CONNECTION_LIMIT` — pool size
- `DB_QUEUE_LIMIT` — queue limit
- `DB_WAIT_FOR_CONNECTIONS` — waitForConnections boolean
- `DB_ENABLE_KEEP_ALIVE` — keep alive boolean
- `DB_KEEP_ALIVE_INITIAL_DELAY` — keep alive initial delay
- `DB_MAX_RETRIES` — retry attempts for DB
- `DB_RETRY_DELAY_MS` — retry delay ms
- `DB_QUERY_TIMEOUT_MS` — query timeout ms
- `JWT_SECRET` — secreto JWT (mínimo 32 chars en prod)
- `JWT_EXPIRY` — expiry string (e.g., 7d)
- `CORS_ORIGIN` — dominios permitidos (csv)
- `LOG_LEVEL` — log level
- `EXECUTION_ENGINE_URL` — URL del execution engine
- `EXECUTION_ENGINE_API_KEY` — API key para engine (opcional en backend)
- `SMTP_HOST` — SMTP host (opcional)
- `SMTP_PORT` — SMTP port
- `SMTP_USER` — SMTP user (opcional)
- `SMTP_PASS` — SMTP pass (opcional)
- `SMTP_FROM` — from header por defecto

Archivos con referencias:

- `backend/src/config/environment.ts` (definición y parsing)
- `backend/.env` (ejemplo de valores locales)
- `backend/docker-compose.yml` (inyecta `EXECUTION_ENGINE_URL`)

---

## Frontend

Variables detectadas:

- `VITE_API_URL` — URL base de la API (usado en `frontend/src/lib/api.ts`)

Archivos con referencias:

- `frontend/src/lib/api.ts` (usa `import.meta.env.VITE_API_URL`)
- `frontend/.env` (tiene `VITE_API_URL`)

---

## Execution Engine

Variables detectadas y usadas en código:

- `NODE_ENV`
- `PORT`
- `EXECUTION_ENGINE_API_KEY` — API key requerida en header `x-api-key` en `execution-engine/src/index.ts`
- `DOCKER_SOCKET` — ruta al socket Docker (default `/var/run/docker.sock`)
- `SANDBOX_NETWORK` — network Docker
- `SANDBOX_VOLUME_NAME` — nombre de volumen compartido (usado en `code.executor.ts`)
- `MAX_CONCURRENT_CONTAINERS` — límite concurrente
- `CONTAINER_TIMEOUT_SECONDS` — timeout por contenedor
- `DEFAULT_CPU_SHARES` (documentada en `.env`) — opcional
- `DEFAULT_MEMORY_LIMIT_MB` (documentada) — opcional
- `DEFAULT_TIME_LIMIT_SECONDS` — opcional
- `SANDBOX_IMAGE_*` — nombres de imágenes (opcional, referenciadas en `.env`)
- `LOG_LEVEL` — nivel de logs (opcional)

Archivos con referencias:

- `execution-engine/src/index.ts`
- `execution-engine/src/config/docker.config.ts`
- `execution-engine/src/services/code.executor.ts`
- `execution-engine/.env` (valores locales)

---

## Extras y variables encontradas en `.env` pero no estrictamente leídas

Se detectaron variables en archivos `.env` o `.env.example` que no aparecen como usadas por el código actual, o que se usan indirectamente desde `docker-compose.yml`.

- Incluir como comentadas en los `.env.example`:
  - `SANDBOX_IMAGE_PYTHON`, `SANDBOX_IMAGE_JAVA`, `SANDBOX_IMAGE_JAVASCRIPT`, `SANDBOX_IMAGE_CPP` (execution-engine)
  - `DEFAULT_CPU_SHARES`, `DEFAULT_MEMORY_LIMIT_MB`, `DEFAULT_TIME_LIMIT_SECONDS`, `MAX_PROCESSES` (execution-engine: límites por contenedor)
  - Variables relacionadas con métricas/monitoring (e.g., `ENABLE_METRICS`, `METRICS_PORT`)

---

## Recomendaciones

- Mantener `backend/.env.example` sincronizado con `backend/src/config/environment.ts` (fuente de verdad).
- Usar `VITE_` prefix para cualquier variable frontend adicional.
- Proteger `JWT_SECRET`, credenciales DB y `EXECUTION_ENGINE_API_KEY` en entornos de producción.

---

Ficheros `.env.example` actualizados:

- `backend/.env.example` — variables requeridas + placeholders (seguro para publicar)
- `frontend/.env.example` — `VITE_API_URL`
- `execution-engine/.env.example` — variables mínimas y `SANDBOX_VOLUME_NAME`; contiene variables extras comentadas

Si deseas, puedo generar un diff de los `.env.example` previos vs actuales o incluir más variables comentadas según prefieras.
