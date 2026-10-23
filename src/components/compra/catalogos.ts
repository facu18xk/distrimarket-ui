import { catalogos, comprasApi } from '../../services';

// Cargas completas para los listados con búsqueda local (ver useLocalPagedResource).
// Proveedores es un catálogo: sale de la caché y se refresca al crear, modificar o dar de baja.
export const cargarProveedores = catalogos.proveedores;
export const cargarFacturasCompra = () => comprasApi.facturas.all();
export const cargarOrdenes = () => comprasApi.ordenes.all();

/**
 * Lo que necesita la factura de compra para llenar sus selectores, desde los catálogos en caché.
 * Los medios de pago son los mismos que usa ventas (se administran en Administración).
 */
export async function cargarCatalogosCompra() {
  const [proveedores, productos, depositos, mediosPago] = await Promise.all([
    catalogos.proveedores(),
    catalogos.productos(),
    catalogos.depositos(),
    catalogos.mediosPago(),
  ]);
  return {
    proveedores: proveedores.filter((p) => p.estado),
    productos,
    depositos: depositos.filter((d) => d.estado),
    mediosPago,
  };
}
