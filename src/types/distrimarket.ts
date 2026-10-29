import type { Role } from '../auth/roles';

export type VentaSubTab = 'facturas' | 'clientes' | 'promociones' | 'reportes';
export type StockSubTab = 'productos' | 'existencias' | 'ajustes' | 'transferencias' | 'depositos';
export type CompraSubTab = 'facturas' | 'proveedores';
export type AdminSubTab = 'usuarios' | 'empleados' | 'timbrados' | 'mediosPago' | 'soporte';

export type MainModule = 'venta' | 'stock' | 'compra' | 'administracion';

/** Usuario de la sesión: lo que devuelve el microservicio de seguridad (/auth/me) más su foto. */
export interface UserProfile {
  idUsuario?: number;
  username: string;
  /** Nombre de la persona asociada al usuario (o el username si no hay). */
  name: string;
  /** Roles del token; deciden qué módulos ve. */
  roles: Role[];
  /** Nombre de los roles para mostrar. */
  role: string;
  documento?: string;
  /** Presentes si la persona del usuario es empleado (por ejemplo, el vendedor). */
  idEmpleado?: number;
  cargo?: string;
  /** Depósito asignado: vendedor, comprador y depositero operan siempre sobre él (no lo eligen). */
  idDeposito?: number;
  nombreDeposito?: string;
  /** Preferencia visual guardada en el navegador. */
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

export interface ContactMessage {
  id: string;
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  fechaEnvio: string;
}
