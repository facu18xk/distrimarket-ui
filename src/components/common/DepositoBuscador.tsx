import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Warehouse, X } from 'lucide-react';
import { fieldClass } from './FormControls';
import { useHaciaArriba } from '../../hooks/useHaciaArriba';
import { cn } from '../../lib/utils';
import type { DepositoResponseDTO } from '../../types/api';

interface DepositoBuscadorProps {
  /** Depósitos entre los que se busca (el catálogo chico de la sesión). */
  depositos: DepositoResponseDTO[];
  value: DepositoResponseDTO | null;
  onChange: (deposito: DepositoResponseDTO | null) => void;
  /** Ids ya elegidos en otras filas: no se ofrecen de nuevo. */
  excluir?: number[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_RESULTADOS = 8;

/** Sin tildes ni mayúsculas, para que "deposito" encuentre "Depósito". */
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Buscador de depósito por nombre o ubicación, como el de cliente en la factura: se escribe,
 * se elige con el mouse o con las flechas y Enter. Busca en el catálogo de depósitos ya cargado
 * (inventario no busca por texto), así que no hace pedidos al backend.
 */
export const DepositoBuscador: React.FC<DepositoBuscadorProps> = ({ depositos, value, onChange, excluir = [], required = false, disabled = false, placeholder = 'Buscar depósito por nombre o ubicación...' }) => {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const haciaArriba = useHaciaArriba(contenedor, abierto);

  const coincidencias = useMemo(() => {
    const terminos = normalizar(texto).split(/\s+/).filter(Boolean);
    return depositos.filter(
      (d) => !excluir.includes(d.id) && terminos.every((t) => normalizar(`${d.nombre} ${d.ubicacion ?? ''}`).includes(t))
    );
  }, [depositos, excluir, texto]);
  const resultados = coincidencias.slice(0, MAX_RESULTADOS);

  // Clic fuera del buscador: se cierra la lista.
  useEffect(() => {
    if (!abierto) return;
    const cerrar = (event: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(event.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const elegir = (deposito: DepositoResponseDTO) => {
    onChange(deposito);
    setTexto('');
    setAbierto(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setAbierto(true);
      setResaltado((actual) => Math.min(actual + 1, resultados.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setResaltado((actual) => Math.max(actual - 1, 0));
    } else if (event.key === 'Enter' && abierto) {
      // Enter elige un depósito; no debe enviar el formulario.
      event.preventDefault();
      if (resultados[resaltado]) elegir(resultados[resaltado]);
    } else if (event.key === 'Escape' && abierto) {
      event.stopPropagation();
      setAbierto(false);
    }
  };

  if (value) {
    return (
      <div className={cn(fieldClass, 'flex items-center justify-between gap-2 bg-white')}>
        <span className="min-w-0 truncate">
          <strong className="text-slate-900">{value.nombre}</strong>
          {value.ubicacion ? <span className="text-slate-400"> · {value.ubicacion}</span> : null}
        </span>
        {!disabled && (
          <button type="button" onClick={() => onChange(null)} className="shrink-0 text-slate-400 hover:text-slate-700" title="Cambiar depósito">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={contenedor}>
      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        // Obligatorio = elegir un depósito de la lista (no alcanza con escribir).
        ref={(input) => input?.setCustomValidity(required ? 'Elija un depósito de la lista.' : '')}
        className={cn(fieldClass, 'pl-8')}
        disabled={disabled}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setResaltado(0);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={abierto}
      />
      {abierto && (
        <div className={cn('absolute z-30 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden text-xs', haciaArriba ? 'bottom-full mb-1' : 'mt-1')}>
          {resultados.map((d, i) => (
            <button
              key={d.id}
              type="button"
              onMouseEnter={() => setResaltado(i)}
              onClick={() => elegir(d)}
              className={cn('w-full text-left px-3 py-1.5 flex items-center gap-2', resaltado === i && 'bg-slate-100')}
            >
              <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-800 truncate">{d.nombre}</span>
              {d.ubicacion && <span className="text-slate-500 truncate">· {d.ubicacion}</span>}
            </button>
          ))}
          {resultados.length === 0 && <p className="px-3 py-2 text-slate-400">No hay depósitos que coincidan.</p>}
          {coincidencias.length > MAX_RESULTADOS && (
            <p className="px-3 py-1.5 border-t border-slate-100 text-slate-400">
              {coincidencias.length - MAX_RESULTADOS} más: siga escribiendo para acotar.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
