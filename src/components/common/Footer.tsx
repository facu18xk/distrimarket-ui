import React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SOPORTE_EMAIL } from '../../lib/contacto';

/**
 * Nombre del nodo de UI que sirvió la página. Con el balanceador habrá dos (UI1 y UI2): cada
 * build define VITE_UI_NODE; si no, se muestra el host que respondió.
 */
const SERVIDOR_UI: string = import.meta.env.VITE_UI_NODE || window.location.host;

export const Footer: React.FC = () => {
  const { setContactModalOpen } = useApp();

  return (
    <footer className="w-full bg-slate-900 text-slate-400 py-2 px-4 sm:px-6 border-t border-slate-800 text-xs print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Brand info + qué servidor de UI respondió (para ver el balanceo entre nodos) */}
        <div className="flex items-center space-x-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>DistriMarket</span>
          <span className="text-slate-600">·</span>
          <span title="Servidor de interfaz que atendió esta página">Servidor UI: {SERVIDOR_UI}</span>
        </div>

        {/* Right: Contact Support Button */}
        <div className="flex items-center space-x-4">
          <a href={`mailto:${SOPORTE_EMAIL}`} className="hidden sm:inline hover:text-slate-200 transition-colors">
            {SOPORTE_EMAIL}
          </a>
          <button
            onClick={() => setContactModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors border border-slate-700"
          >
            <Mail className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-semibold">Contactar a soporte</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
