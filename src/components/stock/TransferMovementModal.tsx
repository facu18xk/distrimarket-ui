import React, { useState } from 'react';
import { ArrowRightLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { ModalLinePagination } from '../common/ModalLinePagination';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';

interface TransferMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 3;

export const TransferMovementModal: React.FC<TransferMovementModalProps> = ({ isOpen, onClose }) => {
  const { addMovement, theme, user, products, depositos } = useApp();
  const [depOrigen, setDepOrigen] = useState(depositos[0]?.nombre || 'Depósito Central');
  const [depDestino, setDepDestino] = useState(depositos[1]?.nombre || 'Depósito Norte');
  const [responsable, setResponsable] = useState(user.name);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Multiple detail lines (Cabecera - Detalle)
  const [items, setItems] = useState([
    {
      producto: products[0]?.nombre || 'Queso Parmesano Reggiano',
      cantidad: 20,
      unidad: products[0]?.unidad || 'kg',
    },
  ]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const handleAddItem = () => {
    const available = products.find((p) => !items.some((it) => it.producto === p.nombre)) || products[0];
    const newItems = [
      ...items,
      {
        producto: available?.nombre || 'Aceite de Oliva',
        cantidad: 10,
        unidad: available?.unidad || 'lt',
      },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depOrigen === depDestino) {
      setError('El depósito de origen y el depósito de destino no pueden ser el mismo.');
      return;
    }

    const totalCant = items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);
    const summaryTitle =
      items.length === 1
        ? items[0].producto
        : `${items[0].producto} y ${items.length - 1} insumo(s) más`;

    addMovement({
      fecha: new Date().toISOString().split('T')[0],
      producto: summaryTitle,
      cantidad: totalCant,
      unidad: items.length === 1 ? items[0].unidad : 'items',
      depOrigen,
      depDestino,
      responsable,
      observaciones: observaciones.trim() || `Transferencia de ${items.length} insumos entre sucursales`,
      estado: 'Completado',
      detalles: items.map((it) => ({
        producto: it.producto,
        cantidad: Number(it.cantidad) || 1,
        unidad: it.unidad,
      })),
    });

    setError('');
    onClose();
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSlice = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Transferencia de Stock (Cabecera - Detalle)"
      subtitle="Genera un remito de movimiento interno con múltiples insumos entre depósitos."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cabecera (Header) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Depósito de Origen (Emisor) *
            </label>
            <select
              value={depOrigen}
              onChange={(e) => {
                setDepOrigen(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              {depositos.map((d) => (
                <option key={d.id} value={d.nombre}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Depósito de Destino (Receptor) *
            </label>
            <select
              value={depDestino}
              onChange={(e) => {
                setDepDestino(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              {depositos.map((d) => (
                <option key={d.id} value={d.nombre}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Responsable de Despacho *
            </label>
            <input
              type="text"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo / Observaciones del Traslado
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Rebalanceo para producción semanal"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        {/* Detalle (Line items) - Fixed height container with pagination */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Insumos a Transferir ({items.length})
              </label>
              <p className="text-[11px] text-slate-500">
                Máximo 3 líneas por vista para mantener estable el tamaño del modal.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Añadir Insumo</span>
            </button>
          </div>

          {/* Fixed height container for stability */}
          <div className="min-h-[175px] max-h-[175px] overflow-y-hidden space-y-2 flex flex-col justify-start">
            {currentSlice.map((item, sliceIdx) => {
              const absIdx = startIndex + sliceIdx;
              return (
                <div
                  key={absIdx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 h-[52px]"
                >
                  {/* Selector Producto */}
                  <div className="flex-1">
                    <select
                      value={item.producto}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[absIdx].producto = e.target.value;
                        const p = products.find((prod) => prod.nombre === e.target.value);
                        if (p) copy[absIdx].unidad = p.unidad;
                        setItems(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.nombre}>
                          {p.nombre} (Stock: {p.cantidad} {p.unidad})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad y Unidad */}
                  <div className="w-36 flex items-center">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      required
                      value={item.cantidad}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[absIdx].cantidad = parseFloat(e.target.value) || 0;
                        setItems(copy);
                      }}
                      placeholder="Cant."
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-l-lg text-xs text-center font-bold text-slate-800 focus:outline-hidden"
                    />
                    <select
                      value={item.unidad}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[absIdx].unidad = e.target.value;
                        setItems(copy);
                      }}
                      className="px-2 py-1.5 bg-slate-100 border border-l-0 border-slate-200 rounded-r-lg text-xs font-bold text-slate-700"
                    >
                      <option value="kg">kg</option>
                      <option value="unid">unid</option>
                      <option value="lt">lt</option>
                    </select>
                  </div>

                  {/* Eliminar fila */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(absIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
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
            label="insumos"
          />
        </div>

        {/* Resumen del movimiento */}
        <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-700">
            <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
            <span>
              Remito de traslado: <strong className="text-slate-900">{items.length} producto(s)</strong> desde{' '}
              <strong className="text-slate-900">{depOrigen}</strong> hacia{' '}
              <strong className="text-slate-900">{depDestino}</strong>
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            style={{ backgroundColor: theme.primaryHex }}
            className="text-white hover:opacity-90 shadow-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Ejecutar Transferencia ({items.length} items)</span>
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
};
