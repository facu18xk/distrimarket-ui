import { http } from './http';
import { getPage, type PageQuery, type PageResult } from './pagination';
import { crudResource } from './resource';
import { invalidar } from '../lib/catalogCache';
import type {
  ClientePatchRequestDTO,
  ClienteRequestDTO,
  ClienteResponseDTO,
  EstadoFacturaVenta,
  FacturaVentaRequestDTO,
  FacturaVentaResponseDTO,
  FacturaVentaResumenDTO,
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

const FACTURAS = '/ventas/facturas-venta';

/** La factura completa se guarda en la sesión para los reportes; al cambiar se descarta. */
async function yOlvidarFactura<T>(id: number, operacion: Promise<T>): Promise<T> {
  const resultado = await operacion;
  invalidar(`factura-${id}`);
  return resultado;
}
const clientes = crudResource<ClienteResponseDTO, ClienteRequestDTO>('/ventas/clientes');

/** Microservicio de ventas (distrimarket-ms-featureC), a través del gateway. */
export const ventasApi = {
  clientes: {
    ...clientes,
    patch: (id: number, body: ClientePatchRequestDTO) =>
      http.patch<ClienteResponseDTO>(`/ventas/clientes/${id}`, body),
  },
  mediosPago: crudResource<MedioPagoDTO, MedioPagoRequestDTO>('/ventas/medios-pago', 'mediosPago'),
  timbrados: crudResource<TimbradoDTO, TimbradoCreateDTO>('/ventas/timbrados', 'timbrados'),
  /**
   * El listado trae solo cabeceras (FacturaVentaResumenDTO); la factura completa, con sus
   * líneas, se pide por id recién cuando se abre.
   */
  facturas: {
    list: (query?: PageQuery, filters?: FacturaVentaFilters): Promise<PageResult<FacturaVentaResumenDTO>> =>
      getPage<FacturaVentaResumenDTO>(FACTURAS, query, filters),
    get: (id: number) => http.get<FacturaVentaResponseDTO>(`${FACTURAS}/${id}`),
    create: (body: FacturaVentaRequestDTO) => http.post<FacturaVentaResponseDTO>(FACTURAS, body),
    update: (id: number, body: FacturaVentaRequestDTO) =>
      yOlvidarFactura(id, http.put<FacturaVentaResponseDTO>(`${FACTURAS}/${id}`, body)),
    remove: (id: number) => yOlvidarFactura(id, http.delete(`${FACTURAS}/${id}`)),
    /** Anular devuelve el stock; reemitir lo vuelve a descontar. */
    cambiarEstado: (id: number, estado: EstadoFacturaVenta) =>
      yOlvidarFactura(id, http.patch<FacturaVentaResponseDTO>(`${FACTURAS}/${id}`, { estado })),
  },
};
