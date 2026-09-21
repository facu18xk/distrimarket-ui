/**
 * Base API Client response structures matching Spring Boot OpenAPI 3.0.3 Contract
 */

export interface PageMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
  status: number;
}

export interface PaginatedApiResponse<T> {
  content: T[];
  pageable: PageMetadata;
}

export interface QueryFilterParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Generic pagination and query helper to simulate backend database queries
 */
export function paginateAndFilter<T>(
  items: T[],
  params: QueryFilterParams,
  searchPredicate?: (item: T, search: string) => boolean,
  statusPredicate?: (item: T, status: string) => boolean
): PaginatedApiResponse<T> {
  const page = Math.max(1, params.page || 1);
  const size = Math.max(1, params.size || 10);
  let filtered = [...items];

  // Apply search query filter if predicate provided
  if (params.search && searchPredicate) {
    const s = params.search.toLowerCase().trim();
    filtered = filtered.filter((item) => searchPredicate(item, s));
  }

  // Apply status filter if predicate provided
  if (params.status && params.status !== 'all' && statusPredicate) {
    filtered = filtered.filter((item) => statusPredicate(item, params.status!));
  }

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * size;
  const content = filtered.slice(startIndex, startIndex + size);

  return {
    content,
    pageable: {
      page: safePage,
      size,
      totalElements,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrevious: safePage > 1,
    },
  };
}
