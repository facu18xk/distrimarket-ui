import React, { useState } from 'react';
import { Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { ModalLinePagination } from '../common/ModalLinePagination';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface AdjustmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 3;

export const AdjustmentFormModal: React.FC<AdjustmentFormModalProps> = ({ isOpen, onClose }) => {
  const { addAdjustment, theme, user, products, depositos, selectedDeposito } = useApp();
  const [tipo, setTipo] = useState<'Entrada' | 'Salida'>('Entrada');
  const [deposito, setDeposito] = useState<string>(selectedDeposito || 'Depósito Central');
  const [motivoGeneral, setMotivoGeneral] = useState('Merma por vencimiento');
  const [responsable, setResponsable] = useState(user.name);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter products for the current selected deposito if available
  const availableProducts = products.filter((p) => !deposito || p.deposito === deposito);
  const candidateProducts = availableProducts.length > 0 ? availableProducts : products;

  // Multiple detail lines (Cabecera - Detalle)
  const [items, setItems] = useState([
    {
      producto: candidateProducts[0]?.nombre || 'Queso Parmesano Reggiano',
      cantidad: 5,
      motivo: 'Merma por vencimiento',
    },
  ]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const handleAddItem = () => {
    const available = candidateProducts.find((p) => !items.some((it) => it.producto === p.nombre)) || candidateProducts[0];
    const newItems = [
      ...items,
      {
        producto: available?.nombre || 'Tomate Redondo',
        cantidad: 2,
        motivo: motivoGeneral,
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

    addAdjustment({
      fecha: new Date().toISOString().split('T')[0],
      deposito,
      tipo,
      motivo: motivoGeneral,
      productosAfectados: items.length,
      responsable,
      detalles: items.map((it) => ({
        producto: it.producto,
        cantidad: Number(it.cantidad) || 1,
        motivo: it.motivo || motivoGeneral,
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
      title="Nuevo Ajuste de Stock (Propio de un Depósito)"
      subtitle={`Registra ajustes internos, mermas o recuentos asignados específicamente a ${deposito}.`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cabecera (Header) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Depósito Afectado *
            </label>
            <select
              value={deposito}
              onChange={(e) => setDeposito(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-bold focus:bg-white focus:outline-hidden focus:border-slate-400"
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
              Tipo de Ajuste *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'Entrada' | 'Salida')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-bold focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              <option value="Entrada">Entrada (+) Ingreso</option>
              <option value="Salida">Salida (-) Merma/Rotura</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo Principal *
            </label>
            <select
              value={motivoGeneral}
              onChange={(e) => setMotivoGeneral(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              <option value="Merma por vencimiento">Merma por vencimiento</option>
              <option value="Compra semanal y reposición">Compra semanal y reposición</option>
              <option value="Reposición urgente">Reposición urgente</option>
              <option value="Rotura de mercadería">Rotura de mercadería</option>
              <option value="Inventario físico (recuento)">Inventario físico (recuento)</option>
              <option value="Deterioro de frío">Deterioro de frío</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Responsable *
            </label>
            <input
              type="text"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        {/* Detalle (Line Items) - Fixed height container with pagination */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Detalle de Insumos Afectados ({items.length})
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
              <span>+ Añadir Línea de Insumo</span>
            </button>
          </div>

          {/* Fixed height container for stability */}
          <div className="min-h-[175px] max-h-[175px] overflow-y-hidden space-y-2 flex flex-col justify-start">
            {currentSlice.map((item, sliceIdx) => {
              const absIdx = startIndex + sliceIdx;
              const matchedProd = products.find((p) => p.nombre === item.producto);
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
                        setItems(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.nombre}>
                          {p.nombre} ({p.deposito} - Stock: {p.cantidad} {p.unidad})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad */}
                  <div className="w-28 flex items-center">
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[absIdx].cantidad = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setItems(copy);
                      }}
                      placeholder="Cant."
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-l-lg text-xs text-center font-bold text-slate-800 focus:outline-hidden"
                    />
                    <span className="px-2 py-1.5 bg-slate-100 border border-l-0 border-slate-200 rounded-r-lg text-[11px] font-bold text-slate-600">
                      {matchedProd?.unidad || 'unid'}
                    </span>
                  </div>

                  {/* Motivo particular de la línea */}
                  <div className="w-44">
                    <input
                      type="text"
                      value={item.motivo}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[absIdx].motivo = e.target.value;
                        setItems(copy);
                      }}
                      placeholder="Causa específica..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
                    />
                  </div>

                  {/* Botón eliminar línea */}
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

        {/* Resumen del Comprobante */}
        <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>
              Total líneas registradas: <strong className="text-slate-900">{items.length} producto(s)</strong>
            </span>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full font-bold text-xs ${
              tipo === 'Entrada'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {tipo === 'Entrada' ? '+ Ingreso global a inventario' : '- Descuento global de existencias'}
          </span>
        </div>

        {/* Actions */}
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
            <span>Confirmar Ajuste ({items.length} items)</span>
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
};
