import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  MainModule,
  VentaSubTab,
  AdminSubTab,
  UserProfile,
  ThemeConfig,
  PromocionItem,
  ContactMessage,
} from '../types/distrimarket';
import { THEME_PALETTES, INITIAL_PROMOCIONES } from '../data/mockData';
import { canAccess as roleCanAccess, homeModule, ROLES } from '../auth/roles';
import { userStore, type AppUser, type StoreResult } from '../auth/userStore';

/**
 * Estado global de la aplicación: sesión, permisos, tema y navegación.
 * Los datos de negocio NO viven aquí: cada pantalla los pide al backend
 * (ver services/ y hooks/usePagedResource).
 */
interface AppContextType {
  // Autenticación
  isLoggedIn: boolean;
  user: UserProfile;
  login: (username: string, password: string) => StoreResult;
  logout: () => void;
  updateUser: (updated: Partial<Pick<UserProfile, 'name' | 'email' | 'avatarUrl'>>) => void;

  // Autorización por rol
  canAccess: (module: MainModule) => boolean;
  isAdmin: boolean;

  // Gestión de usuarios (solo ADMIN)
  users: AppUser[];
  registerUser: (user: AppUser) => StoreResult;
  removeUser: (username: string) => StoreResult;

  // Tema (por usuario, sin volver a desplegar)
  theme: ThemeConfig;
  setThemeColor: (colorId: string) => void;
  toggleDarkMode: () => void;

  // Navegación
  activeModule: MainModule;
  setActiveModule: (m: MainModule) => void;
  ventaSubTab: VentaSubTab;
  setVentaSubTab: (t: VentaSubTab) => void;
  adminSubTab: AdminSubTab;
  setAdminSubTab: (t: AdminSubTab) => void;

  // Modales globales
  contactModalOpen: boolean;
  setContactModalOpen: (open: boolean) => void;
  accountModalOpen: boolean;
  setAccountModalOpen: (open: boolean) => void;

  // Contacto con soporte
  contactMessages: ContactMessage[];
  sendContactMessage: (nombre: string, email: string, asunto: string, mensaje: string) => void;

  // Promociones: todavía sin microservicio, se guardan en memoria
  promociones: PromocionItem[];
  addPromocion: (p: Omit<PromocionItem, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const GUEST: UserProfile = { username: '', name: '', email: '', rol: 'VENDEDOR', role: '', avatarUrl: '' };

function toProfile(user: AppUser): UserProfile {
  return {
    username: user.username,
    name: user.name,
    email: user.email,
    rol: user.rol,
    role: ROLES[user.rol].label,
    avatarUrl: user.avatarUrl,
  };
}

/** Sesión guardada, si su usuario sigue existiendo. */
function restoreSession(): AppUser | null {
  const username = userStore.session.get();
  return username ? (userStore.find(username) ?? null) : null;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('distrimarket_user_theme');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading theme', e);
      }
    }
    return THEME_PALETTES[0];
  });

  // Sesión: el usuario que inició sesión, o nadie.
  const [sessionUser, setSessionUser] = useState<AppUser | null>(restoreSession);
  const [users, setUsers] = useState<AppUser[]>(() => userStore.list());

  const isLoggedIn = sessionUser !== null;
  const user = sessionUser ? toProfile(sessionUser) : GUEST;
  const isAdmin = sessionUser?.rol === 'ADMIN';

  const [activeModule, setActiveModuleState] = useState<MainModule>(() =>
    sessionUser ? homeModule(sessionUser.rol) : 'venta'
  );
  const [ventaSubTab, setVentaSubTab] = useState<VentaSubTab>('facturas');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('usuarios');

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const [promociones, setPromociones] = useState<PromocionItem[]>(INITIAL_PROMOCIONES);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    localStorage.setItem('distrimarket_user_theme', JSON.stringify(theme));
    document.documentElement.style.setProperty('--user-primary-color', theme.primaryHex);
    document.documentElement.style.setProperty('--user-hover-color', theme.hoverHex);
  }, [theme]);

  const setThemeColor = (colorId: string) => {
    const found = THEME_PALETTES.find((p) => p.colorId === colorId);
    if (found) {
      setTheme((prev) => ({ ...found, isDark: prev.isDark }));
    }
  };

  const toggleDarkMode = () => {
    setTheme((prev) => ({ ...prev, isDark: !prev.isDark }));
  };

  const canAccess = (module: MainModule) => (sessionUser ? roleCanAccess(sessionUser.rol, module) : false);

  // Un rol nunca queda parado en un módulo que no le corresponde.
  const setActiveModule = (module: MainModule) => {
    if (canAccess(module)) setActiveModuleState(module);
  };

  const login = (username: string, password: string): StoreResult => {
    const found = userStore.authenticate(username, password);
    if (!found) return { ok: false, error: 'Usuario o contraseña incorrectos.' };
    userStore.session.set(found.username);
    setSessionUser(found);
    setActiveModuleState(homeModule(found.rol));
    return { ok: true };
  };

  const logout = () => {
    userStore.session.clear();
    setSessionUser(null);
  };

  const updateUser = (updated: Partial<Pick<UserProfile, 'name' | 'email' | 'avatarUrl'>>) => {
    if (!sessionUser) return;
    userStore.update(sessionUser.username, updated);
    setSessionUser({ ...sessionUser, ...updated });
    setUsers(userStore.list());
  };

  const registerUser = (newUser: AppUser): StoreResult => {
    if (!isAdmin) return { ok: false, error: 'Solo el administrador puede registrar usuarios.' };
    const result = userStore.create(newUser);
    if (result.ok) setUsers(userStore.list());
    return result;
  };

  const removeUser = (username: string): StoreResult => {
    if (!isAdmin) return { ok: false, error: 'Solo el administrador puede eliminar usuarios.' };
    if (username === sessionUser?.username) return { ok: false, error: 'No puede eliminar su propio usuario.' };
    const result = userStore.remove(username);
    if (result.ok) setUsers(userStore.list());
    return result;
  };

  const sendContactMessage = (nombre: string, email: string, asunto: string, mensaje: string) => {
    const newMsg: ContactMessage = {
      id: String(Date.now()),
      nombre,
      email,
      asunto,
      mensaje,
      fechaEnvio: new Date().toISOString(),
    };
    setContactMessages((prev) => [newMsg, ...prev]);
  };

  const addPromocion = (p: Omit<PromocionItem, 'id'>) => {
    setPromociones((prev) => [{ ...p, id: String(Date.now()) }, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        updateUser,
        canAccess,
        isAdmin,
        users,
        registerUser,
        removeUser,
        theme,
        setThemeColor,
        toggleDarkMode,
        activeModule,
        setActiveModule,
        ventaSubTab,
        setVentaSubTab,
        adminSubTab,
        setAdminSubTab,
        contactModalOpen,
        setContactModalOpen,
        accountModalOpen,
        setAccountModalOpen,
        contactMessages,
        sendContactMessage,
        promociones,
        addPromocion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
