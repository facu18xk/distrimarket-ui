import { comprasApi, inventarioApi, ventasApi } from '../../services';

// Cargas completas para los listados con búsqueda local (ver useLocalPagedResource).
export const cargarProveedores = () => comprasApi.proveedores.all();
export const cargarFacturasCompra = () => comprasApi.facturas.all();
export const cargarOrdenes = () => comprasApi.ordenes.all();

/**
 * Lo que necesita la factura de compra para llenar sus selectores. Los medios
 * de pago son los mismos que usa ventas (se administran en Administración).
 */
export async function cargarCatalogosCompra() {
  const [proveedores, productos, depositos, mediosPago] = await Promise.all([
    comprasApi.proveedores.all(),
    inventarioApi.productos.all(),
    inventarioApi.depositos.all(),
    ventasApi.mediosPago.all(),
  ]);
  return {
    proveedores: proveedores.filter((p) => p.estado),
    productos,
    depositos: depositos.filter((d) => d.estado),
    mediosPago,
  };
}
