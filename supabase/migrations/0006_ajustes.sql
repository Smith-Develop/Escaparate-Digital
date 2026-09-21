-- Escaparate · ajustes que se cambian sin volver a desplegar
--
-- Hasta ahora, cambiar el proveedor de correo o el enlace de donación obligaba
-- a entrar en Coolify, tocar variables y redesplegar. Eso convierte un cambio
-- de cinco segundos en una operación de riesgo, y desanima a hacerlo. Desde
-- aquí lo hace el panel.
--
-- Son **dos** tablas y no una, y la diferencia es la que importa:
--
--   · `ajustes` lo lee la app con la clave pública. Ahí solo puede haber cosas
--     que ya se van a enseñar en pantalla —el bloque de apoyo—, porque
--     cualquiera con sesión puede leerlo.
--   · `ajustes_privados` no lo lee nadie más que el rol de servicio. Ahí viven
--     las credenciales del SMTP, que son un secreto de verdad.
--
-- Mezclarlas sería cuestión de tiempo hasta que alguien guardara la contraseña
-- del correo en la fila equivocada.

/* ── Lo que la app puede leer ──────────────────────────────────────────── */

create table if not exists app_escaparate.ajustes (
    "clave"     text primary key,
    "valor"     jsonb not null default '{}'::jsonb,
    "updatedAt" timestamptz not null default now()
);

alter table app_escaparate.ajustes enable row level security;

-- Leer, cualquiera que tenga sesión; escribir, solo el panel con la clave de
-- servicio. Ojo: el esquema concede por defecto insert/update/delete a
-- `authenticated` en cada tabla nueva (0001), así que hay que quitárselos a
-- mano o la app podría reescribir sus propios ajustes.
revoke all on app_escaparate.ajustes from anon, authenticated;
grant select on app_escaparate.ajustes to authenticated;
grant all on app_escaparate.ajustes to service_role;

create policy "leer ajustes" on app_escaparate.ajustes
    for select to authenticated using (true);

-- Valor de partida: el bloque de apoyo, apagado. Así la pantalla del panel
-- llega con el formulario relleno y se entiende qué hace cada campo.
insert into app_escaparate.ajustes ("clave", "valor")
values (
    'apoyo',
    jsonb_build_object(
        'activo', false,
        'titulo', 'Apoyar Escaparate',
        'texto',  'Escaparate no tiene anuncios ni vende tus datos: lo mantengo yo en mi propio servidor. Si te resulta útil, puedes echar una mano.',
        'boton',  'Invitar a un café',
        'enlace', ''
    )
)
on conflict ("clave") do nothing;

/* ── Lo que no sale de aquí ────────────────────────────────────────────── */

create table if not exists app_escaparate.ajustes_privados (
    "clave"     text primary key,
    "valor"     jsonb not null default '{}'::jsonb,
    "updatedAt" timestamptz not null default now()
);

alter table app_escaparate.ajustes_privados enable row level security;

-- Sin políticas y sin permisos: para la app, esta tabla no existe. Igual que
-- la de auditoría.
revoke all on app_escaparate.ajustes_privados from anon, authenticated;
grant all on app_escaparate.ajustes_privados to service_role;

insert into app_escaparate.ajustes_privados ("clave", "valor")
values ('correo', '{}'::jsonb)
on conflict ("clave") do nothing;

/* ── Marca de tiempo ───────────────────────────────────────────────────── */

-- Con `drop if exists` delante para que esta migración se pueda volver a pasar
-- entera sin que falle en la segunda línea.
drop trigger if exists "ajustes_updatedAt" on app_escaparate.ajustes;
create trigger "ajustes_updatedAt" before update on app_escaparate.ajustes
    for each row execute function app_escaparate.set_updated_at();

drop trigger if exists "ajustes_privados_updatedAt" on app_escaparate.ajustes_privados;
create trigger "ajustes_privados_updatedAt" before update on app_escaparate.ajustes_privados
    for each row execute function app_escaparate.set_updated_at();
