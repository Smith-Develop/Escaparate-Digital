-- Remedo mínimo de lo que Supabase trae de fábrica, para poder validar las
-- migraciones en un Postgres pelado.
create schema if not exists auth;
create schema if not exists storage;

create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    raw_user_meta_data jsonb default '{}'::jsonb
);

-- auth.uid() lee el identificador del JWT; aquí lo tomamos de una variable de
-- sesión, que es justo como lo hace Supabase por debajo.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
);

create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null,
    owner uuid
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$
  select string_to_array(name, '/')
$$;

-- Los roles con los que PostgREST atiende las peticiones.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;
grant usage on schema auth, storage to authenticated, service_role;
