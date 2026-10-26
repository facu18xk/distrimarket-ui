import { catalogos, depositosActivos } from '../../services';

/**
 * Catálogos chicos que necesita la factura de compra (de la sesión). Proveedores y productos
 * se eligen con selectores paginados. Los medios de pago son los mismos que usa ventas.
 */
export async function cargarCatalogosCompra() {
  const [depositos, mediosPago] = await Promise.all([depositosActivos(), catalogos.mediosPago()]);
  return { depositos, mediosPago };
}
