# Conexión a GitHub — Chaos Beats App
## Web + Móvil + Supabase Backend

---

## 1. Estructura del proyecto (monorepo)

Crea un solo repositorio en GitHub que contenga **todo**:

```
chaos-beats/
├── web/                          # App web (Vite + React)
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.ts       # Cliente Supabase
│   │   ├── hooks/
│   │   ├── components/
│   │   └── ...
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── mobile/                       # App móvil (Expo + React Native)
│   ├── app/
│   ├── components/
│   ├── supabase/
│   └── package.json
│
├── supabase/                     # Backend compartido
│   ├── migrations/
│   │   └── 00001_initial_schema.sql
│   ├── functions/
│   │   ├── _shared/cors.ts
│   │   ├── search-songs/index.ts
│   │   ├── check-offline-access/index.ts
│   │   ├── app-version-check/index.ts
│   │   └── push-notification/index.ts
│   ├── seed/
│   │   └── seed.sql
│   └── config.toml
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # CI: lint + pruebas
│       └── deploy.yml           # CD: deploy DB + functions + web + mobile
│
├── postman/
│   └── ChaosBeats.postman_collection.json
│
├── .env.example
├── eas.json
└── README.md
```

> **Nota:** Actualmente tu web está en `AdminChaosBeatsapp-main (2)` y el móvil en `ChaosBeatsappmovil-main`. Te sugiero mover ambas carpetas a este monorepo.

---

## 2. Crear el repositorio en GitHub

```bash
# 1. Crear un nuevo repo en https://github.com/new
#    Dale un nombre como "chaos-beats" (público o privado)

# 2. En tu terminal (desde la carpeta raíz del proyecto):
git init
git add .
git commit -m "feat: initial commit — full stack chaos beats app"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/chaos-beats.git
git push -u origin main
```

---

## 3. Crear proyecto en Supabase

1. Ve a [app.supabase.com](https://app.supabase.com) e inicia sesión
2. Clic en **New Project**
   - **Name:** `chaos-beats`
   - **Database Password:** guárdala (no la pierdas)
   - **Region:** elige la más cercana a tus usuarios
   - **Pricing Plan:** **Pro** (necesario para 50MB de audio)
3. Espera ~2 minutos a que se cree

---

## 4. Obtener credenciales de Supabase

En el Dashboard de Supabase → **Project Settings** → **API**:

| Variable | Dónde usarla |
|----------|-------------|
| `Project URL` → `https://xxxxx.supabase.co` | `.env` del frontend |
| `Anon Key` → `eyJhbGciOiJ...` | `.env` del frontend |
| `Service Role Key` → `eyJhbGciOiJ...` | ⚠️ SOLO en Edge Functions |
| `Project Ref` → `xxxxx` | GitHub Actions + CLI |

---

## 5. Configurar autenticación

### Email + Password (ya viene por defecto)
1. Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Habilita **Confirm email** (opcional pero recomendado)

### Google OAuth
1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto → **APIs & Services** → **Credentials**
3. Crea **OAuth 2.0 Client ID** (tipo: Web application)
4. Agrega redirect URI:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
5. Copia **Client ID** y **Client Secret**
6. En Supabase: **Authentication** → **Providers** → **Google**
7. Pega las credenciales y guarda

---

## 6. Ejecutar migración (crear todas las tablas)

### Opción A: SQL Editor (más fácil)
1. Supabase Dashboard → **SQL Editor**
2. Abre `supabase/migrations/00001_initial_schema.sql`
3. Copia TODO el contenido
4. Pégalo en el editor y clic en **Run** (o Ctrl+Enter)

### Opción B: Supabase CLI
```bash
# Instalar Supabase CLI
npm install -g supabase

# Generar token en: supabase.com → Account → Access Tokens
supabase login

# Vincular proyecto
supabase link --project-ref xxxxxxxxxxxx

# Ejecutar migración
supabase db push
```

---

## 7. Crear el primer usuario OWNER

1. Ve a **Authentication** → **Users** → **Add User**
2. Ingresa email y contraseña del owner
3. Una vez creado, ve a **SQL Editor** y ejecuta:
   ```sql
   update public.profiles
   set rol = 'owner', matricula = 'OWNER-001'
   where id = (select id from auth.users where email = 'owner@tudominio.com');
   ```

---

## 8. Configurar Storage (archivos de audio)

La migración ya crea los buckets `audio`, `covers` y `avatars`.  
Para verificar: **Storage** → **Buckets** en Supabase Dashboard.

> ⚠️ El bucket `audio` es **privado** — solo usuarios autenticados pueden descargar.

---

## 9. Desplegar Edge Functions

```bash
# Desplegar cada función
supabase functions deploy search-songs --project-ref xxxxxxxxxxxx
supabase functions deploy check-offline-access --project-ref xxxxxxxxxxxx
supabase functions deploy app-version-check --project-ref xxxxxxxxxxxx
supabase functions deploy push-notification --project-ref xxxxxxxxxxxx

# Verificar
supabase functions list --project-ref xxxxxxxxxxxx
```

Las funciones quedarán disponibles en:
```
https://xxxxxxxxxxxx.supabase.co/functions/v1/search-songs
https://xxxxxxxxxxxx.supabase.co/functions/v1/check-offline-access
https://xxxxxxxxxxxx.supabase.co/functions/v1/app-version-check
https://xxxxxxxxxxxx.supabase.co/functions/v1/push-notification
```

---

## 10. Configurar el Frontend Web

Crea un archivo `.env` en la raíz de la web app:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

> El archivo `src/lib/supabase.ts` ya está creado y listo para usar.

---

## 11. Configurar GitHub Actions (CI/CD)

### Secrets para GitHub
En tu repositorio de GitHub → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Valor |
|--------|-------|
| `SUPABASE_ACCESS_TOKEN` | Token de tu cuenta Supabase |
| `EXPO_TOKEN` | Token de tu cuenta Expo |
| `VERCEL_TOKEN` | (si usas Vercel) |

### Variables
| Variable | Valor |
|----------|-------|
| `SUPABASE_PROJECT_REF` | `xxxxxxxxxxxx` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` |

---

## 12. Probar con Postman

1. Abre Postman → **File** → **Import**
2. Selecciona `postman/ChaosBeats.postman_collection.json`
3. Configura variables de entorno en Postman:
   - `supabase_url` — `https://xxxxx.supabase.co`
   - `anon_key` — tu Anon Key
   - `auth_token` — obtenlo haciendo login:
     ```bash
     curl -X POST https://xxxxx.supabase.co/auth/v1/token?grant_type=password \
       -H "apikey: TU_ANON_KEY" \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com","password":"test123456"}'
     ```

---

## 13. Resumen de tablas creadas

| Tabla | Propósito |
|-------|-----------|
| `profiles` | Usuarios con rol (owner/admin/user) + matrícula |
| `songs` | Canciones/beats |
| `playlists` | Listas de reproducción |
| `playlist_songs` | Relación playlist ↔ canción |
| `favorites` | Favoritos del usuario |
| `donations` | Donaciones entre usuarios |
| `early_listeners` | Early adopters / badges |
| `comments` | Comentarios en canciones |
| `subscriptions` | Membresías (free, premium, etc.) |
| `listen_history` | Historial de reproducciones |
| `notifications` | Notificaciones push |
| `user_settings` | Preferencias del usuario |
| `app_versions` | Control de versiones de la app |
| `offline_tokens` | Tokens para acceso offline |
| `user_push_tokens` | Push tokens (Expo/APNs/FCM) |

---

## 14. Tabla de roles y permisos

| Recurso | Owner | Admin | User |
|---------|:-----:|:-----:|:----:|
| Ver perfil propio | ✅ | ✅ | ✅ |
| Ver todos los perfiles | ✅ | ✅ | ❌ |
| Crear usuarios | ✅ | ✅ | ❌ |
| Editar usuarios (excepto owner) | ✅ | ✅ | ❌ |
| Cambiar rol a owner | ✅ | ❌ | ❌ |
| Subir canciones | ✅ | ✅ | ❌ |
| Editar/eliminar canciones | ✅ | ✅ | ❌ |
| Escuchar canciones | ✅ | ✅ | ✅ |
| Crear playlists | ✅ | ✅ | ✅ |
| Comentar | ✅ | ✅ | ✅ |
| Donar | ✅ | ✅ | ✅ |
| Ver donaciones | ✅ | ✅ | propias |
| Gestionar versiones app | ✅ | ✅ | ❌ |

---

## 15. ¿Qué sigue?

- [ ] Instalar dependencias: `npm install` en web y mobile
- [ ] Crear `.env` con credenciales reales de Supabase
- [ ] Registrar al owner en Supabase Auth
- [ ] Probar Edge Functions con Postman
- [ ] Configurar GitHub Actions secrets
- [ ] Hacer push a `main` para que se dispare el CI/CD
- [ ] Para builds móviles: `eas build --platform all`
