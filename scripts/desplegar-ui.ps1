<#
.SYNOPSIS
  Compila la UI para UI-1 y UI-2 apuntando a un gateway y la copia a los dos Tomcat (Windows).

.EJEMPLOS
  .\scripts\desplegar-ui.ps1 -Gateway 10.99.213.20        # gateway en otra PC (puerto 8080)
  .\scripts\desplegar-ui.ps1 -Gateway 192.168.0.15:8080
  .\scripts\desplegar-ui.ps1 -Gateway localhost           # gateway en esta PC
  .\scripts\desplegar-ui.ps1 -Gateway 10.0.0.5 -Tomcat1 D:\tomcat-ui1 -Tomcat2 D:\tomcat-ui2

  Si Windows no deja ejecutar scripts:
  powershell -ExecutionPolicy Bypass -File .\scripts\desplegar-ui.ps1 -Gateway 10.0.0.5

.QUE HACE
  1. Compila la UI dos veces (VITE_UI_NODE=UI-1 y UI-2) con VITE_API_GATEWAY_URL=http://<Gateway>.
  2. Vacía webapps\ROOT de cada Tomcat (conserva META-INF y WEB-INF: regla de rutas del SPA).
  3. Copia cada build a su Tomcat y cruza los assets (Apache alterna cada pedido entre nodos,
     y el index.html de un nodo puede pedirle su .js al otro).
  No hace falta reiniciar los Tomcat: son archivos estáticos.
#>
param(
  [Parameter(Mandatory = $true)][string]$Gateway,
  [string]$Tomcat1 = 'C:\tomcat-ui1',
  [string]$Tomcat2 = 'C:\tomcat-ui2'
)
$ErrorActionPreference = 'Stop'
$Ui = Split-Path -Parent $PSScriptRoot

# --- URL del gateway ---------------------------------------------------------
$url = $Gateway.Trim().TrimEnd('/')
if ($url -notmatch '^https?://') { $url = "http://$url" }
if ($url -notmatch ':\d+$')      { $url = "${url}:8080" }
Write-Host "Gateway: $url" -ForegroundColor Cyan

$uri = [Uri]$url
$ok = Test-NetConnection $uri.Host -Port $uri.Port -InformationLevel Quiet -WarningAction SilentlyContinue
if ($ok) { Write-Host "  El gateway responde en $($uri.Host):$($uri.Port)" -ForegroundColor Green }
else     { Write-Host "  AVISO: no se pudo conectar a $($uri.Host):$($uri.Port) (firewall, otra red o gateway apagado). Se compila igual." -ForegroundColor Yellow }

# --- Node (PATH o el que trae IntelliJ) --------------------------------------
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  $node = Get-ChildItem "$env:LOCALAPPDATA\JetBrains" -Recurse -Filter node.exe -Depth 7 -ErrorAction SilentlyContinue |
          Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $node) { throw 'No se encontró node.exe (ni en el PATH ni en IntelliJ).' }
$tsc  = Join-Path $Ui 'node_modules\typescript\bin\tsc'
$vite = Join-Path $Ui 'node_modules\vite\bin\vite.js'
if (-not (Test-Path $vite)) { throw "Faltan dependencias: correr 'npm install' en $Ui" }

# --- Compilar ----------------------------------------------------------------
$salida = Join-Path $env:TEMP 'distrimarket-ui-build'
Push-Location $Ui
# Vite/tsc escriben avisos en stderr; en PowerShell 5.1 con 'Stop' eso corta el script.
# Durante la compilación el resultado se controla con $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
try {
  Write-Host 'Verificando tipos (tsc -b)...' -ForegroundColor Cyan
  & $node $tsc -b 2>&1 | ForEach-Object { "$_" }
  if ($LASTEXITCODE -ne 0) { throw 'tsc falló' }

  # Las variables de entorno tienen prioridad sobre .env.local en Vite.
  $env:VITE_API_GATEWAY_URL = $url
  foreach ($n in 1, 2) {
    $env:VITE_UI_NODE = "UI-$n"
    Write-Host "Compilando UI-$n..." -ForegroundColor Cyan
    & $node $vite build --outDir (Join-Path $salida "ui$n") --emptyOutDir --logLevel warn 2>&1 | ForEach-Object { "$_" }
    if ($LASTEXITCODE -ne 0) { throw "vite build UI-$n falló" }
  }
} finally {
  Remove-Item Env:VITE_API_GATEWAY_URL, Env:VITE_UI_NODE -ErrorAction SilentlyContinue
  Pop-Location
  $ErrorActionPreference = 'Stop'
}

# --- Desplegar ---------------------------------------------------------------
$contextXml = @"
<Context>
  <Valve className="org.apache.catalina.valves.rewrite.RewriteValve"/>
  <WatchedResource>WEB-INF/rewrite.config</WatchedResource>
</Context>
"@
$rewrite = @"
# Rutas del SPA: lo que no tiene extension (/stock, /ventas...) devuelve index.html
# Archivos reales (.js, .css, .svg, .jsp...) se sirven tal cual
RewriteRule !^/.*\.[A-Za-z0-9]+$ /index.html [L]
"@

$tomcats = @{ 1 = $Tomcat1; 2 = $Tomcat2 }
foreach ($n in 1, 2) {
  if (-not (Test-Path (Join-Path $tomcats[$n] 'webapps'))) { throw "No existe $($tomcats[$n])\webapps" }
  $root = Join-Path $tomcats[$n] 'webapps\ROOT'
  New-Item -ItemType Directory -Force $root | Out-Null
  Get-ChildItem $root -Force | Where-Object { $_.Name -notin 'META-INF', 'WEB-INF' } | Remove-Item -Recurse -Force
  Copy-Item (Join-Path $salida "ui$n\*") $root -Recurse -Force

  New-Item -ItemType Directory -Force (Join-Path $root 'META-INF'), (Join-Path $root 'WEB-INF') | Out-Null
  if (-not (Test-Path (Join-Path $root 'META-INF\context.xml')))  { [IO.File]::WriteAllText((Join-Path $root 'META-INF\context.xml'), $contextXml) }
  if (-not (Test-Path (Join-Path $root 'WEB-INF\rewrite.config'))) { [IO.File]::WriteAllText((Join-Path $root 'WEB-INF\rewrite.config'), $rewrite) }
}
# Cruzar assets entre nodos.
Copy-Item (Join-Path $salida 'ui1\assets\*') (Join-Path $Tomcat2 'webapps\ROOT\assets') -Force
Copy-Item (Join-Path $salida 'ui2\assets\*') (Join-Path $Tomcat1 'webapps\ROOT\assets') -Force

# --- Verificar ---------------------------------------------------------------
Write-Host ''
foreach ($p in 8180, 8280) {
  try {
    $r  = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$p/" -TimeoutSec 5
    $js = [regex]::Match($r.Content, '/assets/[^"]+\.js').Value
    $t  = (Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$p$js" -TimeoutSec 5).Headers['Content-Type']
    Write-Host "  :$p  index OK, $js -> $t" -ForegroundColor Green
  } catch { Write-Host "  :$p  no responde (¿Tomcat apagado?). Los archivos ya quedaron copiados." -ForegroundColor Yellow }
}

$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
       Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
       Select-Object -ExpandProperty IPAddress
Write-Host ''
Write-Host 'Listo. Recargar el navegador con Ctrl+F5.' -ForegroundColor Cyan
Write-Host 'El gateway debe permitir en CORS_ALLOWED_ORIGINS el origen con que se abre la UI:'
Write-Host ('  http://localhost' + (($ips | ForEach-Object { ", http://$_" }) -join ''))
