import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { MainModule, VentaSubTab, AdminSubTab, UserProfile, ThemeConfig, ContactMessage } from '../types/distrimarket';
import type { RolUsuario, UsuarioResponseDTO } from '../types/api';
import { THEME_PALETTES } from '../lib/theme';
import { canAccess as rolesCanAccess, homeModule, rolesLabel } from '../auth/roles';
import { session, type Session } from '../auth/session';
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

  const [activeModule, setActiveModuleState] = useState<MainModule>(() => (current ? homeModule(current.roles) : 'venta'));
  const [ventaSubTab, setVentaSubTab] = useState<VentaSubTab>('facturas');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('usuarios');

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  const endSession = useCallback((notice: string | null) => {
    session.clear();
    setCurrent(null);
    setProfile(null);
    setLoginNotice(notice);
  }, []);

  // El backend rechazó el token (401): se vuelve al login con un aviso.
  useEffect(
    () => session.onExpired(() => endSession('Su sesión expiró o ya no es válida. Inicie sesión nuevamente.')),
    [endSession]
  );

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

  const canAccess = (module: MainModule) => rolesCanAccess(user.roles, module);
  const hasRole = (rol: RolUsuario) => user.roles.includes(rol);

  // Un usuario nunca queda parado en un módulo que no le corresponde.
  const setActiveModule = (module: MainModule) => {
    if (canAccess(module)) setActiveModuleState(module);
  };

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      const token = await authApi.login({ username: username.trim(), password });
      const nueva = session.start(token);
      setCurrent(nueva);
      setLoginNotice(null);
      setAvatarUrl(readAvatar(nueva.username));
      setActiveModuleState(homeModule(nueva.roles));
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
