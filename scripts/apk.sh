#!/usr/bin/env bash
# Compila el APK de Android.
#
#   ./scripts/apk.sh              → APK de depuración, para instalar y probar
#   ./scripts/apk.sh --firmado    → APK firmado, para repartir
#   ./scripts/apk.sh --play       → .aab, el formato que pide Google Play
#
# Antes de compilar vuelve a generar el sitio y lo copia dentro del proyecto de
# Android: si no, el APK se queda con la versión web de la última vez.
set -euo pipefail
cd "$(dirname "$0")/.."

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

npm run build
npx cap sync android

cd android
case "${1:-}" in
  --play)    TAREA=bundleRelease; SALIDA="app/build/outputs/bundle/release" ;;
  --firmado) TAREA=assembleRelease; SALIDA="app/build/outputs/apk/release" ;;
  *)         TAREA=assembleDebug;  SALIDA="app/build/outputs/apk/debug" ;;
esac
./gradlew "$TAREA"

echo
ls -lh "$SALIDA"/*.apk "$SALIDA"/*.aab 2>/dev/null | awk '{print "  " $9 "  " $5}'
