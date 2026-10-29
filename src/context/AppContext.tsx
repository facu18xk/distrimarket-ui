import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { MainModule, VentaSubTab, StockSubTab, CompraSubTab, AdminSubTab, UserProfile, ThemeConfig, ContactMessage } from '../types/distrimarket';
import type { RolUsuario, UsuarioResponseDTO } from '../types/api';
import { THEME_PALETTES } from '../lib/theme';
import { esHexValido, temaDesdeHex, textoSobre } from '../lib/color';
import { canAccess as rolesCanAccess, homeModule, rolesLabel } from '../auth/roles';
import { serverErrors, session, type Session } from '../auth/session';
import { LOGIN_PATH, MODULE_PATHS, resolveRoute, type Route } from '../routing/routes';
import { authApi, errorMessage } from '../services';

export type LoginResult = { ok: true } | { ok: false; error: string };

/**
 * Estado global de la aplicación: sesión, permisos, tema y navegación.
 * La sesión es el token JWT del microservicio de seguridad; los datos de negocio
 * NO viven aquí: cada pantalla los pide al backend (ver services/).
 */
interface AppContextType {
  // Autenticación
  isLoggedIn: boolean;
  user: UserProfile;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  /** Aviso para la pantalla de login (por ejemplo, sesión vencida). */
  loginNotice: string | null;
  updateAvatar: (avatarUrl: string) => void;

  // Autorización por rol (un usuario puede tener varios)
  canAccess: (module: MainModule) => boolean;
  hasRole: (rol: RolUsuario) => boolean;
  isAdmin: boolean;

  // Tema (por usuario, sin volver a desplegar)
  theme: ThemeConfig;
  setThemeColor: (colorId: string) => void;
  /** Color libre elegido en la rueda (hex, por ejemplo "#1E90FF"). */
  setThemeHex: (hex: string) => void;
  toggleDarkMode: () => void;

  // Navegación (la URL decide el módulo; ver routing/routes)
  route: Route;
  activeModule: MainModule;
  setActiveModule: (m: MainModule) => void;
  goHome: () => void;
  navigate: (to: string) => void;

  // Falla del backend al cargar datos: se muestra la página de error 500
  serverError: string | null;
  retryAfterServerError: () => void;
  /** Cambia al reintentar, para volver a montar la pantalla y repetir sus pedidos. */
  retryKey: number;
  ventaSubTab: VentaSubTab;
  setVentaSubTab: (t: VentaSubTab) => void;
  stockSubTab: StockSubTab;
  setStockSubTab: (t: StockSubTab) => void;
  compraSubTab: CompraSubTab;
  setCompraSubTab: (t: CompraSubTab) => void;
  adminSubTab: AdminSubTab;
  setAdminSubTab: (t: AdminSubTab) => void;
  navigateToSubTab: (module: MainModule, subTab?: string) => void;

  // Modales globales
  contactModalOpen: boolean;
  setContactModalOpen: (open: boolean) => void;
  accountModalOpen: boolean;
  setAccountModalOpen: (open: boolean) => void;

  // Contacto con soporte
  contactMessages: ContactMessage[];
  sendContactMessage: (nombre: string, email: string, asunto: string, mensaje: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_AVATAR = '';
const avatarKey = (username: string) => `distrimarket_avatar_${username}`;

function readAvatar(username: string): string {
  try {
    return localStorage.getItem(avatarKey(username)) ?? DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

function toProfile(current: Session, profile: UsuarioResponseDTO | null, avatarUrl: string): UserProfile {
  // Mientras llega /auth/me se muestra lo que trae el token.
  const roles = profile?.roles ?? current.roles;
  return {
    idUsuario: profile?.idUsuario,
    username: current.username,
    name: profile?.nombreCompleto ?? current.username,
    roles,
    role: rolesLabel(roles),
    documento: profile?.documento,
    idEmpleado: profile?.idEmpleado ?? current.idEmpleado,
    cargo: profile?.cargo,
    idDeposito: profile?.idDeposito ?? current.idDeposito,
    nombreDeposito: profile?.nombreDeposito,
    avatarUrl,
  };
}

const GUEST: UserProfile = { username: '', name: '', roles: [], role: '', avatarUrl: '' };

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

  // Sesión: el token guardado (si sigue vigente) y el perfil que devuelve /auth/me.
  const [current, setCurrent] = useState<Session | null>(session.get);
  const [profile, setProfile] = useState<UsuarioResponseDTO | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => (current ? readAvatar(current.username) : DEFAULT_AVATAR));
  const [loginNotice, setLoginNotice] = useState<string | null>(null);

  const isLoggedIn = current !== null;
  const user = current ? toProfile(current, profile, avatarUrl) : GUEST;
  const isAdmin = user.roles.includes('ADMIN');

  // Ruta actual: la URL del navegador (atrás/adelante incluidos).
  const [path, setPath] = useState(() => window.location.pathname);
  const navigate = useCallback((to: string) => {
    if (window.location.pathname !== to) window.history.pushState(null, '', to);
    setPath(to);
  }, []);
  useEffect(() => {
    const alVolver = () => setPath(window.location.pathname);
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  const route = resolveRoute(path, user.roles);
  const activeModule = 'module' in route && route.module ? route.module : homeModule(user.roles);
  // La barra de direcciones muestra siempre lo que se ve: /login sin sesión (salvo pantallas de error público
  // como /401 o /403) y, con sesión, el módulo real.
  const isPublicError = path === '/401' || path === '/403' || path === '/unauthorized' || path === '/forbidden';
  const urlVisible = !isLoggedIn ? (isPublicError ? path : LOGIN_PATH) : route.kind === 'redirect' ? route.to : path;
  useEffect(() => {
    if (window.location.pathname !== urlVisible) window.history.replaceState(null, '', urlVisible);
  }, [urlVisible, path]);

  const [serverError, setServerError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => serverErrors.subscribe(setServerError), []);
  const retryAfterServerError = () => {
    setServerError(null);
    setRetryKey((k) => k + 1);
  };

  const [ventaSubTab, setVentaSubTab] = useState<VentaSubTab>('facturas');
  const [stockSubTab, setStockSubTab] = useState<StockSubTab>('productos');
  const [compraSubTab, setCompraSubTab] = useState<CompraSubTab>('facturas');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('usuarios');

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  const endSession = useCallback(
    (notice: string | null) => {
      session.clear();
      // Los catálogos guardados son de esta sesión: el próximo usuario los vuelve a pedir.
      setCurrent(null);
      setProfile(null);
      setServerError(null);
      setLoginNotice(notice);
      navigate(LOGIN_PATH);
    },
    [navigate]
  );

  // El backend rechazó el pedido (401 o 403): logout y vuelta al login con el motivo.
  useEffect(() => session.onExpired((motivo) => endSession(motivo)), [endSession]);

  // El token vence a la hora indicada por el backend: la sesión se cierra sola.
  useEffect(() => {
    if (!current) return;
    const restante = new Date(current.expiresAt).getTime() - Date.now();
    const timer = window.setTimeout(() => endSession('Su sesión expiró. Inicie sesión nuevamente.'), Math.max(0, restante));
    return () => window.clearTimeout(timer);
  }, [current, endSession]);

  // Datos del usuario (nombre, documento, cargo): al iniciar sesión y al recargar la página.
  useEffect(() => {
    if (!current || profile) return;
    let vigente = true;
    authApi
      .me()
      .then((me) => {
        if (vigente) setProfile(me);
      })
      .catch(() => {
        // Un 401 ya cierra la sesión desde el cliente HTTP; otros errores no impiden usar la app.
      });
    return () => {
      vigente = false;
    };
  }, [current, profile]);

  useEffect(() => {
    localStorage.setItem('distrimarket_user_theme', JSON.stringify(theme));
    document.documentElement.style.setProperty('--user-primary-color', theme.primaryHex);
    document.documentElement.style.setProperty('--user-hover-color', theme.hoverHex);
    // Texto sobre el color principal: negro si el color es muy claro (ver .sobre-primario en index.css).
    document.documentElement.style.setProperty('--user-on-primary-color', textoSobre(theme.primaryHex));
    // Modo claro por defecto; el oscuro se elige en Personalización (ver html.oscuro en index.css).
    document.documentElement.classList.toggle('oscuro', Boolean(theme.isDark));
  }, [theme]);

  const setThemeColor = (colorId: string) => {
    const found = THEME_PALETTES.find((p) => p.colorId === colorId);
    if (found) {
      setTheme((prev) => ({ ...found, isDark: prev.isDark }));
    }
  };

  const setThemeHex = (hex: string) => {
    if (esHexValido(hex)) setTheme((prev) => temaDesdeHex(hex, prev.isDark));
  };

  const toggleDarkMode = () => {
    setTheme((prev) => ({ ...prev, isDark: !prev.isDark }));
  };

  const canAccess = (module: MainModule) => rolesCanAccess(user.roles, module);
  const hasRole = (rol: RolUsuario) => user.roles.includes(rol);

  // Un usuario nunca queda parado en un módulo que no le corresponde (también lo controla resolveRoute).
  const setActiveModule = (module: MainModule) => {
    if (canAccess(module)) navigate(MODULE_PATHS[module]);
  };

  const navigateToSubTab = (module: MainModule, subTab?: string) => {
    if (!canAccess(module)) return;
    if (subTab) {
      if (module === 'venta') setVentaSubTab(subTab as VentaSubTab);
      else if (module === 'stock') setStockSubTab(subTab as StockSubTab);
      else if (module === 'compra') setCompraSubTab(subTab as CompraSubTab);
      else if (module === 'administracion') setAdminSubTab(subTab as AdminSubTab);
    }
    navigate(MODULE_PATHS[module]);
  };

  const goHome = () => navigate(MODULE_PATHS[homeModule(user.roles)]);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      const token = await authApi.login({ username: username.trim(), password });
      const nueva = session.start(token);
      setCurrent(nueva);
      setLoginNotice(null);
      setServerError(null);
      setAvatarUrl(readAvatar(nueva.username));
      // La ruta que se había pedido antes del login se respeta si el rol la permite (resolveRoute).
      // El perfil (/auth/me) lo pide el efecto que observa la sesión.
      setProfile(null);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const logout = () => endSession(null);

  const updateAvatar = (url: string) => {
    if (!current) return;
    localStorage.setItem(avatarKey(current.username), url);
    setAvatarUrl(url);
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

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        loginNotice,
        updateAvatar,
        canAccess,
        hasRole,
        isAdmin,
        theme,
        setThemeColor,
        setThemeHex,
        toggleDarkMode,
        route,
        activeModule,
        goHome,
        navigate,
        serverError,
        retryAfterServerError,
        retryKey,
        setActiveModule,
        navigateToSubTab,
        ventaSubTab,
        setVentaSubTab,
        stockSubTab,
        setStockSubTab,
        compraSubTab,
        setCompraSubTab,
        adminSubTab,
        setAdminSubTab,
        contactModalOpen,
        setContactModalOpen,
        accountModalOpen,
        setAccountModalOpen,
        contactMessages,
        sendContactMessage,
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
