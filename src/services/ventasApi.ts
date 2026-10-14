import { http } from './http';
import { crudResource } from './resource';
import type {
  ClientePatchRequestDTO,
  ClienteRequestDTO,
  ClienteResponseDTO,
  EstadoFacturaVenta,
  FacturaVentaRequestDTO,
  FacturaVentaResponseDTO,
  MedioPagoDTO,
  MedioPagoRequestDTO,
  TimbradoCreateDTO,
  TimbradoDTO,
} from '../types/api';

/** Filtros propios del listado de facturas (además de la búsqueda `q`). */
export type FacturaVentaFilters = {
  idCliente?: number;
  idEmpleado?: number;
  idDeposito?: number;
  estado?: EstadoFacturaVenta;
  /** yyyy-MM-dd */
  fechaDesde?: string;
  fechaHasta?: string;
};

const clientes = crudResource<ClienteResponseDTO, ClienteRequestDTO>('/ventas/clientes');
const facturas = crudResource<FacturaVentaResponseDTO, FacturaVentaRequestDTO, FacturaVentaFilters>('/ventas/facturas-venta');

/** Microservicio de ventas (distrimarket-ms-featureC), a través del gateway. */
export const ventasApi = {
  clientes: {
    ...clientes,
    patch: (id: number, body: ClientePatchRequestDTO) =>
      http.patch<ClienteResponseDTO>(`/ventas/clientes/${id}`, body),
  },
  mediosPago: crudResource<MedioPagoDTO, MedioPagoRequestDTO>('/ventas/medios-pago'),
  timbrados: crudResource<TimbradoDTO, TimbradoCreateDTO>('/ventas/timbrados'),
  facturas: {
    ...facturas,
    /** Anular devuelve el stock; reemitir lo vuelve a descontar. */
    cambiarEstado: (id: number, estado: EstadoFacturaVenta) =>
      http.patch<FacturaVentaResponseDTO>(`/ventas/facturas-venta/${id}`, { estado }),
  },
};
