import { http } from './http';
import { crudResource, readResource } from './resource';
import type {
  AjusteStockRequestDTO,
  AjusteStockResponseDTO,
  CategoriaResponseDTO,
  DepositoResponseDTO,
  EmpleadoResponseDTO,
  MarcaResponseDTO,
  ProductoRequestDTO,
  ProductoResponseDTO,
  StockDepositoRequestDTO,
  StockDepositoResponseDTO,
  TransferenciaStockRequestDTO,
  TransferenciaStockResponseDTO,
} from '../types/api';

const ajustes = readResource<AjusteStockResponseDTO, { depositoId?: number; empleadoId?: number }>('/inventario/ajustes-stock');
const transferencias = readResource<TransferenciaStockResponseDTO>('/inventario/transferencias-stock');

/** Microservicio de inventario (distrimarket-ms-featureB), a través del gateway. */
export const inventarioApi = {
  productos: crudResource<ProductoResponseDTO, ProductoRequestDTO, { categoriaId?: number; marcaId?: number }>('/inventario/productos'),
  categorias: readResource<CategoriaResponseDTO>('/inventario/categorias'),
  marcas: readResource<MarcaResponseDTO>('/inventario/marcas'),
  depositos: readResource<DepositoResponseDTO>('/inventario/depositos'),
  empleados: readResource<EmpleadoResponseDTO, { cargo?: string; estado?: boolean }>('/inventario/empleados'),
  stock: {
    ...crudResource<StockDepositoResponseDTO, StockDepositoRequestDTO, { depositoId?: number; productoId?: number }>('/inventario/stock-depositos'),
    deProducto: (depositoId: number, productoId: number) =>
      http.get<StockDepositoResponseDTO>(`/inventario/stock-depositos/deposito/${depositoId}/producto/${productoId}`),
  },
  /** Los ajustes y las transferencias son históricos: se crean, no se editan ni se borran. */
  ajustes: {
    ...ajustes,
    create: (body: AjusteStockRequestDTO) => http.post<AjusteStockResponseDTO>('/inventario/ajustes-stock', body),
  },
  transferencias: {
    ...transferencias,
    create: (body: TransferenciaStockRequestDTO) =>
      http.post<TransferenciaStockResponseDTO>('/inventario/transferencias-stock', body),
  },
};
