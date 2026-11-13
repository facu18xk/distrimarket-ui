import type { MainModule } from '../types/distrimarket';
import type { RolUsuario } from '../types/api';

/**
 * Roles del sistema: los mismos que define el microservicio de seguridad y que
 * viajan en el token. Un usuario puede tener varios (por ejemplo ADMIN y
 * VENDEDOR) y ve la unión de sus módulos. La UI solo oculta lo que no le
 * corresponde: quien realmente autoriza es el backend (gateway y cada servicio).
 */
export type Role = RolUsuario;

interface RoleInfo {
  label: string;
  description: string;
  modules: MainModule[];
}

export const ROLES: Record<Role, RoleInfo> = {
  ADMIN: {
    label: 'Administrador',
    description: 'Acceso total, usuarios y catálogos',
    modules: ['compra', 'stock', 'venta', 'administracion'],
  },
  VENDEDOR: {
    label: 'Vendedor',
    description: 'Ventas y clientes',
    modules: ['venta'],
  },
  DEPOSITERO: {
    label: 'Depositero',
    description: 'Inventario y stock',
    modules: ['stock'],
  },
  COMPRADOR: {
    label: 'Comprador',
    description: 'Compras y proveedores',
    modules: ['compra'],
  },
};

export const ROLE_LIST = Object.keys(ROLES) as Role[];

export const MODULE_LABELS: Record<MainModule, string> = {
  venta: 'Venta',
  stock: 'Stock',
  compra: 'Compra',
  administracion: 'Administración',
};

/** Orden fijo del menú. */
const MODULE_ORDER: MainModule[] = ['compra', 'stock', 'venta', 'administracion'];

/** Módulos que ve un usuario: la unión de los de todos sus roles. */
export function modulesFor(roles: Role[]): MainModule[] {
  return MODULE_ORDER.filter((module) => roles.some((rol) => ROLES[rol]?.modules.includes(module)));
}

export function canAccess(roles: Role[], module: MainModule): boolean {
  return modulesFor(roles).includes(module);
}

/** Primer módulo que el usuario puede ver; es su pantalla de inicio. */
export function homeModule(roles: Role[]): MainModule {
  // El administrador entra a Administración (configuración); el resto, a su primer módulo.
  if (roles.includes('ADMIN')) return 'administracion';
  return modulesFor(roles)[0] ?? 'venta';
}

export function rolesLabel(roles: Role[]): string {
  return roles.map((rol) => ROLES[rol]?.label ?? rol).join(' · ');
}
