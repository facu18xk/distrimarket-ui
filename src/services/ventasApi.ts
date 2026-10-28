import { http } from './http';
import { getPage, type PageQuery, type PageResult } from './pagination';
import { crudResource } from './resource';
import type {
  ContactoMensajeRequestDTO,
  ContactoMensajeResponseDTO,
  PromocionDestinatariosDTO,
  PromocionRequestDTO,
  PromocionResponseDTO,
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

const promociones = crudResource<PromocionResponseDTO, PromocionRequestDTO>('/ventas/promociones');

const clientes = crudResource<ClienteResponseDTO, ClienteRequestDTO>('/ventas/clientes');

/** Microservicio de ventas (distrimarket-ms-featureC), a través del gateway. */
export const ventasApi = {
  clientes: {
    ...clientes,
    patch: (id: number, body: ClientePatchRequestDTO) =>
      http.patch<ClienteResponseDTO>(`/ventas/clientes/${id}`, body),
  },
  mediosPago: crudResource<MedioPagoDTO, MedioPagoRequestDTO>('/ventas/medios-pago'),
  timbrados: crudResource<TimbradoDTO, TimbradoCreateDTO>('/ventas/timbrados'),
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
      http.put<FacturaVentaResponseDTO>(`${FACTURAS}/${id}`, body),
    remove: (id: number) => http.delete(`${FACTURAS}/${id}`),
    /** Anular devuelve el stock; reemitir lo vuelve a descontar. */
    cambiarEstado: (id: number, estado: EstadoFacturaVenta) =>
      http.patch<FacturaVentaResponseDTO>(`${FACTURAS}/${id}`, { estado }),
  },
  /** Soporte: el formulario de contacto es público (se usa desde el login); la bandeja es de ADMIN. */
  soporte: {
    contacto: (body: ContactoMensajeRequestDTO) => http.post<ContactoMensajeResponseDTO>('/ventas/soporte/contacto', body),
    mensajes: (query?: PageQuery, filters?: { atendido?: boolean }): Promise<PageResult<ContactoMensajeResponseDTO>> =>
      getPage<ContactoMensajeResponseDTO>('/ventas/soporte/mensajes', query, filters),
    marcarAtendido: (id: number) => http.patch<ContactoMensajeResponseDTO>(`/ventas/soporte/mensajes/${id}/atendido`),
  },
  /** Promociones: un job las envía por correo a quienes compraron los productos. */
  promociones: {
    ...promociones,
    destinatarios: (id: number) => http.get<PromocionDestinatariosDTO>(`/ventas/promociones/${id}/destinatarios`),
    enviarAhora: (id: number) => http.post<PromocionResponseDTO>(`/ventas/promociones/${id}/enviar`, {}),
  },
};
