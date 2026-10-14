import type { Role } from '../auth/roles';

export type VentaSubTab = 'facturas' | 'clientes' | 'reportes';
export type AdminSubTab = 'usuarios' | 'timbrados' | 'mediosPago';
export type PromocionSubTab = 'activas';

export type PromocionStatus = 'Activa' | 'Programada' | 'Vencida';
export type MainModule = 'stock' | 'compra' | 'venta' | 'promociones' | 'administracion';

export interface UserProfile {
  username: string;
  name: string;
  email: string;
  /** Rol que decide qué módulos ve. */
  rol: Role;
  /** Nombre del rol para mostrar. */
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
