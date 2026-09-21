import React, { useState } from 'react';
import { Palette, User, Image, Check, Sparkles, RefreshCw, Save } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { useApp } from '../../context/AppContext';
import { THEME_PALETTES, AVATAR_OPTIONS } from '../../data/mockData';

export const AccountConfigModal: React.FC = () => {
  const {
    accountModalOpen,
    setAccountModalOpen,
    user,
    updateUser,
    theme,
    setThemeColor,
  } = useApp();

  const [tempName, setTempName] = useState(user.name);
  const [tempEmail, setTempEmail] = useState(user.email);
  const [tempAvatarUrl, setTempAvatarUrl] = useState(user.avatarUrl);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: tempName.trim() || user.name,
      email: tempEmail.trim() || user.email,
      avatarUrl: tempAvatarUrl || user.avatarUrl,
    });
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
      setAccountModalOpen(false);
    }, 1200);
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setTempAvatarUrl(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  return (
    <ModalDialog
      isOpen={accountModalOpen}
      onClose={() => setAccountModalOpen(false)}
      title="Configuración de Cuenta y Personalización de UI"
      subtitle="Personaliza el tema visual y tu perfil. Los cambios se aplican al instante sin reiniciar el servidor ni redeployar."
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-6">
        {/* Banner with zero-downtime note */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-xs text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Personalización instantánea por usuario:</strong> Tus preferencias de color y foto de perfil se almacenan localmente para tu sesión. No afectan a otros usuarios ni requieren detener o recompilar el proyecto.
          </p>
        </div>

        {/* 1. Color de la Interfaz (Theme Selector) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-500" />
            <span>Color Principal de la UI (Barra Superior y Acentos)</span>
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
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {palette.colorName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Imagen de Perfil / Avatar */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Image className="w-3.5 h-3.5 text-slate-500" />
            <span>Foto de Perfil / Ícono del Usuario</span>
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-3">
            {/* Current Preview */}
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-300 shadow-sm shrink-0 bg-slate-100 flex items-center justify-center">
              {tempAvatarUrl ? (
                <img
                  src={tempAvatarUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-8 h-8 text-slate-400" />
              )}
            </div>

            {/* Presets */}
            <div className="flex-1">
              <span className="text-xs text-slate-500 block mb-1.5 font-medium">
                Selecciona uno de los avatares predeterminados:
              </span>
              <div className="flex items-center space-x-2">
                {AVATAR_OPTIONS.map((opt) => {
                  const isCur = tempAvatarUrl === opt.url;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setTempAvatarUrl(opt.url)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                        isCur ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200'
                      }`}
                    >
                      <img
                        src={opt.url}
                        alt={opt.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Custom image URL option */}
          <div className="flex items-center space-x-2">
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="O pega una URL de imagen externa..."
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

        {/* 3. Nombre y Correo */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de Usuario *
            </label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
          </div>
        </div>

        {/* Save button & feedback */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {showSavedFeedback ? (
              <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>¡Preferencias guardadas!</span>
              </span>
            ) : (
              'Guardado local en navegador'
            )}
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setAccountModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cerrar
            </button>
            <button
              type="submit"
              style={{ backgroundColor: theme.primaryHex }}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </form>
    </ModalDialog>
  );
};
