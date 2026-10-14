import type { ReactNode } from 'react';
import type { PagedResource } from '../../hooks/usePagedResource';
import { DataTable, type Column } from './DataTable';
import { PaginationBar } from './PaginationBar';
import { SearchAndFilterBar } from './SearchAndFilterBar';

interface PagedTableProps<T> {
  /** Resultado de usePagedResource: trae datos, búsqueda y página. */
  resource: PagedResource<T>;
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  /** Nombre en plural para el total ("clientes", "facturas"). */
  label: string;
  /** Sin placeholder no se muestra el buscador (recursos que el backend no permite buscar). */
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Filtros extra del módulo, a la derecha del buscador. */
  filters?: ReactNode;
  onRowClick?: (row: T) => void;
}

/**
 * Listado completo: buscador + tabla + paginación, todo resuelto en el servidor.
 * Es la pantalla base de cualquier recurso; los módulos solo aportan columnas.
 */
export function PagedTable<T>({
  resource,
  columns,
  rowKey,
  label,
  searchPlaceholder,
  emptyMessage,
  filters,
  onRowClick,
}: PagedTableProps<T>) {
  return (
    <div className="flex-1 flex flex-col">
      {(searchPlaceholder || filters) && (
        <SearchAndFilterBar
          placeholder={searchPlaceholder}
          searchValue={resource.search}
          onSearchChange={resource.setSearch}
          showSearch={Boolean(searchPlaceholder)}
        >
          {filters}
        </SearchAndFilterBar>
      )}

      <DataTable
        columns={columns}
        rows={resource.items}
        rowKey={rowKey}
        loading={resource.loading}
        error={resource.error}
        onRetry={resource.reload}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
      />

      <PaginationBar
        currentPage={resource.page}
        totalPages={resource.totalPages}
        onPageChange={resource.setPage}
        totalItems={resource.totalElements}
        label={label}
      />
    </div>
  );
}
