import { CompraItem, ProveedorItem } from '../types';
import { paginateAndFilter, PaginatedApiResponse, QueryFilterParams } from './apiClient';

export const compraService = {
  getCompras: (compras: CompraItem[], params: QueryFilterParams): PaginatedApiResponse<CompraItem> => {
    return paginateAndFilter(
      compras,
      params,
      (c, search) =>
        c.numeroFactura.toLowerCase().includes(search) ||
        c.proveedor.toLowerCase().includes(search) ||
        c.responsable.toLowerCase().includes(search) ||
        c.id.toLowerCase().includes(search)
    );
  },

  getProveedores: (proveedores: ProveedorItem[], params: QueryFilterParams): PaginatedApiResponse<ProveedorItem> => {
    return paginateAndFilter(
      proveedores,
      params,
      (p, search) =>
        p.nombre.toLowerCase().includes(search) ||
        p.ruc.toLowerCase().includes(search) ||
        p.contactoPrincipal.toLowerCase().includes(search) ||
        p.email.toLowerCase().includes(search)
    );
  },
};
