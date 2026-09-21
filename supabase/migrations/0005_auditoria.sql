-- Escaparate · rastro de lo que hace el panel de administración
--
-- El panel puede cambiarle el correo a alguien, ponerle una contraseña nueva o
-- suspenderle la cuenta. Son cosas que el usuario nota y no ha pedido, así que
-- tiene que quedar escrito quién las hizo y cuándo: sin esto, la única prueba
-- de que un correo cambió sería la memoria de quien lo cambió.
--
-- La tabla no se parece a las demás del esquema en una cosa importante: **no
-- tiene dueño**. Sus filas no son de ningún usuario de la app, sino del
-- administrador, de modo que aquí no hay política que valga. Se queda con la
-- seguridad por filas activada y sin ninguna política, y además sin permisos
-- para `anon` ni `authenticated`: solo entra el rol de servicio, que es quien
-- la escribe desde `servicio-admin/`.
--
-- Nunca se guarda aquí una contraseña ni un testigo. En `detalle` va lo mínimo
-- para poder reconstruir qué pasó —el correo anterior, la duración de una
-- suspensión, la ruta de una foto borrada—, y nada más.

create table if not exists app_escaparate.admin_auditoria (
    "id"             text primary key default gen_random_uuid()::text,
    -- Quién lo hizo. No lleva clave ajena contra auth.users a propósito: el día
    -- que se borre esa cuenta, el rastro de lo que hizo debe sobrevivir.
    "actor"          uuid not null,
    "actorCorreo"    text not null,
    "accion"         text not null,
    -- A quién afectó, cuando afecta a alguien.
    "objetivo"       uuid,
    "objetivoCorreo" text,
    "detalle"        jsonb not null default '{}'::jsonb,
    "ip"             text,
    "createdAt"      timestamptz not null default now()
);

create index if not exists "admin_auditoria_createdAt_idx"
    on app_escaparate.admin_auditoria ("createdAt" desc);
create index if not exists "admin_auditoria_objetivo_idx"
    on app_escaparate.admin_auditoria ("objetivo");

alter table app_escaparate.admin_auditoria enable row level security;

-- Sin políticas y sin permisos: para la app, esta tabla no existe.
revoke all on app_escaparate.admin_auditoria from anon, authenticated;
grant all on app_escaparate.admin_auditoria to service_role;
