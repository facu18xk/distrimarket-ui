import type { ThemeConfig } from '../types/distrimarket';

/** Conversión de colores para el selector de la rueda (HSV) y el tema (hex). */

export interface Hsv {
  /** Tono, 0 a 360. */
  h: number;
  /** Saturación, 0 a 1. */
  s: number;
  /** Brillo, 0 a 1. */
  v: number;
}

const HEX = /^#?([0-9a-f]{6})$/i;

export const esHexValido = (texto: string) => HEX.test(texto.trim());

function aRgb(hex: string): [number, number, number] {
  const limpio = hex.trim().replace('#', '');
  return [0, 2, 4].map((i) => parseInt(limpio.slice(i, i + 2), 16)) as [number, number, number];
}

function aHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function hsvAHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return aHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function hexAHsv(hex: string): Hsv {
  const [r, g, b] = aRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: (h + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}

/** Mezcla un color con otro (0 = el primero, 1 = el segundo). */
function mezclar(hex: string, con: string, proporcion: number): string {
  const a = aRgb(hex);
  const b = aRgb(con);
  return aHex(...(a.map((c, i) => c + (b[i] - c) * proporcion) as [number, number, number]));
}

/** Luminancia relativa (WCAG): sirve para avisar si el texto blanco no se leería sobre el color. */
export function luminancia(hex: string): number {
  const [r, g, b] = aRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste del texto blanco sobre el color (4.5 o más se lee bien). */
export const contrasteConBlanco = (hex: string) => 1.05 / (luminancia(hex) + 0.05);

/** Tema completo a partir de un color elegido: el hover es un poco más oscuro y el fondo, muy claro. */
export function temaDesdeHex(hex: string, isDark: boolean): ThemeConfig {
  const primario = `#${hex.trim().replace('#', '').toUpperCase()}`;
  return {
    colorId: 'custom',
    colorName: `Personalizado ${primario}`,
    primaryHex: primario,
    hoverHex: mezclar(primario, '#000000', 0.15),
    lightBgHex: mezclar(primario, '#FFFFFF', 0.92),
    isDark,
  };
}

/** Por debajo de este contraste el texto blanco ya no se lee bien sobre el color. */
const CONTRASTE_MINIMO_BLANCO = 2.5;

/**
 * Color de texto para poner sobre el color elegido: blanco, salvo que el color sea muy claro
 * (amarillo, celeste, lima...), en cuyo caso pasa a casi negro.
 */
export function textoSobre(hex: string): string {
  return contrasteConBlanco(hex) < CONTRASTE_MINIMO_BLANCO ? '#0F172A' : '#FFFFFF';
}
