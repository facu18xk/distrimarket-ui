import React, { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { useApp } from '../../context/AppContext';
import { StockStatus } from '../../types/distrimarket';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose }) => {
  const { addProduct, theme, depositos, selectedDeposito } = useApp();
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Quesos');
  const [deposito, setDeposito] = useState(
    selectedDeposito && selectedDeposito !== 'todos' ? selectedDeposito : depositos[0]?.nombre || 'Depósito Central'
  );

  React.useEffect(() => {
    if (isOpen && selectedDeposito && selectedDeposito !== 'todos') {
      setDeposito(selectedDeposito);
    }
  }, [isOpen, selectedDeposito]);
  const [ultimoPrecio, setUltimoPrecio] = useState('15.00');
  const [precioVenta, setPrecioVenta] = useState('20.00');
  const [cantidad, setCantidad] = useState('10');
  const [unidad, setUnidad] = useState('kg');
  const [estado, setEstado] = useState<StockStatus>('Óptimo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    addProduct({
      nombre: nombre.trim(),
      categoria,
      deposito,
      ultimoPrecio: parseFloat(ultimoPrecio) || 0,
      precioVenta: parseFloat(precioVenta) || 0,
      cantidad: parseFloat(cantidad) || 0,
      unidad,
      estado,
    });

    // Reset
    setNombre('');
    onClose();
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Producto / Insumo"
      subtitle="Ingresa la información básica y el depósito de almacenamiento inicial."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre del Producto / Insumo *
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Mozzarella Fior di Latte"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              <option value="Quesos">Quesos</option>
              <option value="Vegetales">Vegetales</option>
              <option value="Panificados">Panificados</option>
              <option value="Salsas y Condimentos">Salsas y Condimentos</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Carnes">Carnes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Depósito Inicial
            </label>
            <select
              value={deposito}
              onChange={(e) => setDeposito(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              {depositos.map((d) => (
                <option key={d.id} value={d.nombre}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Último Costo ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={ultimoPrecio}
              onChange={(e) => setUltimoPrecio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Precio Venta ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cantidad Inicial
            </label>
            <div className="flex">
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-l-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
              />
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="px-2 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-xs text-slate-700 font-bold"
              >
                <option value="kg">kg</option>
                <option value="unid">unid</option>
                <option value="lt">lt</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Estado de Stock
          </label>
          <div className="flex space-x-3">
            {(['Óptimo', 'Bajo', 'Crítico'] as StockStatus[]).map((st) => (
              <label key={st} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="stockStatus"
                  checked={estado === st}
                  onChange={() => setEstado(st)}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span>{st}</span>
              </label>
            ))}
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
            <span>Guardar Producto</span>
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
