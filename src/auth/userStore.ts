import type { Role } from './roles';

/**
 * Usuarios de la aplicación.
 *
 * PROVISORIO: el backend todavía no tiene autenticación, así que los usuarios y
 * sus contraseñas viven en el navegador (localStorage, sin cifrar). Sirve para
 * demostrar login, roles y registro por el administrador; NO es seguridad real.
 * Cuando exista un servicio de autenticación, solo cambia este archivo: el resto
 * de la app usa las funciones de abajo y no sabe dónde se guardan los usuarios.
 */
export interface AppUser {
  username: string;
  password: string;
  name: string;
  email: string;
  rol: Role;
  avatarUrl: string;
}

const USERS_KEY = 'distrimarket_users';
const SESSION_KEY = 'distrimarket_session_user';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

/** Un usuario de ejemplo por rol, para poder entrar la primera vez. */
export const SEED_USERS: AppUser[] = [
  { username: 'admin', password: 'admin123', name: 'Admin DistriMarket', email: 'admin@distrimarket.com', rol: 'ADMIN', avatarUrl: DEFAULT_AVATAR },
  { username: 'vendedor', password: 'vendedor123', name: 'Juan Pérez', email: 'juan.perez@distrimarket.com', rol: 'VENDEDOR', avatarUrl: DEFAULT_AVATAR },
  { username: 'deposito', password: 'deposito123', name: 'Ana Gómez', email: 'ana.gomez@distrimarket.com', rol: 'DEPOSITERO', avatarUrl: DEFAULT_AVATAR },
  { username: 'compras', password: 'compras123', name: 'Luis Benítez', email: 'luis.benitez@distrimarket.com', rol: 'COMPRADOR', avatarUrl: DEFAULT_AVATAR },
];

function readUsers(): AppUser[] {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AppUser[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Datos guardados ilegibles: se vuelve a los usuarios de ejemplo.
  }
  return SEED_USERS;
}

function writeUsers(users: AppUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const normalize = (username: string) => username.trim().toLowerCase();

export type StoreResult = { ok: true } | { ok: false; error: string };

export const userStore = {
  list: readUsers,

  find(username: string): AppUser | undefined {
    return readUsers().find((u) => u.username === normalize(username));
  },

  authenticate(username: string, password: string): AppUser | null {
    const user = this.find(username);
    return user && user.password === password ? user : null;
  },

  create(user: AppUser): StoreResult {
    const username = normalize(user.username);
    if (!username || !user.password || !user.name.trim()) {
      return { ok: false, error: 'Usuario, nombre y contraseña son obligatorios.' };
    }
    if (user.password.length < 6) {
      return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    const users = readUsers();
    if (users.some((u) => u.username === username)) {
      return { ok: false, error: `Ya existe el usuario "${username}".` };
    }
    writeUsers([...users, { ...user, username, name: user.name.trim(), avatarUrl: user.avatarUrl || DEFAULT_AVATAR }]);
    return { ok: true };
  },

  update(username: string, changes: Partial<Omit<AppUser, 'username'>>): void {
    writeUsers(readUsers().map((u) => (u.username === username ? { ...u, ...changes } : u)));
  },

  remove(username: string): StoreResult {
    const users = readUsers();
    const target = users.find((u) => u.username === username);
    if (!target) return { ok: false, error: 'El usuario no existe.' };
    if (target.rol === 'ADMIN' && users.filter((u) => u.rol === 'ADMIN').length === 1) {
      return { ok: false, error: 'No se puede eliminar al único administrador.' };
    }
    writeUsers(users.filter((u) => u.username !== username));
    return { ok: true };
  },

  session: {
    get: (): string | null => localStorage.getItem(SESSION_KEY),
    set: (username: string) => localStorage.setItem(SESSION_KEY, username),
    clear: () => localStorage.removeItem(SESSION_KEY),
  },
};
