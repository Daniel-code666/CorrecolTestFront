# Correcol · Gestión de clientes

Frontend Angular 21 standalone con formularios reactivos, Bootstrap 5.3 y CSS. Consume la API existente a través de `/api`.

La URL base está centralizada en `src/app/core/api.config.ts`. El valor predeterminado `/api` funciona tanto con el proxy de desarrollo como con Nginx en Docker. Para apuntar directamente a otra dirección se cambia únicamente `API_BASE_URL`; una URL absoluta requiere que el backend permita CORS para el origen del frontend.

## Desarrollo

Requiere Node.js 22.12 o superior dentro de la rama 22 y npm.

```powershell
npm ci
npm start
```

Abre http://localhost:4200. El proxy de desarrollo conecta con http://localhost:5080; puede ajustarse en `proxy.conf.json`. Si Docker ya ocupa el puerto 4200, usa `npm start -- --port 4201`.

## Docker Compose

El `compose.yaml` del backend incluye los servicios `db`, `api` y `front`. En el `.env` del backend:

```dotenv
FRONTEND_PATH='../Front'
FRONTEND_PORT=4200
```

`FRONTEND_PATH` debe apuntar a esta carpeta (ruta absoluta o relativa al Compose). En este equipo está configurada la ruta absoluta existente. Desde la carpeta del backend:

```powershell
docker compose up -d --build
docker compose ps
```

Frontend: http://localhost:4200. Nginx sirve Angular, permite recargar rutas internas y redirige `/api/` a `api:8080`. El servicio espera a que la API esté saludable. El Dockerfile incluye su propio healthcheck. No requiere CORS ni cambios al contrato del backend.

El script `scripts/integrate-compose.ps1` permite configurar esta integración en otra copia del backend mediante `-BackendPath` y `-FrontendPath`; conserva los servicios y credenciales existentes.

## Organización

- `core`: utilidades de HTTP, errores y diálogo accesible.
- `features/clientes`: modelos, servicio HTTP, listado y formulario compartido.
- `features/catalogos`: consultas geográficas, servicio CRUD y formulario compartido para países, departamentos y ciudades, con recuperación de todas las páginas de opciones.
- `app`: estructura visual y rutas cargadas bajo demanda.

El estado se mantiene en los componentes mediante signals y formularios reactivos; no se necesita una biblioteca global de estado. Los servicios encapsulan HTTP. Bootstrap aporta la cuadrícula y controles; Angular administra las interacciones sin JavaScript de Bootstrap ni jQuery.

## Funciones y reglas

- Gestión de países, departamentos y ciudades desde el menú: crear, consultar, editar y desactivar. Búsqueda por código/nombre, filtros de ubicación y estado, y paginación del servidor con 10, 20 o 30 registros. Los enlaces de países y departamentos abren sus registros dependientes.
- Los códigos de catálogos se asignan al crear y quedan bloqueados en edición, al igual que el país de un departamento y el departamento de una ciudad. Los países permiten editar nombre, ISO 1 (hasta 5 caracteres), ISO 2 (hasta 3) y capital; departamentos y ciudades permiten editar el nombre. Nombres y capital admiten hasta 100 caracteres.
- El borrado de catálogos es lógico y requiere confirmación. Los inactivos se pueden consultar, pero no editar ni reactivar. La API rechaza la desactivación con clientes asociados (incluso inactivos) o dependencias activas; el diálogo muestra el motivo y conserva los datos.
- Los formularios de creación y los clientes cargan opciones activas actualizadas, sin una caché persistente que oculte cambios. Las consultas incluyen nombres de padres inactivos para conservar el contexto de registros históricos.
- Listado paginado, filtros por identificación, razón social, tipo y estado.
- Creación y edición en un diálogo modal, conservando filtros y página del listado; el formulario consulta por ID antes de editar.
- Validaciones, mensajes de éxito y errores del servidor.
- País, departamento y ciudad en cascada. Se consultan todas las páginas; las selecciones dependientes se limpian al cambiar su padre y se ignoran respuestas obsoletas.
- Departamento/ciudad obligatorios solo si el catálogo tiene opciones. Identificación como texto, hasta 30 caracteres; razón social hasta 150.
- Exportación Excel de todos los resultados de los filtros aplicados.
- Desactivación con confirmación. No se ofrece reactivación porque la API no la implementa.
- Estados de carga, vacío, error y consulta de inactivos; diseño adaptable.

## Verificación

```powershell
npm run build
npm test
npx playwright test
```

La prueba de catálogo verifica la carga de 125 municipios en dos páginas. La prueba de navegador requiere el conjunto de contenedores en ejecución y Microsoft Edge instalado. Crea un cliente con prefijo `QA`, comprueba edición, exportación y desactivación, y lo conserva inactivo porque la API solo permite borrado lógico. Las capturas se guardan en `artifacts/`.

`tests/catalog-crud.spec.ts` verifica el CRUD real de un país, un departamento y una ciudad de prueba, los campos inmutables, el rechazo de duplicados y la restricción de desactivar padres con hijos activos. Los registros creados por la prueba quedan desactivados al terminar; los catálogos existentes no se modifican.

`.npmrc` activa `legacy-peer-deps` debido a un fallo de npm 10 al resolver dependencias opcionales de las herramientas de pruebas. `package-lock.json` fija las versiones reproducibles para desarrollo y Docker.
