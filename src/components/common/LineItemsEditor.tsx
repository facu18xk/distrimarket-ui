import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { fieldClass } from './FormControls';
import { formatMoney } from '../../lib/format';
import { lineUnitPrice, linesTotal, newLineItem, type LineItem, type PriceMode } from '../../lib/lineItems';
import type { ProductoResponseDTO } from '../../types/api';

interface LineItemsEditorProps {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  productos: ProductoResponseDTO[];
  price?: PriceMode;
  title?: string;
}

/**
 * Detalle de un formulario cabecera-detalle: una fila por producto, que crece
 * con "Agregar producto". Lo comparten la factura de venta, la de compra, los
 * ajustes de stock y las transferencias.
 */
export function LineItemsEditor({ lines, onChange, productos, price = 'catalogo', title = 'Productos' }: LineItemsEditorProps) {
  const update = (key: number, changes: Partial<LineItem>) =>
    onChange(lines.map((line) => (line.key === key ? { ...line, ...changes } : line)));
  const withPrice = price !== 'sin';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {title} ({lines.length})
        </h4>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...lines, newLineItem()])}>
          <Plus />
          <span>Agregar producto</span>
        </Button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-2.5 px-3">Producto</th>
              <th className="py-2.5 px-3 w-24 text-center">Cantidad</th>
              {withPrice && <th className="py-2.5 px-3 w-32 text-right">Precio</th>}
              {withPrice && <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>}
              <th className="py-2.5 px-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line) => {
              const unitPrice = lineUnitPrice(line, productos, price);
              const inCatalog = line.idProducto === '' || productos.some((p) => p.id === line.idProducto);
              return (
                <tr key={line.key}>
                  <td className="py-2 px-3 min-w-48">
                    <select
                      className={fieldClass}
                      required
                      value={line.idProducto}
                      onChange={(e) => update(line.key, { idProducto: e.target.value === '' ? '' : Number(e.target.value) })}
                    >
                      <option value="">Seleccionar producto...</option>
                      {/* Línea ya guardada de un producto que inventario dio de baja. */}
                      {!inCatalog && <option value={line.idProducto}>Producto #{line.idProducto} (no disponible)</option>}
                      {productos.map((p) => (
                        <option key={p.id} value={p.id} disabled={!p.estado}>
                          {p.nombre}
                          {!p.estado ? ' (inactivo)' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      className={`${fieldClass} text-center`}
                      type="number"
                      min={1}
                      required
                      value={line.cantidad}
                      onChange={(e) => update(line.key, { cantidad: Math.max(1, Number(e.target.value) || 1) })}
                    />
                  </td>
                  {withPrice && (
                    <td className="py-2 px-3 text-right text-slate-600">
                      {price === 'manual' ? (
                        <input
                          className={`${fieldClass} text-right`}
                          type="number"
                          min={0}
                          required
                          value={line.precioUnitario}
                          onChange={(e) => update(line.key, { precioUnitario: Math.max(0, Number(e.target.value) || 0) })}
                        />
                      ) : (
                        formatMoney(unitPrice)
                      )}
                    </td>
                  )}
                  {withPrice && (
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatMoney(unitPrice * line.cantidad)}</td>
                  )}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onChange(lines.filter((l) => l.key !== line.key))}
                      disabled={lines.length === 1}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400"
                      title="Quitar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {withPrice && (
        <div className="flex items-center justify-end gap-3 mt-3 text-sm">
          <span className="text-slate-500">{price === 'catalogo' ? 'Total estimado' : 'Total'}</span>
          <span className="text-lg font-black text-slate-900">{formatMoney(linesTotal(lines, productos, price))}</span>
        </div>
      )}
    </div>
  );
}
