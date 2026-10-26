import { conCache, invalidar } from '../lib/catalogCache';
import { inventarioApi } from './inventarioApi';
import { ventasApi } from './ventasApi';

/**
 * Catálogos chicos y casi fijos que se guardan en sessionStorage (ver lib/catalogCache):
 * llenan selectores y dan nombres a los ids sin volver a pedirlos en cada pantalla.
 *
 * Lo grande o lo que cambia seguido (productos, empleados, clientes, proveedores, facturas)
 * NO se guarda en el navegador: se pide por página (10) o por id cada vez, así el backend
 * responde desde Redis y cada GET queda a la vista en la caché del servidor.
 */
export const catalogos = {
  depositos: () => conCache('depositos', () => inventarioApi.depositos.all()),
  categorias: () => conCache('categorias', () => inventarioApi.categorias.all()),
  marcas: () => conCache('marcas', () => inventarioApi.marcas.all()),
  mediosPago: () => conCache('mediosPago', () => ventasApi.mediosPago.all()),
  timbrados: () => conCache('timbrados', () => ventasApi.timbrados.all()),
};

export type Catalogo = keyof typeof catalogos;

/** Después de crear, modificar o dar de baja algo de un catálogo. */
export const invalidarCatalogo = (...nombres: Catalogo[]) => invalidar(...nombres);

/** Depósitos activos, para los formularios. */
export const depositosActivos = async () => (await catalogos.depositos()).filter((d) => d.estado);
