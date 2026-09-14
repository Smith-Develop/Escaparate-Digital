# Datos de la versión con servidor

Aquí está lo que había en la app antes de mover todo a Supabase:

- `uploads-antiguos/<userId>/` — las fotos, tal cual estaban en `public/uploads`.
- `dev.db` — copia de la base SQLite, con las fichas de esas fotos.

**No se borra hasta haber migrado.** La cuenta `prueba@prueba.com` tiene fotos
reales que solo existen aquí: no están en Supabase ni en ningún otro sitio.

Se sube con:

    node --env-file=.env.local scripts/migrar-a-supabase.mjs --correo prueba@prueba.com

Está fuera de `public/` a propósito: ahí dentro, los 6,5 MB de fotos viajaban
dentro del APK y de la web sin que nadie los mirase, porque las fotos ahora se
descargan del almacén de Supabase.
