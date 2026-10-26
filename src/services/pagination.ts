import { http, type QueryParams } from './http';

/** Página tal como la consume la UI: siempre igual, venga del microservicio que venga. */
export interface PageResult<T> {
  content: T[];
  /** Base 1, como la ve el usuario. */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Parámetros de listado de la UI (página base 1). */
export interface PageQuery {
  page?: number;
  size?: number;
  /** Texto libre; el backend lo recibe como `q`. */
  search?: string;
  /** Ej.: "id,desc". */
  sort?: string;
}

/**
 * Los tres microservicios paginan con nombres distintos:
 *  - ventas:     content, pageNumber, pageSize, totalElements, totalPages
 *  - inventario: content, number, size, totalElements, totalPages (Page de Spring)
 *  - compras:    contenido, numeroPagina, tamanio, totalElementos, totalPaginas
 * Aquí se unifican para que tablas y paginadores no sepan de dónde vino el dato.
 */
interface RawPage<T> {
  content?: T[];
  contenido?: T[];
  pageNumber?: number;
  number?: number;
  numeroPagina?: number;
  pageSize?: number;
  size?: number;
  tamanio?: number;
  totalElements?: number;
  totalElementos?: number;
  totalPages?: number;
  totalPaginas?: number;
}

export function normalizePage<T>(raw: RawPage<T>): PageResult<T> {
  const content = raw.content ?? raw.contenido ?? [];
  const zeroBased = raw.pageNumber ?? raw.number ?? raw.numeroPagina ?? 0;
  return {
    content,
    page: zeroBased + 1,
    size: raw.pageSize ?? raw.size ?? raw.tamanio ?? content.length,
    totalElements: raw.totalElements ?? raw.totalElementos ?? content.length,
    totalPages: Math.max(1, raw.totalPages ?? raw.totalPaginas ?? 1),
  };
}

export const DEFAULT_PAGE_SIZE = 10;

/** Tope de un catálogo chico pedido de una vez (el máximo de página que aceptan los microservicios). */
export const CATALOGO_MAX = 100;

/** GET paginado: traduce la página base 1 de la UI a la base 0 del backend. */
export async function getPage<T>(path: string, query: PageQuery = {}, filters: QueryParams = {}): Promise<PageResult<T>> {
  const raw = await http.get<RawPage<T>>(path, {
    page: Math.max(0, (query.page ?? 1) - 1),
    size: query.size ?? DEFAULT_PAGE_SIZE,
    q: query.search?.trim() || undefined,
    sort: query.sort,
    ...filters,
  });
  return normalizePage(raw);
}

/**
 * Trae un catálogo corto completo en una sola página (para llenar un selector).
 * Solo para catálogos chicos (medios de pago, timbrados, categorías, marcas, depósitos);
 * productos, empleados, clientes y proveedores se eligen con un buscador paginado.
 */
export async function getAll<T>(path: string, filters: QueryParams = {}, limit = CATALOGO_MAX): Promise<T[]> {
  return (await getPage<T>(path, { page: 1, size: limit }, filters)).content;
}
