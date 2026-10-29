import React from 'react';
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
    <footer className="w-full bg-slate-100 text-slate-500 py-3 px-4 sm:px-6 border-t border-slate-200 text-xs print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Brand info + qué servidor de UI respondió (para ver el balanceo entre nodos) */}
        <div className="flex items-center space-x-2 text-slate-500">
          <span className="font-medium text-slate-700">DistriMarket</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-400" title="Servidor de interfaz que atendió esta página">
            Servidor UI: {SERVIDOR_UI}
          </span>
        </div>

        {/* Right: Contact Support Action */}
        <div className="flex items-center space-x-3 text-slate-500">
          <a href={`mailto:${SOPORTE_EMAIL}`} className="hidden sm:inline hover:text-slate-800 transition-colors">
            {SOPORTE_EMAIL}
          </a>
          <span className="hidden sm:inline text-slate-300">·</span>
          <button
            onClick={() => setContactModalOpen(true)}
            className="hover:text-slate-800 transition-colors font-medium cursor-pointer"
          >
            Contactar a soporte
          </button>
        </div>
      </div>
    </footer>
  );
};
