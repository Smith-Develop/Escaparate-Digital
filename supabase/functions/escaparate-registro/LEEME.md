# Cómo desplegar esta función en un Supabase autoalojado

En Supabase Cloud bastaría `supabase functions deploy`. En una instalación
propia —la tuya, en Coolify— las funciones se sirven desde un directorio montado
en el contenedor `functions`, así que desplegar es dejar el fichero ahí y
reiniciar ese contenedor.

1. **Copia la carpeta al servidor**, dentro del volumen de funciones de tu
   Supabase. En la plantilla de Coolify suele ser algo como
   `…/volumes/functions/`, junto a la función `main` que ya viene:

   ```bash
   scp -r supabase/functions/escaparate-registro \
       tu-servidor:/ruta/a/supabase/volumes/functions/
   ```

2. **Comprueba que el contenedor tiene la clave de servicio.** La función lee
   `SUPABASE_SERVICE_ROLE_KEY`; la plantilla de Coolify ya se la pasa al
   servicio `functions`. Si no estuviera, se añade como variable de ese
   servicio: es la misma clave que usas en local, y aquí sí puede estar, porque
   se queda en el servidor.

3. **Reinicia el contenedor `functions`** desde Coolify.

4. **Comprueba que responde:**

   ```bash
   curl -i -X POST https://TU-SUPABASE/functions/v1/escaparate-registro \
     -H "apikey: TU_CLAVE_ANONIMA" \
     -H "Authorization: Bearer TU_CLAVE_ANONIMA" \
     -H "Content-Type: application/json" \
     -d '{"email":"prueba@ejemplo.com","password":"unaClaveLarga","name":"Prueba"}'
   ```

   Debe devolver `200 {"ok":true}`. Repetirla con el mismo correo debe dar
   `409`. Borra después esa cuenta de prueba desde el Studio.

Mientras la función no esté desplegada **no se rompe nada**: la app lo detecta y
vuelve al registro normal con confirmación por correo.
