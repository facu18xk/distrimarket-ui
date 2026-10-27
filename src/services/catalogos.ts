import { inventarioApi } from './inventarioApi';
import { ventasApi } from './ventasApi';

/**
 * Catálogos chicos para llenar selectores y dar nombres a los ids. No se guardan en el
 * navegador: cada pantalla los pide al backend, que los responde desde su caché (Redis).
 * La UI solo guarda los datos del usuario (sesión, color y foto).
 */
export const catalogos = {
  depositos: () => inventarioApi.depositos.all(),
  categorias: () => inventarioApi.categorias.all(),
  marcas: () => inventarioApi.marcas.all(),
  mediosPago: () => ventasApi.mediosPago.all(),
  timbrados: () => ventasApi.timbrados.all(),
};

/** Depósitos activos, para los formularios. */
export const depositosActivos = async () => (await catalogos.depositos()).filter((d) => d.estado);
