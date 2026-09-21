


export type StockSubTab = 'inventario' | 'ajustes' | 'transferencias' | 'movimientos' | 'depositos' | 'reporte';
export type CompraSubTab = 'compras' | 'proveedores' | 'reportes';
export type VentaSubTab = 'ventas' | 'clientes' | 'reportes';
export type PromocionSubTab = 'activas';

export type StockStatus = 'Crítico' | 'Óptimo' | 'Bajo';
export type CompraStatus = 'Recibida' | 'Pendiente' | 'Cancelada';
export type VentaStatus = 'Completada' | 'Pendiente' | 'Anulada';
export type MovimientoStatus = 'Completado' | 'Pendiente' | 'Cancelado';
export type PromocionStatus = 'Activa' | 'Programada' | 'Vencida';
export type ClienteType = 'Frecuente' | 'Delivery' | 'Ocasional' | 'Nuevo';
export type MainModule = 'stock' | 'compra' | 'venta' | 'promociones';
export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
}

export interface ThemeConfig {
  colorId: string;
  colorName: string;
  primaryHex: string;
  hoverHex: string;
  lightBgHex: string;
  isDark: boolean;
}

export interface ProductItem {
  id: string;
  nombre: string;
  categoria: string;
  deposito: string;
  ultimoPrecio: number;
  precioVenta: number;
  cantidad: number;
  unidad: string;
  estado: StockStatus;
}

export interface StockAdjustmentItem {
  id: string;
  fecha: string;
  deposito: string; // Propio de un depósito
  tipo: 'Entrada' | 'Salida';
  motivo: string;
  productosAfectados: number;
  responsable: string;
  detalles?: {
    producto: string;
    cantidad: number;
    motivo: string;
  }[];
}

export interface StockMovementItem {
  id: string;
  fecha: string;
  producto: string;
  cantidad: number;
  unidad: string;
  depOrigen: string;
  depDestino: string;
  responsable: string;
  observaciones?: string;
  estado: MovimientoStatus;
  detalles: {
    producto: string;
    cantidad: number;
    unidad: string;
  }[];
}

export interface DepositoItem {
  id: string;
  nombre: string;
  direccion: string;
  fechaCreacion: string;
  productosCount: number;
  estado: boolean;
  productosList?: {
    producto: string;
    categoria: string;
    stock: number;
    unidad: string;
  }[];
}

export interface CompraItem {
  id: string;
  numeroFactura: string;
  fecha: string;
  proveedor: string;
  responsable: string;
  observaciones: string;
  total: number;
  estado: CompraStatus;
  detalles: {
    producto: string;
    cantidad: number;
    costoUnitario: number;
    subtotal: number;
  }[];
}

export interface ProveedorItem {
  id: string;
  nombre: string;
  ruc: string;
  telefono: string;
  email: string;
  contactoPrincipal: string;
  direccion: string;
  estado: boolean;
}

export interface VentaItem {
  id: string;
  numeroComprobante: string;
  fecha: string;
  cliente: string;
  tipoVenta: 'Mesa' | 'Delivery' | 'Mostrador';
  referencia: string;
  responsable: string;
  observaciones: string;
  total: number;
  estado: VentaStatus;
  detalles: {
    producto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
}

export interface ClienteItem {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  tipo: ClienteType;
  totalCompras: number;
}

export interface PromocionItem {
  id: string;
  nombre: string;
  tipo: '2×1' | 'Porcentaje' | 'Precio Fijo' | 'Combo';
  descuentoValor: string;
  fechaInicio: string;
  fechaFin: string;
  estado: PromocionStatus;
  detalles?: {
    producto: string;
    precioOrig: number;
    precioPromo: number;
    descPorc: string;
  }[];
}

export interface ContactMessage {
  id: string;
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  fechaEnvio: string;
}
