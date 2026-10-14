import { type PromocionItem } from '../types';
import { paginateAndFilter, type PaginatedApiResponse, type QueryFilterParams } from './apiClient';

export const promocionService = {
  getPromociones: (promociones: PromocionItem[], params: QueryFilterParams): PaginatedApiResponse<PromocionItem> => {
    return paginateAndFilter(
      promociones,
      params,
      (p, search) =>
        p.nombre.toLowerCase().includes(search) ||
        p.tipo.toLowerCase().includes(search) ||
        p.id.toLowerCase().includes(search)
    );
  },
};
