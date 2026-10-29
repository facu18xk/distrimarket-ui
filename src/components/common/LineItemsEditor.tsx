import { PackagePlus, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { fieldClass } from './FormControls';
import { formatMoney } from '../../lib/format';
import { lineUnitPrice, linesTotal, newLineItem, type LineItem, type PriceMode } from '../../lib/lineItems';
import { ProductoPicker } from './EntityPickers';

interface LineItemsEditorProps {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  price?: PriceMode;
  title?: string;
  onCrearProducto?: (lineKey: number) => void;
}

/**
 * Detalle de un formulario cabecera-detalle: una fila por producto, que crece
 * con "Agregar producto". Lo comparten la factura de venta, la de compra, los
 * ajustes de stock y las transferencias. Cada fila elige su producto con un selector
 * paginado (10 por vez), sin cargar todo el catálogo de productos.
 */
export function LineItemsEditor({ lines, onChange, price = 'catalogo', title = 'Productos', onCrearProducto }: LineItemsEditorProps) {
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

      <div className="border border-slate-200 rounded-xl">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-2 px-3">Producto</th>
              <th className="py-2 px-2 w-20 text-center">Cant.</th>
              {withPrice && <th className="py-2 px-2 w-24 sm:w-28 text-right">Precio</th>}
              {withPrice && <th className="hidden sm:table-cell py-2 px-2 w-28 text-right">Subtotal</th>}
              <th className="py-2 px-1 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line) => {
              const unitPrice = lineUnitPrice(line, price);
              return (
                <tr key={line.key}>
                  <td className="py-1.5 px-2">
                    {onCrearProducto ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 min-w-0">
                          <ProductoPicker
                            required
                            mostrarPrecio={price === 'catalogo'}
                            value={line.producto}
                            onChange={(producto) => update(line.key, { producto })}
                            onCrearNuevo={() => onCrearProducto(line.key)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-slate-500 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                          onClick={() => onCrearProducto(line.key)}
                          title="Crear producto nuevo"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <ProductoPicker
                        required
                        mostrarPrecio={price === 'catalogo'}
                        value={line.producto}
                        onChange={(producto) => update(line.key, { producto })}
                      />
                    )}
                  </td>
                  <td className="py-1.5 px-2">
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
                    <td className="py-1.5 px-2 text-right text-slate-600">
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
                    <td className="hidden sm:table-cell py-1.5 px-2 text-right font-bold text-slate-900">{formatMoney(unitPrice * line.cantidad)}</td>
                  )}
                  <td className="py-1.5 px-1 text-center">
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
          <span className="text-lg font-black text-slate-900">{formatMoney(linesTotal(lines, price))}</span>
        </div>
      )}
    </div>
  );
}
