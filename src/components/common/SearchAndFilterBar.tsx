import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';

interface SearchAndFilterBarProps {
  placeholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  /** false = solo se muestran los filtros (children). */
  showSearch?: boolean;
  /** Filtros propios del módulo (selectores, fechas), a la derecha del buscador. */
  children?: React.ReactNode;
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  placeholder = 'Buscar...',
  searchValue,
  onSearchChange,
  showSearch = true,
  children,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3">
      {showSearch ? (
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 z-10">
            <Search className="w-4 h-4" />
          </div>
          <Input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9 pr-9 h-9 bg-white"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors z-10"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
};
