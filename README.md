# Escaparate · Armario virtual y probador de conjuntos

Aplicación web *mobile-first* para digitalizar tu ropa y montar conjuntos con las
fotos reales de tus prendas, sin abrir el armario.

## Puesta en marcha

```bash
npm install
npx prisma db push     # crea prisma/dev.db a partir del esquema
npm run seed           # opcional: armario de ejemplo
npm run dev
```

La app queda en <http://localhost:3000>. Con los datos de ejemplo puedes entrar con:

| Correo | Contraseña |
| --- | --- |
| `demo@escaparate.app` | `escaparate` |

### Probar desde el móvil

**La cámara solo funciona en `localhost` o sobre HTTPS**: los navegadores
bloquean `getUserMedia` en orígenes no seguros. Si abres la app por la IP de la
red local (`npm run dev -- -H 0.0.0.0`) todo funciona salvo la captura de fotos,
que cae automáticamente al selector de galería. Para probar la cámara necesitas
un túnel con TLS: los *Dev Tunnels* de VS Code, `ngrok http 3000` o
`cloudflared tunnel --url http://localhost:3000`.

Esos túneles sirven la app en un dominio público pero reenvían la petición al
servidor local reescribiendo la cabecera `Origin` a `localhost:3000`, mientras
que `x-forwarded-host` conserva el dominio del túnel. Next compara las dos para
protegerse de CSRF, no coinciden, y rechaza las Server Actions con
**`Invalid Server Actions request`**, lo que rompe el login y el registro.

`next.config.ts` ya lo contempla para los túneles habituales
(`*.devtunnels.ms`, ngrok, Cloudflare). Si usas otro proveedor, añádelo sin
tocar código:

```bash
ALLOWED_DEV_ORIGINS="mi-tunel.example.com" npm run dev
```

La excepción **solo se aplica en desarrollo**; la build de producción mantiene la
comprobación estricta de origen.

### Variables de entorno

`.env` se crea a partir de `.env.example`:

- `DATABASE_URL` — por defecto `file:./dev.db` (SQLite).
- `AUTH_SECRET` — cámbialo en producción.
- `ALLOWED_DEV_ORIGINS` — opcional, orígenes extra permitidos al desarrollar
  detrás de un túnel (ver más abajo).

## Stack

- **Next.js 16** (App Router, Server Actions) y **React 19**
- **Tailwind CSS v4** + **Framer Motion** para las microinteracciones táctiles
- **Zustand** para los filtros del armario y el conjunto activo
- **Prisma** sobre SQLite en local (PostgreSQL en producción, ver más abajo)
- **@imgly/background-removal** para recortar el fondo de las fotos en el navegador

## Cómo está organizado

```
app/
├── (auth)/              # registro, login y server actions de sesión
├── dashboard/
│   ├── page.tsx         # inicio: estadísticas y accesos rápidos
│   ├── closet/          # escaparate + alta de prendas (cámara → recorte → ficha)
│   ├── studio/          # probador 3D
│   ├── looks/           # lookbook y agenda
│   └── profile/         # medidas del avatar
└── api/                 # items, looks, avatar y subida de imágenes
components/
├── ui/                  # botón, chip, campos, hoja inferior
├── closet/              # cámara, cuadrícula, filtros, ficha y colocación
├── studio/              # lienzo del conjunto y cajón de ropa
├── looks/               # tarjetas y agenda
└── layout/              # cabecera y barra de navegación inferior
lib/
├── placement.ts         # colocación de cada prenda en el lienzo
├── silhouette.ts        # maniquí de referencia a partir de las medidas
├── taxonomy.ts          # categorías, colores, temporadas, ocasiones
├── store.ts             # estado de filtros y del conjunto equipado
├── image.ts             # reescalado, recorte de fondo y color dominante
└── auth.ts              # hash de contraseñas y sesiones en cookie
```

## Cómo funciona el probador

No hay avatar generado. El estudio compone la combinación de prendas, y si el
usuario se ha hecho una foto de cuerpo entero, la monta **sobre esa foto**. La
clave está en que **cada prenda guarda dónde se coloca**.

1. Al subir la foto, después de recortar el fondo y rellenar la ficha, aparece
   un paso de colocación: la prenda se arrastra sobre la figura de referencia y
   se **estira por los tiradores** —uno lateral, uno inferior y uno en la
   esquina— o con los deslizadores de ancho y alto. Todo eso se guarda junto a
   la prenda (`placeX`, `placeY`, `placeW`, `placeH` en `Item`).

   La foto se hace con la **cámara del teléfono**, no con un visor propio.
   Resolver dentro del navegador la orientación, las proporciones y los
   objetivos resultó poco fiable —un flujo pedido en vertical llegaba
   apaisado—, mientras que la cámara nativa ya trae todo eso resuelto y el
   usuario conoce sus modos, su temporizador y sus lentes. La app se ocupa de lo
   que viene después.

   Tras el borrado automático hay un paso de **retoque a mano**
   ([RetoqueEditor](components/closet/RetoqueEditor.tsx)): el recorte casi
   siempre deja restos —una percha, un trozo de suelo, una sombra— y se quitan
   pasando el dedo, con un modo restaurar para volver atrás si uno se pasa. Los
   trazos se guardan como vectores, no como copias de la imagen, así que
   deshacer es repintar la lista sin el último en vez de reservar decenas de
   megas por paso. Al terminar se vuelve a recortar al contenido, porque borrar
   los bordes cambia el encuadre útil de la prenda.

   El alto es independiente del ancho a propósito: una camiseta corta se estira
   hacia abajo para que no quede el vientre al aire sin ensancharla a la vez.
   Mientras `placeH` valga 0 el alto es automático y sigue a la proporción de la
   foto; en cuanto se estira pasa a mandar el valor guardado, y «Sin estirar»
   lo devuelve a automático.
2. Las coordenadas son relativas a un lienzo de proporción fija (`CANVAS_ASPECT`
   en [lib/placement.ts](lib/placement.ts)), así que la misma colocación vale
   igual en una miniatura que a pantalla completa, y en cualquier móvil.

   Esa proporción tiene que ser **idéntica** en el editor y en el estudio: si
   una de las dos cajas se deforma, los mismos porcentajes colocan la prenda en
   otro sitio y con otro tamaño. Por eso las dos usan el mismo componente,
   [AspectCanvas](components/ui/AspectCanvas.tsx), que fija el alto con
   `min(100cqh, 100cqw / proporción)`. No basta con `aspect-ratio`: dentro de un
   contenedor flexible, la caja puede encogerse por debajo de su anchura
   preferida y la proporción se rompe sin avisar.
3. El estudio apila las prendas **en el orden en que las eliges**: la última
   seleccionada queda encima. Así decides si la camisa va por fuera del pantalón
   o por dentro. La tira «Capas» del estudio muestra ese orden y basta con tocar
   una prenda para ponerla delante. El orden se guarda con el look
   (`LookItem.position`), de modo que al reabrirlo se ve igual.
4. El botón **Aleatorio** compone un conjunto con el armario entero: una prenda
   de cada categoría básica y, de vez en cuando, un abrigo o un accesorio.
5. La colocación se puede corregir en cualquier momento desde la ficha de la
   prenda, con «Ajustar colocación».
6. En **Perfil → Tu foto** se puede hacer una foto de cuerpo entero. Se le
   recorta el fondo y se alinea con el maniquí igual que una prenda; a partir de
   ahí es la capa de abajo del probador, con un interruptor para mostrarla u
   ocultarla.

El estudio usa el fondo a sangre en toda la pantalla, con la figura proyectando
sombra sobre él y gestos de acercamiento: pellizcar amplía, arrastrar recorre y
un toque doble vuelve al encuadre completo (la transformación es visual, no toca
las coordenadas guardadas). Coloca el avatar grande a la izquierda, a su derecha
una columna estrecha con dos pestañas y abajo un raíl a lo ancho con las cinco
categorías en iconos grandes.

Los dos carruseles funcionan como el de una consola: se deslizan y **lo que queda
en el centro es lo que se pone**, sin apuntar ni tocar, así que se van pasando
opciones viendo el resultado en el avatar hasta dar con la que convence. La
mecánica —guardia antirrebote, detección del elemento centrado y resincronización
cuando el conjunto cambia por otra vía— vive en un único sitio,
[useCarrusel](components/studio/useCarrusel.ts), parametrizado por eje; tiene tres
sutilezas fáciles de romper al copiarlas y así solo hay que arreglarlas una vez.
Se apoya en `scroll-snap` del navegador en lugar de recolocar por JavaScript, de
modo que el deslizamiento conserva su inercia.

- **Raíl inferior**, horizontal: las prendas de la categoría activa. La primera
  casilla es «Sin prenda» y centrarla deja esa capa libre.
- **Columna lateral**, vertical, con dos pestañas: *Puestas* es el inventario del
  conjunto y el control de capas —tocar una prenda la trae al frente—, y *Looks*
  es el carrusel de conjuntos guardados. Centrar un look lo pone entero; la
  casilla «Sin look» desviste. Cada casilla enseña el conjunto compuesto de
  verdad, reutilizando `OutfitCanvas` en versión miniatura, así que es una vista
  previa fiel y no hace falta inventar qué prendas mostrar.

Poner un look lo marca además como «en edición», de modo que «Guardar look» pasa
a «Actualizar». La hoja llega con el nombre, la ocasión y la fecha ya rellenos
—sin eso, actualizar los borraba, porque la petición manda siempre los cuatro
campos— y ofrece «Guardar copia» para quien se prueba un look, lo retoca y no
quiere pisar el original. El detalle importante: **cambiar una prenda no suelta el
look**, pero *Aleatorio* y *Desvestir* sí, y el carrusel vuelve solo a «Sin look».

El maniquí de referencia se dibuja con las medidas del usuario
([lib/silhouette.ts](lib/silhouette.ts)), de modo que colocas la ropa sobre tus
propias proporciones y no sobre un cuerpo genérico. Ese maniquí solo aparece
mientras colocas: nunca en el probador.

La razón de hacerlo así es sencilla: una foto de una prenda extendida puede
estar encuadrada de mil maneras, y ninguna regla automática acierta con todas.
Colocarla una vez a mano cuesta unos segundos y el resultado es exacto para
siempre.

## Decisiones y limitaciones conocidas

- **Sin avatar.** Se probaron un avatar 3D (Three.js) y un avatar 2D generado a
  partir de las medidas; ninguno resultaba convincente con fotos reales de ropa.
  El enfoque actual —componer las fotos en la posición que decide el usuario— da
  un resultado predecible y fiel a las prendas de verdad.
- **Medidas corporales.** Se siguen guardando y sirven para dibujar el maniquí
  de referencia al colocar cada prenda. Son útiles además como registro propio a
  la hora de comprar ropa.
- **Recorte de fondo.** El modelo (unos 40 MB) se descarga del CDN de IMG.LY la
  primera vez y queda cacheado en el navegador. Si falla —sin red, CDN
  bloqueado— la prenda se guarda con la foto original y se avisa al usuario en
  lugar de bloquear el alta.
- **Almacenamiento de imágenes.** Las fotos se guardan en `public/uploads/<userId>/`.
  Es lo correcto en local, pero en un despliegue con sistema de ficheros efímero
  (Vercel, contenedores) hay que cambiar `app/api/upload/route.ts` por Supabase
  Storage, S3 o Cloudinary.
- **Sesiones.** Autenticación propia con `scrypt` y sesiones en base de datos
  sobre cookie `httpOnly`. Suficiente para el MVP; si necesitas OAuth o enlaces
  mágicos, el punto de extensión es `lib/auth.ts`.

## Pasar a PostgreSQL

1. En `prisma/schema.prisma`, cambia `provider = "sqlite"` por `"postgresql"`.
2. Apunta `DATABASE_URL` a tu servidor.
3. `npx prisma migrate dev --name init`.

El esquema no usa nada específico de SQLite, así que no hace falta tocar más.

## Sistema de diseño

La interfaz sigue las pautas de [DESIGN.md](DESIGN.md). Lo que eso significa en
este código:

- **Canto como sombra.** Las superficies no llevan `border` sino un anillo de
  1 px en la capa de sombra (`.edge` y `.edge-raised` en
  [globals.css](app/globals.css)), que da un borde más nítido y se puede animar
  sin mover la maquetación.
- **Foco visible obligatorio.** Una única regla con `:where(…):focus-visible`
  pinta un anillo azul en todos los controles. Antes no había ninguno: los
  campos usaban `outline-none` sin sustituto, que deja sin referencia a quien
  navega con teclado.
- **Zoom permitido.** Se retiró `maximumScale: 1` del viewport; limitar la
  escala deja fuera a quien necesita ampliar.
- **Áreas de pulsación.** Ningún control baja de 24 px reales; los iconos
  pequeños amplían su zona con un pseudoelemento en lugar de crecer.
- **Cifras tabulares** en todo lo que se compara en columna, elipsis reales
  (`…`) en los marcadores de posición y ejemplos concretos en vez de «Opcional».
- **Movimiento.** Solo se animan `transform`, `opacity` y las sombras; nunca
  `transition: all` ni propiedades que recalculan la maquetación.

- **Paleta y tipografía completas del sistema.** Blanco puro con texto
  `#171717` en claro, negro puro con `#ededed` en oscuro, acción principal en
  negro sobre blanco (y al revés en oscuro). Geist en toda la interfaz, con
  interletraje negativo —nunca positivo, que la familia ya va estrecha— y las
  ligaduras activadas.

## Tema claro y oscuro

La app trae las dos paletas y el usuario elige en **Perfil → Apariencia** entre
claro, oscuro o seguir al sistema. La preferencia se guarda en el navegador.

Cómo está montado, por si hay que tocarlo:

- Las dos paletas viven en [app/globals.css](app/globals.css). El atributo
  `data-theme` del `<html>` contiene siempre el tema **ya resuelto** (`claro` u
  `oscuro`), nunca `sistema`: así el CSS solo conoce dos paletas.
- Un script en línea ([lib/theme.ts](lib/theme.ts)) traduce la preferencia antes
  de la primera pintura. Sin él habría un destello del tema equivocado al
  cargar.
- Con la preferencia en «sistema», [ThemeSync](components/ThemeSync.tsx) escucha
  los cambios del sistema operativo, que en el móvil suele conmutar solo al
  anochecer.
- Hay dos tokens que merecen mención: `on-accent` es el color del texto sobre el
  acento (no se puede usar el fondo de la página, porque el acento cambia de
  claridad entre temas), y `display` es el fondo de las superficies donde se
  enseña la foto de una prenda —sin él, una camiseta blanca en tema claro se
  confunde con la tarjeta.

El manifiesto de la PWA mantiene los colores oscuros: la pantalla de arranque de
la app instalada es siempre oscura, que es la identidad del producto.

## PWA

La app se puede instalar en la pantalla de inicio: `app/manifest.ts` define el
manifiesto y `public/sw.js` cachea el armario y las fotos para poder consultarlo
sin cobertura. **El service worker solo se registra en la build de producción**
(`npm run build && npm start`), para no servir respuestas cacheadas durante el
desarrollo.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | servidor de desarrollo |
| `npm run build` / `npm start` | build y arranque de producción |
| `npm run seed` | recrea la cuenta demo con 12 prendas y 2 looks |
| `npm run db:push` | sincroniza el esquema con la base de datos |
| `npm run lint` | ESLint |
