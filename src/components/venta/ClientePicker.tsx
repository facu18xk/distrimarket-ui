import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Search, UserPlus, X } from 'lucide-react';
import { fieldClass } from '../common';
import { useDebounce } from '../../hooks';
import { ventasApi } from '../../services';
import { formatDocumento, formatPhone } from '../../lib/paraguay';
import { cn } from '../../lib/utils';
import type { ClienteResponseDTO } from '../../types/api';

interface ClientePickerProps {
  value: ClienteResponseDTO | null;
  onChange: (cliente: ClienteResponseDTO | null) => void;
  /** Se llama con lo que el usuario escribió cuando elige registrar un cliente nuevo. */
  onCreate: (texto: string) => void;
}

const MAX_RESULTADOS = 6;

/** "4.123.456" o "80012345-6" se buscan como están guardados: sin puntos. */
const paraBuscar = (texto: string) => (/^[\d.\-\s]+$/.test(texto) ? texto.replace(/[.\s]/g, '') : texto);

/**
 * Buscador rápido de cliente por nombre, CI o RUC. La búsqueda la hace el
 * backend; si el cliente no existe, se lo registra sin salir de la factura.
 */
export const ClientePicker: React.FC<ClientePickerProps> = ({ value, onChange, onCreate }) => {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  // Resultados junto con el texto al que corresponden: si no es el actual, se está buscando.
  const [encontrado, setEncontrado] = useState<{ texto: string | null; clientes: ClienteResponseDTO[] }>({ texto: null, clientes: [] });
  const [resaltado, setResaltado] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const busqueda = useDebounce(texto.trim(), 250);

  useEffect(() => {
    if (!abierto) return;
    let cancelado = false;
    ventasApi.clientes
      .list({ page: 1, size: MAX_RESULTADOS, search: paraBuscar(busqueda) })
      .then((pagina) => {
        if (cancelado) return;
        setEncontrado({ texto: busqueda, clientes: pagina.content });
        setResaltado(0);
      })
      .catch(() => {
        if (!cancelado) setEncontrado({ texto: busqueda, clientes: [] });
      });
    return () => {
      cancelado = true;
    };
  }, [busqueda, abierto]);

  // Mientras se escribe (o hasta que llega la respuesta) no se muestran resultados viejos.
  const buscando = abierto && (encontrado.texto !== busqueda || busqueda !== texto.trim());
  const resultados = buscando ? [] : encontrado.clientes;

  // Clic fuera del buscador: se cierra la lista.
  useEffect(() => {
    const cerrar = (event: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(event.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const elegir = (cliente: ClienteResponseDTO) => {
    onChange(cliente);
    setTexto('');
    setAbierto(false);
  };

  const crear = () => {
    setAbierto(false);
    onCreate(texto.trim());
  };

  // Las opciones navegables con el teclado: los resultados y, al final, "registrar".
  const totalOpciones = resultados.length + 1;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setAbierto(true);
      setResaltado((actual) => (actual + 1) % totalOpciones);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setResaltado((actual) => (actual - 1 + totalOpciones) % totalOpciones);
    } else if (event.key === 'Enter' && abierto) {
      // Enter elige una opción; no debe enviar la factura.
      event.preventDefault();
      if (resaltado < resultados.length) elegir(resultados[resaltado]);
      else crear();
    } else if (event.key === 'Escape' && abierto) {
      event.stopPropagation();
      setAbierto(false);
    }
  };

  if (value) {
    const p = value.persona;
    return (
      <div className={cn(fieldClass, 'flex items-center justify-between gap-2 bg-white')}>
        <div className="min-w-0">
          <span className="block font-bold text-slate-900 truncate">{p.nombreCompleto}</span>
          <span className="block text-[11px] text-slate-500 truncate">
            {p.ruc ? `RUC ${p.ruc}` : `CI ${formatDocumento(p.ci)}`}
            {p.telefono ? ` · ${formatPhone(p.telefono)}` : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 text-slate-400 hover:text-slate-700"
          title="Cambiar cliente"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={contenedor}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
      </div>
      {/* `required` hace que el navegador no deje enviar la factura sin cliente. */}
      <input
        className={cn(fieldClass, 'pl-9')}
        required
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={handleKeyDown}
        placeholder="Nombre, CI o RUC..."
        autoComplete="off"
        role="combobox"
        aria-expanded={abierto}
      />

      {abierto && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden text-xs">
          {resultados.map((cliente, i) => (
            <button
              key={cliente.idCliente}
              type="button"
              onMouseEnter={() => setResaltado(i)}
              onClick={() => elegir(cliente)}
              className={cn('w-full text-left px-3 py-2 flex items-center justify-between gap-3', resaltado === i && 'bg-slate-100')}
            >
              <span className="font-semibold text-slate-800 truncate">{cliente.persona.nombreCompleto}</span>
              <span className="text-slate-500 shrink-0">{formatDocumento(cliente.persona.ci, cliente.persona.ruc)}</span>
            </button>
          ))}

          {!buscando && resultados.length === 0 && (
            <p className="px-3 py-2 text-slate-400">{busqueda ? 'No hay clientes que coincidan.' : 'Escriba para buscar.'}</p>
          )}

          <button
            type="button"
            onMouseEnter={() => setResaltado(resultados.length)}
            onClick={crear}
            className={cn(
              'w-full text-left px-3 py-2 flex items-center gap-2 border-t border-slate-100 font-semibold text-emerald-700',
              resaltado === resultados.length && 'bg-emerald-50'
            )}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{texto.trim() ? `Registrar cliente "${texto.trim()}"` : 'Registrar cliente nuevo'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
