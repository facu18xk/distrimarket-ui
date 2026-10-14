import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  label?: string;
}

/** Páginas a mostrar: primera, última y las vecinas de la actual; null = "...". */
function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(null);
    result.push(p);
  });
  return result;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  label = 'elementos',
}) => {
  const { theme } = useApp();
  const handleInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = parseInt(String(new FormData(e.currentTarget).get('pagina')), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
    } else {
      e.currentTarget.reset();
    }
  };

  return (
    <div className="mt-auto pt-4 pb-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 select-none">
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center space-x-1.5 h-8 text-xs font-semibold"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </Button>

        {totalItems !== undefined && (
          <span className="text-xs text-slate-400 hidden sm:inline-block">
            Total: <span className="font-semibold text-slate-700">{totalItems}</span> {label}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {pageWindow(currentPage, totalPages).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="px-1 text-slate-400 font-bold">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={currentPage === p ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(p)}
              style={currentPage === p ? { backgroundColor: theme.primaryHex, color: '#FFF' } : {}}
              className="w-8 h-8 p-0 text-xs font-bold"
            >
              {p}
            </Button>
          )
        )}
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center space-x-1.5 h-8 text-xs font-semibold"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>

        {totalPages > 1 && (
          <form onSubmit={handleInputSubmit} className="flex items-center space-x-1 text-xs">
            <span className="text-slate-400">Ir a página:</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              name="pagina"
              // La clave hace que el campo muestre la página actual cada vez que cambia.
              key={currentPage}
              defaultValue={currentPage}
              className="w-12 h-8 text-center p-1 text-xs font-bold"
            />
          </form>
        )}
      </div>
    </div>
  );
};
