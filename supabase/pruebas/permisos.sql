-- Lo que Supabase concede de fábrica sobre sus propios esquemas y que en un
-- Postgres pelado hay que dar a mano. Los permisos del esquema app_escaparate
-- NO van aquí: viajan dentro de 0001_init.sql, porque en el Supabase de verdad
-- también hacen falta.
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.buckets to authenticated;
