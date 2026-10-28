import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';
import { errorMessage } from '../services/http';
import { DEFAULT_PAGE_SIZE, type PageQuery, type PageResult } from '../services/pagination';

export interface PagedResource<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalElements: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  /** Vuelve a pedir la página actual (después de crear o borrar: cambian el orden y el total). */
  reload: () => void;
  /** Reemplaza una fila con lo que devolvió el backend al modificarla, sin volver a pedir la página. */
  replaceItem: (isSame: (row: T) => boolean, updated: T) => void;
}

interface Options<F> {
  pageSize?: number;
  sort?: string;
  /** Filtros propios del recurso; al cambiar se vuelve a la página 1. */
  filters?: F;
  /** false = no consulta todavía (por ejemplo, una pestaña que no está visible). */
  enabled?: boolean;
}

/** Respuesta (o error) de una consulta, junto con la consulta a la que pertenece. */
interface Settled<T> {
  key: string;
  result: PageResult<T> | null;
  error: string | null;
}

/**
 * Listado paginado contra el backend: la búsqueda y la paginación las resuelve
 * el servidor. Une búsqueda con debounce, página actual, carga y error para
 * que cada pantalla no lo repita.
 *
 * `fetcher` debe ser estable entre renders (los métodos `list` de los servicios lo son).
 */
export function usePagedResource<T, F = undefined>(
  fetcher: (query: PageQuery, filters?: F) => Promise<PageResult<T>>,
  { pageSize = DEFAULT_PAGE_SIZE, sort, filters, enabled = true }: Options<F> = {}
): PagedResource<T> {
  const [search, setSearch] = useState('');
  const [version, setVersion] = useState(0);
  const debouncedSearch = useDebounce(search, 350);
  const filtersKey = JSON.stringify(filters ?? null);

  // La página elegida vale solo para la búsqueda y los filtros con los que se eligió:
  // al cambiar cualquiera de los dos, se vuelve sola a la primera.
  const scope = `${debouncedSearch}|${filtersKey}`;
  const [pageChoice, setPageChoice] = useState({ scope, page: 1 });
  const page = pageChoice.scope === scope ? pageChoice.page : 1;

  const requestKey = `${scope}|${page}|${pageSize}|${sort ?? ''}|${version}`;
  const [settled, setSettled] = useState<Settled<T>>({ key: '', result: null, error: null });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetcher({ page, size: pageSize, search: debouncedSearch, sort }, filtersKey === 'null' ? undefined : (JSON.parse(filtersKey) as F))
      .then((result) => {
        if (!cancelled) setSettled({ key: requestKey, result, error: null });
      })
      .catch((e: unknown) => {
        // Se conserva la última página buena para que la tabla no quede vacía detrás del error.
        if (!cancelled) setSettled((previous) => ({ key: requestKey, result: previous.result, error: errorMessage(e) }));
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher, page, pageSize, debouncedSearch, sort, filtersKey, enabled, requestKey]);

  const setPage = useCallback((next: number) => setPageChoice({ scope, page: next }), [scope]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const replaceItem = useCallback((isSame: (row: T) => boolean, updated: T) => {
    setSettled((previous) =>
      previous.result
        ? { ...previous, result: { ...previous.result, content: previous.result.content.map((row) => (isSame(row) ? updated : row)) } }
        : previous
    );
  }, []);

  // Cargando = la consulta vigente todavía no tiene respuesta.
  const current = settled.key === requestKey;

  return {
    items: settled.result?.content ?? [],
    page,
    totalPages: settled.result?.totalPages ?? 1,
    totalElements: settled.result?.totalElements ?? 0,
    loading: enabled && !current,
    error: current ? settled.error : null,
    search,
    setSearch,
    setPage,
    reload,
    replaceItem,
  };
}
