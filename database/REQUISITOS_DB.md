# Requisitos de Base de Datos — AdminChaosBeatsapp

---

## 1. Resumen del Proyecto

Plataforma web tipo "beats app" para una institución educativa. Los usuarios se registran con **correo electrónico**, **contraseña** y **matrícula institucional**. Hay tres roles con distintos niveles de acceso: `owner`, `admin` y `user`. La plataforma permite gestionar canciones (beats) donde los administradores suben contenido y los estudiantes lo reproducen.

---

## 2. Roles y Permisos

| Rol    | Descripción |
|--------|-------------|
| Owner  | Dueño de la plataforma. Acceso total a todo: usuarios, canciones y configuración. |
| Admin  | Personal administrativo de la institución. Gestiona usuarios y canciones. |
| User   | Estudiante o usuario final. Solo ve su perfil y escucha canciones. |

### Matriz de permisos

| Acción                        | Owner | Admin | User |
|-------------------------------|:-----:|:-----:|:----:|
| Ver su propio perfil          |   ✅   |   ✅   |   ✅  |
| Ver perfiles de otros         |   ✅   |   ✅   |   ❌  |
| Crear usuarios                |   ✅   |   ✅   |   ❌  |
| Editar cualquier usuario      |   ✅   |   ✅*  |   ❌  |
| Eliminar usuarios             |   ✅   |   ❌   |   ❌  |
| Cambiar rol de un usuario     |   ✅   |   ❌   |   ❌  |
| Subir canciones               |   ✅   |   ✅   |   ❌  |
| Editar canciones              |   ✅   |   ✅   |   ❌  |
| Eliminar canciones            |   ✅   |   ✅   |   ❌  |
| Escuchar/ver canciones        |   ✅   |   ✅   |   ✅  |

> *El admin puede editar usuarios, pero **no puede** cambiar el rol de alguien a `owner` ni editar al propio `owner`.

---

## 3. Estructura de Tablas

### 3.1 Tabla: `profiles`

Vinculada directamente con `auth.users` de Supabase. Se crea automáticamente al registrarse.

| Columna     | Tipo       | Restricciones                          | Descripción                              |
|-------------|------------|----------------------------------------|------------------------------------------|
| id          | UUID       | PK, FK → auth.users(id), ON DELETE CASCADE | ID del usuario (heredado de auth)    |
| email       | TEXT       | NOT NULL                               | Correo capturado en el registro          |
| matricula   | TEXT       | NOT NULL, **UNIQUE**                   | ID institucional único del estudiante    |
| rol         | TEXT       | NOT NULL, CHECK ('owner','admin','user') | Rol del usuario                        |
| metadata    | JSONB      | NOT NULL, DEFAULT '{}'                 | Datos adicionales (preferencias, etc.)   |
| created_at  | TIMESTAMPTZ | NOT NULL, DEFAULT now()               | Fecha de creación                        |
| updated_at  | TIMESTAMPTZ | NOT NULL, DEFAULT now()               | Fecha de última modificación             |

**Índices:**
- `UNIQUE INDEX` sobre `matricula` — garantiza que no haya matrículas duplicadas.
- `INDEX` sobre `rol` — optimiza consultas por rol.

### 3.2 Tabla: `songs`

Canciones o beats subidos por admin/owner.

| Columna     | Tipo       | Restricciones                          | Descripción                              |
|-------------|------------|----------------------------------------|------------------------------------------|
| id          | UUID       | PK, DEFAULT gen_random_uuid()          | ID único de la canción                   |
| title       | TEXT       | NOT NULL                               | Título de la canción                     |
| artist      | TEXT       | NULLABLE                               | Artista o autor                          |
| file_url    | TEXT       | NOT NULL                               | URL del archivo de audio                 |
| created_by  | UUID       | NOT NULL, FK → profiles(id), ON DELETE CASCADE | Quién subió la canción         |
| metadata    | JSONB      | NOT NULL, DEFAULT '{}'                 | Metadatos (género, duración, etc.)       |
| created_at  | TIMESTAMPTZ | NOT NULL, DEFAULT now()               | Fecha de subida                          |
| updated_at  | TIMESTAMPTZ | NOT NULL, DEFAULT now()               | Fecha de última modificación             |

**Índices:**
- `INDEX` sobre `created_by` — optimiza joins con profiles.

---

## 4. Flujo de Autenticación (Sign-up)

Basado en el diseño de Figma, el formulario de registro captura:

1. **Correo electrónico** → se envía a Supabase Auth (`auth.users.email`)
2. **Contraseña** → la maneja Supabase Auth (hasheada automáticamente)
3. **Matrícula** → se pasa como `raw_user_meta_data.matricula` en el sign-up

### Trigger automático `on_auth_user_created`

apenas se crea un `auth.users`, se dispara un trigger que inserta el perfil en `profiles`:

```sql
INSERT INTO profiles (id, email, matricula, rol)
VALUES (
  NEW.id,
  NEW.email,
  NEW.raw_user_meta_data->>'matricula',   -- viene del formulario
  COALESCE(NEW.raw_user_meta_data->>'rol', 'user')  -- por defecto 'user'
);
```

Esto asegura que **cada usuario registrado tenga siempre su perfil**.

---

## 5. Políticas de Seguridad (RLS)

### 5.1 Función auxiliar

Se crea `get_current_user_role()` que devuelve el rol del usuario autenticado consultando `profiles`. Se usa en todas las políticas RLS.

### 5.2 Políticas para `profiles`

| Política               | Tipo     | ¿Quién?         | ¿Qué permite?                                                     |
|------------------------|----------|-----------------|-------------------------------------------------------------------|
| owner_all_profiles     | ALL      | rol = 'owner'   | Dueño puede hacer lo que quiera sobre cualquier perfil            |
| admin_select_profiles  | SELECT   | rol = 'admin'   | Admin puede ver todos los perfiles                                |
| admin_insert_profiles  | INSERT   | rol = 'admin'   | Admin puede crear nuevos usuarios                                 |
| admin_update_profiles  | UPDATE   | rol = 'admin'   | Admin puede editar perfiles (excepto cambiar a `owner`)          |
| user_select_own_profile| SELECT   | id = auth.uid() | User solo ve su propio perfil                                     |
| user_update_own_profile| UPDATE   | id = auth.uid() | User puede editar su perfil (sin cambiar su rol)                  |

### 5.3 Políticas para `songs`

| Política                     | Tipo   | ¿Quién?                   | ¿Qué permite?                                     |
|------------------------------|--------|---------------------------|---------------------------------------------------|
| authenticated_select_songs   | SELECT | Todos autenticados        | Cualquier usuario logueado puede ver las canciones |
| admin_owner_insert_songs     | INSERT | rol IN ('admin','owner')  | Solo admin y owner pueden subir canciones          |
| admin_owner_update_songs     | UPDATE | rol IN ('admin','owner')  | Solo admin y owner pueden editar canciones         |
| admin_owner_delete_songs     | DELETE | rol IN ('admin','owner')  | Solo admin y owner pueden eliminar canciones       |

---

## 6. Diagrama de Relaciones

```
auth.users (Supabase)
    │
    │  id ──────────────► profiles.id (FK, 1:1)
    │
    ▼
profiles
    │
    │  id  ◄──── songs.created_by (FK, 1:N)
    ▼
songs
```

Cada usuario tiene **un perfil** (1:1 con auth).  
Cada canción pertenece a **un usuario** que la subió (N:1 con profiles).

---

## 7. Puntos a considerar / Dudas abiertas

- **Almacenamiento de archivos de audio:** ¿Los beats se almacenan en Supabase Storage, en un bucket S3, o en otro servicio? La columna `file_url` debe apuntar a donde sea que se alojen.
- **Configuración del owner inicial:** ¿Quién crea el primer usuario con rol `owner`? Debe hacerse manualmente en la base de datos o mediante un seed.
- **Recuperación de contraseña:** ¿Se habilita el flujo de "olvidé mi contraseña" vía Supabase Auth?
- **Metadata de usuario:** ¿Qué datos adicionales podrían necesitarse? (ej. nombre completo, grupo, grado, foto de perfil). Hoy está en JSONB como `metadata` para ser flexible.
- **Metadata de canciones:** ¿Se necesita género musical, duración, BPM, clave, etc.? Todo cabe en el JSONB de `songs.metadata`.

---

## 8. Listo para implementar

El script SQL completo está en:
```
supabase/migrations/00001_initial_schema.sql
```

Pasos para implementar:

1. Crear el proyecto en [app.supabase.com](https://app.supabase.com)
2. Ir a **SQL Editor**
3. Copiar y pegar el contenido de `00001_initial_schema.sql`
4. Ejecutar
5. Crear manualmente el primer usuario `owner` desde Authentication > Users
6. Ejecutar el seed o insertar manualmente su perfil con `rol = 'owner'`
