# Escaparate · Armario virtual y probador de conjuntos

Aplicación web *mobile-first* para digitalizar tu ropa y montar conjuntos con las
fotos reales de tus prendas, sin abrir el armario.

## Puesta en marcha

Escaparate no tiene servidor propio: es una aplicación de cliente que habla
directamente con **tu** Supabase. Hace falta Node 22 o superior.

```bash
npm install
cp .env.example .env.local      # y rellena las tres variables de Supabase
npm run dev                     # http://localhost:3000
```

Para dejar la base lista la primera vez, aplica en orden los tres ficheros de
`supabase/migrations/` en el editor SQL de tu Supabase, y comprueba que todo ha
quedado en su sitio:

```bash
node --env-file=.env.local scripts/comprobar-supabase.mjs
node --env-file=.env.local scripts/seed-supabase.mjs      # armario de ejemplo
```

Con los datos de ejemplo puedes entrar con `demo@escaparate.app` / `escaparate`.

### Variables de entorno

| Variable | Qué es |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | La URL de la **API** (el dominio de Supabase), no la cadena de conexión a PostgreSQL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clave anónima. Es pública por diseño: viaja dentro de la app y quien protege los datos es la seguridad por filas |
| `NEXT_PUBLIC_SUPABASE_SCHEMA` | El esquema donde viven las tablas, por si la instancia es compartida |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo para los scripts de carga inicial, desde tu máquina. **Se salta la seguridad por filas**: nunca en el navegador ni en un repositorio |

Las tres primeras se resuelven **al compilar**, no al arrancar: al desplegar en
Coolify hay que declararlas como variables de compilación.

## Cómo se reparte

| Destino | Cómo |
| --- | --- |
| **Web** | `npm run build` deja el sitio en `out/`; el `Dockerfile` lo sirve con nginx |
| **Android** | Capacitor mete `out/` dentro del APK: `npx cap sync android && cd android && ./gradlew assembleDebug` |
| **iPhone** | La misma web, instalada desde Safari con «Añadir a pantalla de inicio» |

En el APK **los ficheros viajan dentro**: la app abre sin tocar la red. Por eso
`capacitor.config.ts` no define `server.url`, que convertiría la aplicación en
una cáscara que carga la web por internet.

### Desplegar en Coolify

Cuatro ajustes en el recurso, y los cuatro tienen su motivo:

| Ajuste | Valor | Por qué |
| --- | --- | --- |
| **Build Pack** | `Dockerfile` | Con Nixpacks, Coolify ve un proyecto de Next y arranca `npm start`, que aquí no existe: la app es estática. El contenedor muere al nacer y el proxy devuelve 502 |
| **Puerto** | `80` o `3000` | `nginx.conf` escucha en los dos justamente para que dé igual cuál haya detectado |
| **Variables** | las tres `NEXT_PUBLIC_*` | Marcadas como **Build Variable**: se resuelven al construir la imagen. Si solo están como variables de ejecución, la app se despliega pero se abre diciendo que faltan |
| **Salud** | `/salud` | Devuelve `ok` en texto plano |

Después de cambiar cualquiera de las tres variables hay que **reconstruir**:
reiniciar el contenedor no basta, porque sus valores ya están dentro del
JavaScript compilado.

En el recurso de **Supabase** —no en el de Escaparate— hay además un ajuste que
gobierna el registro: `ENABLE_EMAIL_AUTOCONFIRM` en `true` hace que las cuentas
nazcan confirmadas y se entre sin pasar por el correo. Vale para toda la
instancia; está explicado más abajo, en «El registro, sin confirmar el correo».

Si algún día se vuelve a exigir confirmación, hará falta que el enlace del correo
sepa volver. GoTrue solo admite las direcciones de su lista blanca, así que se
añade la de la app **sin quitar las que ya hubiera**, porque la instancia la
comparten varias aplicaciones:

```
GOTRUE_URI_ALLOW_LIST = <lo que ya haya>,https://tu-dominio/**
```

Con el autoconfirmado puesto, esa lista solo hace falta para restablecer
contraseñas.

Para comprobar que ha salido bien, sin abrir el navegador:

```bash
curl https://tu-dominio/salud     # → ok
```

## Sin servidor, y por qué

La versión anterior renderizaba cada pantalla en el servidor consultando SQLite
por Prisma. Funcionaba, pero sin cobertura no se veía nada: aunque el service
worker devolviera el HTML cacheado, ese HTML se generaba con los datos del
usuario en el servidor.

Ahora la interfaz **nunca lee de la red**. Lee de un espejo del armario guardado
en el propio móvil (IndexedDB), que se refresca por detrás cuando hay conexión:

```
Interfaz React  →  espejo local (IndexedDB)  ⇄  Supabase
                   items · looks · tags          Auth · Postgres+RLS
                   avatar · perfil · fotos       Storage
```

Consecuencias, todas buscadas:

- **El escaparate se ve en el metro**, con sus fotos, y el estudio y el lookbook
  también. Para escribir sí hace falta red, y la app lo dice.
- **Arranca más rápido**, porque no espera a ninguna consulta para pintar.
- **Ya no hay ruta de API que proteger.** Lo que separa el armario de un usuario
  del de otro son las políticas de la base (`supabase/migrations/0002_rls.sql`),
  no un `requireUser()` en cada manejador. La validación que queda en el cliente
  es ayuda al usuario, no seguridad; lo que no se negocia se comprueba con
  restricciones `CHECK` en PostgreSQL.

La sincronización se trae **todo**, no solo lo que ha cambiado: un armario son
cinco consultas y unos cientos de kilobytes, y a cambio no hay que llevar la
cuenta de qué se editó ni de qué se borró. Lo caro son las fotos, y esas se
guardan por su ruta y **nunca se descargan dos veces**; del original sin recortar
ni se hace copia, porque solo sirve para rehacer el recorte, que ya necesita red.

## Stack

- **Next.js 16** en exportación estática (`output: "export"`), React 19, TypeScript
- **Tailwind CSS v4** con variables de tema
- **Supabase**: Auth, PostgreSQL con seguridad por filas y Storage privado
- **Zustand** para el estado y el espejo local; **IndexedDB** a pelo para guardarlo
- **Framer Motion** para los gestos y las transiciones
- **@imgly/background-removal** para recortar el fondo en el navegador
- **Capacitor** para el APK de Android

## Cómo está organizado

```
app/
├── (auth)/              # entrar y registrarse contra Supabase Auth
├── dashboard/           # inicio, armario, estudio, looks, perfil, inversión
└── manifest.ts          # manifiesto de la PWA
components/
├── ui/                  # botón, chip, campos, hoja inferior, Foto
├── closet/              # cámara, cuadrícula, filtros, ficha y colocación
├── studio/              # lienzo del conjunto, raíl y columna lateral
├── looks/               # tarjetas y agenda
├── profile/             # cuenta, foto de cuerpo entero y medidas
└── SesionProvider.tsx   # quién está dentro
lib/
├── supabase/            # el cliente y dónde se guarda la sesión
├── datos/               # lo que antes eran las rutas de API
├── local/               # el espejo: IndexedDB, sincronización y fotos
├── placement.ts         # colocación de cada prenda en el lienzo
├── silhouette.ts        # maniquí de referencia a partir de las medidas
├── taxonomy.ts          # categorías, colores, temporadas, ocasiones
├── inversion.ts         # cuánto vale el armario, por categoría, marca y año
├── dinero.ts            # céntimos, tramos de precio y formato de importes
└── image.ts             # reescalado, recorte de fondo y color dominante
supabase/
├── migrations/          # el esquema, las políticas y el almacén
├── schema.prisma        # solo para generar el SQL; la app no usa Prisma
└── pruebas/probar.sh    # levanta un PostgreSQL desechable y prueba las políticas
scripts/                 # carga de datos, migración, iconos y service worker
migracion/               # lo que quedó de la versión con servidor (ver su LEEME)
```

## Cómo se cataloga una prenda

Además de la categoría, el tipo, el color, la temporada y la ocasión, cada
prenda guarda **talla**, **precio aproximado** y **fecha de compra**. No son
adornos: con ellos el armario sirve para saber qué talla se gasta en cada marca,
cuánto cuesta lo que uno tiene puesto y qué lleva años sin estrenarse. Los tres
son opcionales y viven en `Item` (`size`, `priceCents`, `purchasedAt`). El precio
se escribe como se dice —`39,90` o `39.90`— y se guarda en céntimos, que es la
única forma de no acumular errores de coma flotante.

Las listas de serie cubren lo habitual, pero **el usuario añade las suyas en
cualquiera de las propiedades**: tipo de prenda, color, temporada y ocasión. Un
armario real tiene «camiseta oversize», «burdeos», «media estación» o «boda», y
obligar a encajarlos en una lista cerrada estropea justo lo que hace útil el
catálogo: el filtrado. Cada fila de etiquetas del formulario lleva un chip
«+ …» que despliega su gestor ([GestorEtiquetas](components/closet/GestorEtiquetas.tsx)),
donde se **crean, renombran y borran** las propias; las de serie no se tocan. El
gestor vive a lo ancho, debajo de la fila, porque dentro del carrusel horizontal
de chips sus botones se salían de la pantalla por la derecha.

Todas se guardan en `Tag`, una fila por usuario, propiedad y `slug`. Dos detalles
que conviene tener presentes:

- **Los tipos de prenda cuelgan de una categoría** (`Tag.parent`). «Camiseta» en
  parte superior y «Camiseta» en abrigos son etiquetas distintas, y cada una solo
  aparece mientras se cataloga su categoría. La columna es una cadena vacía en el
  resto de propiedades: un nulo en SQLite no cuenta como repetido y colaría
  duplicados.
- **Renombrar no desvincula prendas.** En color, temporada y ocasión la prenda
  guarda el `slug`, que no cambia nunca: «Burdeos» puede pasar a «Vino tinto» sin
  tocar una sola prenda. La excepción son los tipos, donde el valor guardado es
  el propio nombre (`Item.subcategory`), así que el servidor renombra también las
  prendas afectadas y las dos escrituras van en la misma transacción.

La categoría es la única propiedad cerrada, y a propósito: las cinco de serie
deciden la capa que ocupa la prenda en el probador, el icono del raíl y su
colocación por omisión, cosas que una categoría inventada no sabría contestar.

El servidor rechaza los identificadores reservados y los duplicados, y no deja
borrar una etiqueta que alguna prenda esté usando —dice en cuántas está—, porque
si no, esas prendas quedarían apuntando a un valor que ya no existe y
desaparecerían de los filtros sin explicación.

Al mostrar la lista, [lib/taxonomy.ts](lib/taxonomy.ts) une las de serie con las
propias en un solo array de `Etiqueta`; los componentes no saben —ni les importa—
de dónde viene cada una.

## Filtrar el armario

El escaparate filtra por **todas** las propiedades que se catalogan: categoría,
tipo, color, temporada, ocasión, marca, talla, tramo de precio, año de compra y
favoritas, además de la búsqueda por texto. Las categorías están siempre a la
vista y el resto vive en un panel desplegable con el número de filtros activos en
el botón.

Marca, talla, año y tipo **no salen de ninguna lista fija**: se derivan de las
prendas que hay en el armario, que es lo único que tiene sentido ofrecer —nadie
quiere filtrar por una marca que no tiene—. Los tipos se acotan además a la
categoría elegida, y cambiar de categoría suelta el tipo: si no, la cuadrícula se
quedaría vacía sin que se vea por qué.

«Sin precio» y «Sin fecha» son tramos como los demás, y sirven para lo contrario
de lo que parece: encontrar las prendas a las que les falta el dato y
completarlas.

## Cuánto vale el armario

El **inicio** responde a en qué se ha ido el dinero: el total invertido, el
precio medio, la prenda más cara y el reparto por categoría, por tipo de prenda,
por marca y por año de compra, debajo del resumen del armario
([ResumenInversion.tsx](components/inicio/ResumenInversion.tsx)).

Vivió un tiempo en una pantalla aparte y se trajo aquí: es un dato que solo
sirve si se ve de pasada, y tenerlo detrás de un botón significaba no mirarlo
nunca.

Todo se calcula en el servidor a partir de las prendas
([lib/inversion.ts](lib/inversion.ts)); no hay ninguna cifra guardada que pueda
quedarse desfasada al añadir o borrar ropa. Como el precio es opcional, cada
grupo cuenta aparte las prendas sin precio: decir «has invertido 340» cuando la
mitad del armario no tiene precio sería mentir con estadísticas.

Las barras se miden contra el grupo que más suma, no contra el total: comparadas
con el total, en un armario repartido todas salen igual de cortas y no se
distingue nada. Los importes van en euros, con el símbolo detrás y separado como
se escribe en español ([lib/dinero.ts](lib/dinero.ts)), y ese fichero es el único
que habría que tocar para cambiar de moneda.

Los importes van en euros, con el símbolo detrás y separado.

El anillo de categorías cuenta **prendas**, no dinero. Repartiendo el gasto, una
categoría sin precios anotados desaparecía del anillo, y con medio armario sin
precio parecía que solo había camisetas.

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
4. **Una prenda por capa, salvo los accesorios.** Elegir otra camiseta sustituye
   a la anterior, porque en el torso solo cabe una; en cambio una pulsera, una
   cadena y unas gafas se llevan a la vez, así que los accesorios se acumulan.
   Por eso el raíl cambia de comportamiento en esa categoría: en vez del
   carrusel que viste lo que queda centrado, cada casilla se toca para ponerla o
   quitarla y hay una casilla «Quitar todos».
5. El botón **Aleatorio** compone un conjunto con el armario entero: una prenda
   de cada categoría básica y, de vez en cuando, un abrigo y hasta dos
   accesorios.
6. La colocación se puede corregir en cualquier momento desde la ficha de la
   prenda, con «Ajustar colocación».
7. En **Perfil → Tu foto** se puede hacer una foto de cuerpo entero. Se le
   recorta el fondo y se alinea con el maniquí igual que una prenda; a partir de
   ahí es la capa de abajo del probador, con un interruptor para mostrarla u
   ocultarla. **Apagarla se recuerda**: quien la esconde no quiere encontrársela
   otra vez al recargar. La preferencia se guarda en el navegador
   ([lib/preferencias.ts](lib/preferencias.ts)) y se lee con
   `useSyncExternalStore`, que es lo que evita que el servidor y el cliente
   pinten cosas distintas al hidratar.

El estudio usa el fondo a sangre en toda la pantalla, con la figura proyectando
sombra sobre él y gestos de acercamiento: pellizcar amplía, arrastrar recorre y
un toque doble vuelve al encuadre completo (la transformación es visual, no toca
las coordenadas guardadas).

El telón se reparte en **tres columnas con el mismo aire**: las categorías en
vertical a la izquierda, la figura en el centro y la columna de dos pestañas a
la derecha. Todo lo que flota va anclado **a la columna del centro**, no al
borde del telón, así que se coloca solo en cualquier ancho en vez de con
distancias medidas a ojo:

- Arriba, una fila con *Aleatorio* a un lado y los dos botones redondos al otro
  —vestir sobre mi foto, que se queda encendido, y desvestir—. Antes el
  interruptor de la foto era una casilla suelta bajo la tarjeta, que ocupaba
  alto y no se relacionaba con nada.
- Abajo a la izquierda, **el nombre del conjunto**: el del look que se está
  retocando o «Conjunto nuevo», con cuántas prendas lleva y si está guardado.
  Es lo que se mira al montar un conjunto y vivía en letra pequeña dentro de la
  tarjeta blanca.

La tarjeta blanca de abajo queda entonces para lo que se toca: qué categoría
enseña el raíl, el botón de la foto del conjunto y el de guardar.

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

## Perfil

El perfil reúne lo que es tuyo y no de la ropa, ordenado por lo que se toca a
menudo:

- **La cuenta**: nombre —editable ahí mismo—, correo y desde cuándo usas la app.
  El correo no se cambia desde aquí: es la credencial de entrada, y cambiarlo
  pide comprobar que el nuevo no está cogido y que sigues siendo tú.
- **El resumen del armario**: prendas, looks y lo invertido, cada uno enlazando
  con su pantalla.
- **Tu foto** de cuerpo entero, que es lo que cambia la cara del probador.
- **Tus medidas**, plegadas: se ve el maniquí con seis medidas de referencia y
  el editor completo se despliega al pulsar «Ajustar». Los doce deslizadores
  ocupaban el perfil entero y se tocan una vez al año.
- **Apariencia** y **cerrar sesión**.

El tono de piel, el color de pelo y el peinado **ya no están**: eran del avatar
dibujado que se abandonó y no los leía ningún componente, así que se han quitado
de la interfaz, de la API y de la tabla `Avatar`. Las medidas sí se quedan,
porque con ellas se dibuja el maniquí de referencia al colocar cada prenda.

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
- **Almacenamiento de imágenes.** Las fotos viven en un bucket privado de
  Supabase, en una carpeta por usuario, y se leen con enlaces firmados de un
  minuto. Lo que guarda la prenda es la **ruta**, no una URL: las firmadas
  caducan y una URL guardada dejaría de servir a la hora.
- **Escribir exige conexión.** Consultar funciona siempre; añadir o editar, no.
  Se decidió así para la primera versión: una cola de cambios pendientes obliga
  a decidir qué pasa cuando el mismo dato cambia en dos sitios, y eso es un
  problema aparte. El esquema ya lleva `updatedAt` en todas las tablas
  justamente para poder resolverlo más adelante.
- **En iPhone el sistema puede vaciar el almacén** sin avisar cuando le falta
  disco, y Safari no concede almacenamiento persistente. No es arreglable, solo
  sobrevivible: si al abrir hay sesión pero el espejo está vacío, se vuelve a
  descargar. **El offline realmente fiable es el APK de Android.**
- **Las contraseñas de la versión anterior no se migran.** Se guardaban con
  `scrypt` en un formato propio que Supabase no entiende, así que
  `scripts/migrar-a-supabase.mjs` pide una nueva. El resto de la cuenta sí viaja.
- **El recorte de fondo pesa.** El tiempo de ejecución de WebAssembly ocupa unos
  23 MB dentro del APK y el modelo son otros 40 MB que se descargan del CDN de
  IMG.LY la primera vez. Si falla, la prenda se guarda con la foto original y se
  avisa, en lugar de bloquear el alta.

## Sistema de diseño

La identidad es **cálida y redondeada**: un fondo de salvia apagada, tarjetas
blancas muy redondeadas que flotan encima con sombra difusa, y un ámbar que
manda en todo lo que se puede tocar. Lo que eso significa en este código:

- **Lo que separa es la sombra, no la línea.** Las superficies no llevan borde:
  `.edge` y `.edge-raised` ([globals.css](app/globals.css)) son sombras suaves
  y amplias. En oscuro sí añaden un filo de 1 px, porque sobre carbón una
  sombra no separa nada.
- **Texto oscuro sobre el ámbar.** `--on-accent` es casi negro, no blanco: con
  un dorado claro el blanco no llega al contraste necesario. Es el motivo de
  que los botones principales se lean como en la referencia y no como un
  degradado lavado.
- **El ámbar de los rellenos no vale como texto.** Sobre el fondo de salvia da
  1,56:1, muy lejos del 4,5 que pide un texto pequeño, así que los enlaces y el
  maniquí usan `--accent-ink`, el mismo tono llevado a ámbar tostado: 4,84:1
  sobre el fondo y 5,77:1 sobre blanco. En oscuro no hace falta, y `--accent-ink`
  vuelve a ser el ámbar vivo, que ahí ya da 9:1.
- **Un solo acento en los dos temas.** De noche cambia el fondo —carbón cálido—
  pero el ámbar se queda: la marca no debería cambiar de color al anochecer.
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
- **Movimiento, uno para toda la app.** Solo se animan `transform`, `opacity` y
  las sombras; nunca `transition: all` ni propiedades que recalculan la
  maquetación. El gesto nació en el armario —las prendas aparecen subiendo ocho
  píxeles, escalonadas y con tope al octavo elemento— y vive en
  [lib/animaciones.ts](lib/animaciones.ts), de donde lo toman el inicio, el
  lookbook, el perfil y el estudio. Para envolver una sección basta con
  [Aparece](components/ui/Aparece.tsx). Tenerlo en un sitio evita lo de antes:
  dos listas parecidas entrando a ritmos distintos porque cada pantalla se
  inventaba su duración.

  Un aviso por si se envuelve un enlace: dentro de una rejilla, un `<a>` es
  elemento de rejilla y se comporta como bloque, pero metido en el envoltorio de
  la animación vuelve a ser en línea y el fondo de la tarjeta se parte. Los
  enlaces que hacen de tarjeta llevan `block h-full`.

- **Cabeceras en dos formatos.** Con vuelta atrás, disposición de detalle:
  botón redondo a la izquierda, título centrado y otro botón redondo a la
  derecha, con el hueco reservado aunque no haya acción para que el título no
  baile de una pantalla a otra. Sin ella, el título manda: grande y a la
  izquierda. Las dos viven en [Header.tsx](components/layout/Header.tsx), junto
  al botón redondo que comparten.
- **Portada y acceso son pantallas de bienvenida**: la ilustración manda, el
  título va en mayúsculas y **las acciones se anclan abajo**, que es donde llega
  el pulgar. El anclaje se hace con `min-h-dvh` y `mt-auto`, no con posición
  fija: en el móvil, un elemento fijo pelea con el teclado y con la barra del
  navegador. La ilustración es un vector propio
  ([ArmarioAbierto.tsx](components/ilustraciones/ArmarioAbierto.tsx)): pesa
  menos de 3 kB, no se pixela y toma sus colores del tema, así que de noche no
  hay que servir otra versión.
- **La barra inferior es una pastilla que flota**, no un borde pegado al
  fondo, y marca dónde estás con un punto sobre el icono que se desplaza de una
  pestaña a otra.
- **Geist en toda la interfaz**, con interletraje negativo —nunca positivo, que
  la familia ya va estrecha— y las ligaduras activadas.

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

## PWA y service worker

`app/manifest.ts` define el manifiesto y `public/sw.js` guarda la app entera —el
HTML, el CSS y el JavaScript— para poder abrirla sin cobertura. La lista de
ficheros **no se escribe a mano**: la genera `scripts/build-sw.mjs` recorriendo
`out/` al terminar de compilar, porque los fragmentos de JavaScript llevan huella
en el nombre y cambian en cada build; una lista desactualizada se traduce en una
pantalla en blanco el primer día sin red.

El service worker **no cachea datos**. El armario y las fotos viven en IndexedDB,
que es donde la app sabe buscarlos; un service worker cacheando respuestas de la
API daría la ilusión de funcionar y fallaría al cambiar cualquier parámetro. Solo
se registra en producción, para no servir respuestas viejas mientras se desarrolla.

Dentro del APK el service worker no interviene —los ficheros ya son locales—, así
que nada importante depende de él.

**El aviso para instalarla** ([InstalarApp.tsx](components/InstalarApp.tsx)) tiene
dos caminos, porque los navegadores no se parecen: Android y escritorio avisan
con `beforeinstallprompt` cuando la app cumple los requisitos, y ese aviso hay
que guardarlo porque solo sirve una vez y solo tras un gesto del usuario; iOS no
tiene ese evento, así que allí se explica el camino a mano (Compartir → Añadir a
pantalla de inicio), que es la única forma de instalar sin pasar por la App
Store. No aparece si ya está instalada, ni dentro del APK, ni si se descartó.

## El registro, sin confirmar el correo

Registrarse crea la cuenta y entra en el mismo paso, sin pasar por el correo.
Eso **no se decide desde la app**: la confirmación es un ajuste de la instancia
de Supabase (`ENABLE_EMAIL_AUTOCONFIRM`, que alimenta a
`GOTRUE_MAILER_AUTOCONFIRM`), y está desactivada a propósito.

Conviene saber lo que eso significa, porque la instancia la comparten varias
aplicaciones: **el ajuste vale para todas**. Las cuentas que ya existían siguen
como estaban, pero a partir de ahí cualquier app de esa instancia acepta
registros con correos sin verificar. Se asumió con conocimiento de causa; si
algún día deja de convenir, se vuelve a poner en `false` y hay que dar a cada
app una forma de confirmar.

Se valoró la alternativa de dejar la confirmación puesta y que solo Escaparate
creara cuentas ya confirmadas, con una función de borde que usara la clave de
servicio desde el servidor. Se descartó porque el servicio de funciones de esa
instancia no sirve ninguna función —ni la que trae de fábrica— y arreglarlo
exigía acceso al servidor, no solo al panel.

Con todo, `lib/auth-cliente.ts` **no da por hecho** que el servidor esté así: si
el alta no devuelve sesión, intenta entrar acto seguido, y solo si el servidor
contesta «email not confirmed» enseña la pantalla de «revisa tu correo». Así, el
día que alguien cambie ese ajuste, la app lo cuenta en vez de quedarse muda.

## Compartir

Dos botones, y detrás tres caminos distintos según dónde corra la app
([lib/compartir.ts](lib/compartir.ts)): en el APK el WebView de Android no trae
`navigator.share`, así que se usa el complemento de Capacitor —y para mandar una
imagen hay que escribirla antes en disco, porque comparte ficheros, no datos en
memoria—; en la web móvil `navigator.share` sí existe y admite ficheros; y en
escritorio, donde no suele haber nada de eso, se copia el enlace y se avisa. La
función devuelve qué acabó pasando para que la interfaz lo cuente: compartir en
silencio y que el usuario no sepa si ha funcionado es peor que no ofrecerlo.

La dirección que se comparte viene de `NEXT_PUBLIC_SITIO_URL`, porque dentro del
APK `location.origin` es `https://localhost` y no le sirve a nadie.

**La foto del conjunto** ([lib/lienzoConjunto.ts](lib/lienzoConjunto.ts)) —el
botón con **icono de cámara** del estudio, porque lo que sale de ahí es una
imagen y no un enlace— se
compone en un lienzo de 1080×1920 repitiendo la misma colocación que se ve en
pantalla, con el fondo teñido por la ropa puesta y la firma abajo. Las fotos
salen del espejo local, así que **también se puede compartir sin conexión**: si
se ve el conjunto, se puede mandar.

## La barra de navegación y el alto de la pantalla

El panel es una columna de **altura exacta de la ventana** (`h-dvh`) que no
desplaza el documento: lo que se desplaza es el contenido, y la barra inferior es
el último hijo de esa columna.

Antes la barra era `sticky bottom-0`, y eso la ata a que la página tenga scroll:
en las pantallas que no lo tienen —el estudio, o el perfil en una pantalla
alta— se quedaba flotando a media altura, allí donde terminara el contenido. Con
la columna de altura fija está abajo por construcción, y además deja de moverse
cuando el navegador del móvil esconde o enseña su barra de direcciones.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | servidor de desarrollo |
| `npm run build` | exportación estática a `out/` + lista del service worker |
| `node --env-file=.env.local scripts/comprobar-supabase.mjs` | ¿responde tu Supabase? ¿están las tablas y el bucket? |
| `node --env-file=.env.local scripts/seed-supabase.mjs` | armario de ejemplo (14 prendas, 4 etiquetas, 2 looks) |
| `node --env-file=.env.local scripts/migrar-a-supabase.mjs --correo … --seco` | sube el armario de la versión con servidor |
| `node --env-file=.env.local scripts/aplicar-migraciones.mjs --ensayo` | ensaya el SQL contra tu base y lo deshace |
| `./supabase/pruebas/probar.sh` | levanta un PostgreSQL desechable y comprueba las políticas |
| `node scripts/generar-iconos.mjs` | rasteriza los iconos a PNG |
| `npx cap sync android` | mete la última compilación en el proyecto de Android |
| `npm run lint` | ESLint |
