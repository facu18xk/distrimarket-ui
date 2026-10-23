import { catalogos, inventarioApi } from '../../services';

/** Lo que necesitan los formularios de stock para llenar sus selectores (catálogos en caché de la sesión). */
export async function cargarCatalogosStock() {
  const [productos, depositos, empleados] = await Promise.all([
    catalogos.productos(),
    catalogos.depositos(),
    catalogos.empleados(),
  ]);
  return { productos, depositos: depositos.filter((d) => d.estado), empleados: empleados.filter((e) => e.estado) };
}

export type CatalogosStock = Awaited<ReturnType<typeof cargarCatalogosStock>>;

// Cargas completas para los listados con búsqueda local (ver useLocalPagedResource).
// Productos y depósitos son catálogos: salen de la caché y se refrescan al modificarse.
export const cargarProductos = catalogos.productos;
export const cargarDepositos = catalogos.depositos;
export const cargarExistencias = () => inventarioApi.stock.all();
export const cargarAjustes = () => inventarioApi.ajustes.all();
export const cargarTransferencias = () => inventarioApi.transferencias.all();
