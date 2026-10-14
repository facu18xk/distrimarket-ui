import { useMemo, useState } from 'react';
import { useAsyncData } from './useAsyncData';
import type { PagedResource } from './usePagedResource';
import { DEFAULT_PAGE_SIZE } from '../services/pagination';

/** Sin tildes ni mayúsculas, para que "depósito" encuentre "DEPOSITO". */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Mismo resultado que usePagedResource, pero para recursos cuyo backend todavía
 * no busca por texto (inventario y compras): trae el listado completo una vez y
 * busca y pagina en el navegador. Sirve mientras los catálogos sean chicos;
 * cuando el backend acepte `q`, la pantalla cambia a usePagedResource y nada más.
 *
 * `loader` debe ser estable (función de módulo o useCallback).
 * `searchText` devuelve el texto donde se busca para cada fila.
 */
export function useLocalPagedResource<T>(
  loader: () => Promise<T[]>,
  searchText: (row: T) => string,
  pageSize = DEFAULT_PAGE_SIZE
): PagedResource<T> {
  const data = useAsyncData(loader);
  const [search, setSearchValue] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const rows = data.data ?? [];
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return rows;
    return rows.filter((row) => {
      const text = normalize(searchText(row));
      return terms.every((term) => text.includes(term));
    });
  }, [data.data, search, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  return {
    items: filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    totalPages,
    totalElements: filtered.length,
    loading: data.loading,
    error: data.error,
    search,
    // Una búsqueda nueva siempre empieza en la primera página.
    setSearch: (value) => {
      setSearchValue(value);
      setPage(1);
    },
    setPage,
    reload: data.reload,
  };
}
