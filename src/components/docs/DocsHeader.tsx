import React from 'react';
import { BookOpen, PlayCircle, GitCompare, Code2, Copy, Check, Sparkles } from 'lucide-react';
import { IMPROVED_OPENAPI_YAML } from '../../data/openApiContent';

interface HeaderProps {
  activeTab: 'guide' | 'simulator' | 'compare' | 'backend';
  setActiveTab: (tab: 'guide' | 'simulator' | 'compare' | 'backend') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(IMPROVED_OPENAPI_YAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">OpenAPI Studio</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                  OpenAPI 3.0.3
                </span>
              </div>
              <p className="text-xs text-slate-400">Guía interactiva de DTOs, Paginación y Respuestas Reutilizables</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="tab-guide"
              onClick={() => setActiveTab('guide')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'guide'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Paso a Paso (Guía)</span>
            </button>

            <button
              id="tab-simulator"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Simulador & Errores (403/404)</span>
            </button>

            <button
              id="tab-compare"
              onClick={() => setActiveTab('compare')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>Antes vs Después</span>
            </button>

            <button
              id="tab-backend"
              onClick={() => setActiveTab('backend')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'backend'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Código Backend</span>
            </button>
          </nav>

          {/* Action Button: Copy YAML */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-copy-yaml"
              onClick={handleCopy}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-emerald-100" />}
              <span>{copied ? '¡YAML Copiado!' : 'Copiar openapi.yml'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-between pb-3 pt-1 border-t border-slate-800 text-xs overflow-x-auto space-x-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'guide' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800'
            }`}
          >
            Paso a Paso
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'simulator' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800'
            }`}
          >
            Simulador
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'compare' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800'
            }`}
          >
            Antes vs Después
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'backend' ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800'
            }`}
          >
            Backend DTOs
          </button>
        </div>
      </div>
    </header>
  );
};
