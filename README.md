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

En desarrollo, Vite reenvía `/ventas`, `/inventario` y `/compras` al gateway (ver
`vite.config.ts`), así el navegador no necesita CORS. Si el gateway no está en
`http://localhost:8080`, copiar `.env.example` a `.env.local` y ajustar.

## Usuarios y roles

El login es **provisorio**: el backend todavía no tiene autenticación, así que los usuarios
viven en el navegador (`src/auth/userStore.ts`, donde también están los usuarios de ejemplo).
No es seguridad real.

| Rol | Ve |
|---|---|
| Administrador | Todo, más Administración (usuarios, timbrados, medios de pago) |
| Vendedor | Venta, Promociones |
| Encargado de depósito | Stock |
| Encargado de compras | Compra, Stock |

Los roles y sus módulos se definen en `src/auth/roles.ts`.

## Estructura

```
src/
  auth/         roles y usuarios
  services/     conexión con el backend (un archivo por microservicio)
  types/api.ts  DTO, espejo del openapi.yaml de distrimarket-common
  hooks/        usePagedResource, useAsyncAction, useAsyncData
  components/
    common/     piezas compartidas: PagedTable, DataTable, SubTabs, FormField...
    venta/ stock/ compra/ promociones/ administracion/   un directorio por módulo
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

- Stock y Compra están conectados solo en lectura.
- Promociones y el formulario de contacto no tienen backend: sus datos no se guardan.
