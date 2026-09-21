import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { HeaderNavbar, Footer } from './components/common';
import { LoginView } from './components/auth';
import { ContactModal, AccountConfigModal } from './components/modals';
import { StockModuleView } from './components/stock';
import { CompraModuleView } from './components/compra';
import { VentaModuleView } from './components/venta';
import { PromocionModuleView } from './components/promociones';
import { BackendEquivalence, CodeComparator, ApiSimulator, StepGuide } from './components/docs';
import { Code, BookOpen } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isLoggedIn, activeModule } = useApp();
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [docTab, setDocTab] = useState<'openapi' | 'backend' | 'simulator' | 'guide'>('openapi');

  if (!isLoggedIn) {
    return (
      <>
        <LoginView />
        <ContactModal />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navbar matching Figma */}
      <HeaderNavbar />

      {/* Floating or Secondary Bar to toggle OpenAPI Docs & Architecture Guide */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-white">distrimarket-ui</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Vite + React + Tailwind + Microservicios Spring Boot</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowApiDocs(!showApiDocs)}
            className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700 font-medium"
          >
            <Code className="w-3.5 h-3.5 text-orange-400" />
            <span>{showApiDocs ? 'Volver a UI Figma' : 'Ver Contrato OpenAPI & DTOs'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {showApiDocs ? (
          <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-300 pb-3">
              <button
                onClick={() => setDocTab('openapi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  docTab === 'openapi' ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Contrato OpenAPI 3.0.3 (YAML)
              </button>
              <button
                onClick={() => setDocTab('backend')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  docTab === 'backend' ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Equivalencia Java DTOs & Handler
              </button>
              <button
                onClick={() => setDocTab('simulator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  docTab === 'simulator' ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Simulador de Endpoints
              </button>
              <button
                onClick={() => setDocTab('guide')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                  docTab === 'guide' ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Guía Paso a Paso</span>
              </button>
            </div>

            {docTab === 'openapi' && <CodeComparator />}
            {docTab === 'backend' && <BackendEquivalence />}
            {docTab === 'simulator' && <ApiSimulator />}
            {docTab === 'guide' && <StepGuide onGoToSimulator={() => setDocTab('simulator')} />}
          </div>
        ) : (
          <>
            {activeModule === 'stock' && <StockModuleView />}
            {activeModule === 'compra' && <CompraModuleView />}
            {activeModule === 'venta' && <VentaModuleView />}
            {activeModule === 'promociones' && <PromocionModuleView />}
          </>
        )}
      </main>

      {/* Pinned Global Footer */}
      <Footer />

      {/* Modals */}
      <ContactModal />
      <AccountConfigModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
