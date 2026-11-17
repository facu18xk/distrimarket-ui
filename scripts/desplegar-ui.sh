#!/usr/bin/env bash
# Compila la UI para UI-1 y UI-2 apuntando a un gateway y la copia a los dos Tomcat (Linux).
#
# Uso:
#   ./scripts/desplegar-ui.sh 10.99.213.20            # gateway en otra PC (puerto 8080)
#   ./scripts/desplegar-ui.sh 192.168.0.15:8080
#   TOMCAT1=/opt/tomcat-ui1 TOMCAT2=/opt/tomcat-ui2 ./scripts/desplegar-ui.sh 10.0.0.5
#
# Qué hace:
#   1. Compila la UI dos veces (VITE_UI_NODE=UI-1 y UI-2) con VITE_API_GATEWAY_URL=http://<gateway>.
#   2. Vacía webapps/ROOT de cada Tomcat (conserva META-INF y WEB-INF: regla de rutas del SPA).
#   3. Copia cada build a su Tomcat y cruza los assets (Apache alterna cada pedido entre nodos).
#   No hace falta reiniciar los Tomcat.
set -euo pipefail

if [ $# -lt 1 ]; then echo "Uso: $0 <ip-o-url-del-gateway>"; exit 1; fi
UI_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TOMCAT1="${TOMCAT1:-/opt/tomcat-ui1}"
TOMCAT2="${TOMCAT2:-/opt/tomcat-ui2}"
SALIDA="${TMPDIR:-/tmp}/distrimarket-ui-build"

URL="${1%/}"
case "$URL" in http://*|https://*) ;; *) URL="http://$URL";; esac
echo "$URL" | grep -Eq ':[0-9]+$' || URL="$URL:8080"
echo "Gateway: $URL"

HOSTPORT="${URL#*://}"
if timeout 3 bash -c "</dev/tcp/${HOSTPORT%:*}/${HOSTPORT##*:}" 2>/dev/null; then
  echo "  El gateway responde en $HOSTPORT"
else
  echo "  AVISO: no se pudo conectar a $HOSTPORT (firewall, otra red o gateway apagado). Se compila igual."
fi

command -v node >/dev/null || { echo "Falta Node.js (sudo apt install nodejs npm)"; exit 1; }
[ -d "$UI_DIR/node_modules" ] || { echo "Faltan dependencias: correr 'npm install' en $UI_DIR"; exit 1; }

cd "$UI_DIR"
echo "Verificando tipos (tsc -b)..."
npx tsc -b
for n in 1 2; do
  echo "Compilando UI-$n..."
  VITE_API_GATEWAY_URL="$URL" VITE_UI_NODE="UI-$n" \
    npx vite build --outDir "$SALIDA/ui$n" --emptyOutDir --logLevel warn
done

desplegar() {
  local n="$1" tomcat="$2" root="$2/webapps/ROOT"
  [ -d "$tomcat/webapps" ] || { echo "No existe $tomcat/webapps"; exit 1; }
  mkdir -p "$root/META-INF" "$root/WEB-INF"
  find "$root" -mindepth 1 -maxdepth 1 ! -name META-INF ! -name WEB-INF -exec rm -rf {} +
  cp -r "$SALIDA/ui$n/." "$root/"
  [ -f "$root/META-INF/context.xml" ] || cat > "$root/META-INF/context.xml" <<'EOF'
<Context>
  <Valve className="org.apache.catalina.valves.rewrite.RewriteValve"/>
  <WatchedResource>WEB-INF/rewrite.config</WatchedResource>
</Context>
EOF
  [ -f "$root/WEB-INF/rewrite.config" ] || cat > "$root/WEB-INF/rewrite.config" <<'EOF'
# Rutas del SPA: lo que no tiene extension (/stock, /ventas...) devuelve index.html
# Archivos reales (.js, .css, .svg, .jsp...) se sirven tal cual
RewriteRule !^/.*\.[A-Za-z0-9]+$ /index.html [L]
EOF
}
desplegar 1 "$TOMCAT1"
desplegar 2 "$TOMCAT2"
# Cruzar assets entre nodos.
cp "$SALIDA/ui1/assets/"* "$TOMCAT2/webapps/ROOT/assets/"
cp "$SALIDA/ui2/assets/"* "$TOMCAT1/webapps/ROOT/assets/"

echo
for p in 8180 8280; do
  js=$(curl -s "http://127.0.0.1:$p/" | grep -o '/assets/[^"]*\.js' | head -n1 || true)
  if [ -n "$js" ]; then
    echo "  :$p  index OK, $js -> $(curl -s -o /dev/null -w '%{content_type}' "http://127.0.0.1:$p$js")"
  else
    echo "  :$p  no responde (¿Tomcat apagado?). Los archivos ya quedaron copiados."
  fi
done

echo
echo "Listo. Recargar el navegador con Ctrl+F5."
echo "El gateway debe permitir en CORS_ALLOWED_ORIGINS el origen con que se abre la UI:"
echo "  http://localhost$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -v '^$' | sed 's/^/, http:\/\//' | tr -d '\n')"
