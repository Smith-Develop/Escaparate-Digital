#!/usr/bin/env bash
# Compila el APK de Android.
#
#   ./scripts/apk.sh              → APK de depuración, para instalar y probar
#   ./scripts/apk.sh --firmado    → APK firmado, para repartir
#   ./scripts/apk.sh --play       → .aab, el formato que pide Google Play
#   ./scripts/apk.sh --play --version 1.1
#                                 → además sube versionName a 1.1 y versionCode +1
#   ./scripts/apk.sh --con-panel  → incluye el panel de administración
#
# El panel se queda fuera por defecto: se administra desde la web, y dentro de
# la app son pantallas que no pintan nada y que un revisor de Google puede
# encontrarse sin contexto. Sin `NEXT_PUBLIC_ADMIN_API` las pantallas siguen
# existiendo pero no hablan con nadie ni aparecen en el perfil.
#
# Play rechaza dos subidas con el mismo `versionCode`, y es un fallo que solo se
# descubre después de esperar la compilación entera; por eso el número se sube
# desde aquí y no a mano.
#
# Antes de compilar vuelve a generar el sitio y lo copia dentro del proyecto de
# Android: si no, el APK se queda con la versión web de la última vez.
set -euo pipefail
cd "$(dirname "$0")/.."

MODO=""
VERSION=""
CON_PANEL="no"
while [ $# -gt 0 ]; do
  case "$1" in
    --version)   VERSION="${2:-}"; shift 2 ;;
    --con-panel) CON_PANEL="si"; shift ;;
    *)           MODO="$1"; shift ;;
  esac
done

# Firmar hace falta para todo lo que no sea depuración.
if [ "$MODO" = "--play" ] || [ "$MODO" = "--firmado" ]; then
  if [ ! -f android/keystore.properties ]; then
    cat >&2 <<'AVISO'
Falta android/keystore.properties, así que el paquete saldría sin firmar y Play
lo rechazaría al subirlo.

  1. Crea el almacén de claves, una sola vez y fuera del proyecto:
       keytool -genkeypair -v -keystore ~/claves/escaparate-subida.jks          -alias escaparate -keyalg RSA -keysize 4096 -validity 10000
  2. Copia android/keystore.properties.ejemplo a android/keystore.properties
     y rellena las cuatro líneas.

Guarda el .jks con copia de seguridad: es lo que te permite actualizar la app.
AVISO
    exit 1
  fi
fi

if [ -n "$VERSION" ]; then
  CODIGO=$(grep -oP 'versionCode \K\d+' android/app/build.gradle)
  SIGUIENTE=$((CODIGO + 1))
  sed -i "s/versionCode $CODIGO/versionCode $SIGUIENTE/; s/versionName \".*\"/versionName \"$VERSION\"/" android/app/build.gradle
  echo "versión: $VERSION (versionCode $CODIGO → $SIGUIENTE)"
fi

# Capacitor y supabase-js piden Node 22 o superior; en esta máquina el del
# sistema es más antiguo y el bueno vive en nvm.
if ! node -e 'process.exit(process.versions.node.split(".")[0] >= 22 ? 0 : 1)' 2>/dev/null; then
  # shellcheck disable=SC1090
  [ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" && nvm use --lts >/dev/null 2>&1 || true
fi
node -e 'process.exit(process.versions.node.split(".")[0] >= 22 ? 0 : 1)' || {
  echo "Hace falta Node 22 o superior (ahora: $(node -v))." >&2; exit 1; }
echo "node: $(node -v)"

# Capacitor 8 necesita Java 21; en esta máquina el `java` del PATH es el 17.
if [ -z "${JAVA_HOME:-}" ] || ! "$JAVA_HOME/bin/java" -version 2>&1 | grep -q '"21'; then
  for candidato in /usr/lib/jvm/java-21-openjdk-amd64 /usr/lib/jvm/openjdk-21 /snap/android-studio/current/jbr; do
    [ -x "$candidato/bin/java" ] && export JAVA_HOME="$candidato" && break
  done
fi
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
echo "java: $("$JAVA_HOME/bin/java" -version 2>&1 | head -1)"

if [ "$CON_PANEL" = "si" ]; then
  npm run build
else
  # Vacía y exportada: así gana sobre lo que diga `.env.local`.
  NEXT_PUBLIC_ADMIN_API="" npm run build
fi
npx cap sync android

cd android
case "$MODO" in
  --play)    TAREA=bundleRelease; SALIDA="app/build/outputs/bundle/release" ;;
  --firmado) TAREA=assembleRelease; SALIDA="app/build/outputs/apk/release" ;;
  *)         TAREA=assembleDebug;  SALIDA="app/build/outputs/apk/debug" ;;
esac
./gradlew "$TAREA"

echo
ls -lh "$SALIDA"/*.apk "$SALIDA"/*.aab 2>/dev/null | awk '{print "  " $9 "  " $5}'
