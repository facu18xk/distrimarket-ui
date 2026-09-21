import { ProductItem, StockAdjustmentItem, StockMovementItem, DepositoItem } from '../types';
import { paginateAndFilter, PaginatedApiResponse, QueryFilterParams } from './apiClient';

export const stockService = {
  getProducts: (products: ProductItem[], params: QueryFilterParams, depositoFilter?: string): PaginatedApiResponse<ProductItem> => {
    const list = depositoFilter && depositoFilter !== 'todos'
      ? products.filter((p) => p.deposito.toLowerCase() === depositoFilter.toLowerCase())
      : products;
    return paginateAndFilter(
      list,
      params,
      (p, search) =>
        p.nombre.toLowerCase().includes(search) ||
        p.categoria.toLowerCase().includes(search) ||
        p.id.toLowerCase().includes(search) ||
        p.deposito.toLowerCase().includes(search)
    );
  },

  getAdjustments: (adjustments: StockAdjustmentItem[], params: QueryFilterParams, depositoFilter?: string): PaginatedApiResponse<StockAdjustmentItem> => {
    const list = depositoFilter && depositoFilter !== 'todos'
      ? adjustments.filter((a) => a.deposito.toLowerCase() === depositoFilter.toLowerCase())
      : adjustments;
    return paginateAndFilter(
      list,
      params,
      (a, search) =>
        a.id.toLowerCase().includes(search) ||
        a.motivo.toLowerCase().includes(search) ||
        a.deposito.toLowerCase().includes(search) ||
        a.responsable.toLowerCase().includes(search)
    );
  },

  getMovements: (movements: StockMovementItem[], params: QueryFilterParams, depositoFilter?: string): PaginatedApiResponse<StockMovementItem> => {
    const list = depositoFilter && depositoFilter !== 'todos'
      ? movements.filter((m) =>
          m.depOrigen.toLowerCase() === depositoFilter.toLowerCase() ||
          m.depDestino.toLowerCase() === depositoFilter.toLowerCase()
        )
      : movements;
    return paginateAndFilter(
      list,
      params,
      (m, search) =>
        m.id.toLowerCase().includes(search) ||
        m.producto.toLowerCase().includes(search) ||
        m.depOrigen.toLowerCase().includes(search) ||
        m.depDestino.toLowerCase().includes(search) ||
        m.responsable.toLowerCase().includes(search)
    );
  },

  getDepositos: (depositos: DepositoItem[], params: QueryFilterParams): PaginatedApiResponse<DepositoItem> => {
    return paginateAndFilter(
      depositos,
      params,
      (d, search) =>
        d.nombre.toLowerCase().includes(search) ||
        d.direccion.toLowerCase().includes(search) ||
        d.id.toLowerCase().includes(search)
    );
  },
};
