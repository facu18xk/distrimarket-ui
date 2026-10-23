import React, { useState } from 'react';
import { Palette, User, Image, Check, ShieldCheck } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { Badge } from '../ui/badge';
import { useApp } from '../../context/AppContext';
import { ROLES } from '../../auth/roles';
import { THEME_PALETTES, AVATAR_OPTIONS } from '../../lib/theme';

/**
 * Cuenta del usuario. Los datos (nombre, documento, roles, cargo) vienen del microservicio de
 * seguridad y solo los cambia un administrador; el color y la foto son preferencias de este navegador.
 */
export const AccountConfigModal: React.FC = () => {
  const { accountModalOpen, setAccountModalOpen, user, updateAvatar, theme, setThemeColor } = useApp();
  const [customUrlInput, setCustomUrlInput] = useState('');

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      updateAvatar(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  return (
    <ModalDialog
      isOpen={accountModalOpen}
      onClose={() => setAccountModalOpen(false)}
      title="Mi cuenta"
      subtitle="Tus datos de acceso y tus preferencias visuales."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* 1. Datos de la cuenta (backend) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Datos de la cuenta</span>
          </label>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div>
              <dt className="text-slate-500">Usuario</dt>
              <dd className="font-semibold text-slate-900">{user.username}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Nombre</dt>
              <dd className="font-semibold text-slate-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Documento</dt>
              <dd className="font-semibold text-slate-900">{user.documento ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Empleado</dt>
              <dd className="font-semibold text-slate-900">
                {user.idEmpleado ? user.cargo ?? 'Empleado' : 'No es empleado'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500 mb-1">Roles</dt>
              <dd className="flex flex-wrap gap-1.5">
                {user.roles.map((rol) => (
                  <Badge key={rol} variant={rol === 'ADMIN' ? 'default' : 'secondary'}>
                    {ROLES[rol]?.label ?? rol}
                  </Badge>
                ))}
              </dd>
            </div>
          </dl>
          <p className="text-[11px] text-slate-400 mt-1.5">Para cambiar estos datos o la contraseña, pedíselo a un administrador.</p>
        </div>

        {/* 2. Color de la interfaz */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-500" />
            <span>Color principal de la interfaz</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {THEME_PALETTES.map((palette) => {
              const isSelected = theme.colorId === palette.colorId;
              return (
                <button
                  type="button"
                  key={palette.colorId}
                  onClick={() => setThemeColor(palette.colorId)}
                  className={`flex items-center space-x-2.5 p-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: palette.primaryHex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 truncate">{palette.colorName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Foto de perfil */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Image className="w-3.5 h-3.5 text-slate-500" />
            <span>Foto de perfil</span>
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-300 shadow-sm shrink-0 bg-slate-100 flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => updateAvatar(opt.url)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                    user.avatarUrl === opt.url ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200'
                  }`}
                >
                  <img src={opt.url} alt={opt.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="O pegá la URL de una imagen..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Aplicar URL
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => setAccountModalOpen(false)}
            style={{ backgroundColor: theme.primaryHex }}
            className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-opacity"
          >
            Listo
          </button>
        </div>
      </div>
    </ModalDialog>
  );
};
