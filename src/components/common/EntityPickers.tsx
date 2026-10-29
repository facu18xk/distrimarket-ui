import type { FC, ReactNode } from 'react';
import { PackagePlus } from 'lucide-react';
import { RemotePicker } from './RemotePicker';
import { comprasApi, inventarioApi, ventasApi } from '../../services';
import type { PageQuery } from '../../services/pagination';
import { formatMoney } from '../../lib/format';
import { formatDocumento } from '../../lib/paraguay';
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
    pie={
      onCrearNuevo ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCrearNuevo();
          }}
          className="w-full text-left px-3 py-2 flex items-center gap-2 font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          <PackagePlus className="w-3.5 h-3.5" />
          <span>Registrar producto nuevo</span>
        </button>
      ) : (
        props.pie
      )
    }
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

export const ProveedorPicker: FC<PickerProps<ProveedorResponseDTO>> = (props) => (
  <RemotePicker
    {...props}
    buscable
    buscarPagina={paginaDeProveedores}
    clave={(p) => p.idProveedor}
    etiqueta={(p) => nombreProveedor(p)}
    detalle={(p) => p.persona.ruc ?? ''}
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
