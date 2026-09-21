import { useState, useMemo } from 'react';

export interface UsePaginationOptions<T> {
  data: T[];
  initialPage?: number;
  pageSize?: number;
}

export interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  paginatedData: T[];
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
}

export function usePagination<T>({
  data,
  initialPage = 1,
  pageSize = 10,
}: UsePaginationOptions<T>): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page is valid when data changes
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, safePage, pageSize]);

  const setPage = (page: number) => {
    const target = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(target);
  };

  const nextPage = () => {
    if (safePage < totalPages) {
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    }
  };

  const prevPage = () => {
    if (safePage > 1) {
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  };

  const firstPage = () => setCurrentPage(1);
  const lastPage = () => setCurrentPage(totalPages);

  return {
    currentPage: safePage,
    totalPages,
    pageSize,
    totalItems,
    paginatedData,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    canNextPage: safePage < totalPages,
    canPrevPage: safePage > 1,
  };
}
