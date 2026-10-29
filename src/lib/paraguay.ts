/**
 * Formatos y validaciones de documentos y datos de Paraguay.
 * Un solo lugar para que todos los formularios y tablas se comporten igual.
 */

export const onlyDigits = (value: string | null | undefined): string => (value ?? '').replace(/\D/g, '');

const miles = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// ------------------------------------------------------------------ Cédula

/** Lo que se guarda: solo dígitos (máximo 8). */
export function normalizeCi(value: string): string {
  return onlyDigits(value).slice(0, 8);
}

/** Para mostrar: 4.123.456 */
export function formatCi(value: string | null | undefined): string {
  const digits = onlyDigits(value);
  return digits ? miles(digits) : '';
}

export function ciError(value: string): string | null {
  const digits = onlyDigits(value);
  if (!digits) return null;
  return digits.length < 5 ? 'La cédula debe tener entre 5 y 8 dígitos.' : null;
}

// --------------------------------------------------------------------- RUC

/** Dígito verificador del RUC (módulo 11, el que usa la SET/DNIT). */
export function rucCheckDigit(base: string): number {
  const digits = onlyDigits(base);
  let total = 0;
  let factor = 2;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    total += Number(digits[i]) * factor;
    factor = factor === 11 ? 2 : factor + 1;
  }
  const resto = total % 11;
  return resto > 1 ? 11 - resto : 0;
}

/** Mientras se escribe: deja dígitos y un guion antes del verificador ("80012345-6"). */
export function maskRuc(value: string): string {
  const limpio = value.replace(/[^\d-]/g, '');
  const [base = '', ...resto] = limpio.split('-');
  const dv = resto.join('').slice(0, 1);
  const baseCorta = base.slice(0, 8);
  return limpio.includes('-') ? `${baseCorta}-${dv}` : baseCorta;
}

/** RUC completo a partir de la base, calculando el verificador: "80012345" -> "80012345-0". */
export function completeRuc(base: string): string {
  const digits = onlyDigits(base).slice(0, 8);
  return digits ? `${digits}-${rucCheckDigit(digits)}` : '';
}

export function rucError(value: string): string | null {
  if (!value.trim()) return null;
  const match = /^(\d{5,8})-(\d)$/.exec(value.trim());
  if (!match) return 'El RUC debe tener el formato 80012345-6 (número, guion y dígito verificador).';
  const esperado = rucCheckDigit(match[1]);
  return Number(match[2]) === esperado ? null : `El dígito verificador no coincide: para ${match[1]} corresponde ${esperado}.`;
}

/**
 * RUC para mostrar (y en el campo mientras se escribe): puntos de miles en la base, sin tocar
 * el guion ni el verificador: "80012345-6" -> "80.012.345-6". Se guarda sin puntos (ver maskRuc).
 */
export function formatRuc(value: string | null | undefined): string {
  if (!value) return '';
  const [base, ...resto] = value.split('-');
  if (!/^\d*$/.test(base)) return value;
  return resto.length ? `${miles(base)}-${resto.join('')}` : miles(base);
}

/** CI o RUC para mostrar en una tabla. */
export function formatDocumento(ci?: string | null, ruc?: string | null): string {
  if (ruc) return formatRuc(ruc);
  return formatCi(ci) || '—';
}

/** Un documento suelto (CI o RUC, por ejemplo el de una factura): con puntos de miles. */
export function formatDocumentoTexto(documento: string | null | undefined): string {
  if (!documento) return '—';
  return documento.includes('-') ? formatRuc(documento) : formatCi(documento) || documento;
}

// ---------------------------------------------------------------- Teléfono

/**
 * Lleva cualquier forma de escribirlo a la forma nacional: 0981 123 456.
 * Acepta +595 981..., 595981..., 981... y líneas fijas (021 555 123).
 */
export function formatPhone(value: string | null | undefined): string {
  let digits = onlyDigits(value);
  if (!digits) return '';
  if (digits.startsWith('595')) digits = digits.slice(3);
  if (!digits.startsWith('0')) digits = `0${digits}`;
  digits = digits.slice(0, 10);

  // Celular: 09XX + 6 dígitos. Fijo: código de área de 3 o 4 dígitos + número.
  const area = digits.startsWith('09') ? 4 : 3;
  const partes = [digits.slice(0, area), digits.slice(area, area + 3), digits.slice(area + 3)];
  return partes.filter(Boolean).join(' ');
}

export function phoneError(value: string): string | null {
  const digits = onlyDigits(formatPhone(value));
  if (!digits) return null;
  if (digits.startsWith('09')) {
    return digits.length === 10 ? null : 'Un celular tiene 10 dígitos: 0981 123 456.';
  }
  return digits.length >= 9 ? null : 'El teléfono está incompleto. Ej.: 021 555 123.';
}

// --------------------------------------------------------- Factura y timbrado

/** Establecimiento-punto de expedición-número: 001-001-0000001. */
export const NUMERO_FACTURA_PATTERN = /^\d{3}-\d{3}-\d{7}$/;

/** Mientras se escribe: agrupa los dígitos en 3-3-7. */
export function maskNumeroFactura(value: string): string {
  const digits = onlyDigits(value).slice(0, 13);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join('-');
}

/**
 * Para mostrar: si son 13 dígitos (con o sin guiones) se muestra 001-001-0000001;
 * cualquier otro valor guardado se deja tal cual.
 */
export function formatNumeroFactura(value: string | null | undefined): string {
  if (!value) return '—';
  const digits = onlyDigits(value);
  return digits.length === 13 && /^[\d-\s]+$/.test(value) ? maskNumeroFactura(digits) : value;
}

/** Al salir del campo: completa con ceros la última parte ("001-001-25" -> "001-001-0000025"). */
export function padNumeroFactura(value: string): string {
  const [establecimiento = '', punto = '', numero = ''] = maskNumeroFactura(value).split('-');
  if (!establecimiento || !punto || !numero) return maskNumeroFactura(value);
  return `${establecimiento.padStart(3, '0')}-${punto.padStart(3, '0')}-${numero.padStart(7, '0')}`;
}

/** Prefijo que impone el timbrado: sucursal y punto de expedición. */
export function prefijoFactura(sucursal?: string | null, puntoExpedicion?: string | null): string {
  return `${onlyDigits(sucursal).padStart(3, '0')}-${onlyDigits(puntoExpedicion).padStart(3, '0')}-`;
}

/** Número de timbrado: 8 dígitos. */
export const normalizeTimbrado = (value: string): string => onlyDigits(value).slice(0, 8);

/** Sucursal o punto de expedición: 3 dígitos. */
export const normalizeCodigo3 = (value: string): string => onlyDigits(value).slice(0, 3);
export const padCodigo3 = (value: string): string => (onlyDigits(value) ? onlyDigits(value).padStart(3, '0').slice(-3) : '');
