# 🔐 GUÍA DE INTEGRACIÓN AUTHGEAR - PASO A PASO

**Fecha:** 25 de Diciembre 2025  
**Estado:** 🟢 IMPLEMENTACIÓN LISTA

---

## 📋 CAMBIOS REALIZADOS

### ✅ Archivos creados

```
backend/
├── src/
│   ├── services/auth/
│   │   └── authgearService.ts          ← NUEVO: Servicio Authgear
│   ├── routes/webhooks/
│   │   └── authgear.webhook.ts         ← NUEVO: Webhook handler
│   └── utils/
│       └── authgear.utils.ts           ← NUEVO: Helpers de tokens
├── .env.example                        ← NUEVO: Ejemplo de configuración
└── AUTHGEAR_SETUP.md                   ← ESTE ARCHIVO
```

### ✅ Archivos modificados

```
backend/
├── src/
│   ├── config/environment.ts           ← ACTUALIZADO: Config Authgear
│   ├── middleware/auth.middleware.ts   ← MEJORADO: Con AuthgearService
│   └── main.ts                         ← ACTUALIZADO: Webhooks y errores
├── package.json                        ← ACTUALIZADO: Nuevas dependencias
```

---

## 🚀 INSTALACIÓN Y SETUP (5 minutos)

### Paso 1: Instalar dependencias

```bash
cd backend

# Opción A: npm
npm install

# Opción B: bun
bun install
```

**Se instalarán automáticamente:**
- `@authgear/core@^1.4.0` - SDK de Authgear
- `jwks-rsa@^2.1.5` - Validación de JWTs con JWKS
- Dependencias existentes se mantienen

### Paso 2: Configurar variables de entorno

```bash
# Copiar template
cp .env.example .env

# Editar .env
nano .env  # o tu editor favorito
```

**Actualizar SOLO estas variables:**

```bash
# CRITICAL - Sin esto NO funcionará
AUTHGEAR_ENDPOINT=http://localhost:9000
AUTHGEAR_CLIENT_ID=your_client_id         # ← Del admin panel
AUTHGEAR_CLIENT_SECRET=your_client_secret # ← Del admin panel
AUTHGEAR_API_KEY=your_api_key             # ← Del admin panel
AUTHGEAR_WEBHOOK_SECRET=tu_webhook_secret # ← Generar (32+ chars)
```

**Variables opcionales (defaults):**

```bash
# Ya tienen valores por defecto, solo cambiar si es necesario
TOKEN_CACHE_TTL=3600000       # Cache 1 hora (3600000 ms)
LOG_LEVEL=debug               # debug/info/warn/error
```

### Paso 3: Compilar

```bash
npm run build
# o
bun run build
```

Deberías ver:
```
✓ Compilación exitosa
TotalSize: ...
Build time: ...ms
```

### Paso 4: Iniciar servidor

```bash
npm run dev
# o
bun run dev
```

Deberías ver:
```
============================================================
🎯 Backend escuchando en puerto 3000
🌐 Ambiente: development
🔗 URL base: http://localhost:3000
📋 API v1: http://localhost:3000/api/v1
💚 Health: http://localhost:3000/health
🔐 Autenticación: Authgear (JWKS + Sincronización)
📨 Webhooks: http://localhost:3000/webhooks/authgear
============================================================
```

---

## 🧪 TESTING - VERIFICAR QUE FUNCIONA

### Test 1: Health check (sin autenticación)

```bash
curl http://localhost:3000/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2025-12-25T18:00:00.000Z"}
```

### Test 2: API info

```bash
curl http://localhost:3000/api/v1

# Respuesta esperada:
# {
#   "name": "Evaluación Automática de Programación API",
#   "version": "1.0.0",
#   "endpoints": {...},
#   "webhooks": "/webhooks"
# }
```

### Test 3: Ruta protegida SIN token (debe fallar)

```bash
curl http://localhost:3000/api/v1/me

# Respuesta esperada (401):
# {
#   "success": false,
#   "error": {
#     "code": "AUTHENTICATION_ERROR",
#     "message": "Token no proporcionado"
#   },
#   "timestamp": "..."
# }
```

### Test 4: Ruta protegida CON token inválido (debe fallar)

```bash
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3000/api/v1/me

# Respuesta esperada (401):
# {
#   "success": false,
#   "error": {
#     "code": "AUTHENTICATION_ERROR",
#     "message": "Token inválido o expirado"
#   },
#   "timestamp": "..."
# }
```

### Test 5: Ruta protegida CON token VÁLIDO (debe funcionar)

**Antes de este test, necesitas:**

1. Un usuario creado en Authgear
2. Un token JWT generado por Authgear
3. El token debe ser válido (no expirado)

```bash
# Reemplazar YOUR_VALID_TOKEN con un token real
curl -H "Authorization: Bearer YOUR_VALID_TOKEN" \
  http://localhost:3000/api/v1/me

# Respuesta esperada (200):
# {
#   "success": true,
#   "data": {
#     "id": "550e8400-...",
#     "email": "user@example.com",
#     "role": "student"
#   },
#   "timestamp": "..."
# }
```

### Test 6: Webhook health check

```bash
curl http://localhost:3000/webhooks/health

# Respuesta esperada:
# {
#   "status": "ok",
#   "service": "webhooks",
#   "timestamp": "..."
# }
```

---

## 🔧 OBTENER CREDENCIALES DE AUTHGEAR

### Paso 1: Admin Panel

1. Abre: `http://localhost:9000` (o tu instancia de Authgear)
2. Login como admin
3. Ve a: **Applications**

### Paso 2: Crear/Editar aplicación

1. Click en tu aplicación
2. Copiar:
   - **Client ID** → `AUTHGEAR_CLIENT_ID`
   - **Client Secret** → `AUTHGEAR_CLIENT_SECRET`

### Paso 3: API Keys

1. Ve a: **API Keys**
2. Crear una nueva API Key
3. Copiar → `AUTHGEAR_API_KEY`

### Paso 4: Webhook Secret

1. Ve a: **Webhooks**
2. Generar un "Signing Key"
3. Copiar → `AUTHGEAR_WEBHOOK_SECRET`

### Paso 5: JWKS URI

Se calcula automáticamente:
```
{AUTHGEAR_ENDPOINT}/.well-known/openid-configuration/keys
```

**Ejemplo:**
```
http://localhost:9000/.well-known/openid-configuration/keys
```

---

## 🎯 FLUJO DE AUTENTICACIÓN

```
┌─────────────────────────────────────────────────────────┐
│ CLIENTE (Frontend/App)                                  │
└─────────────┬───────────────────────────────────────────┘
              │ 1. Usuario hace login en Authgear
              ↓
┌─────────────────────────────────────────────────────────┐
│ AUTHGEAR                                                │
│ - Valida credenciales                                   │
│ - Retorna JWT firmado con RS256                         │
└─────────────┬───────────────────────────────────────────┘
              │ 2. Cliente obtiene token
              ↓
┌─────────────────────────────────────────────────────────┐
│ CLIENTE                                                 │
│ Authorization: Bearer <token>                           │
└─────────────┬───────────────────────────────────────────┘
              │ 3. Request a endpoint protegido
              ↓
┌─────────────────────────────────────────────────────────┐
│ BACKEND (authMiddleware)                                │
│ 1. Extrae token del header                              │
│ 2. Decodifica sin verificar (obtiene kid del header)    │
│ 3. Obtiene clave pública desde JWKS                     │
│ 4. Verifica firma JWT (RS256)                           │
│ 5. Llama a /oauth/userinfo de Authgear                 │
│ 6. Sincroniza usuario en BD local                       │
│ 7. Retorna datos del usuario                            │
└─────────────┬───────────────────────────────────────────┘
              │ 4. Usuario autenticado
              ↓
┌─────────────────────────────────────────────────────────┐
│ ENDPOINT PROTEGIDO (tu handler)                         │
│ req.user = { id, email, role }                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 SINCRONIZACIÓN DE USUARIOS

### Cómo funciona:

1. **Primer login:** Usuario se crea en BD local automáticamente
2. **Logins siguientes:** Usuario se actualiza si cambiaron datos
3. **Webhooks:** Si están configurados, sincronizan cambios en tiempo real

### Campos sincronizados:

```
Authgear              →  BD Local
─────────────────────────────────
sub                  →  authId
email                →  email
first_name           →  firstName
last_name            →  lastName
picture              →  profileImageUrl
email_verified       →  (usado en validación)
custom_attributes    →  role, phone, bio, etc.
```

---

## 📊 ESTRUCTURA DE ARCHIVOS

### AuthgearService (`src/services/auth/authgearService.ts`)

```typescript
class AuthgearService {
  // Validar token contra JWKS + sincronizar usuario
  async verifyToken(token: string): Promise<AuthUser>
  
  // Validar firma de webhook
  validateWebhookSignature(payload: string, signature: string): boolean
  
  // Limpiar cache de token
  invalidateTokenCache(token: string): void
}
```

### Middleware Auth (`src/middleware/auth.middleware.ts`)

```typescript
// Valida token + sincroniza usuario
export async function authMiddleware(req, res, next)

// Verifica roles del usuario
export function roleCheckMiddleware(allowedRoles)

// Maneja errores globales
export function errorHandlerMiddleware(error, req, res, next)

// Loguea requests
export function requestLoggerMiddleware(req, res, next)

// Invalida token en logout
export function logoutMiddleware(req, res, next)
```

### Webhooks (`src/routes/webhooks/authgear.webhook.ts`)

```typescript
// Recibe eventos de Authgear
POST /webhooks/authgear
Headers:
  X-Authgear-Signature: HMAC-SHA256

Eventos soportados:
  - user.created
  - user.updated
  - user.disabled
  - user.deleted
```

### Utils (`src/utils/authgear.utils.ts`)

```typescript
// Decodificar token
decodeToken(token: string)

// Comprobar si expiró
isTokenExpired(token: string)

// Obtener tiempo hasta expiración
getTokenTimeToExpire(token: string)

// Extraer email
getTokenEmail(token: string)

// Extraer ID de usuario
getTokenSubject(token: string)

// Y más helpers...
```

---

## ⚙️ CONFIGURACIÓN RECOMENDADA

### Producción

```bash
# .env
NODE_ENV=production
AUTHGEAR_ENDPOINT=https://tu-authgear.ejemplo.com
CORS_ORIGIN=https://tu-frontend.ejemplo.com
LOG_LEVEL=warn
TOKEN_CACHE_TTL=1800000  # 30 minutos
```

### Desarrollo

```bash
# .env
NODE_ENV=development
AUTHGEAR_ENDPOINT=http://localhost:9000
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=debug
TOKEN_CACHE_TTL=3600000  # 1 hora
```

### Testing

```bash
# .env
NODE_ENV=test
AUTHGEAR_ENDPOINT=http://localhost:9000
LOG_LEVEL=error
TOKEN_CACHE_TTL=60000  # 1 minuto
```

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module '@authgear/core'"

```bash
# Solución
npm install
npm run build
```

### Error: "JWKS fetch failed"

```
Verifica que:
1. AUTHGEAR_ENDPOINT es correcto
2. Authgear está levantado (http://localhost:9000)
3. La ruta JWKS es accesible
```

### Error: "Token inválido"

```
Verifica que:
1. El token es de Authgear (no generado localmente)
2. El token no ha expirado
3. CLIENT_ID coincide con el del token
```

### Error: "Firma de webhook inválida"

```
Verifica que:
1. AUTHGEAR_WEBHOOK_SECRET coincide con Authgear
2. El payload no fue modificado
3. La firma se valida antes de procesar
```

### Error: "Usuario no sincronizado"

```
Verifica que:
1. El método getUserByAuthId existe en userService
2. Los custom_attributes de Authgear se envían
3. El webhook está configurado
```

---

## ✅ CHECKLIST FINAL

- [ ] Dependencias instaladas (`npm install`)
- [ ] `.env` configurado con credenciales Authgear
- [ ] Backend compila sin errores (`npm run build`)
- [ ] Backend inicia sin errores (`npm run dev`)
- [ ] Health check responde (GET `/health`)
- [ ] Test token inválido retorna 401
- [ ] Test token válido retorna usuario
- [ ] Webhook health check funciona
- [ ] Logs muestran "AuthgearService inicializado"
- [ ] CORS configurado correctamente

---

## 📞 SIGUIENTE PASO

Una vez verificado TODO:

1. **Prueba con tu frontend** - Conecta tu app Preact/Astro
2. **Configura webhooks en Authgear** - Opcional pero recomendado
3. **Implementa logout** - Usar `logoutMiddleware`
4. **Testing exhaustivo** - Token refresh, expiración, etc.

---

**¡Authgear integrado correctamente!** 🎉
