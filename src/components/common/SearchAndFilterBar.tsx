import React from 'react';
import { Search, X, Server } from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface SearchAndFilterBarProps {
  placeholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  // Optional categories kept for signature compatibility, but buttons are removed as requested
  categories?: string[];
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  backendFilterLabel?: string;
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  placeholder = 'Buscar...',
  searchValue,
  onSearchChange,
  backendFilterLabel = 'Filtro en Backend (API Query)',
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
      {/* Search Input using shadcn Input */}
      <div className="relative flex-1 max-w-lg">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
          <Search className="w-4 h-4" />
        </div>
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10 py-2.5 h-10 bg-white"
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

      {/* Backend filter indicator using shadcn Badge */}
      <div className="hidden sm:flex items-center">
        <Badge variant="outline" className="flex items-center space-x-1.5 px-3 py-1.5 bg-white font-medium text-slate-600">
          <Server className="w-3.5 h-3.5 text-emerald-500" />
          <span>{backendFilterLabel}</span>
        </Badge>
      </div>
    </div>
  );
};

