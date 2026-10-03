# Innova Carty Console · Frontend Web Application

Consola web de operaciones para el administrador de tienda: monitoreo en tiempo real de la flota de carritos inteligentes (US11) y gestión del catálogo con pesos nominales y tolerancias (US13). Construida con Angular 22, TypeScript y Angular Material, a partir de los mock-ups del capítulo 5 del informe.

## Funcionalidades del Sprint 1

| Vista | Ruta | User Story |
| :--- | :--- | :--- |
| Inicio de sesión del personal | `/sign-in` | US11 |
| Dashboard (KPIs, sesiones por hora, alertas en vivo, estado de la flota) | `/dashboard` | US11 |
| Lista de carritos con filtros por estado y búsqueda | `/carts` | US11 |
| Detalle del carrito, discrepancia de peso y desbloqueo con PIN | `/carts/:id` | US11 |
| Alertas por tipo (geocerca, peso, RFID, dispositivos) | `/alerts` | US11 |
| Catálogo, edición de tolerancias y alta de productos | `/catalog` | US13 |

Las vistas de monitoreo se refrescan cada 5 segundos.

## Estructura (por bounded context)

```
src/app/
├── iam/          # Inicio de sesión, AuthService y guards
├── monitoring/   # Carritos, sesiones de compra, alertas y eventos (US11)
│   ├── domain/model/        # Entidades y reglas (peso, tolerancia, estados)
│   ├── application/         # CartSupervisionService (desbloqueo, auditoría)
│   ├── infrastructure/      # Clientes REST de /api/v1
│   └── presentation/        # Páginas y diálogos
├── catalog/      # Productos y tolerancias (US13)
└── shared/       # Layout, BaseApiService, polling y componentes comunes
server/           # API fake con json-server (db.json = datos semilla)
api/              # Función serverless de Vercel que sirve la API fake desplegada
```

## API fake (Sprint 1)

El backend en Spring Boot se implementa en el Sprint 2. Mientras tanto la consola consume una API fake con [json-server](https://github.com/typicode/json-server) que expone los recursos bajo `/api/v1`, el mismo prefijo que usarán los servicios reales:

`/carts`, `/shopping-sessions`, `/alerts`, `/cart-events`, `/products`, `/stores`, `/session-stats`, `/audit-logs`, `POST /authentication/sign-in` y `POST /authentication/verify-pin`.

En local los cambios se guardan en `server/db.local.json` (ignorado por git). En Vercel los datos viven en memoria y vuelven al estado inicial cuando la función se reinicia.

**Cuenta demo:** `lucia.medina@retailco.pe` / `demo1234`, PIN de supervisor `2468`.

## Ejecutar en local

Requiere Node.js 22 o superior.

```bash
npm install
npm start          # API fake en :3000 + Angular en http://localhost:4200
npm run api:reset  # vuelve a los datos semilla
npm test           # pruebas unitarias (Vitest)
npm run build      # build de producción en dist/frontend-web-app
```

## Despliegue

Vercel, con el preset de Angular. `vercel.json` redirige `/api/v1/*` a la función `api/index.js` y el resto de rutas a `index.html`.

## Convenciones

GitFlow (`main`, `develop`, `feature/*`, `release/*`, `hotfix/*`), Conventional Commits y Semantic Versioning. Estilo de código según la guía de Angular y Prettier (`.prettierrc`).
