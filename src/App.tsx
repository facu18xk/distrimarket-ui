import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { HeaderNavbar, Footer, ConfirmProvider, ErrorBoundary, ErrorPage } from './components/common';
import { LoginView } from './components/auth';
import { ContactModal, AccountConfigModal } from './components/modals';
import { StockModuleView } from './components/stock';
import { CompraModuleView } from './components/compra';
import { VentaModuleView } from './components/venta';
import { AdministracionModuleView } from './components/administracion';

const MainLayout: React.FC = () => {
  const { isLoggedIn, route, activeModule, canAccess, goHome, serverError, retryAfterServerError, retryKey } = useApp();

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
        {serverError ? (
          // El backend falló al cargar datos: página 500 con la opción de reintentar.
          <ErrorPage code={500} detail={serverError} onRetry={retryAfterServerError} onHome={goHome} />
        ) : route.kind === 'notFound' ? (
          <ErrorPage code={404} onHome={goHome} />
        ) : (
          canAccess(activeModule) && (
            <ErrorBoundary key={`${activeModule}-${retryKey}`} onHome={goHome}>
              {activeModule === 'stock' && <StockModuleView />}
              {activeModule === 'compra' && <CompraModuleView />}
              {activeModule === 'venta' && <VentaModuleView />}
              {activeModule === 'administracion' && <AdministracionModuleView />}
            </ErrorBoundary>
          )
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
