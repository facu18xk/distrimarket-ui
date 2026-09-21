import React, { useState } from 'react';
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

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages = 8,
  onPageChange,
  totalItems,
  label = 'elementos',
}) => {
  const { theme } = useApp();
  const [inputPage, setInputPage] = useState<string>(String(currentPage));

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputPage, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
    } else {
      setInputPage(String(currentPage));
    }
  };

  return (
    <div className="mt-auto pt-4 pb-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 select-none">
      {/* Left: Previous Button & Item Count */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
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

      {/* Center: Numeric Page Buttons */}
      <div className="flex items-center space-x-1">
        {[1, 2, 3].map((p) => {
          if (p > totalPages) return null;
          const isActive = currentPage === p;
          return (
            <Button
              key={p}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(p)}
              style={isActive ? { backgroundColor: theme.primaryHex, color: '#FFF' } : {}}
              className="w-8 h-8 p-0 text-xs font-bold"
            >
              {p}
            </Button>
          );
        })}

        {totalPages > 4 && <span className="px-1 text-slate-400 font-bold">...</span>}

        {totalPages > 3 && (
          <Button
            variant={currentPage === totalPages ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(totalPages)}
            style={currentPage === totalPages ? { backgroundColor: theme.primaryHex, color: '#FFF' } : {}}
            className="w-8 h-8 p-0 text-xs font-bold"
          >
            {totalPages}
          </Button>
        )}
      </div>

      {/* Right: Next Button and Go to page input */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center space-x-1.5 h-8 text-xs font-semibold"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>

        {/* Go to page direct jump */}
        <form onSubmit={handleInputSubmit} className="flex items-center space-x-1 text-xs">
          <span className="text-slate-400">Ir a página:</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            className="w-12 h-8 text-center p-1 text-xs font-bold"
          />
        </form>
      </div>
    </div>
  );
};

