import type { ProductoResponseDTO } from '../types/api';

/** Una fila del detalle de un formulario cabecera-detalle. */
export interface LineItem {
  /** Identificador local de la fila; el backend no lo recibe. */
  key: number;
  /** Producto elegido (con nombre y precio para mostrarlo); null = todavía sin elegir. */
  producto: ProductoResponseDTO | null;
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
  producto: null,
  cantidad: 1,
  precioUnitario: 0,
  ...values,
});

export function lineUnitPrice(line: LineItem, price: PriceMode): number {
  if (price === 'manual') return line.precioUnitario;
  if (price === 'sin') return 0;
  return line.producto?.precioVenta ?? 0;
}

export function linesTotal(lines: LineItem[], price: PriceMode): number {
  return lines.reduce((total, line) => total + lineUnitPrice(line, price) * line.cantidad, 0);
}

/** Lo que recibe el backend: id del producto y cantidad. */
export const lineasADetalle = (lines: LineItem[]) =>
  lines.filter((l) => l.producto).map((l) => ({ idProducto: l.producto!.id, cantidad: l.cantidad }));

/**
 * Líneas de un documento ya guardado (que trae solo idProducto): pide cada producto distinto por
 * id una sola vez. Si alguno ya no existe, la línea queda con un producto "no disponible".
 */
export async function lineasDesdeDetalle(detalles: { idProducto: number; cantidad: number; precioUnitario?: number }[], buscarProducto: (id: number) => Promise<ProductoResponseDTO>): Promise<LineItem[]> {
  const ids = [...new Set(detalles.map((d) => d.idProducto))];
  const productos = new Map(
    await Promise.all(
      ids.map((id) =>
        buscarProducto(id).then(
          (p) => [id, p] as const,
          () => [id, { id, nombre: `Producto #${id} (no disponible)`, precioVenta: 0, porcentajeIva: 0, idCategoria: 0, idMarca: 0, estado: false } as ProductoResponseDTO] as const
        )
      )
    )
  );
  return detalles.map((d) => newLineItem({ producto: productos.get(d.idProducto) ?? null, cantidad: d.cantidad, precioUnitario: d.precioUnitario ?? 0 }));
}
