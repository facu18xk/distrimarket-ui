import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  MainModule,
  StockSubTab,
  CompraSubTab,
  VentaSubTab,
  PromocionSubTab,
  UserProfile,
  ThemeConfig,
  ProductItem,
  StockAdjustmentItem,
  StockMovementItem,
  DepositoItem,
  CompraItem,
  ProveedorItem,
  VentaItem,
  ClienteItem,
  PromocionItem,
  ContactMessage
} from '../types/distrimarket';
import {
  THEME_PALETTES,
  INITIAL_PRODUCTS,
  INITIAL_ADJUSTMENTS,
  INITIAL_MOVEMENTS,
  INITIAL_DEPOSITOS,
  INITIAL_COMPRAS,
  INITIAL_PROVEEDORES,
  INITIAL_VENTAS,
  INITIAL_CLIENTES,
  INITIAL_PROMOCIONES
} from '../data/mockData';

interface AppContextType {
  // Auth & Profile
  isLoggedIn: boolean;
  user: UserProfile;
  login: (name: string, pass: string) => boolean;
  logout: () => void;
  updateUser: (updated: Partial<UserProfile>) => void;

  // Theming (User-specific without redeploying)
  theme: ThemeConfig;
  setThemeColor: (colorId: string) => void;
  toggleDarkMode: () => void;

  // Navigation
  activeModule: MainModule;
  setActiveModule: (m: MainModule) => void;
  stockSubTab: StockSubTab;
  setStockSubTab: (t: StockSubTab) => void;
  selectedDeposito: string;
  setSelectedDeposito: (dep: string) => void;
  compraSubTab: CompraSubTab;
  setCompraSubTab: (t: CompraSubTab) => void;
  ventaSubTab: VentaSubTab;
  setVentaSubTab: (t: VentaSubTab) => void;
  promocionSubTab: PromocionSubTab;
  setPromocionSubTab: (t: PromocionSubTab) => void;

  // Modals
  contactModalOpen: boolean;
  setContactModalOpen: (open: boolean) => void;
  accountModalOpen: boolean;
  setAccountModalOpen: (open: boolean) => void;

  // Contact support
  contactMessages: ContactMessage[];
  sendContactMessage: (nombre: string, email: string, asunto: string, mensaje: string) => void;

  // Data Collections
  products: ProductItem[];
  addProduct: (p: Omit<ProductItem, 'id'>) => void;
  deleteProduct: (id: string) => void;

  adjustments: StockAdjustmentItem[];
  addAdjustment: (a: Omit<StockAdjustmentItem, 'id'>) => void;

  movements: StockMovementItem[];
  addMovement: (m: Omit<StockMovementItem, 'id'>) => void;

  depositos: DepositoItem[];
  addDeposito: (d: Omit<DepositoItem, 'id'>) => void;

  compras: CompraItem[];
  addCompra: (c: Omit<CompraItem, 'id'>) => void;

  proveedores: ProveedorItem[];
  addProveedor: (p: Omit<ProveedorItem, 'id'>) => void;

  ventas: VentaItem[];
  addVenta: (v: Omit<VentaItem, 'id'>) => void;

  clientes: ClienteItem[];
  addCliente: (c: Omit<ClienteItem, 'id'>) => void;

  promociones: PromocionItem[];
  addPromocion: (p: Omit<PromocionItem, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved theme or default to Figma orange
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

  // User Profile (per-user state)
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('distrimarket_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading user profile', e);
      }
    }
    return {
      name: 'Juan Pérez',
      email: 'juan.perez@distrimarket.com',
      role: 'Administrador de Sucursal',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('distrimarket_is_logged_in');
    return saved !== null ? saved === 'true' : true;
  });

  // Navigation State
  const [activeModule, setActiveModule] = useState<MainModule>('stock');
  const [stockSubTab, setStockSubTab] = useState<StockSubTab>('inventario');
  const [selectedDeposito, setSelectedDeposito] = useState<string>('Depósito Central');
  const [compraSubTab, setCompraSubTab] = useState<CompraSubTab>('compras');
  const [ventaSubTab, setVentaSubTab] = useState<VentaSubTab>('ventas');
  const [promocionSubTab, setPromocionSubTab] = useState<PromocionSubTab>('activas');

  // Modals
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  // Entities Data State
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [adjustments, setAdjustments] = useState<StockAdjustmentItem[]>(INITIAL_ADJUSTMENTS);
  const [movements, setMovements] = useState<StockMovementItem[]>(INITIAL_MOVEMENTS);
  const [depositos, setDepositos] = useState<DepositoItem[]>(INITIAL_DEPOSITOS);
  const [compras, setCompras] = useState<CompraItem[]>(INITIAL_COMPRAS);
  const [proveedores, setProveedores] = useState<ProveedorItem[]>(INITIAL_PROVEEDORES);
  const [ventas, setVentas] = useState<VentaItem[]>(INITIAL_VENTAS);
  const [clientes, setClientes] = useState<ClienteItem[]>(INITIAL_CLIENTES);
  const [promociones, setPromociones] = useState<PromocionItem[]>(INITIAL_PROMOCIONES);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  // Save changes to localStorage for per-user personalization
  useEffect(() => {
    localStorage.setItem('distrimarket_user_theme', JSON.stringify(theme));
    document.documentElement.style.setProperty('--user-primary-color', theme.primaryHex);
    document.documentElement.style.setProperty('--user-hover-color', theme.hoverHex);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('distrimarket_user_profile', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('distrimarket_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  const setThemeColor = (colorId: string) => {
    const found = THEME_PALETTES.find((p) => p.colorId === colorId);
    if (found) {
      setTheme((prev) => ({
        ...found,
        isDark: prev.isDark,
      }));
    }
  };

  const toggleDarkMode = () => {
    setTheme((prev) => ({
      ...prev,
      isDark: !prev.isDark,
    }));
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  const login = (name: string, _pass: string) => {
    setIsLoggedIn(true);
    if (name.trim()) {
      updateUser({ name: name.trim() });
    }
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
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

  // Add Item Handlers
  const addProduct = (p: Omit<ProductItem, 'id'>) => {
    const newItem: ProductItem = {
      ...p,
      id: String(Date.now()),
    };
    setProducts((prev) => [newItem, ...prev]);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const addAdjustment = (a: Omit<StockAdjustmentItem, 'id'>) => {
    const nextNum = adjustments.length + 1;
    const newItem: StockAdjustmentItem = {
      ...a,
      id: `AJ-${String(nextNum).padStart(3, '0')}`,
    };
    setAdjustments((prev) => [newItem, ...prev]);
  };

  const addMovement = (m: Omit<StockMovementItem, 'id'>) => {
    const nextNum = movements.length + 1;
    const newItem: StockMovementItem = {
      ...m,
      id: `MV-${String(nextNum).padStart(3, '0')}`,
    };
    setMovements((prev) => [newItem, ...prev]);
  };

  const addDeposito = (d: Omit<DepositoItem, 'id'>) => {
    const newItem: DepositoItem = {
      ...d,
      id: String(Date.now()),
    };
    setDepositos((prev) => [...prev, newItem]);
  };

  const addCompra = (c: Omit<CompraItem, 'id'>) => {
    const nextNum = compras.length + 1;
    const newItem: CompraItem = {
      ...c,
      id: `CO-${String(nextNum).padStart(3, '0')}`,
    };
    setCompras((prev) => [newItem, ...prev]);
  };

  const addProveedor = (p: Omit<ProveedorItem, 'id'>) => {
    const newItem: ProveedorItem = {
      ...p,
      id: String(Date.now()),
    };
    setProveedores((prev) => [...prev, newItem]);
  };

  const addVenta = (v: Omit<VentaItem, 'id'>) => {
    const nextNum = ventas.length + 1;
    const newItem: VentaItem = {
      ...v,
      id: `VT-${String(nextNum).padStart(3, '0')}`,
      numeroComprobante: `VT-${String(nextNum).padStart(3, '0')}`,
    };
    setVentas((prev) => [newItem, ...prev]);
  };

  const addCliente = (c: Omit<ClienteItem, 'id'>) => {
    const newItem: ClienteItem = {
      ...c,
      id: String(Date.now()),
    };
    setClientes((prev) => [...prev, newItem]);
  };

  const addPromocion = (p: Omit<PromocionItem, 'id'>) => {
    const newItem: PromocionItem = {
      ...p,
      id: String(Date.now()),
    };
    setPromociones((prev) => [newItem, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        updateUser,
        theme,
        setThemeColor,
        toggleDarkMode,
        activeModule,
        setActiveModule,
        stockSubTab,
        setStockSubTab,
        selectedDeposito,
        setSelectedDeposito,
        compraSubTab,
        setCompraSubTab,
        ventaSubTab,
        setVentaSubTab,
        promocionSubTab,
        setPromocionSubTab,
        contactModalOpen,
        setContactModalOpen,
        accountModalOpen,
        setAccountModalOpen,
        contactMessages,
        sendContactMessage,
        products,
        addProduct,
        deleteProduct,
        adjustments,
        addAdjustment,
        movements,
        addMovement,
        depositos,
        addDeposito,
        compras,
        addCompra,
        proveedores,
        addProveedor,
        ventas,
        addVenta,
        clientes,
        addCliente,
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
