import type { MainModule } from '../types/distrimarket';
import type { Role } from '../auth/roles';
import { canAccess, homeModule } from '../auth/roles';

export const LOGIN_PATH = '/login';

export const MODULE_PATHS: Record<MainModule, string> = {
  venta: '/venta',
  stock: '/stock',
  compra: '/compra',
  administracion: '/administracion',
};

const MODULO_POR_RUTA = new Map<string, MainModule>(
  Object.entries(MODULE_PATHS).map(([modulo, ruta]) => [ruta, modulo as MainModule])
);

export type Route =
  | { kind: 'module'; module: MainModule }
  | { kind: 'redirect'; module: MainModule; to: string }
  | { kind: 'unauthorized' }
  | { kind: 'forbidden'; module?: MainModule }
  | { kind: 'notFound' };

const normalizar = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path);

export function resolveRoute(path: string, roles: Role[]): Route {
  const ruta = normalizar(path);
  const inicio = homeModule(roles);
  if (ruta === '/' || ruta === '' || ruta === LOGIN_PATH) {
    return { kind: 'redirect', module: inicio, to: MODULE_PATHS[inicio] };
  }
  if (ruta === '/401' || ruta === '/unauthorized') {
    return { kind: 'unauthorized' };
  }
  if (ruta === '/403' || ruta === '/forbidden') {
    return { kind: 'forbidden' };
  }
  const modulo = MODULO_POR_RUTA.get(ruta);
  if (!modulo) return { kind: 'notFound' };
  if (!canAccess(roles, modulo)) return { kind: 'forbidden', module: modulo };
  return { kind: 'module', module: modulo };
}
