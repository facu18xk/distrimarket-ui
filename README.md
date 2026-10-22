# distrimarket-ui

Frontend de DistriMarket (React + TypeScript + Vite + Tailwind). Consume los microservicios
de ventas, inventario y compras **siempre a través del API Gateway**.

## Cómo ejecutar

1. Levantar el backend: Eureka, gateway (8080) y los microservicios.
2. Instalar dependencias y arrancar:

   ```bash
   npm install
   npm run dev
   ```

3. Abrir `http://localhost:5173`.

En desarrollo, Vite reenvía `/auth`, `/ventas`, `/inventario` y `/compras` al gateway (ver
`vite.config.ts`), así el navegador no necesita CORS. Si el gateway no está en
`http://localhost:8080`, copiar `.env.example` a `.env.local` y ajustar.

## Sesión, usuarios y roles

El login va contra el microservicio de seguridad (`POST /auth/login`): valida la contraseña
(BCrypt) y devuelve un **token JWT**. La UI lo guarda (`src/auth/session.ts`) y lo envía en
cada pedido (`Authorization: Bearer ...`); si el backend responde 401 (token vencido o
inválido) la sesión se cierra y vuelve al login con un aviso. También se cierra sola cuando
vence el token.

Usuario inicial: `admin` / `Admin123!` (lo crea distrimarket-ms-auth). Los demás usuarios
los registra un administrador en **Administración → Usuarios** (`/auth/usuarios`),
vinculados a un empleado o a una persona (por CI).

Un usuario puede tener **varios roles** y ve la suma de sus módulos:

| Rol | Ve |
|---|---|
| Administrador | Todo, más Administración (usuarios, timbrados, medios de pago) |
| Vendedor | Venta |
| Encargado de depósito | Stock |
| Encargado de compras | Compra |

La UI solo oculta lo que no corresponde (por ejemplo, "dar de baja" clientes y facturas
es solo para ADMIN); quien autoriza de verdad es el backend (gateway y cada microservicio).
Los roles y sus módulos se definen en `src/auth/roles.ts`.

## Estructura

```
src/
  auth/         sesión (token JWT) y roles
  services/     conexión con el backend (un archivo por microservicio)
  types/api.ts  DTO, espejo del openapi.yaml de distrimarket-common
  hooks/        usePagedResource, useAsyncAction, useAsyncData
  components/
    common/     piezas compartidas: PagedTable, DataTable, SubTabs, FormField...
    venta/ stock/ compra/ administracion/   un directorio por módulo
```

## Cómo agregar una pantalla

Todas las pantallas siguen el mismo esquema. El ejemplo más corto es
`src/components/administracion/CatalogosPanel.tsx`.

1. **DTO**: agregarlos en `src/types/api.ts`.
2. **Servicio**: una línea en el archivo del microservicio.
   `crudResource<Respuesta, Request>('/inventario/marcas')` ya da `list`, `all`, `get`,
   `create`, `update` y `remove`; `readResource` da solo las lecturas.
3. **Listado**: `usePagedResource(api.recurso.list)` trae datos, búsqueda y paginación del
   servidor; se dibuja con `<PagedTable>` declarando solo las columnas.
4. **Formulario**: `ModalDialog` + `FormField` + `FormActions`, y `useAsyncAction` para
   guardar y mostrar el mensaje de error que devuelve el backend.

Los tres microservicios paginan con nombres distintos; `services/pagination.ts` los unifica,
así que las pantallas no necesitan saber de cuál viene el dato.

## Pendiente

- Promociones no tiene microservicio: el módulo se quitó hasta que exista.
- El formulario de contacto no tiene backend: el mensaje no se envía ni se guarda.
