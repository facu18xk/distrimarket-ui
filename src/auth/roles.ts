import type { MainModule } from '../types/distrimarket';

/**
 * Roles de la aplicación. ADMIN es independiente y ve todo; los demás ven solo
 * los módulos de su trabajo. Es una sola aplicación: el rol decide qué pestañas
 * y pantallas aparecen, no hay un proyecto por rol.
 */
export type Role = 'ADMIN' | 'VENDEDOR' | 'DEPOSITERO' | 'COMPRADOR';

interface RoleInfo {
  label: string;
  description: string;
  modules: MainModule[];
}

export const ROLES: Record<Role, RoleInfo> = {
  ADMIN: {
    label: 'Administrador',
    description: 'Acceso total y administración del sistema',
    modules: ['stock', 'compra', 'venta', 'promociones', 'administracion'],
  },
  VENDEDOR: {
    label: 'Vendedor',
    description: 'Ventas, clientes',
    modules: ['venta'],
  },
  DEPOSITERO: {
    label: 'Encargado de depósito',
    description: 'Inventario y stock',
    modules: ['stock'],
  },
  COMPRADOR: {
    label: 'Encargado de compras',
    description: 'Compras y proveedores',
    modules: ['compra'],
  },
};

export const ROLE_LIST = Object.keys(ROLES) as Role[];

export const MODULE_LABELS: Record<MainModule, string> = {
  stock: 'Stock',
  compra: 'Compra',
  venta: 'Venta',
  promociones: 'Promociones',
  administracion: 'Administración',
};

export function canAccess(role: Role, module: MainModule): boolean {
  return ROLES[role].modules.includes(module);
}

/** Primer módulo que el rol puede ver; es su pantalla de inicio. */
export function homeModule(role: Role): MainModule {
  return ROLES[role].modules[0];
}
