/**
 * DTO de los microservicios, espejo del contrato único
 * (distrimarket-common/src/main/resources/static/openapi.yaml).
 * Si cambia el contrato, cambia este archivo.
 */

// ------------------------------------------------------------------ Comunes

export type TipoPersona = 'FISICA' | 'JURIDICA';

export interface PersonaRequestDTO {
  tipoPersona: TipoPersona;
  nombreCompleto: string;
  ci?: string;
  ruc?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}

export interface PersonaResponseDTO extends PersonaRequestDTO {
  id: number;
}

// ------------------------------------------------------------------- Ventas

export interface ClienteRequestDTO {
  persona: PersonaRequestDTO;
}

/** PATCH: solo los campos de persona que cambian. */
export interface ClientePatchRequestDTO {
  persona: Partial<PersonaRequestDTO>;
}

export interface ClienteResponseDTO {
  idCliente: number;
  estado: boolean;
  persona: PersonaResponseDTO;
}

export interface MedioPagoRequestDTO {
  nombre: string;
}

export interface MedioPagoDTO extends MedioPagoRequestDTO {
  idMedioPago: number;
  activo?: boolean;
}

export interface TimbradoCreateDTO {
  numeroTimbrado: string;
  fechaInicio: string;
  fechaVencimiento: string;
  sucursal?: string;
  puntoExpedicion?: string;
}

export interface TimbradoDTO extends TimbradoCreateDTO {
  idTimbrado: number;
  activo?: boolean;
}

export type EstadoFacturaVenta = 'EMITIDA' | 'ANULADA';

export interface FacturaVentaDetalleRequestDTO {
  idProducto: number;
  cantidad: number;
}

export interface FacturaVentaRequestDTO {
  numeroFactura: string;
  fechaEmision?: string;
  idCliente: number;
  idEmpleado: number;
  idDeposito: number;
  idMedioPago: number;
  idTimbrado: number;
  detalles: FacturaVentaDetalleRequestDTO[];
}

export interface FacturaVentaDetalleResponseDTO {
  idDetalle: number;
  idProducto: number;
  /** Falta si inventario dio de baja el producto. */
  nombreProducto?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  porcentajeIva?: number;
  montoIva: number;
}

/** Empleado y depósito llegan como objetos libres; fuera del id, todo es opcional. */
export interface FacturaEmpleadoDTO {
  id: number;
  cargo?: string;
  estado?: boolean;
  persona?: Partial<PersonaResponseDTO>;
}

export interface FacturaDepositoDTO {
  id: number;
  nombre?: string;
  ubicacion?: string;
  estado?: boolean;
}

export interface FacturaVentaResponseDTO {
  idFacturaVenta: number;
  numeroFactura: string;
  fechaEmision: string;
  activo: boolean;
  estado: EstadoFacturaVenta;
  totalIva: number;
  totalGeneral: number;
  cliente: ClienteResponseDTO;
  empleado?: FacturaEmpleadoDTO;
  deposito?: FacturaDepositoDTO;
  medioPago?: MedioPagoDTO;
  timbrado?: TimbradoDTO;
  detalles: FacturaVentaDetalleResponseDTO[];
}

// --------------------------------------------------------------- Inventario

export interface ProductoResponseDTO {
  id: number;
  codigoBarra?: string | null;
  nombre: string;
  precioVenta: number;
  stockActual?: number;
  porcentajeIva: number;
  idCategoria: number;
  idMarca: number;
  estado: boolean;
}

export interface DepositoResponseDTO {
  id: number;
  nombre: string;
  ubicacion?: string;
  estado: boolean;
}

export interface StockDepositoResponseDTO {
  id: number;
  idDeposito: number;
  nombreDeposito?: string;
  idProducto: number;
  nombreProducto?: string;
  cantidad: number;
}

export interface EmpleadoResponseDTO {
  id: number;
  cargo: string;
  fechaIngreso: string;
  estado: boolean;
  persona: PersonaResponseDTO;
}

// ------------------------------------------------------------------ Compras

export interface ProveedorResponseDTO {
  idProveedor: number;
  nombreFantasia?: string;
  estado: boolean;
  persona: PersonaResponseDTO;
}

export interface FacturaCompraDetalleResponseDTO {
  idDetalle: number;
  idProducto: number;
  nombreProducto: string;
  codigoBarra?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  porcentajeIva?: number;
  montoIva: number;
}

export interface FacturaCompraResponseDTO {
  idFacturaCompra: number;
  numeroFactura?: string;
  fechaEmision?: string;
  activo: boolean;
  timbrado: string;
  estado: string;
  condicionCompra: string;
  totalIva: number;
  totalGeneral: number;
  proveedor: ProveedorResponseDTO;
  deposito?: DepositoResponseDTO;
  medioPago?: MedioPagoDTO;
  detalles: FacturaCompraDetalleResponseDTO[];
}

export interface OrdenCompraDTO {
  id: number;
  idProveedor: number;
  idEmpleado: number;
  estado?: string;
  observacion?: string;
  total?: number;
}

// ------------------------------------------- Inventario: altas y movimientos

export interface CategoriaResponseDTO {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface MarcaResponseDTO {
  id: number;
  nombre: string;
}

export interface ProductoRequestDTO {
  codigoBarra?: string;
  nombre: string;
  descripcion?: string;
  precioCosto: number;
  precioVenta: number;
  /** El backend solo admite 0, 5 o 10. */
  porcentajeIva: number;
  stockMinimo: number;
  idCategoria: number;
  idMarca: number;
}

export interface StockDepositoRequestDTO {
  idDeposito: number;
  idProducto: number;
  cantidad: number;
}

/** Línea de un movimiento: producto y cantidad. */
export interface DetalleCantidadDTO {
  idProducto: number;
  cantidad: number;
}

export type TipoAjuste = 'POSITIVO' | 'NEGATIVO';

export interface AjusteStockRequestDTO {
  idDeposito: number;
  idEmpleado: number;
  motivo: string;
  tipoAjuste: TipoAjuste;
  detalles: DetalleCantidadDTO[];
}

export interface AjusteStockResponseDTO {
  id: number;
  idDeposito: number;
  nombreDeposito: string;
  idEmpleado: number;
  nombreEmpleado: string;
  motivo: string;
  tipoAjuste: TipoAjuste;
  detalles: { idProducto: number; nombreProducto: string; cantidad: number }[];
}

export interface TransferenciaStockRequestDTO {
  idDepositoOrigen: number;
  idDepositoDestino: number;
  idEmpleado: number;
  observacion?: string;
  detalles: DetalleCantidadDTO[];
}

export interface TransferenciaStockResponseDTO {
  id: number;
  idDepositoOrigen: number;
  nombreDepositoOrigen: string;
  idDepositoDestino: number;
  nombreDepositoDestino: string;
  idEmpleado: number;
  nombreEmpleado: string;
  observacion?: string | null;
  estado: string;
  detalles: { idProducto: number; nombreProducto: string; cantidad: number }[];
}

// ------------------------------------------------------------ Compras: altas

export interface ProveedorRequestDTO {
  nombreFantasia?: string;
  persona: PersonaRequestDTO;
}

export type CondicionCompra = 'CONTADO' | 'CREDITO';

export interface FacturaCompraDetalleRequestDTO {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  porcentajeIva?: number;
}

export interface FacturaCompraRequestDTO {
  numeroFactura: string;
  fechaEmision: string;
  /** Timbrado del proveedor (8 dígitos). */
  timbrado: string;
  idProveedor: number;
  idDeposito: number;
  idMedioPago: number;
  condicionCompra: CondicionCompra;
  detalles: FacturaCompraDetalleRequestDTO[];
}

// -------------------------------------------------------------- Seguridad (auth)

export type RolUsuario = 'ADMIN' | 'VENDEDOR' | 'DEPOSITERO' | 'COMPRADOR';

export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface TokenResponseDTO {
  accessToken: string;
  tokenType: string;
  /** Segundos de vigencia. */
  expiresIn: number;
  expiresAt: string;
  username: string;
  roles: RolUsuario[];
  idPersona?: number;
  idEmpleado?: number;
}

export interface UsuarioResponseDTO {
  idUsuario: number;
  username: string;
  roles: RolUsuario[];
  activo: boolean;
  idPersona?: number;
  nombreCompleto?: string;
  documento?: string;
  idEmpleado?: number;
  cargo?: string;
}

/** Se indica idPersona o idEmpleado (uno de los dos). */
export interface UsuarioCreateRequestDTO {
  username: string;
  password: string;
  roles: RolUsuario[];
  idPersona?: number;
  idEmpleado?: number;
}

/** password opcional: si viene, reemplaza la actual. */
export interface UsuarioUpdateRequestDTO {
  username: string;
  password?: string;
  roles: RolUsuario[];
}
