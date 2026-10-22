import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { HeaderNavbar, Footer, ConfirmProvider } from './components/common';
import { LoginView } from './components/auth';
import { ContactModal, AccountConfigModal } from './components/modals';
import { StockModuleView } from './components/stock';
import { CompraModuleView } from './components/compra';
import { VentaModuleView } from './components/venta';
import { AdministracionModuleView } from './components/administracion';

const MainLayout: React.FC = () => {
  const { isLoggedIn, activeModule, canAccess } = useApp();

  if (!isLoggedIn) {
    return (
      <>
        <LoginView />
        <ContactModal />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-orange-500 selection:text-white print:bg-white">
      <HeaderNavbar />

      <main className="flex-1 flex flex-col print:block">
        {/* Autorización: un módulo solo se dibuja si el rol del usuario lo incluye. */}
        {canAccess(activeModule) && (
          <>
            {activeModule === 'stock' && <StockModuleView />}
            {activeModule === 'compra' && <CompraModuleView />}
            {activeModule === 'venta' && <VentaModuleView />}
            {activeModule === 'administracion' && <AdministracionModuleView />}
          </>
        )}
      </main>

      <Footer />

      <ContactModal />
      <AccountConfigModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ConfirmProvider>
        <MainLayout />
      </ConfirmProvider>
    </AppProvider>
  );
}
