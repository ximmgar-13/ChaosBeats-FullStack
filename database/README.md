# Base de datos — AdminChaosBeatsapp

## Esquema

- **profiles** — vinculada a `auth.users` de Supabase, con roles `owner`, `admin`, `user`
- **songs** — canciones subidas por `admin`/`owner`, con `created_by` → `profiles.id`

## Cómo aplicar la migración

### Opción 1: Supabase Studio (SQL Editor)

1. Abre el SQL Editor en [app.supabase.com](https://app.supabase.com)
2. Copia el contenido de `supabase/migrations/00001_initial_schema.sql`
3. Pega y ejecuta

### Opción 2: Supabase CLI

```bash
supabase link --project-ref <ref>
supabase db push
```

## Al registrarse

El trigger `on_auth_user_created` inserta automáticamente el perfil.  
Envía en el sign-up estas metadata:

```json
{
  "matricula": "ID_INSTITUCIONAL",
  "rol": "user"
}
```

Solo el `owner` puede asignar `rol = 'admin'` posteriormente.

## Políticas RLS (resumen)

| Tabla     | Acción   | ¿Quién puede?            |
|-----------|----------|--------------------------|
| profiles  | SELECT   | Todos (c/u su perfil)    |
| profiles  | SELECT   | Admin/owner: todos       |
| profiles  | INSERT   | Solo owner/admin         |
| profiles  | UPDATE   | Owner todo; admin no a owner |
| songs     | SELECT   | Todos autenticados       |
| songs     | INSERT   | Solo admin/owner         |
| songs     | UPDATE   | Solo admin/owner         |
| songs     | DELETE   | Solo admin/owner         |
