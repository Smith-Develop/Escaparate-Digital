# Escaparate · imagen para Coolify
#
# La app es un sitio estático: no hay servidor de Node en producción, solo
# ficheros. Por eso la imagen final es un nginx con `out/` dentro y pesa unas
# decenas de megas en vez de arrastrar node_modules.
#
# Las variables NEXT_PUBLIC_* se resuelven al COMPILAR, no al arrancar: hay que
# declararlas en Coolify como «Build Variable», o la app saldrá sin saber a qué
# Supabase hablar.

FROM node:24-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_SCHEMA=public
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SUPABASE_SCHEMA=$NEXT_PUBLIC_SUPABASE_SCHEMA

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
