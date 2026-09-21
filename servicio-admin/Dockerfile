# servicio-admin · imagen para Coolify
#
# No hay nada que compilar: el servicio son seis ficheros de JavaScript y una
# única dependencia (nodemailer, que no tiene ninguna propia), así que la imagen
# es el Node oficial con ellos dentro. Pesa lo que pesa Node y poco más.
#
# Al contrario que la app, aquí las variables son de EJECUCIÓN, no de
# compilación: la clave de servicio nunca se hornea en la imagen. Si la imagen
# acabara en un registro público, no llevaría ningún secreto.
FROM node:24-alpine

WORKDIR /app

# Una sola dependencia —nodemailer, que a su vez no tiene ninguna— y se instala
# antes de copiar el código para que Docker reaproveche la capa mientras no
# cambie. `--omit=dev` y `npm ci` para que la imagen lleve exactamente lo que
# dice el candado y nada más.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.mjs sesion.mjs supabase.mjs datos.mjs ajustes.mjs correo.mjs ./

ENV NODE_ENV=production PORT=3000
EXPOSE 3000

# Sin sesión, y no dice nada de nadie: solo que el proceso está vivo.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:3000/salud || exit 1

# Node como PID 1 con --init para que las señales de parada lleguen.
USER node
CMD ["node", "index.mjs"]
