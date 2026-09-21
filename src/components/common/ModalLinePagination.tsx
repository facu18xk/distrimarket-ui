import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface ModalLinePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export const ModalLinePagination: React.FC<ModalLinePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  label = 'líneas',
}) => {
  if (totalItems <= pageSize) {
    return null;
  }

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between pt-2 pb-1 text-xs border-t border-slate-200 mt-2 bg-slate-50/70 px-3 py-1.5 rounded-lg">
      <span className="text-slate-500 text-[11px]">
        Mostrando <strong className="text-slate-800 font-semibold">{startIdx} - {endIdx}</strong> de{' '}
        <strong className="text-slate-800 font-semibold">{totalItems}</strong> {label}
      </span>

      <div className="flex items-center space-x-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-6 w-6 rounded-md p-0"
          title="Página anterior"
        >
          <ChevronLeft className="w-3 h-3" />
        </Button>

        <span className="px-2 py-0.5 font-bold text-slate-700 text-[11px] bg-white border border-slate-200 rounded-md">
          {currentPage} / {totalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="h-6 w-6 rounded-md p-0"
          title="Página siguiente"
        >
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

