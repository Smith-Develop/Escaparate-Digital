-- Escaparate · cerrar la puerta al rol anónimo
--
-- Hallazgo al revisar la instalación: Supabase concede de oficio permisos
-- completos a `anon`, `authenticated` y `service_role` sobre los esquemas que
-- se crean, mediante permisos por defecto de `supabase_admin`. O sea que
-- nuestras tablas nacieron accesibles para el rol anónimo aunque 0001 solo se
-- los diera a `authenticated`.
--
-- Hoy no se escapa ni un dato —la seguridad por filas está activa y todas las
-- políticas son `to authenticated`, así que sin sesión no casa ninguna y la
-- respuesta viene vacía—, pero eso deja la protección colgando de una sola
-- cuerda. Si algún día alguien añade una tabla aquí y se olvida de activar RLS,
-- quedaría abierta a cualquiera con la clave anónima, que va dentro de la app y
-- por tanto la tiene todo el mundo.
--
-- Con esto, sin sesión ni siquiera se llega a la tabla: PostgREST responde
-- «permission denied», que además es un mensaje mucho más claro al depurar.
--
-- No afecta a la autenticación: el registro y el acceso van por GoTrue, no por
-- PostgREST.

revoke all on all tables in schema app_escaparate from anon;
revoke usage on schema app_escaparate from anon;

-- Y que las tablas que se creen mañana tampoco nazcan abiertas.
alter default privileges in schema app_escaparate revoke all on tables from anon;
