-- Escaparate · esquema inicial
--
-- Todo vive en el esquema `app_escaparate`, no en `public`, porque este
-- Supabase lo comparten varias aplicaciones. Eso obliga a cuidar tres cosas que
-- en una instancia dedicada salen gratis:
--
--   · Los permisos. Supabase concede los suyos sobre `public` de fábrica; sobre
--     un esquema nuevo hay que darlos a mano o PostgREST responde «permission
--     denied» antes siquiera de mirar las políticas.
--   · El nombre del disparador de alta de usuario. `on_auth_user_created` es el
--     nombre que usa todo el mundo, así que otra de tus apps puede tenerlo ya
--     cogido: los disparadores de una tabla no pueden repetir nombre.
--   · A quién se le crea perfil. `auth.users` es común a todas las apps de esta
--     instancia; si el disparador no mirase de dónde viene el registro, cada
--     usuario de cualquier otra app acabaría con un armario vacío aquí.
--
-- Generado con
--   npx prisma migrate diff --from-empty --to-schema-datamodel supabase/schema.prisma --script
-- y retocado a mano para: los valores por defecto de los identificadores (los
-- generaba el cliente de Prisma, no la base), la clave ajena contra auth.users,
-- timestamptz en vez de timestamp, y los dos disparadores.
--
-- Probado con ./supabase/pruebas/probar.sh

create extension if not exists pgcrypto;

create schema if not exists app_escaparate;

-- Sin esto, PostgREST no puede ni mirar. `anon` se queda fuera a propósito: sin
-- sesión no hay nada que ver, y así ni se llega a evaluar una política.
grant usage on schema app_escaparate to authenticated, service_role;

-- ── Perfil ─────────────────────────────────────────────────────────────────
-- El correo NO se guarda aquí: vive en auth.users y la sesión ya lo trae al
-- cliente. Así queda estructural lo que antes era solo una nota en el código:
-- cambiar de correo no es editar un campo más del perfil.
create table app_escaparate.profiles (
    "id"        uuid primary key references auth.users (id) on delete cascade,
    "name"      text not null,
    "createdAt" timestamptz not null default now()
);

-- ── Medidas ────────────────────────────────────────────────────────────────
create table app_escaparate."Avatar" (
    "id"         text primary key default gen_random_uuid()::text,
    "userId"     uuid not null unique references auth.users (id) on delete cascade,
    "figure"     text not null default 'neutra',
    "heightCm"   integer not null default 170,
    "weightKg"   integer not null default 68,
    "shoulderCm" integer not null default 42,
    "chestCm"    integer not null default 96,
    "waistCm"    integer not null default 80,
    "hipCm"      integer not null default 98,
    "neckCm"     integer not null default 37,
    "thighCm"    integer not null default 54,
    "bicepCm"    integer not null default 30,
    "inseamCm"   integer not null default 80,
    "armCm"      integer not null default 60,
    "footCm"     integer not null default 26,
    -- Ruta dentro del bucket, no una URL: las firmadas caducan.
    "photoUrl"   text,
    "photoX"     double precision not null default 0.5,
    "photoY"     double precision not null default 0.02,
    "photoW"     double precision not null default 0.86,
    "photoH"     double precision not null default 0,
    "updatedAt"  timestamptz not null default now(),
    constraint "Avatar_figure_check" check ("figure" in ('neutra', 'femenina', 'masculina'))
);

-- ── Prendas ────────────────────────────────────────────────────────────────
create table app_escaparate."Item" (
    "id"            text primary key default gen_random_uuid()::text,
    "userId"        uuid not null references auth.users (id) on delete cascade,
    "name"          text not null,
    -- Rutas dentro del bucket de fotos.
    "imageUrl"      text not null,
    "originalUrl"   text,
    "imageWidth"    integer not null default 0,
    "imageHeight"   integer not null default 0,
    -- Colocación sobre el lienzo del probador, relativa (0 a 1).
    "placeX"        double precision not null default 0.5,
    "placeY"        double precision not null default 0.2,
    "placeW"        double precision not null default 0.6,
    "placeH"        double precision not null default 0,
    "category"      text not null,
    "subcategory"   text not null,
    "color"         text not null,
    "dominantColor" text not null default '#B9B4AC',
    "season"        text not null,
    "occasion"      text not null,
    "brand"         text,
    "notes"         text,
    "size"          text,
    "priceCents"    integer,
    "purchasedAt"   timestamptz,
    "favorite"      boolean not null default false,
    "createdAt"     timestamptz not null default now(),
    "updatedAt"     timestamptz not null default now(),
    -- Sin servidor delante, la validación de la app es ayuda al usuario, no
    -- seguridad. Lo que no puede negociarse se comprueba aquí.
    constraint "Item_category_check" check ("category" in ('superior', 'inferior', 'calzado', 'abrigo', 'accesorio')),
    constraint "Item_price_check"    check ("priceCents" is null or ("priceCents" >= 0 and "priceCents" <= 100000000)),
    constraint "Item_place_check"    check ("placeW" > 0 and "placeW" <= 1.6 and "placeH" >= 0 and "placeH" <= 1.6),
    constraint "Item_name_check"     check (char_length("name") between 1 and 80)
);

create index "Item_userId_idx" on app_escaparate."Item" ("userId");
create index "Item_userId_category_idx" on app_escaparate."Item" ("userId", "category");

-- ── Etiquetas propias ──────────────────────────────────────────────────────
create table app_escaparate."Tag" (
    "id"        text primary key default gen_random_uuid()::text,
    "userId"    uuid not null references auth.users (id) on delete cascade,
    "kind"      text not null,
    -- Cadena vacía salvo en "tipo", donde dice de qué categoría cuelga. Un nulo
    -- no cuenta como repetido y colaría duplicados.
    "parent"    text not null default '',
    "slug"      text not null,
    "label"     text not null,
    "hex"       text,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamptz not null default now(),
    constraint "Tag_kind_check" check ("kind" in ('tipo', 'color', 'temporada', 'ocasion'))
);

create unique index "Tag_userId_kind_parent_slug_key" on app_escaparate."Tag" ("userId", "kind", "parent", "slug");
create index "Tag_userId_kind_idx" on app_escaparate."Tag" ("userId", "kind");

-- ── Conjuntos ──────────────────────────────────────────────────────────────
create table app_escaparate."Look" (
    "id"          text primary key default gen_random_uuid()::text,
    "userId"      uuid not null references auth.users (id) on delete cascade,
    "name"        text not null,
    "notes"       text,
    "occasion"    text,
    "scheduledAt" timestamptz,
    "createdAt"   timestamptz not null default now(),
    "updatedAt"   timestamptz not null default now()
);

create index "Look_userId_idx" on app_escaparate."Look" ("userId");
create index "Look_userId_scheduledAt_idx" on app_escaparate."Look" ("userId", "scheduledAt");

create table app_escaparate."LookItem" (
    "id"       text primary key default gen_random_uuid()::text,
    "lookId"   text not null references app_escaparate."Look" (id) on delete cascade,
    "itemId"   text not null references app_escaparate."Item" (id) on delete cascade,
    -- Orden de apilado: 0 es la prenda del fondo.
    "position" integer not null default 0
);

create unique index "LookItem_lookId_itemId_key" on app_escaparate."LookItem" ("lookId", "itemId");
create index "LookItem_itemId_idx" on app_escaparate."LookItem" ("itemId");

-- ── Permisos ───────────────────────────────────────────────────────────────
-- Quien filtra es la seguridad a nivel de fila (0002); esto solo abre la puerta
-- para que llegue a evaluarse.
grant select, insert, update, delete on all tables in schema app_escaparate to authenticated;
grant all on all tables in schema app_escaparate to service_role;
alter default privileges in schema app_escaparate
    grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema app_escaparate
    grant all on tables to service_role;

-- ── updatedAt ──────────────────────────────────────────────────────────────
-- Prisma lo mantenía desde el cliente. Aquí lo hace la base, que además es la
-- única forma de que sea fiable cuando escriben varios dispositivos.
create or replace function app_escaparate.set_updated_at() returns trigger
language plpgsql as $$
begin
    new."updatedAt" = now();
    return new;
end $$;

create trigger "Avatar_updatedAt" before update on app_escaparate."Avatar"
    for each row execute function app_escaparate.set_updated_at();
create trigger "Item_updatedAt" before update on app_escaparate."Item"
    for each row execute function app_escaparate.set_updated_at();
create trigger "Tag_updatedAt" before update on app_escaparate."Tag"
    for each row execute function app_escaparate.set_updated_at();
create trigger "Look_updatedAt" before update on app_escaparate."Look"
    for each row execute function app_escaparate.set_updated_at();

-- ── Alta de usuario ────────────────────────────────────────────────────────
-- Sustituye a registerAction, que creaba el usuario y sus medidas a la vez.
--
-- `auth.users` es común a todas las aplicaciones de esta instancia, así que se
-- mira la marca que deja el registro de Escaparate (`signUp` la envía en los
-- metadatos). Quien se registre en otra de tus apps no recibe armario aquí.
create or replace function app_escaparate.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if coalesce(new.raw_user_meta_data ->> 'app', '') <> 'escaparate' then
        return new;
    end if;

    insert into app_escaparate.profiles ("id", "name")
        values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Sin nombre'))
        on conflict ("id") do nothing;
    insert into app_escaparate."Avatar" ("userId") values (new.id)
        on conflict ("userId") do nothing;
    return new;
end $$;

-- Nombre con sufijo: otra app de esta instancia puede tener ya el suyo, y dos
-- disparadores de la misma tabla no pueden llamarse igual.
create trigger on_auth_user_created_escaparate after insert on auth.users
    for each row execute function app_escaparate.handle_new_user();
