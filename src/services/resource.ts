import { http, type QueryParams } from './http';
import { getAll, getPage, type PageQuery, type PageResult } from './pagination';

/**
 * Todos los recursos REST del backend siguen el mismo esquema
 * (/recurso, /recurso/{id}), así que el CRUD se escribe una sola vez.
 * Cada módulo solo declara su ruta y sus DTO.
 */
export interface ReadResource<TResponse, TFilters extends QueryParams = QueryParams> {
  list: (query?: PageQuery, filters?: TFilters) => Promise<PageResult<TResponse>>;
  all: (filters?: TFilters) => Promise<TResponse[]>;
  get: (id: number) => Promise<TResponse>;
}

export interface CrudResource<TResponse, TRequest, TFilters extends QueryParams = QueryParams>
  extends ReadResource<TResponse, TFilters> {
  create: (body: TRequest) => Promise<TResponse>;
  update: (id: number, body: TRequest) => Promise<TResponse>;
  /** Borrado lógico: el registro queda inactivo. */
  remove: (id: number) => Promise<void>;
}

export function readResource<TResponse, TFilters extends QueryParams = QueryParams>(
  path: string
): ReadResource<TResponse, TFilters> {
  return {
    list: (query, filters) => getPage<TResponse>(path, query, filters),
    all: (filters) => getAll<TResponse>(path, filters),
    get: (id) => http.get<TResponse>(`${path}/${id}`),
  };
}

export function crudResource<TResponse, TRequest, TFilters extends QueryParams = QueryParams>(
  path: string
): CrudResource<TResponse, TRequest, TFilters> {
  return {
    ...readResource<TResponse, TFilters>(path),
    create: (body) => http.post<TResponse>(path, body),
    update: (id, body) => http.put<TResponse>(`${path}/${id}`, body),
    remove: (id) => http.delete(`${path}/${id}`),
  };
}
