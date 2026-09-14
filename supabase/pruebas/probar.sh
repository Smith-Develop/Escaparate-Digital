#!/usr/bin/env bash
# Aplica las migraciones sobre un PostgreSQL desechable y comprueba las
# políticas con dos usuarios. No toca ningún Supabase real.
#
#   ./supabase/pruebas/probar.sh
#
# Necesita Docker en marcha. `auth` y `storage` se remedan en remedo.sql,
# porque en un Postgres pelado no existen.
set -euo pipefail
cd "$(dirname "$0")/../.."
NOMBRE=escaparate-pg-prueba

limpiar() { docker rm -f "$NOMBRE" >/dev/null 2>&1 || true; }
trap limpiar EXIT
limpiar

docker run -d --rm --name "$NOMBRE" -e POSTGRES_PASSWORD=x postgres:16 >/dev/null
for _ in $(seq 1 60); do docker exec "$NOMBRE" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done

for f in supabase/pruebas/remedo.sql supabase/migrations/*.sql supabase/pruebas/permisos.sql; do
  docker cp "$f" "$NOMBRE:/tmp/$(basename "$f")" >/dev/null
  docker exec "$NOMBRE" psql -U postgres -q -v ON_ERROR_STOP=1 -f "/tmp/$(basename "$f")"
  echo "aplicado: $f"
done

docker cp supabase/pruebas/politicas.sql "$NOMBRE:/tmp/" >/dev/null
docker exec "$NOMBRE" psql -U postgres -f /tmp/politicas.sql 2>&1 |
  grep -v '^SET$\|^DO$\|^INSERT\|^RESET$\|^t$\|Output format\|^$'
