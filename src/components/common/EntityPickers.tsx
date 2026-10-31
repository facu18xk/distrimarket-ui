import type { FC, ReactNode } from 'react';
import { PackagePlus, Plus, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { RemotePicker } from './RemotePicker';
import { comprasApi, inventarioApi, ventasApi } from '../../services';
import type { PageQuery } from '../../services/pagination';
import { formatMoney } from '../../lib/format';
import { formatDocumento, formatRuc } from '../../lib/paraguay';
import { nombreProveedor } from '../../lib/proveedor';
import type { ClienteResponseDTO, EmpleadoResponseDTO, ProductoResponseDTO, ProveedorResponseDTO } from '../../types/api';

/** Selectores de recursos grandes, de a 10 por página (ver RemotePicker). */

interface PickerProps<T> {
  value: T | null;
  onChange: (value: T | null) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  pie?: ReactNode;
}

// Funciones de módulo: estables entre renders, como pide RemotePicker.
const paginaDeProductos = (query: PageQuery) => inventarioApi.productos.list(query);
const paginaDeEmpleadosActivos = (query: PageQuery) => inventarioApi.empleados.list(query, { estado: true });
const paginaDeProveedores = (query: PageQuery) => comprasApi.proveedores.list(query);
const paginaDeClientes = (query: PageQuery) => ventasApi.clientes.list(query);


/**
 * Última opción de un selector con búsqueda: crear uno nuevo sin salir del formulario.
 * Mismo aspecto en clientes, proveedores y productos.
 */
export function PieCrearNuevo({ texto, icono, onClick }: { texto: string; icono: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-full text-left px-3 py-2 flex items-center gap-2 font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
    >
      {icono}
      <span>{texto}</span>
    </button>
  );
}

/** Botón "Nuevo" junto a un selector (proveedor, producto): el mismo en todos los formularios. */
export function BotonNuevo({ onClick, title, disabled }: { onClick: () => void; title: string; disabled?: boolean }) {
  return (
    <Button type="button" variant="outline" className="h-9 shrink-0 px-3" onClick={onClick} title={title} disabled={disabled}>
      <Plus />
      <span>Nuevo</span>
    </Button>
  );
}

export interface ProductoPickerProps extends PickerProps<ProductoResponseDTO> {
  mostrarPrecio?: boolean;
  buscable?: boolean;
  onCrearNuevo?: () => void;
}

export const ProductoPicker: FC<ProductoPickerProps> = ({
  mostrarPrecio = true,
  buscable = true,
  onCrearNuevo,
  ...props
}) => (
  <RemotePicker
    {...props}
    buscable={buscable}
    buscarPagina={paginaDeProductos}
    clave={(p) => p.id}
    etiqueta={(p) => p.nombre}
    detalle={mostrarPrecio ? (p) => formatMoney(p.precioVenta) : (p) => p.codigoBarra ?? ''}
    deshabilitado={(p) => !p.estado}
    placeholder={props.placeholder ?? 'Seleccionar producto...'}
    pie={onCrearNuevo ? <PieCrearNuevo texto="Crear producto nuevo" icono={<PackagePlus className="w-3.5 h-3.5" />} onClick={onCrearNuevo} /> : props.pie}
  />
);

export const EmpleadoPicker: FC<PickerProps<EmpleadoResponseDTO>> = (props) => (
  <RemotePicker
    {...props}
    buscable
    buscarPagina={paginaDeEmpleadosActivos}
    clave={(e) => e.id}
    etiqueta={(e) => e.persona.nombreCompleto}
    detalle={(e) => e.cargo}
    placeholder={props.placeholder ?? 'Seleccionar empleado...'}
  />
);

/** Proveedores: con búsqueda y, si se pasa onCrearNuevo, "Crear proveedor nuevo" al fondo (como en clientes). */
export const ProveedorPicker: FC<PickerProps<ProveedorResponseDTO> & { onCrearNuevo?: () => void }> = ({ onCrearNuevo, ...props }) => (
  <RemotePicker
    {...props}
    pie={onCrearNuevo ? <PieCrearNuevo texto="Crear proveedor nuevo" icono={<UserPlus className="w-3.5 h-3.5" />} onClick={onCrearNuevo} /> : props.pie}
    buscable
    buscarPagina={paginaDeProveedores}
    clave={(p) => p.idProveedor}
    etiqueta={(p) => nombreProveedor(p)}
    detalle={(p) => formatRuc(p.persona.ruc)}
    deshabilitado={(p) => !p.estado}
    placeholder={props.placeholder ?? 'Seleccionar proveedor...'}
  />
);

/** Clientes: ventas sí busca por nombre, CI o RUC. */
export const ClienteSelector: FC<PickerProps<ClienteResponseDTO>> = (props) => (
  <RemotePicker
    {...props}
    buscable
    buscarPagina={paginaDeClientes}
    clave={(c) => c.idCliente}
    etiqueta={(c) => c.persona.nombreCompleto}
    detalle={(c) => formatDocumento(c.persona.ci, c.persona.ruc)}
    placeholder={props.placeholder ?? 'Todos los clientes'}
  />
);
