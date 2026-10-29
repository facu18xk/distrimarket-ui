import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { fieldClass } from './FormControls';
import { usePagedResource } from '../../hooks/usePagedResource';
import { useHaciaArriba } from '../../hooks/useHaciaArriba';
import { cn } from '../../lib/utils';
import type { PageQuery, PageResult } from '../../services/pagination';

export interface RemotePickerProps<T> {
  value: T | null;
  onChange: (value: T | null) => void;
  /** Una página del backend (10 por vez). Debe ser estable: los métodos `list` de los servicios lo son. */
  buscarPagina: (query: PageQuery) => Promise<PageResult<T>>;
  clave: (item: T) => number;
  etiqueta: (item: T) => string;
  /** Texto secundario a la derecha (documento, precio, cargo). */
  detalle?: (item: T) => string;
  /** Opciones visibles pero no elegibles (por ejemplo, inactivas). */
  deshabilitado?: (item: T) => boolean;
  /** Solo si el backend busca por texto (`q`); si no, se recorre por páginas. */
  buscable?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Acción extra al pie de la lista (por ejemplo, "Registrar nuevo"). */
  pie?: ReactNode;
}

/**
 * Selector de un recurso grande (productos, empleados, proveedores, clientes): en lugar de
 * cargar todo para un <select>, pide de a una página al backend mientras la lista está abierta.
 */
export function RemotePicker<T>({
  value,
  onChange,
  buscarPagina,
  clave,
  etiqueta,
  detalle,
  deshabilitado,
  buscable = false,
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  pie,
}: RemotePickerProps<T>) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const opciones = usePagedResource<T>(buscarPagina, { enabled: abierto });
  const haciaArriba = useHaciaArriba(contenedor, abierto);

  // Clic fuera de la lista: se cierra.
  useEffect(() => {
    if (!abierto) return;
    const cerrar = (event: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(event.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const elegir = (item: T) => {
    onChange(item);
    setAbierto(false);
  };

  return (
    <div className="relative" ref={contenedor}>
      {/* Campo oculto para que el navegador exija una opción en los formularios. */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          className="absolute inset-0 opacity-0 pointer-events-none"
          required
          value={value ? String(clave(value)) : ''}
          onChange={() => undefined}
        />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto((actual) => !actual)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && abierto) {
            e.stopPropagation();
            setAbierto(false);
          }
        }}
        className={cn(fieldClass, 'flex items-center justify-between gap-2 text-left bg-white disabled:bg-slate-50 disabled:text-slate-500')}
      >
        <span className={cn('truncate', !value && 'text-slate-400')}>{value ? etiqueta(value) : placeholder}</span>
        <span className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && !disabled && !required && (
            <X
              className="w-3.5 h-3.5 hover:text-slate-700"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            />
          )}
          <ChevronDown className="w-3.5 h-3.5" />
        </span>
      </button>

      {abierto && (
        <div className={cn('absolute z-50 min-w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden text-xs', haciaArriba ? 'bottom-full mb-1' : 'mt-1')}>
          {buscable && (
            <div className="relative border-b border-slate-100">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                className="w-full pl-8 pr-2 py-2 outline-none"
                placeholder="Buscar..."
                value={opciones.search}
                onChange={(e) => opciones.setSearch(e.target.value)}
                onKeyDown={(e) => {
                  // Enter dentro del buscador no debe enviar el formulario.
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {opciones.error ? (
              <p className="px-3 py-2 text-rose-600">{opciones.error}</p>
            ) : opciones.loading && opciones.items.length === 0 ? (
              <p className="px-3 py-2 text-slate-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...
              </p>
            ) : opciones.items.length === 0 ? (
              <p className="px-3 py-2 text-slate-400">Sin resultados.</p>
            ) : (
              opciones.items.map((item) => {
                const bloqueado = deshabilitado?.(item) ?? false;
                const elegido = value !== null && clave(value) === clave(item);
                return (
                  <button
                    key={clave(item)}
                    type="button"
                    disabled={bloqueado}
                    onClick={() => elegir(item)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 flex items-center justify-between gap-3 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent',
                      elegido && 'bg-slate-100 font-bold',
                      opciones.loading && 'opacity-60'
                    )}
                  >
                    <span className="truncate text-slate-800">
                      {etiqueta(item)}
                      {bloqueado ? ' (inactivo)' : ''}
                    </span>
                    {detalle && <span className="text-slate-500 shrink-0">{detalle(item)}</span>}
                  </button>
                );
              })
            )}
          </div>

          {opciones.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-1 border-t border-slate-100 text-slate-500">
              <button
                type="button"
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                disabled={opciones.page <= 1}
                onClick={() => opciones.setPage(opciones.page - 1)}
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>
                Página {opciones.page} de {opciones.totalPages} · {opciones.totalElements} en total
              </span>
              <button
                type="button"
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                disabled={opciones.page >= opciones.totalPages}
                onClick={() => opciones.setPage(opciones.page + 1)}
                title="Página siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {pie && <div className="border-t border-slate-100">{pie}</div>}
        </div>
      )}
    </div>
  );
}
