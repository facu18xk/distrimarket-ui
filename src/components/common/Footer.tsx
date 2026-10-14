import React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { setContactModalOpen } = useApp();

  return (
    <footer className="w-full bg-slate-900 text-slate-400 py-4 px-4 sm:px-6 border-t border-slate-800 text-xs print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Brand info */}
        <div className="flex items-center space-x-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>DistriMarket</span>
        </div>

        {/* Right: Contact Support Button */}
        <div className="flex items-center space-x-4">
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
