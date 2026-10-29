import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fieldClass } from './FormControls';
import { cn } from '../../lib/utils';

const miles = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 });

/** Número entero con punto de miles ("12.000"); null = campo vacío. */
const mostrar = (valor: number | null) => (valor === null ? '' : miles.format(valor));

interface CampoNumeroProps {
  /** null = vacío. */
  value: number | null;
  onChange: (valor: number | null) => void;
  min?: number;
  max?: number;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Texto fijo antes del número, por ejemplo "Gs.". */
  prefijo?: string;
  /** Mensaje de error propio (por ejemplo, stock insuficiente): bloquea el envío del formulario. */
  error?: string | null;
  className?: string;
  placeholder?: string;
  title?: string;
}

/**
 * Campo para enteros (cantidades y precios en guaraníes). Se puede borrar todo y escribir de nuevo,
 * al entrar se selecciona el valor (escribir lo reemplaza) y los miles se separan con punto.
 * Las validaciones (obligatorio, mínimo, máximo y errores propios) son las del navegador:
 * el formulario no se envía mientras alguna falle.
 */
export function CampoNumero({ value, onChange, min, max, required, disabled, autoFocus, prefijo, error, className, placeholder, title }: CampoNumeroProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState(() => mostrar(value));
  // Último valor que avisó este campo: si el de afuera cambia por otro motivo, se muestra el nuevo.
  const emitido = useRef<number | null>(value);
  const cursor = useRef<number | null>(null);

  useEffect(() => {
    if (value !== emitido.current) {
      emitido.current = value;
      setTexto(mostrar(value));
    }
  }, [value]);

  // Al agregar o quitar puntos de miles, el cursor queda después del mismo dígito.
  useLayoutEffect(() => {
    const input = ref.current;
    if (!input || cursor.current === null || document.activeElement !== input) return;
    let digitos = cursor.current;
    let pos = 0;
    while (pos < texto.length && digitos > 0) {
      if (/\d/.test(texto[pos])) digitos--;
      pos++;
    }
    input.setSelectionRange(pos, pos);
    cursor.current = null;
  }, [texto]);

  const mensaje =
    error ||
    (value !== null && min !== undefined && value < min ? `Debe ser ${min} o más.` : '') ||
    (value !== null && max !== undefined && value > max ? `Debe ser ${max} o menos.` : '');

  useEffect(() => {
    ref.current?.setCustomValidity(mensaje);
  }, [mensaje]);

  const cambiar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const crudo = e.target.value;
    const antesDelCursor = crudo.slice(0, e.target.selectionStart ?? crudo.length);
    cursor.current = (antesDelCursor.match(/\d/g) ?? []).length;
    const digitos = crudo.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 15);
    const nuevo = digitos === '' ? null : Number(digitos);
    emitido.current = nuevo;
    setTexto(mostrar(nuevo));
    onChange(nuevo);
  };

  const input = (
    <input
      ref={ref}
      className={cn(fieldClass, prefijo && 'pl-10', mensaje && 'border-rose-400 focus:border-rose-500', className)}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      required={required}
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder={placeholder}
      title={mensaje || title}
      aria-invalid={Boolean(mensaje)}
      value={texto}
      onChange={cambiar}
      onFocus={(e) => e.target.select()}
    />
  );

  if (!prefijo) return input;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{prefijo}</span>
      {input}
    </div>
  );
}
