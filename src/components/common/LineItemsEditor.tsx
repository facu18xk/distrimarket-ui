import { useEffect, useState } from 'react';
import { PackagePlus, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { CampoNumero } from './CampoNumero';
import { formatMoney } from '../../lib/format';
import { lineUnitPrice, linesTotal, newLineItem, type LineItem, type PriceMode } from '../../lib/lineItems';
import { ProductoPicker } from './EntityPickers';
import { ApiError, inventarioApi } from '../../services';

/**
 * Control de stock del detalle: los productos se eligen para un depósito.
 *  - Sin depósito elegido no se pueden cargar productos.
 *  - Con `verificarStock`, cada línea muestra lo disponible y no deja guardar si se pide de más.
 */
export interface ControlDeposito {
  idDeposito: number | null;
  verificarStock: boolean;
  /**
   * Unidades por producto que ya están reservadas por este mismo documento (al modificar una
   * factura, su stock ya se descontó y vuelve a estar disponible para ella).
   */
  reservado?: Record<number, number>;
}

interface LineItemsEditorProps {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  price?: PriceMode;
  title?: string;
  onCrearProducto?: (lineKey: number) => void;
  deposito?: ControlDeposito;
}

/** Stock de cada producto en un depósito: undefined = consultando, null = no se pudo consultar. */
function useDisponibles(idDeposito: number | null, idsProducto: number[], activo: boolean) {
  const [stock, setStock] = useState<Record<string, number | null>>({});
  const clave = (p: number) => `${idDeposito}:${p}`;
  const faltan = activo && idDeposito !== null ? idsProducto.filter((p) => !(clave(p) in stock)) : [];
  const pendientes = faltan.join(',');

  useEffect(() => {
    if (!pendientes || idDeposito === null) return;
    let vigente = true;
    for (const id of pendientes.split(',').map(Number)) {
      inventarioApi.stock
        .deProducto(idDeposito, id)
        .then((s) => s.cantidad)
        // 404: el producto no tiene existencia en ese depósito, o sea 0 disponibles.
        .catch((e) => (e instanceof ApiError && e.status === 404 ? 0 : null))
        .then((cantidad) => {
          if (vigente) setStock((actual) => ({ ...actual, [`${idDeposito}:${id}`]: cantidad }));
        });
    }
    return () => {
      vigente = false;
    };
  }, [idDeposito, pendientes]);

  return (idProducto: number): number | null | undefined => (idDeposito === null ? undefined : stock[clave(idProducto)]);
}

/**
 * Detalle de un formulario cabecera-detalle: una fila por producto, que crece
 * con "Agregar producto". Lo comparten la factura de venta, la de compra, los
 * ajustes de stock y las transferencias. Cada fila elige su producto con un selector
 * paginado (10 por vez), sin cargar todo el catálogo de productos.
 */
export function LineItemsEditor({ lines, onChange, price = 'catalogo', title = 'Productos', onCrearProducto, deposito }: LineItemsEditorProps) {
  const update = (key: number, changes: Partial<LineItem>) =>
    onChange(lines.map((line) => (line.key === key ? { ...line, ...changes } : line)));
  const withPrice = price !== 'sin';
  const sinDeposito = Boolean(deposito) && deposito!.idDeposito === null;

  const ids = [...new Set(lines.flatMap((l) => (l.producto ? [l.producto.id] : [])))];
  const disponible = useDisponibles(deposito?.idDeposito ?? null, ids, Boolean(deposito?.verificarStock));
  // El mismo producto puede estar en varias líneas: se controla la suma.
  const pedido = (idProducto: number) => lines.reduce((total, l) => total + (l.producto?.id === idProducto ? l.cantidad : 0), 0);

  const avisoStock = (line: LineItem): { texto: string; error: string | null } | null => {
    if (!deposito?.verificarStock || !line.producto || deposito.idDeposito === null) return null;
    const enDeposito = disponible(line.producto.id);
    if (enDeposito === undefined) return { texto: 'Consultando stock...', error: null };
    if (enDeposito === null) return { texto: 'Stock sin verificar', error: null };
    const total = enDeposito + (deposito.reservado?.[line.producto.id] ?? 0);
    if (pedido(line.producto.id) > total) {
      return { texto: `Disponible: ${total}`, error: total === 0 ? 'No hay stock de este producto en el depósito.' : `Stock insuficiente: hay ${total} en el depósito.` };
    }
    return { texto: `Disponible: ${total}`, error: null };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {title} ({lines.length})
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sinDeposito}
          title={sinDeposito ? 'Elija primero el depósito' : undefined}
          onClick={() => onChange([...lines, newLineItem()])}
        >
          <Plus />
          <span>Agregar producto</span>
        </Button>
      </div>

      {sinDeposito && <p className="mb-2 text-[11px] text-amber-700">Elija primero el depósito para cargar productos.</p>}

      <div className="border border-slate-200 rounded-xl">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-2 px-3">Producto</th>
              <th className="py-2 px-2 w-24 text-center">Cant.</th>
              {withPrice && <th className="py-2 px-2 w-28 sm:w-32 text-right">Precio</th>}
              {withPrice && <th className="hidden sm:table-cell py-2 px-2 w-28 text-right">Subtotal</th>}
              <th className="py-2 px-1 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line) => {
              const unitPrice = lineUnitPrice(line, price);
              const stock = avisoStock(line);
              const picker = (
                <ProductoPicker
                  required
                  disabled={sinDeposito}
                  mostrarPrecio={price === 'catalogo'}
                  value={line.producto}
                  onChange={(producto) => update(line.key, { producto })}
                  onCrearNuevo={onCrearProducto ? () => onCrearProducto(line.key) : undefined}
                />
              );
              return (
                <tr key={line.key} className="align-top">
                  <td className="py-1.5 px-2">
                    {onCrearProducto ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 min-w-0">{picker}</div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={sinDeposito}
                          className="h-9 w-9 shrink-0 text-slate-500 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                          onClick={() => onCrearProducto(line.key)}
                          title="Crear producto nuevo"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      picker
                    )}
                  </td>
                  <td className="py-1.5 px-2">
                    <CampoNumero
                      className="text-center px-1.5"
                      min={1}
                      required
                      disabled={sinDeposito}
                      value={line.cantidad > 0 ? line.cantidad : null}
                      onChange={(cantidad) => update(line.key, { cantidad: cantidad ?? 0 })}
                      error={stock?.error}
                    />
                    {stock && (
                      <p className={`mt-0.5 text-center text-[10px] leading-tight ${stock.error ? 'text-rose-600 font-semibold' : 'text-slate-400'}`} title={stock.error ?? undefined}>
                        {stock.texto}
                      </p>
                    )}
                  </td>
                  {withPrice && (
                    <td className="py-1.5 px-2 text-right text-slate-600">
                      {price === 'manual' ? (
                        <CampoNumero
                          className="text-right px-1.5"
                          min={0}
                          required
                          title="Precio unitario en guaraníes"
                          value={line.precioUnitario}
                          onChange={(precio) => update(line.key, { precioUnitario: precio ?? 0 })}
                        />
                      ) : (
                        <span className="block py-2">{formatMoney(unitPrice)}</span>
                      )}
                    </td>
                  )}
                  {withPrice && (
                    <td className="hidden sm:table-cell py-1.5 px-2 text-right font-bold text-slate-900">
                      <span className="block py-2">{formatMoney(unitPrice * line.cantidad)}</span>
                    </td>
                  )}
                  <td className="py-1.5 px-1 text-center">
                    <button
                      type="button"
                      onClick={() => onChange(lines.filter((l) => l.key !== line.key))}
                      disabled={lines.length === 1}
                      className="mt-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400"
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
