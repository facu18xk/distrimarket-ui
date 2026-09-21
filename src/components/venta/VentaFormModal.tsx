import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { ModalLinePagination } from '../common/ModalLinePagination';
import { useApp } from '../../context/AppContext';
import type { VentaStatus } from '../../types/distrimarket';

interface VentaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 3;

export const VentaFormModal: React.FC<VentaFormModalProps> = ({ isOpen, onClose }) => {
  const { addVenta, theme, user, clientes, products } = useApp();
  const [cliente, setCliente] = useState(clientes[0]?.nombre || 'Carlos García');
  const [tipoVenta, setTipoVenta] = useState<'Mesa' | 'Delivery' | 'Mostrador'>('Mesa');
  const [referencia, setReferencia] = useState('Mesa 3');
  const [observaciones, setObservaciones] = useState('');
  const [estado, setEstado] = useState<VentaStatus>('Completada');
  const [currentPage, setCurrentPage] = useState(1);

  // Line items
  const [items, setItems] = useState([
    { producto: products[0]?.nombre || 'Queso Parmesano Reggiano', cantidad: 1, precioUnitario: 30.0 },
    { producto: products[1]?.nombre || 'Masa Pizza Familiar', cantidad: 2, precioUnitario: 15.0 },
  ]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const handleAddItem = () => {
    const nextProduct = products.find((p) => !items.some((it) => it.producto === p.nombre)) || products[0];
    const newItems = [
      ...items,
      { producto: nextProduct?.nombre || 'Cerveza Artesanal', cantidad: 1, precioUnitario: nextProduct?.precioVenta || 8.0 },
    ];
    setItems(newItems);
    const newPage = Math.ceil(newItems.length / ITEMS_PER_PAGE);
    setCurrentPage(newPage);
  };

  const handleRemoveItem = (absoluteIndex: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== absoluteIndex);
      setItems(newItems);
      const newTotalPages = Math.max(1, Math.ceil(newItems.length / ITEMS_PER_PAGE));
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }
    }
  };

  const subtotal = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
  const iva = subtotal * 0.10; // 10% IVA standard
  const total = subtotal + iva;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addVenta({
      numeroComprobante: '',
      fecha: new Date().toISOString().split('T')[0],
      cliente,
      tipoVenta,
      referencia,
      responsable: user.name,
      observaciones: observaciones || `Venta tipo ${tipoVenta}`,
      total,
      estado,
      detalles: items.map((it) => ({
        producto: it.producto,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        subtotal: it.cantidad * it.precioUnitario,
      })),
    });

    onClose();
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSlice = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nueva Venta"
      subtitle="Genera un comprobante fiscal con cálculo automático de IVA y desglose de items."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cabecera */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de Venta
            </label>
            <select
              value={tipoVenta}
              onChange={(e) => {
                const val = e.target.value as 'Mesa' | 'Delivery' | 'Mostrador';
                setTipoVenta(val);
                if (val === 'Mesa') setReferencia('Mesa 1');
                if (val === 'Delivery') setReferencia('Delivery a domicilio');
                if (val === 'Mostrador') setReferencia('Mostrador / Caja');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              <option value="Mesa">Mesa / Salón</option>
              <option value="Delivery">Delivery</option>
              <option value="Mostrador">Mostrador (Take Away)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cliente
            </label>
            <select
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre} ({c.tipo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referencia / Mesa / Nota
            </label>
            <input
              type="text"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        {/* Dynamic products list - Fixed height container with pagination */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Productos Consumidos ({items.length})
              </label>
              <p className="text-[11px] text-slate-500">
                Máximo 3 líneas por vista para mantener estable el tamaño del formulario.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Añadir Producto</span>
            </button>
          </div>

          {/* Fixed height container for stability */}
          <div className="min-h-[175px] max-h-[175px] overflow-y-hidden space-y-2 flex flex-col justify-start">
            {currentSlice.map((item, sliceIdx) => {
              const absIdx = startIndex + sliceIdx;
              return (
                <div key={absIdx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 h-[50px]">
                  <select
                    value={item.producto}
                    onChange={(e) => {
                      const copy = [...items];
                      copy[absIdx].producto = e.target.value;
                      const prod = products.find((p) => p.nombre === e.target.value);
                      if (prod) copy[absIdx].precioUnitario = prod.precioVenta;
                      setItems(copy);
                    }}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.nombre}>
                        {p.nombre} (${p.precioVenta.toFixed(2)})
                      </option>
                    ))}
                  </select>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[absIdx].cantidad = parseInt(e.target.value, 10) || 1;
                        setItems(copy);
                      }}
                      placeholder="Cant."
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      value={item.precioUnitario}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[absIdx].precioUnitario = parseFloat(e.target.value) || 0;
                        setItems(copy);
                      }}
                      placeholder="Precio"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div className="w-24 text-right pr-2 font-bold text-xs text-slate-900">
                    ${(item.cantidad * item.precioUnitario).toFixed(2)}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(absIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Quitar línea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Modal pagination */}
          <ModalLinePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={items.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            label="productos"
          />
        </div>

        {/* Financial summary */}
        <div className="p-3 bg-slate-100 rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Neto:</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>IVA Estimado (10%):</span>
            <span className="font-semibold">${iva.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1 border-t border-slate-200">
            <span>Total Comprobante:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estado de la Venta
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as VentaStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              <option value="Completada">Completada (Cobrada)</option>
              <option value="Pendiente">Pendiente (Mesa abierta)</option>
              <option value="Anulada">Anulada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observaciones
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Cliente solicitó factura con RUC"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{ backgroundColor: theme.primaryHex }}
            className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Emitir Comprobante</span>
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
