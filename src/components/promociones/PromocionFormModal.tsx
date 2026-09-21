import React, { useState } from 'react';
import { Plus, Tag, Calendar, Percent } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { useApp } from '../../context/AppContext';
import { PromocionStatus } from '../../types/distrimarket';

interface PromocionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromocionFormModal: React.FC<PromocionFormModalProps> = ({ isOpen, onClose }) => {
  const { addPromocion, theme, products } = useApp();
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'2×1' | 'Porcentaje' | 'Precio Fijo' | 'Combo'>('Porcentaje');
  const [descuentoValor, setDescuentoValor] = useState('25%');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState('2026-10-15');
  const [estado, setEstado] = useState<PromocionStatus>('Activa');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    addPromocion({
      nombre: nombre.trim(),
      tipo,
      descuentoValor,
      fechaInicio,
      fechaFin,
      estado,
    });

    setNombre('');
    onClose();
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nueva Promoción / Campaña"
      subtitle="Configura descuentos automáticos y campañas promocionales para clientes."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre de la Campaña / Promoción *
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Happy Hour 2x1 en Cervezas Artesanales"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de Promoción
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              <option value="Porcentaje">Porcentaje de Descuento (%)</option>
              <option value="2×1">2×1 (Lleva 2 Paga 1)</option>
              <option value="Precio Fijo">Precio Fijo Especial</option>
              <option value="Combo">Combo / Menú Ejecutivo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Valor del Beneficio
            </label>
            <input
              type="text"
              value={descuentoValor}
              onChange={(e) => setDescuentoValor(e.target.value)}
              placeholder="Ej: 20% o $15.00"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Estado Inicial
          </label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as PromocionStatus)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:bg-white focus:outline-hidden focus:border-slate-400"
          >
            <option value="Activa">Activa (Vigente hoy)</option>
            <option value="Programada">Programada (Futura)</option>
            <option value="Vencida">Vencida</option>
          </select>
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
            <span>Guardar Promoción</span>
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
