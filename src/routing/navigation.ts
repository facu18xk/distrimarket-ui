import type { ComponentType } from 'react';
import {
  FileText,
  Users,
  BarChart3,
  Package,
  Boxes,
  SlidersHorizontal,
  ArrowLeftRight,
  Warehouse,
  Receipt,
  Truck,
  UserCheck,
  Stamp,
  CreditCard,
  Megaphone,
  UserCog,
  LifeBuoy,
} from 'lucide-react';
import type { MainModule, VentaSubTab, StockSubTab, CompraSubTab, AdminSubTab } from '../types';

export interface SubSectionItem<T extends string = string> {
  id: T;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const VENTA_SUBTABS: SubSectionItem<VentaSubTab>[] = [
  { id: 'facturas', label: 'Facturas', icon: FileText },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'promociones', label: 'Promociones', icon: Megaphone },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
];

export const STOCK_SUBTABS: SubSectionItem<StockSubTab>[] = [
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'existencias', label: 'Existencias', icon: Boxes },
  { id: 'ajustes', label: 'Ajustes', icon: SlidersHorizontal },
  { id: 'transferencias', label: 'Transferencias', icon: ArrowLeftRight },
  { id: 'depositos', label: 'Depósitos', icon: Warehouse },
];

export const COMPRA_SUBTABS: SubSectionItem<CompraSubTab>[] = [
  { id: 'facturas', label: 'Facturas de compra', icon: Receipt },
  { id: 'proveedores', label: 'Proveedores', icon: Truck },
];

export const ADMIN_SUBTABS: SubSectionItem<AdminSubTab>[] = [
  { id: 'usuarios', label: 'Usuarios', icon: UserCheck },
  { id: 'empleados', label: 'Empleados', icon: UserCog },
  { id: 'timbrados', label: 'Timbrados', icon: Stamp },
  { id: 'mediosPago', label: 'Medios de pago', icon: CreditCard },
  { id: 'soporte', label: 'Soporte', icon: LifeBuoy },
];

export const MODULE_SUBSECTIONS: Record<MainModule, SubSectionItem[]> = {
  venta: VENTA_SUBTABS,
  stock: STOCK_SUBTABS,
  compra: COMPRA_SUBTABS,
  administracion: ADMIN_SUBTABS,
};
