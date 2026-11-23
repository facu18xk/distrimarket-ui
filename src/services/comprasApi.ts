import { http } from './http';
import { crudResource, readResource } from './resource';
import type {
  FacturaCompraRequestDTO,
  FacturaCompraResponseDTO,
  OrdenCompraDTO,
  ProveedorRequestDTO,
  ProveedorResponseDTO,
} from '../types/api';

/** Filtros del listado de facturas de compra (además de la búsqueda libre `q`). */
export type FacturaCompraFilters = {
  proveedorId?: number;
  estado?: string;
  /** yyyy-MM-dd */
  desde?: string;
  /** yyyy-MM-dd */
  hasta?: string;
  numeroFactura?: string;
};

/** Filtros del listado de órdenes de compra. */
export type OrdenCompraFilters = {
  proveedorId?: number;
  estado?: string;
};

/** Filtros del listado de proveedores. */
export type ProveedorFilters = {
  estado?: boolean;
};

export type ReporteComprasFiltros = {
  desde: string;
  hasta: string;
  proveedorId?: number;
  depositoId?: number;
  estado?: 'ACTIVA' | 'ANULADA';
};

export interface GrupoReporteCompras {
  id: number;
  nombre: string;
  facturas: number;
  total: number;
}

export interface ReporteCompras {
  depositoId: number | null;
  resumen: { activas: number; totalComprado: number; anuladas: number; totalAnulado: number };
  porDia: { fecha: string; facturas: number; total: number }[];
  porProveedor: GrupoReporteCompras[];
  porMedioPago: GrupoReporteCompras[];
  productos: (GrupoReporteCompras & { unidades: number })[];
}

/** Microservicio de compras (distrimarket-ms-featureA), a través del gateway. */
export const comprasApi = {
  proveedores: crudResource<ProveedorResponseDTO, ProveedorRequestDTO, ProveedorFilters>('/compras/proveedores'),
  facturas: {
    ...crudResource<FacturaCompraResponseDTO, FacturaCompraRequestDTO, FacturaCompraFilters>('/compras/facturas'),
    anular: (id: number) => http.patch<FacturaCompraResponseDTO>(`/compras/facturas/${id}/anular`),
    reporte: (filtros: ReporteComprasFiltros) => http.get<ReporteCompras>('/compras/facturas/reporte', filtros),
  },
  ordenes: readResource<OrdenCompraDTO, OrdenCompraFilters>('/compras/ordenes'),
};
