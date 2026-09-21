import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { ModalLinePagination } from '../common/ModalLinePagination';
import { useApp } from '../../context/AppContext';
import type { CompraStatus } from '../../types/distrimarket';

interface CompraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 3;

export const CompraFormModal: React.FC<CompraFormModalProps> = ({ isOpen, onClose }) => {
  const { addCompra, theme, user, proveedores, products } = useApp();
  const [proveedor, setProveedor] = useState(proveedores[0]?.nombre || 'Distribuidora Estrella SA');
  const [numeroFactura, setNumeroFactura] = useState('FAC-' + Math.floor(100000 + Math.random() * 900000));
  const [observaciones, setObservaciones] = useState('');
  const [estado, setEstado] = useState<CompraStatus>('Recibida');
  const [currentPage, setCurrentPage] = useState(1);

  // Line items
  const [items, setItems] = useState([
    { producto: products[0]?.nombre || 'Queso Parmesano Reggiano', cantidad: 20, costoUnitario: 24.0 },
  ]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const handleAddItem = () => {
    const nextProduct = products.find((p) => !items.some((it) => it.producto === p.nombre)) || products[0];
    const newItems = [
      ...items,
      { producto: nextProduct?.nombre || 'Harina de Trigo', cantidad: 10, costoUnitario: 5.0 },
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

  const totalCalculado = items.reduce((acc, it) => acc + it.cantidad * it.costoUnitario, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addCompra({
      numeroFactura,
      fecha: new Date().toISOString().split('T')[0],
      proveedor,
      responsable: user.name,
      observaciones: observaciones || 'Ingreso de mercadería estándar',
      total: totalCalculado,
      estado,
      detalles: items.map((it) => ({
        producto: it.producto,
        cantidad: it.cantidad,
        costoUnitario: it.costoUnitario,
        subtotal: it.cantidad * it.costoUnitario,
      })),
    });

    onClose();
  };

  // Slice items for current page to keep popup dimensions stable
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSlice = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nueva Factura de Compra"
      subtitle="Ingresa la información del proveedor, factura y desglose de insumos comprados."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cabecera */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proveedor *
            </label>
            <select
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              {proveedores.map((prov) => (
                <option key={prov.id} value={prov.nombre}>
                  {prov.nombre} ({prov.ruc})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Número de Factura / Timbrado *
            </label>
            <input
              type="text"
              required
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        {/* Dynamic items list - Fixed height container with pagination */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Detalle de Productos / Insumos ({items.length})
              </label>
              <p className="text-[11px] text-slate-500">
                Máximo 3 líneas visibles por página para mantener estable el tamaño del formulario.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Añadir Línea</span>
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
                      setItems(copy);
                    }}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.nombre}>
                        {p.nombre}
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
                        copy[absIdx].cantidad = parseFloat(e.target.value) || 0;
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
                      value={item.costoUnitario}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[absIdx].costoUnitario = parseFloat(e.target.value) || 0;
                        setItems(copy);
                      }}
                      placeholder="Costo ($)"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div className="w-24 text-right pr-2 font-bold text-xs text-slate-900">
                    ${(item.cantidad * item.costoUnitario).toFixed(2)}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(absIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar fila"
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
            label="insumos"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estado de la Compra
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as CompraStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              <option value="Recibida">Recibida (Ingreso a stock)</option>
              <option value="Pendiente">Pendiente (Por entregar)</option>
              <option value="Cancelada">Cancelada</option>
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
              placeholder="Ej: Lote entregado en Depósito Central"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        {/* Total summary bar */}
        <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Total General a Pagar:
          </span>
          <span className="text-lg font-black text-slate-900">
            ${totalCalculado.toFixed(2)}
          </span>
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
            <span>Registrar Compra</span>
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
