import type { ProductoResponseDTO } from '../types/api';

/** Una fila del detalle de un formulario cabecera-detalle. */
export interface LineItem {
  /** Identificador local de la fila; el backend no lo recibe. */
  key: number;
  idProducto: number | '';
  cantidad: number;
  /** Solo cuando el precio se carga a mano (compras). */
  precioUnitario: number;
}

/**
 * De dónde sale el precio de cada línea:
 *  - 'catalogo': del precio de venta del producto, solo se muestra (ventas)
 *  - 'manual':   lo escribe el usuario (compras: el costo cambia en cada factura)
 *  - 'sin':      el movimiento no tiene precio (ajustes, transferencias)
 */
export type PriceMode = 'catalogo' | 'manual' | 'sin';

let nextKey = 1;

export const newLineItem = (values: Partial<Omit<LineItem, 'key'>> = {}): LineItem => ({
  key: nextKey++,
  idProducto: '',
  cantidad: 1,
  precioUnitario: 0,
  ...values,
});

export function lineUnitPrice(line: LineItem, productos: ProductoResponseDTO[], price: PriceMode): number {
  if (price === 'manual') return line.precioUnitario;
  if (price === 'sin') return 0;
  return productos.find((p) => p.id === line.idProducto)?.precioVenta ?? 0;
}

export function linesTotal(lines: LineItem[], productos: ProductoResponseDTO[], price: PriceMode): number {
  return lines.reduce((total, line) => total + lineUnitPrice(line, productos, price) * line.cantidad, 0);
}
