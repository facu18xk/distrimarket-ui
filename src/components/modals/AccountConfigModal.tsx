import React, { useState } from 'react';
import { Palette, User, Image, Check, ShieldCheck } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { ColorWheel } from '../common/ColorWheel';
import { Badge } from '../ui/badge';
import { useApp } from '../../context/AppContext';
import { ROLES } from '../../auth/roles';
import { THEME_PALETTES, AVATAR_OPTIONS } from '../../lib/theme';

/**
 * Cuenta del usuario. Los datos (nombre, documento, roles, cargo) vienen del microservicio de
 * seguridad y solo los cambia un administrador; el color y la foto son preferencias de este navegador.
 */
export const AccountConfigModal: React.FC = () => {
  const { accountModalOpen, setAccountModalOpen, user, updateAvatar, theme, setThemeColor, setThemeHex } = useApp();
  const [customUrlInput, setCustomUrlInput] = useState('');
  // Cambia solo al tocar un color rápido: la rueda se vuelve a armar con ese color.
  const [versionRueda, setVersionRueda] = useState(0);

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      updateAvatar(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  const titulo = (icono: React.ReactNode, texto: string) => (
    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
      {icono}
      <span>{texto}</span>
    </h4>
  );

  return (
    <ModalDialog
      isOpen={accountModalOpen}
      onClose={() => setAccountModalOpen(false)}
      title="Mi cuenta"
      subtitle="Tus datos de acceso y tus preferencias visuales."
      maxWidth="3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        {/* Izquierda: datos de la cuenta (backend) y foto */}
        <div className="space-y-4">
          <section>
            {titulo(<ShieldCheck className="w-3.5 h-3.5 text-slate-500" />, 'Datos de la cuenta')}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <div>
                <dt className="text-slate-500">Usuario</dt>
                <dd className="font-semibold text-slate-900 truncate">{user.username}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Nombre</dt>
                <dd className="font-semibold text-slate-900 truncate">{user.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Documento</dt>
                <dd className="font-semibold text-slate-900">{user.documento ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Empleado</dt>
                <dd className="font-semibold text-slate-900">{user.idEmpleado ? user.cargo ?? 'Empleado' : 'No es empleado'}</dd>
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-1.5">
                <dt className="text-slate-500">Roles:</dt>
                {user.roles.map((rol) => (
                  <dd key={rol}>
                    <Badge variant={rol === 'ADMIN' ? 'default' : 'secondary'}>{ROLES[rol]?.label ?? rol}</Badge>
                  </dd>
                ))}
              </div>
            </dl>
            <p className="text-[11px] text-slate-400 mt-1">Estos datos y la contraseña los cambia un administrador.</p>
          </section>

          <section>
            {titulo(<Image className="w-3.5 h-3.5 text-slate-500" />, 'Foto de perfil')}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-300 shrink-0 bg-slate-100 flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => updateAvatar(opt.url)}
                    title={opt.name}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                      user.avatarUrl === opt.url ? 'border-slate-800 ring-2 ring-slate-300' : 'border-slate-200'
                    }`}
                  >
                    <img src={opt.url} alt={opt.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="O pegá la URL de una imagen..."
                className="flex-1 min-w-0 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Aplicar
              </button>
            </div>
          </section>
        </div>

        {/* Derecha: color de la interfaz */}
        <section>
          {titulo(<Palette className="w-3.5 h-3.5 text-slate-500" />, 'Color de la interfaz')}
          {/* Colores rápidos; la rueda permite cualquier otro. */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            {THEME_PALETTES.map((palette) => {
              const isSelected = theme.colorId === palette.colorId;
              return (
                <button
                  type="button"
                  key={palette.colorId}
                  onClick={() => {
                    setThemeColor(palette.colorId);
                    setVersionRueda((v) => v + 1);
                  }}
                  title={palette.colorName}
                  className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-110 ${
                    isSelected ? 'ring-2 ring-offset-2 ring-slate-800' : ''
                  }`}
                  style={{ backgroundColor: palette.primaryHex }}
                >
                  {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </button>
              );
            })}
            <span className="text-[11px] text-slate-500">{theme.colorId === 'custom' ? `Personalizado: ${theme.primaryHex}` : theme.colorName}</span>
          </div>
          <ColorWheel key={versionRueda} value={theme.primaryHex} onChange={setThemeHex} />
        </section>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          onClick={() => setAccountModalOpen(false)}
          style={{ backgroundColor: theme.primaryHex }}
          className="sobre-primario px-5 py-1.5 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-opacity"
        >
          Listo
        </button>
      </div>
    </ModalDialog>
  );
};
