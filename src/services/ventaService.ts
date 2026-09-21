import { VentaItem, ClienteItem } from '../types';
import { paginateAndFilter, PaginatedApiResponse, QueryFilterParams } from './apiClient';

export const ventaService = {
  getVentas: (ventas: VentaItem[], params: QueryFilterParams): PaginatedApiResponse<VentaItem> => {
    return paginateAndFilter(
      ventas,
      params,
      (v, search) =>
        v.numeroComprobante.toLowerCase().includes(search) ||
        v.cliente.toLowerCase().includes(search) ||
        v.responsable.toLowerCase().includes(search) ||
        v.id.toLowerCase().includes(search)
    );
  },

  getClientes: (clientes: ClienteItem[], params: QueryFilterParams): PaginatedApiResponse<ClienteItem> => {
    return paginateAndFilter(
      clientes,
      params,
      (c, search) =>
        c.nombre.toLowerCase().includes(search) ||
        c.telefono.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.tipo.toLowerCase().includes(search)
    );
  },
};
