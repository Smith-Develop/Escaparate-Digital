-- Escaparate · seguridad a nivel de fila
--
-- Esto es lo único que separa el armario de un usuario del de otro. Antes había
-- un servidor que comprobaba la sesión en cada ruta de la API (`requireUser()`
-- en los 15 manejadores) y filtraba por `userId` en cada consulta. Ahora la app
-- habla directamente con la base de datos desde el móvil, así que esa frontera
-- vive aquí y solo aquí.
--
-- Dos detalles que no son adorno:
--
--   · `(select auth.uid())` en vez de `auth.uid()` a secas: entre paréntesis y
--     con select, Postgres lo evalúa una vez por consulta en lugar de una vez
--     por fila. Se nota al recorrer un armario entero.
--   · Todas las políticas son `to authenticated`. El rol anónimo no aparece por
--     ninguna parte, así que sin sesión no se ve absolutamente nada.
--
-- Las tablas viven en el esquema `app_escaparate`, no en `public`: este
-- Supabase lo comparten varias aplicaciones. Los nombres de política solo
-- tienen que ser únicos dentro de su tabla, así que «propias» no choca con
-- nada de las otras apps.

alter table app_escaparate.profiles   enable row level security;
alter table app_escaparate."Avatar"   enable row level security;
alter table app_escaparate."Item"     enable row level security;
alter table app_escaparate."Tag"      enable row level security;
alter table app_escaparate."Look"     enable row level security;
alter table app_escaparate."LookItem" enable row level security;

-- ── Perfil ─────────────────────────────────────────────────────────────────
-- Sin insert: lo crea el disparador handle_new_user con security definer.
create policy "perfil propio" on app_escaparate.profiles
    for select to authenticated using ("id" = (select auth.uid()));

create policy "editar perfil propio" on app_escaparate.profiles
    for update to authenticated
    using ("id" = (select auth.uid()))
    with check ("id" = (select auth.uid()));

-- ── Tablas con dueño directo ───────────────────────────────────────────────
create policy "propias" on app_escaparate."Avatar"
    for all to authenticated
    using ("userId" = (select auth.uid()))
    with check ("userId" = (select auth.uid()));

create policy "propias" on app_escaparate."Item"
    for all to authenticated
    using ("userId" = (select auth.uid()))
    with check ("userId" = (select auth.uid()));

create policy "propias" on app_escaparate."Tag"
    for all to authenticated
    using ("userId" = (select auth.uid()))
    with check ("userId" = (select auth.uid()));

create policy "propias" on app_escaparate."Look"
    for all to authenticated
    using ("userId" = (select auth.uid()))
    with check ("userId" = (select auth.uid()));

-- ── Prendas dentro de un conjunto ──────────────────────────────────────────
-- `LookItem` no tiene dueño propio, así que se pregunta por los dos extremos.
--
-- El segundo `exists` es el que suele olvidarse y el que importa: sin él, quien
-- adivine el identificador de una prenda ajena puede meterla en un conjunto
-- suyo y, al leerlo con `select ... items(*)`, sacar la fila entera de esa
-- prenda. Es justo lo que hacía `ownedItemIds()` en app/api/looks/route.ts.
-- Consecuencia práctica, comprobada: un look y sus prendas hay que guardarlos
-- en DOS sentencias (primero el look, luego las prendas). En una sola, con un
-- CTE que inserte el look y sus prendas a la vez, la política no ve todavía el
-- look recién creado y rechaza la fila. La versión con servidor sí podía
-- hacerlo de golpe porque Prisma escribía en cascada por debajo.
create policy "propias" on app_escaparate."LookItem"
    for all to authenticated
    using (
        exists (select 1 from app_escaparate."Look" l
                 where l."id" = "lookId" and l."userId" = (select auth.uid()))
    )
    with check (
        exists (select 1 from app_escaparate."Look" l
                 where l."id" = "lookId" and l."userId" = (select auth.uid()))
        and
        exists (select 1 from app_escaparate."Item" i
                 where i."id" = "itemId" and i."userId" = (select auth.uid()))
    );
