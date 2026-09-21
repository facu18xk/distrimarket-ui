import React, { useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { useApp } from '../../context/AppContext';

interface ProveedorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProveedorFormModal: React.FC<ProveedorFormModalProps> = ({ isOpen, onClose }) => {
  const { addProveedor, theme } = useApp();
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [contactoPrincipal, setContactoPrincipal] = useState('');
  const [direccion, setDireccion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    addProveedor({
      nombre: nombre.trim(),
      ruc: ruc.trim() || '20-00000000-0',
      telefono: telefono.trim() || '+54 11 0000-0000',
      email: email.trim() || 'proveedor@distrimarket.com',
      contactoPrincipal: contactoPrincipal.trim() || 'Contacto Comercial',
      direccion: direccion.trim() || 'S/D',
      estado: true,
    });

    setNombre('');
    setRuc('');
    onClose();
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Proveedor"
      subtitle="Los datos de contacto reutilizan la estructura base de PersonaDTO."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Razón Social / Nombre del Proveedor *
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Distribuidora Alimentos Andinos SA"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              RUC / CUIT *
            </label>
            <input
              type="text"
              required
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              placeholder="Ej: 30-71234567-8"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+54 11 4444-5555"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
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
              placeholder="ventas@proveedor.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Persona / Contacto Principal
            </label>
            <input
              type="text"
              value={contactoPrincipal}
              onChange={(e) => setContactoPrincipal(e.target.value)}
              placeholder="Nombre del ejecutivo"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Dirección / Depósito Proveedor
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Calle, Número, Localidad"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
          />
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
            <span>Guardar Proveedor</span>
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
