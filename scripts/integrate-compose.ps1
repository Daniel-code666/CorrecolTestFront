param(
  [string]$BackendPath = 'C:\Users\Administrador\source\repos\CorrecolTest',
  [string]$FrontendPath = (Split-Path $PSScriptRoot -Parent)
)
$ErrorActionPreference = 'Stop'
$composePath = Join-Path $BackendPath 'compose.yaml'
$compose = [IO.File]::ReadAllText($composePath)
if ($compose -notmatch '(?m)^  front:') {
  $service = @'
  front:
    image: correcoltest-front:local
    build:
      context: ${FRONTEND_PATH:?Configure FRONTEND_PATH in .env}
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:${FRONTEND_PORT:-4200}:80"
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped

'@
  if ($compose -notmatch '(?m)^volumes:') { throw 'No se encontró la sección de volúmenes esperada.' }
  $compose = $compose -replace '(?m)^volumes:', ($service + "`nvolumes:")
  [IO.File]::WriteAllText($composePath, $compose, [Text.UTF8Encoding]::new($false))
}
$envPath = Join-Path $BackendPath '.env'
$environment = [IO.File]::ReadAllText($envPath)
$frontPath = $FrontendPath.Replace('\','/')
if ($environment -notmatch '(?m)^FRONTEND_PATH=') { $environment += "`nFRONTEND_PATH='$frontPath'`n" }
if ($environment -notmatch '(?m)^FRONTEND_PORT=') { $environment += "FRONTEND_PORT=4200`n" }
[IO.File]::WriteAllText($envPath, $environment, [Text.UTF8Encoding]::new($false))
$examplePath = Join-Path $BackendPath '.env.example'
$example = [IO.File]::ReadAllText($examplePath)
if ($example -notmatch '(?m)^FRONTEND_PATH=') { $example += "`n# Ruta del repositorio Angular (absoluta o relativa al compose.yaml).`nFRONTEND_PATH=../Front`nFRONTEND_PORT=4200`n"; [IO.File]::WriteAllText($examplePath, $example, [Text.UTF8Encoding]::new($false)) }
Write-Output 'Compose integrado con front. Variables locales configuradas sin mostrar credenciales.'
