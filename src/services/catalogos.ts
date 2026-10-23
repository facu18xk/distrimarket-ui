import { conCache, invalidar } from '../lib/catalogCache';
import { comprasApi } from './comprasApi';
import { inventarioApi } from './inventarioApi';
import { ventasApi } from './ventasApi';

/**
 * Catálogos compartidos por toda la UI, pedidos una sola vez por sesión (ver lib/catalogCache).
 * Se usan para llenar selectores y para mostrar nombres en lugar de ids.
 * Cada función es estable, así que sirve directamente con useAsyncData.
 */
export const catalogos = {
  productos: () => conCache('productos', () => inventarioApi.productos.all()),
  /** Todos (también inactivos): una factura vieja puede tener un vendedor que ya no está. */
  empleados: () => conCache('empleados', () => inventarioApi.empleados.all()),
  depositos: () => conCache('depositos', () => inventarioApi.depositos.all()),
  categorias: () => conCache('categorias', () => inventarioApi.categorias.all()),
  marcas: () => conCache('marcas', () => inventarioApi.marcas.all()),
  mediosPago: () => conCache('mediosPago', () => ventasApi.mediosPago.all()),
  timbrados: () => conCache('timbrados', () => ventasApi.timbrados.all()),
  proveedores: () => conCache('proveedores', () => comprasApi.proveedores.all()),
};

export type Catalogo = keyof typeof catalogos;

/** Después de crear, modificar o dar de baja algo de un catálogo. */
export const invalidarCatalogo = (...nombres: Catalogo[]) => invalidar(...nombres);
