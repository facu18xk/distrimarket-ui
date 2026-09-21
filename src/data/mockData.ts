import {
  ProductItem,
  StockAdjustmentItem,
  StockMovementItem,
  DepositoItem,
  CompraItem,
  ProveedorItem,
  VentaItem,
  ClienteItem,
  PromocionItem,
  ThemeConfig
} from '../types/distrimarket';

export const THEME_PALETTES: ThemeConfig[] = [
  {
    colorId: 'orange',
    colorName: 'Naranja DistriMarket (Figma)',
    primaryHex: '#F97316',
    hoverHex: '#EA580C',
    lightBgHex: '#FFF7ED',
    isDark: false,
  },
  {
    colorId: 'blue',
    colorName: 'Azul Corporativo',
    primaryHex: '#2563EB',
    hoverHex: '#1D4ED8',
    lightBgHex: '#EFF6FF',
    isDark: false,
  },
  {
    colorId: 'emerald',
    colorName: 'Verde Esmeralda',
    primaryHex: '#059669',
    hoverHex: '#047857',
    lightBgHex: '#ECFDF5',
    isDark: false,
  },
  {
    colorId: 'purple',
    colorName: 'Violeta Royal',
    primaryHex: '#7C3AED',
    hoverHex: '#6D28D9',
    lightBgHex: '#F5F3FF',
    isDark: false,
  },
  {
    colorId: 'rose',
    colorName: 'Rosa Carmesí',
    primaryHex: '#E11D48',
    hoverHex: '#BE123C',
    lightBgHex: '#FFF1F2',
    isDark: false,
  },
  {
    colorId: 'slate',
    colorName: 'Gris Grafito Minimalista',
    primaryHex: '#334155',
    hoverHex: '#1E293B',
    lightBgHex: '#F8FAFC',
    isDark: false,
  },
];

export const AVATAR_OPTIONS = [
  { id: '1', name: 'Avatar 1 (Chica Anime)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Avatar 2 (Juan Ejecutivo)', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Avatar 3 (Ilustración Estilo Figma)', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80' },
  { id: '4', name: 'Avatar 4 (Profesional Moderna)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' }
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  { id: '1', nombre: 'Queso Parmesano Reggiano', categoria: 'Quesos', deposito: 'Depósito Central', ultimoPrecio: 24.0, precioVenta: 30.0, cantidad: 3, unidad: 'kg', estado: 'Crítico' },
  { id: '2', nombre: 'Masa Pizza Familiar', categoria: 'Panificados', deposito: 'Depósito Norte', ultimoPrecio: 50.0, precioVenta: 65.0, cantidad: 12, unidad: 'unid', estado: 'Óptimo' },
  { id: '3', nombre: 'Tomate Redondo', categoria: 'Vegetales', deposito: 'Depósito Sur', ultimoPrecio: 2.0, precioVenta: 3.5, cantidad: 8, unidad: 'kg', estado: 'Crítico' },
  { id: '4', nombre: 'Aceite de Oliva Virgen Extra', categoria: 'Salsas y Condimentos', deposito: 'Depósito Central', ultimoPrecio: 15.0, precioVenta: 20.0, cantidad: 14, unidad: 'lt', estado: 'Bajo' },
  { id: '5', nombre: 'Harina de Trigo 000', categoria: 'Panificados', deposito: 'Depósito Norte', ultimoPrecio: 5.0, precioVenta: 7.5, cantidad: 25, unidad: 'kg', estado: 'Óptimo' },
  { id: '6', nombre: 'Mozzarella en Barra', categoria: 'Quesos', deposito: 'Depósito Sur', ultimoPrecio: 18.0, precioVenta: 24.0, cantidad: 6, unidad: 'kg', estado: 'Crítico' },
  { id: '7', nombre: 'Cerveza Artesanal IPA', categoria: 'Bebidas', deposito: 'Depósito Central', ultimoPrecio: 8.0, precioVenta: 15.0, cantidad: 48, unidad: 'unid', estado: 'Óptimo' },
  { id: '8', nombre: 'Salsa de Tomate Pomodoro', categoria: 'Salsas y Condimentos', deposito: 'Depósito Norte', ultimoPrecio: 4.5, precioVenta: 6.0, cantidad: 11, unidad: 'lt', estado: 'Bajo' },
  { id: '9', nombre: 'Jamón Cocido Natural', categoria: 'Carnes', deposito: 'Depósito Central', ultimoPrecio: 16.0, precioVenta: 22.0, cantidad: 18, unidad: 'kg', estado: 'Óptimo' },
  { id: '10', nombre: 'Levadura Fresca', categoria: 'Panificados', deposito: 'Depósito Norte', ultimoPrecio: 3.0, precioVenta: 4.5, cantidad: 4, unidad: 'kg', estado: 'Bajo' },
  { id: '11', nombre: 'Albahaca Fresca Hidropónica', categoria: 'Vegetales', deposito: 'Depósito Sur', ultimoPrecio: 1.5, precioVenta: 2.5, cantidad: 15, unidad: 'atados', estado: 'Óptimo' },
  { id: '12', nombre: 'Aceitunas Negras Descarozadas', categoria: 'Salsas y Condimentos', deposito: 'Depósito Sur', ultimoPrecio: 6.0, precioVenta: 9.0, cantidad: 5, unidad: 'kg', estado: 'Bajo' },
];

export const INITIAL_ADJUSTMENTS: StockAdjustmentItem[] = [
  {
    id: 'AJ-001',
    fecha: '2026-08-25',
    deposito: 'Depósito Central',
    tipo: 'Entrada',
    motivo: 'Compra semanal y reposición',
    productosAfectados: 3,
    responsable: 'Juan Pérez',
    detalles: [
      { producto: 'Queso Parmesano Reggiano', cantidad: 10, motivo: 'Reposición básica' },
      { producto: 'Aceite de Oliva Virgen Extra', cantidad: 8, motivo: 'Reingreso de proveedor' },
      { producto: 'Jamón Cocido Natural', cantidad: 15, motivo: 'Stock de seguridad' },
    ],
  },
  {
    id: 'AJ-002',
    fecha: '2026-08-24',
    deposito: 'Depósito Sur',
    tipo: 'Salida',
    motivo: 'Merma por vencimiento',
    productosAfectados: 2,
    responsable: 'María López',
    detalles: [
      { producto: 'Tomate Redondo', cantidad: 4, motivo: 'Deterioro por maduración' },
      { producto: 'Mozzarella en Barra', cantidad: 2, motivo: 'Fecha límite de consumo' },
    ],
  },
  {
    id: 'AJ-003',
    fecha: '2026-08-23',
    deposito: 'Depósito Norte',
    tipo: 'Entrada',
    motivo: 'Reposición urgente de harinas',
    productosAfectados: 2,
    responsable: 'Juan Pérez',
    detalles: [
      { producto: 'Harina de Trigo 000', cantidad: 20, motivo: 'Urgencia por alta demanda' },
      { producto: 'Levadura Fresca', cantidad: 10, motivo: 'Reposición fin de semana' },
    ],
  },
  {
    id: 'AJ-004',
    fecha: '2026-08-22',
    deposito: 'Depósito Central',
    tipo: 'Salida',
    motivo: 'Inventario físico (rotura)',
    productosAfectados: 2,
    responsable: 'Carlos Ruiz',
    detalles: [
      { producto: 'Cerveza Artesanal IPA', cantidad: 3, motivo: 'Rotura de botella' },
      { producto: 'Queso Parmesano Reggiano', cantidad: 1, motivo: 'Merma de fraccionamiento' },
    ],
  },
  {
    id: 'AJ-005',
    fecha: '2026-08-20',
    deposito: 'Depósito Norte',
    tipo: 'Salida',
    motivo: 'Merma por humedad',
    productosAfectados: 1,
    responsable: 'Carlos Ruiz',
    detalles: [
      { producto: 'Harina de Trigo 000', cantidad: 5, motivo: 'Bolsa humedecida en transporte' },
    ],
  },
];

export const INITIAL_MOVEMENTS: StockMovementItem[] = [
  {
    id: 'MV-001',
    fecha: '2026-08-26',
    producto: 'Varios insumos (3 productos)',
    cantidad: 80,
    unidad: 'items',
    depOrigen: 'Depósito Central',
    depDestino: 'Depósito Norte',
    responsable: 'Juan Pérez',
    observaciones: 'Rebalanceo de stock para producción de pizzas y ensaladas.',
    estado: 'Completado',
    detalles: [
      { producto: 'Queso Parmesano Reggiano', cantidad: 50, unidad: 'kg' },
      { producto: 'Aceite de Oliva', cantidad: 20, unidad: 'lt' },
      { producto: 'Harina de Trigo', cantidad: 10, unidad: 'kg' },
    ],
  },
  {
    id: 'MV-002',
    fecha: '2026-08-25',
    producto: 'Masa Pizza Familiar',
    cantidad: 120,
    unidad: 'unid',
    depOrigen: 'Depósito Central',
    depDestino: 'Depósito Sur',
    responsable: 'Carlos Ruiz',
    observaciones: 'Abastecimiento turno noche.',
    estado: 'Pendiente',
    detalles: [
      { producto: 'Masa Pizza Familiar', cantidad: 120, unidad: 'unid' },
    ],
  },
  {
    id: 'MV-003',
    fecha: '2026-08-24',
    producto: 'Aceite de Oliva',
    cantidad: 30,
    unidad: 'lt',
    depOrigen: 'Depósito Norte',
    depDestino: 'Depósito Sur',
    responsable: 'María López',
    observaciones: 'Cancelado por falta de camión refrigerado.',
    estado: 'Cancelado',
    detalles: [
      { producto: 'Aceite de Oliva', cantidad: 30, unidad: 'lt' },
    ],
  },
];

export const INITIAL_DEPOSITOS: DepositoItem[] = [
  {
    id: '1',
    nombre: 'Depósito Central',
    direccion: 'Av. Principal 123, Planta Central',
    fechaCreacion: '12/04/2025',
    productosCount: 1450,
    estado: true,
    productosList: [
      { producto: 'Queso Parmesano Reggiano', categoria: 'Quesos', stock: 350, unidad: 'kg' },
      { producto: 'Aceite de Oliva', categoria: 'Salsas y Condimentos', stock: 800, unidad: 'lt' },
      { producto: 'Mozzarella', categoria: 'Quesos', stock: 300, unidad: 'kg' }
    ]
  },
  {
    id: '2',
    nombre: 'Depósito Norte',
    direccion: 'Ruta 3 km 15, Parque Industrial Norte',
    fechaCreacion: '15/05/2025',
    productosCount: 820,
    estado: true,
    productosList: [
      { producto: 'Masa Pizza Familiar', categoria: 'Panificados', stock: 420, unidad: 'unid' },
      { producto: 'Harina de Trigo', categoria: 'Panificados', stock: 400, unidad: 'kg' }
    ]
  },
  {
    id: '3',
    nombre: 'Depósito Sur',
    direccion: 'Av. Circunvalación 890, Módulo B',
    fechaCreacion: '01/08/2025',
    productosCount: 610,
    estado: true,
    productosList: [
      { producto: 'Tomate', categoria: 'Vegetales', stock: 250, unidad: 'kg' },
      { producto: 'Mozzarella', categoria: 'Quesos', stock: 360, unidad: 'kg' }
    ]
  }
];

export const INITIAL_COMPRAS: CompraItem[] = [
  {
    id: 'CO-001',
    numeroFactura: 'FAC-0019284',
    fecha: '2026-08-25',
    proveedor: 'Distribuidora Estrella SA',
    responsable: 'Juan Pérez',
    observaciones: 'Compra semanal de frescos e insumos básicos para panadería y cocina.',
    total: 1250.0,
    estado: 'Recibida',
    detalles: [
      { producto: 'Queso Parmesano Reggiano', cantidad: 30, costoUnitario: 24.0, subtotal: 720.0 },
      { producto: 'Salsa de Tomate', cantidad: 100, costoUnitario: 5.3, subtotal: 530.0 }
    ]
  },
  {
    id: 'CO-002',
    numeroFactura: 'FAC-0083210',
    fecha: '2026-08-24',
    proveedor: 'Lácteos del Valle',
    responsable: 'María López',
    observaciones: 'Reposición lácteos.',
    total: 680.0,
    estado: 'Pendiente',
    detalles: [
      { producto: 'Mozzarella', cantidad: 35, costoUnitario: 18.0, subtotal: 630.0 }
    ]
  },
  {
    id: 'CO-003',
    numeroFactura: 'FAC-0044192',
    fecha: '2026-08-23',
    proveedor: 'Carnes Premium SRL',
    responsable: 'Juan Pérez',
    observaciones: 'Lote semanal carnes.',
    total: 2100.0,
    estado: 'Recibida',
    detalles: []
  },
  {
    id: 'CO-004',
    numeroFactura: 'FAC-0011983',
    fecha: '2026-08-22',
    proveedor: 'Verdulería Central',
    responsable: 'Carlos Ruiz',
    observaciones: 'Pedido devuelto por mal estado.',
    total: 340.0,
    estado: 'Cancelada',
    detalles: []
  },
  {
    id: 'CO-005',
    numeroFactura: 'FAC-0077812',
    fecha: '2026-08-21',
    proveedor: 'Bebidas del Norte',
    responsable: 'Juan Pérez',
    observaciones: 'Bebidas surtidas.',
    total: 890.0,
    estado: 'Recibida',
    detalles: []
  },
  {
    id: 'CO-006',
    numeroFactura: 'FAC-0099411',
    fecha: '2026-08-20',
    proveedor: 'Distribuidora Estrella SA',
    responsable: 'Juan Pérez',
    observaciones: 'Entrega pendiente de validación física.',
    total: 1500.0,
    estado: 'Pendiente',
    detalles: []
  }
];

export const INITIAL_PROVEEDORES: ProveedorItem[] = [
  { id: '1', nombre: 'Distribuidora Estrella SA', ruc: '20-12345678-9', telefono: '+54 11 4567-8901', email: 'contacto@estrella.com', contactoPrincipal: 'Carlos Estrella', direccion: 'Av. Corrientes 1234, CABA', estado: true },
  { id: '2', nombre: 'Lácteos del Valle', ruc: '20-98765432-1', telefono: '+54 351 456-7890', email: 'ventas@lacteosv.com', contactoPrincipal: 'Roberto Valle', direccion: 'Ruta 5 km 23, Córdoba', estado: true },
  { id: '3', nombre: 'Carnes Premium SRL', ruc: '30-55667788-0', telefono: '+54 11 9876-5432', email: 'info@carnespremium.com', contactoPrincipal: 'Esteban Carni', direccion: 'Parque Industrial B5', estado: true },
  { id: '4', nombre: 'Verdulería Central', ruc: '20-11223344-5', telefono: '+54 11 2345-6789', email: 'central@verdulería.com', contactoPrincipal: 'Lucía Central', direccion: 'Mercado Central P12', estado: false },
  { id: '5', nombre: 'Bebidas del Norte', ruc: '30-44556677-8', telefono: '+54 381 234-5678', email: 'ventas@bebidasnorte.com', contactoPrincipal: 'Marcos Norte', direccion: 'Zona Franca Lote 8', estado: true },
];

export const INITIAL_VENTAS: VentaItem[] = [
  {
    id: 'VT-001',
    numeroComprobante: 'VT-001',
    fecha: '2026-08-26',
    cliente: 'Carlos García',
    tipoVenta: 'Mesa',
    referencia: 'Mesa 3',
    responsable: 'Juan Pérez',
    observaciones: 'Consumo en salón principal.',
    total: 39.0,
    estado: 'Completada',
    detalles: [
      { producto: 'Pizza Muzarella Grande', cantidad: 2, precioUnitario: 12.0, subtotal: 24.0 },
      { producto: 'Cerveza Artesanal IPA 500ml', cantidad: 3, precioUnitario: 5.0, subtotal: 15.0 }
    ]
  },
  {
    id: 'VT-002',
    numeroComprobante: 'VT-002',
    fecha: '2026-08-26',
    cliente: 'Ana Martínez',
    tipoVenta: 'Delivery',
    referencia: 'Delivery - Ana Martínez',
    responsable: 'María López',
    observaciones: 'Enviar salsa picante aparte.',
    total: 120.5,
    estado: 'Pendiente',
    detalles: []
  },
  {
    id: 'VT-003',
    numeroComprobante: 'VT-003',
    fecha: '2026-08-25',
    cliente: 'Roberto Sánchez',
    tipoVenta: 'Mesa',
    referencia: 'Mesa 7',
    responsable: 'Juan Pérez',
    observaciones: 'Cuenta cerrada con propina.',
    total: 210.0,
    estado: 'Completada',
    detalles: []
  },
  {
    id: 'VT-004',
    numeroComprobante: 'VT-004',
    fecha: '2026-08-25',
    cliente: 'Laura Díaz',
    tipoVenta: 'Mostrador',
    referencia: 'Mostrador',
    responsable: 'Carlos Ruiz',
    observaciones: 'Cliente canceló el pedido antes de salir.',
    total: 45.0,
    estado: 'Anulada',
    detalles: []
  },
  {
    id: 'VT-005',
    numeroComprobante: 'VT-005',
    fecha: '2026-08-25',
    cliente: 'Pedro López',
    tipoVenta: 'Mesa',
    referencia: 'Mesa 1',
    responsable: 'Juan Pérez',
    observaciones: 'Comensales habituales.',
    total: 175.0,
    estado: 'Completada',
    detalles: []
  },
  {
    id: 'VT-006',
    numeroComprobante: 'VT-006',
    fecha: '2026-08-24',
    cliente: 'María Fernández',
    tipoVenta: 'Delivery',
    referencia: 'Delivery',
    responsable: 'María López',
    observaciones: 'Pagado online.',
    total: 95.0,
    estado: 'Completada',
    detalles: []
  },
  {
    id: 'VT-007',
    numeroComprobante: 'VT-007',
    fecha: '2026-08-24',
    cliente: 'Juan Rodríguez',
    tipoVenta: 'Mesa',
    referencia: 'Mesa 5',
    responsable: 'Juan Pérez',
    observaciones: 'Pendiente de cobro terminal POS.',
    total: 310.0,
    estado: 'Pendiente',
    detalles: []
  }
];

export const INITIAL_CLIENTES: ClienteItem[] = [
  { id: '1', nombre: 'Carlos García', telefono: '+54 11 5678-1234', email: 'carlos.g@email.com', direccion: 'Av. Santa Fe 2345', tipo: 'Frecuente', totalCompras: 2450.0 },
  { id: '2', nombre: 'Ana Martínez', telefono: '+54 11 8765-4321', email: 'ana.m@email.com', direccion: 'Calle Florida 567', tipo: 'Delivery', totalCompras: 890.0 },
  { id: '3', nombre: 'Roberto Sánchez', telefono: '+54 11 2345-6789', email: 'r.sanchez@email.com', direccion: 'Belgrano 1234', tipo: 'Ocasional', totalCompras: 210.0 },
  { id: '4', nombre: 'Laura Díaz', telefono: '+54 11 9876-5432', email: 'laura.d@email.com', direccion: 'Palermo 890', tipo: 'Frecuente', totalCompras: 1780.0 },
  { id: '5', nombre: 'Pedro López', telefono: '+54 351 345-6789', email: 'pedro.l@email.com', direccion: 'Córdoba 456', tipo: 'Nuevo', totalCompras: 175.0 },
];

export const INITIAL_PROMOCIONES: PromocionItem[] = [
  { id: '1', nombre: '2×1 Pizzas Medianas', tipo: '2×1', descuentoValor: '-2026-08-20', fechaInicio: '2026-08-20', fechaFin: '2026-09-20', estado: 'Activa' },
  { id: '2', nombre: 'Happy Hour Viernes 50%', tipo: 'Porcentaje', descuentoValor: '50%', fechaInicio: '2026-08-15', fechaFin: '2026-09-15', estado: 'Activa' },
  { id: '3', nombre: 'Menú Ejecutivo Especial', tipo: 'Precio Fijo', descuentoValor: '$25.00', fechaInicio: '2026-09-01', fechaFin: '2026-09-30', estado: 'Programada' },
  { id: '4', nombre: 'Descuento Cumpleañeros', tipo: 'Porcentaje', descuentoValor: '20%', fechaInicio: '2026-07-01', fechaFin: '2026-08-01', estado: 'Vencida' },
  { id: '5', nombre: 'Combo Familiar Domingo', tipo: 'Combo', descuentoValor: '-2026-08-22', fechaInicio: '2026-08-22', fechaFin: '2026-10-22', estado: 'Activa' },
];
