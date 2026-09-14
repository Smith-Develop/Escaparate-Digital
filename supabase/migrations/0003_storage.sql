-- Escaparate · almacén de fotos
--
-- Un solo bucket privado, con una carpeta por usuario. Lleva el nombre de la
-- app por delante porque la instancia es compartida:
--
--     escaparate-fotos/<uid>/<uuid>.png
--
-- Es la misma forma que tenía en disco (`public/uploads/<userId>/<uuid>.png`),
-- así que la migración de las fotos que ya existen es una reescritura de ruta.
--
-- El límite de tamaño y los tipos permitidos dejan de ser código
-- (app/api/upload/route.ts los comprobaba a mano) y pasan a ser plataforma: la
-- comprobación ya no se puede saltar desde un cliente modificado.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'escaparate-fotos',
    'escaparate-fotos',
    false,                                             -- privado: se lee con URL firmada
    8388608,                                           -- 8 MB, como MAX_BYTES
    array['image/png', 'image/jpeg', 'image/webp']     -- como EXT_BY_TYPE
)
on conflict (id) do update
    set file_size_limit    = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types,
        public             = excluded.public;

-- Cada cual, dentro de su carpeta. `storage.foldername(name)` devuelve los
-- segmentos de la ruta, así que el primero tiene que ser el identificador de
-- quien pide la operación.
-- El nombre lleva el de la app por delante: las políticas de `storage.objects`
-- son de una sola tabla compartida por todos los buckets de la instancia, así
-- que dos apps no pueden llamar igual a las suyas.
create policy "escaparate: carpeta propia" on storage.objects
    for all to authenticated
    using (
        bucket_id = 'escaparate-fotos'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
        bucket_id = 'escaparate-fotos'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );
