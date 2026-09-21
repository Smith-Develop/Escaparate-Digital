# servicio-admin

El detrás del panel de administración de Escaparate. Es la **única** pieza del
proyecto que usa la clave de servicio de Supabase.

## Por qué existe

La app es una exportación estática: no tiene servidor donde esconder un
secreto. Y cambiarle el correo o la contraseña a alguien solo se puede hacer con
la clave de servicio, que se salta la seguridad por filas de **toda** la
instancia —compartida con tu otra aplicación—. Meterla en el navegador sería
repartirla; así que vive aquí, en un proceso propio, y hacia fuera se publican
nueve operaciones cerradas.

No es un proxy: ninguna ruta acepta SQL, ni nombres de tabla, ni rutas libres.

## Cómo decide quién entra

1. Cada petición llega con la sesión de Supabase de quien usa el panel, la misma
   que usa la app.
2. El servicio la verifica **contra GoTrue** (`/auth/v1/user`), no la descifra
   por su cuenta: así no necesita guardar el `JWT_SECRET`.
3. El correo verificado tiene que estar en `ADMIN_CORREOS` y estar confirmado.
4. Los intentos fallidos se cuentan por IP y se contesta cada vez más despacio.

Cada operación que cambia algo deja una fila en `app_escaparate.admin_auditoria`
(quién, qué, a quién, cuándo, desde qué IP). Nunca se registran contraseñas ni
testigos.

## Variables de entorno

Todas de **ejecución**. En Coolify, sin marcar «Build Variable».

| Variable | Para qué |
| --- | --- |
| `SUPABASE_URL` | La API de tu Supabase (la misma que usa la app). |
| `SUPABASE_ANON_KEY` | La clave pública. Con ella se verifica la sesión de quien llama. |
| `SUPABASE_SERVICE_ROLE_KEY` | La clave de servicio. **Solo aquí.** |
| `SUPABASE_SCHEMA` | `app_escaparate`. |
| `ADMIN_CORREOS` | Correos que administran, separados por comas. |
| `ORIGENES_PERMITIDOS` | Direcciones desde las que se acepta el panel, separadas por comas. Sin comodines. |
| `SITIO_URL` | La dirección pública de la app, para que el correo de recuperación vuelva a `/recuperar/`. |
| `PORT` | 3000 por defecto, que es lo que espera Coolify. |
| `HOST` | En el contenedor, `0.0.0.0` (ya lo pone `NODE_ENV=production`). En tu máquina escucha solo en `127.0.0.1`: un proceso con la clave de servicio no debe quedar a la escucha de toda la wifi. |

En tu máquina se reaprovecha el `.env.local` de la app: si no encuentra
`SUPABASE_URL` mira `NEXT_PUBLIC_SUPABASE_URL`, y lo mismo con la clave pública,
el esquema y la dirección del sitio.

## En local

```bash
ADMIN_CORREOS=tu@correo.com \
ORIGENES_PERMITIDOS=http://127.0.0.1:3000 \
PORT=8787 \
node --env-file=../.env.local index.mjs
```

Y la app, apuntando ahí:

```bash
NEXT_PUBLIC_ADMIN_API=http://127.0.0.1:8787 npm run dev
```

## En Coolify

1. Recurso nuevo, del mismo repositorio, con **Dockerfile** `servicio-admin/Dockerfile`
   y contexto de compilación `servicio-admin`.
2. Un dominio propio, por ejemplo `admin-escaparate.tu-dominio`.
3. Las variables de arriba, **de ejecución**. `ORIGENES_PERMITIDOS` es la
   dirección de la app (`https://escaparate.tu-dominio`), sin barra final.
4. En el recurso de **Escaparate**, añadir `NEXT_PUBLIC_ADMIN_API` con la
   dirección de este servicio, marcada como **Build Variable**, y reconstruir:
   sin ella la app no enseña el panel.

Para comprobar que está vivo: `curl https://admin-escaparate.tu-dominio/salud`.

## Las nueve operaciones

| Ruta | Qué hace |
| --- | --- |
| `GET /admin/yo` | Si quien llama administra. Es lo único que contesta «no» sin penalizar. |
| `GET /admin/resumen` | Cifras generales y últimas altas. |
| `GET /admin/usuarios` | Las cuentas de Escaparate, con sus contadores. |
| `GET /admin/usuario?id=` | Ficha, armario y looks de una cuenta, con las fotos firmadas. |
| `POST /admin/correo` | Cambia el correo, ya confirmado. |
| `POST /admin/contrasena` | `temporal` (la genera y la devuelve una vez) o `correo` (manda el de recuperación). |
| `POST /admin/suspension` | 24 h, 7 días, 30 días o levantar. |
| `GET /admin/biblioteca` | Todas las imágenes del almacén, con dueño y si son huérfanas. |
| `DELETE /admin/foto` | Borra una huérfana, comprobando otra vez que no la usa nadie. |

## Lo que este servicio NO hace

No borra cuentas, no edita ni borra prendas ni looks de nadie, y no lee la
tabla de auditoría hacia fuera. Si algún día hace falta, se añade aquí: la
puerta es esta y conviene que siga siendo la única.
