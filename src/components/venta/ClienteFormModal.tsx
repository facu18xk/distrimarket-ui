import React, { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { useApp } from '../../context/AppContext';
import type { ClienteType } from '../../types/distrimarket';

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClienteFormModal: React.FC<ClienteFormModalProps> = ({ isOpen, onClose }) => {
  const { addCliente, theme } = useApp();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tipo, setTipo] = useState<ClienteType>('Nuevo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    addCliente({
      nombre: nombre.trim(),
      telefono: telefono.trim() || '+54 11 0000-0000',
      email: email.trim() || 'cliente@email.com',
      direccion: direccion.trim() || 'S/D',
      tipo,
      totalCompras: 0,
    });

    setNombre('');
    onClose();
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Cliente"
      subtitle="Los datos de contacto reutilizan la estructura base de PersonaDTO."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre y Apellido *
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Marcelo Gallardo"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teléfono / WhatsApp
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+54 11 9999-8888"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de Cliente
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ClienteType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            >
              <option value="Nuevo">Nuevo</option>
              <option value="Frecuente">Frecuente</option>
              <option value="Delivery">Delivery Habitual</option>
              <option value="Ocasional">Ocasional</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dirección de Entrega
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle y altura"
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
            <span>Guardar Cliente</span>
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
