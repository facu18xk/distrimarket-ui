import type { ReactNode } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Clases extra para la celda (por ejemplo, negrita en la columna principal). */
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;

/**
 * Tabla única de la aplicación: mismas cabeceras, mismos estados de carga,
 * error y vacío en todos los módulos. Cada pantalla solo declara sus columnas.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = 'No se encontraron registros.',
  onRowClick,
}: DataTableProps<T>) {
  const message = (content: ReactNode) => (
    <tr>
      <td colSpan={columns.length} className="py-10 text-center text-slate-400">
        {content}
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              {columns.map((column) => (
                <th key={column.header} className={cn('py-2 px-3', ALIGN[column.align ?? 'left'])}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn('divide-y divide-slate-100 text-slate-700 font-medium', loading && rows.length > 0 && 'opacity-50')}>
            {error
              ? message(
                  <div className="flex flex-col items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">{error}</span>
                    {onRetry && (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        <RefreshCw />
                        <span>Reintentar</span>
                      </Button>
                    )}
                  </div>
                )
              : loading && rows.length === 0
                ? message(
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando...
                    </span>
                  )
                : rows.length === 0
                  ? message(emptyMessage)
                  : rows.map((row) => (
                      <tr
                        key={rowKey(row)}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={cn('hover:bg-slate-50/60 transition-colors', onRowClick && 'cursor-pointer')}
                      >
                        {columns.map((column) => (
                          <td key={column.header} className={cn('py-1.5 px-3', ALIGN[column.align ?? 'left'], column.className)}>
                            {column.cell(row)}
                          </td>
                        ))}
                      </tr>
                    ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
