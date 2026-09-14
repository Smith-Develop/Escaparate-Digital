-- Comprueba que las políticas hacen lo que dicen, con dos usuarios de verdad.
-- Cada línea imprime lo que ha pasado; no hay aserciones automáticas porque lo
-- que importa aquí es leer con los ojos que un usuario NO ve lo del otro.
\set ON_ERROR_STOP off
\pset tuples_only on
\pset format unaligned

-- Ana y Bruno se registran en Escaparate; Carla, en otra app de la misma
-- instancia de Supabase.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@ejemplo.com',   '{"name":"Ana","app":"escaparate"}'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@ejemplo.com', '{"name":"Bruno","app":"escaparate"}'),
  ('33333333-3333-3333-3333-333333333333', 'carla@ejemplo.com', '{"name":"Carla","app":"otra-app"}');

\echo ''
\echo '1· al registrarse se crean perfil y medidas'
select '   ' || (select count(*) from app_escaparate.profiles) || ' perfiles · '
    || (select count(*) from app_escaparate."Avatar") || ' avatares · Ana se llama '
    || (select name from app_escaparate.profiles where id = '11111111-1111-1111-1111-111111111111');

\echo '1b· quien se registra en otra app de esta instancia NO recibe armario'
select '   Carla tiene ' || (select count(*) from app_escaparate.profiles
                             where id = '33333333-3333-3333-3333-333333333333') || ' perfiles aquí';

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false) is not null;

\echo '2· Ana crea una prenda sin dar identificador'
insert into app_escaparate."Item" ("userId","name","imageUrl","category","subcategory","color","season","occasion","purchasedAt")
values ('11111111-1111-1111-1111-111111111111','Camiseta de Ana','11111111-1111-1111-1111-111111111111/a.png',
        'superior','Camiseta','blanco','verano','casual','2026-03-14')
returning '   id generado por la base: ' || left("id", 8) || '…';

\echo '3· Ana guarda un look en dos pasos, como hará la app'
do $$
declare mi_look text; mi_prenda text;
begin
  insert into app_escaparate."Look" ("userId","name") values ('11111111-1111-1111-1111-111111111111','Domingo') returning id into mi_look;
  select "id" into mi_prenda from app_escaparate."Item" limit 1;
  insert into app_escaparate."LookItem" ("lookId","itemId","position") values (mi_look, mi_prenda, 0);
  raise notice '   guardado';
exception when others then raise warning '   FALLA: % (%)', sqlerrm, sqlstate;
end $$;

\echo '4· en UNA sola sentencia con CTE debe fallar (por eso van dos)'
do $$ begin
  with l as (insert into app_escaparate."Look" ("userId","name")
             values ('11111111-1111-1111-1111-111111111111','De golpe') returning id)
  insert into app_escaparate."LookItem" ("lookId","itemId") select l.id, i."id" from l, app_escaparate."Item" i limit 1;
  raise warning '   pasó: revisa la política, no debería';
exception when insufficient_privilege then raise notice '   rechazado, como se espera';
end $$;

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false) is not null;

\echo '5· Bruno no ve nada de Ana'
select '   ' || (select count(*) from app_escaparate."Item") || ' prendas · '
    || (select count(*) from app_escaparate."Look") || ' looks · '
    || (select count(*) from app_escaparate."LookItem") || ' prendas en looks · '
    || (select count(*) from app_escaparate.profiles) || ' perfiles (el suyo)';

\echo '6· Bruno no puede crear nada a nombre de Ana'
do $$ begin
  insert into app_escaparate."Item" ("userId","name","imageUrl","category","subcategory","color","season","occasion")
  values ('11111111-1111-1111-1111-111111111111','Robada','x/y.png','superior','Camiseta','negro','verano','casual');
  raise warning '   FALLO DE SEGURIDAD: le ha dejado';
exception when insufficient_privilege then raise notice '   rechazado, correcto';
end $$;

\echo '7· Bruno no puede meter una prenda de Ana en un look suyo'
do $$
declare mi_look text;
begin
  insert into app_escaparate."Look" ("userId","name") values ('22222222-2222-2222-2222-222222222222','Look de Bruno') returning id into mi_look;
  insert into app_escaparate."LookItem" ("lookId","itemId")
  values (mi_look, (select "id" from app_escaparate."Item" limit 1));
  raise warning '   FALLO DE SEGURIDAD: le ha dejado';
exception
  when insufficient_privilege then raise notice '   rechazado por la política, correcto';
  when not_null_violation   then raise notice '   rechazado (ni siquiera ve el id), correcto';
end $$;

\echo '8· una categoría inventada la para el CHECK'
do $$ begin
  insert into app_escaparate."Item" ("userId","name","imageUrl","category","subcategory","color","season","occasion")
  values ('22222222-2222-2222-2222-222222222222','Rara','22222222-2222-2222-2222-222222222222/r.png',
          'sombrero','Gorra','negro','verano','casual');
  raise warning '   FALLO: ha aceptado una categoría inventada';
exception when check_violation then raise notice '   rechazado por CHECK, correcto';
end $$;

reset role;
\echo '9· las fechas viajan con zona horaria (si no, retroceden un día al oeste de Greenwich)'
select '   purchasedAt = ' || to_json("purchasedAt")::text from app_escaparate."Item" where "name" = 'Camiseta de Ana';

\echo '10· updatedAt se mueve solo al editar'
do $$
declare antes timestamptz; despues timestamptz;
begin
  select "updatedAt" into antes from app_escaparate."Item" limit 1;
  perform pg_sleep(0.05);
  update app_escaparate."Item" set "name" = "name";
  select "updatedAt" into despues from app_escaparate."Item" limit 1;
  raise notice '   %', case when despues > antes then 'sí' else 'NO — revisa el disparador' end;
end $$;
\echo ''
