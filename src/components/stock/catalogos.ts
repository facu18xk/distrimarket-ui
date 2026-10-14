import { inventarioApi } from '../../services';

/** Lo que necesitan los formularios de stock para llenar sus selectores. */
export async function cargarCatalogosStock() {
  const [productos, depositos, empleados] = await Promise.all([
    inventarioApi.productos.all(),
    inventarioApi.depositos.all(),
    inventarioApi.empleados.all({ estado: true }),
  ]);
  return { productos, depositos: depositos.filter((d) => d.estado), empleados };
}

export type CatalogosStock = Awaited<ReturnType<typeof cargarCatalogosStock>>;

// Cargas completas para los listados con búsqueda local (ver useLocalPagedResource).
export const cargarProductos = () => inventarioApi.productos.all();
export const cargarExistencias = () => inventarioApi.stock.all();
export const cargarAjustes = () => inventarioApi.ajustes.all();
export const cargarTransferencias = () => inventarioApi.transferencias.all();
export const cargarDepositos = () => inventarioApi.depositos.all();
