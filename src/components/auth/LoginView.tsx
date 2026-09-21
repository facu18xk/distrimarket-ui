import React, { useState } from 'react';
import { ShoppingCart, Lock, User, ArrowRight, Mail, HelpCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginView: React.FC = () => {
  const { login, theme, setContactModalOpen } = useApp();
  const [username, setUsername] = useState('Juan Pérez');
  const [password, setPassword] = useState('distrimarket2026');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(username, password);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Banner matching Figma */}
      <header
        className="w-full py-3.5 px-6 shadow-md flex items-center justify-between"
        style={{ backgroundColor: theme.primaryHex }}
      >
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 p-1.5 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">DistriMarket</span>
        </div>
        <button
          onClick={() => setContactModalOpen(true)}
          className="text-white/90 hover:text-white text-xs font-semibold flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Ayuda / Contacto</span>
        </button>
      </header>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div
              className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: theme.primaryHex }}
            >
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">DistriMarket</h2>
            <p className="text-xs text-slate-500">
              Ingresa tus credenciales para acceder a los módulos de inventario, compras y ventas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Ej: Juan Pérez"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: theme.primaryHex }}
              className="w-full py-2.5 px-4 text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 text-sm"
            >
              <span>{loading ? 'Iniciando sesión...' : 'Iniciar sesión'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Bottom link to contact support */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center space-x-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
              <span>¿Tienes problemas para acceder? Contactar a soporte</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
