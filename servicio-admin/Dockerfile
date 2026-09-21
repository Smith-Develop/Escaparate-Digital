# servicio-admin · imagen para Coolify
#
# No hay nada que compilar ni que instalar: el servicio son tres ficheros de
# JavaScript sin dependencias, así que la imagen es el Node oficial con ellos
# dentro. Pesa lo que pesa Node y nada más.
#
# Al contrario que la app, aquí las variables son de EJECUCIÓN, no de
# compilación: la clave de servicio nunca se hornea en la imagen. Si la imagen
# acabara en un registro público, no llevaría ningún secreto.
FROM node:24-alpine

WORKDIR /app
COPY package.json index.mjs sesion.mjs datos.mjs ./

ENV NODE_ENV=production PORT=3000
EXPOSE 3000

# Sin sesión, y no dice nada de nadie: solo que el proceso está vivo.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:3000/salud || exit 1

# Node como PID 1 con --init para que las señales de parada lleguen.
USER node
CMD ["node", "index.mjs"]
