import type { RolUsuario, TokenResponseDTO } from '../types/api';

/**
 * Sesión del usuario: el token JWT que emitió el microservicio de seguridad
 * (POST /auth/login) y los datos que vienen con él. El cliente HTTP lo agrega a
 * cada pedido como "Authorization: Bearer ...". Se guarda en localStorage para
 * que la sesión siga al recargar la página o abrir otra pestaña.
 */
export interface Session {
  token: string;
  expiresAt: string;
  username: string;
  roles: RolUsuario[];
  idPersona?: number;
  idEmpleado?: number;
}

const KEY = 'distrimarket_session';

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Session;
    if (!saved.token || new Date(saved.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

type Listener = () => void;
const expiredListeners = new Set<Listener>();

export const session = {
  get: read,

  token: (): string | null => read()?.token ?? null,

  start(token: TokenResponseDTO): Session {
    const value: Session = {
      token: token.accessToken,
      expiresAt: token.expiresAt,
      username: token.username,
      roles: token.roles,
      idPersona: token.idPersona,
      idEmpleado: token.idEmpleado,
    };
    localStorage.setItem(KEY, JSON.stringify(value));
    return value;
  },

  clear(): void {
    localStorage.removeItem(KEY);
  },

  /** El backend rechazó el token (vencido o inválido): avisa a quien muestre la pantalla de login. */
  expired(): void {
    localStorage.removeItem(KEY);
    expiredListeners.forEach((listener) => listener());
  },

  onExpired(listener: Listener): () => void {
    expiredListeners.add(listener);
    return () => {
      expiredListeners.delete(listener);
    };
  },
};
