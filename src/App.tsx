import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import {
  HeaderNavbar,
  Footer,
  ConfirmProvider,
  ErrorBoundary,
  ErrorPage,
  UnauthorizedPage,
  ForbiddenPage,
} from './components/common';
import { LOGIN_PATH } from './routing/routes';
import { LoginView } from './components/auth';
import { ContactModal, AccountConfigModal } from './components/modals';
import { StockModuleView } from './components/stock';
import { CompraModuleView } from './components/compra';
import { VentaModuleView } from './components/venta';
import { AdministracionModuleView } from './components/administracion';

const MainLayout: React.FC = () => {
  const {
    isLoggedIn,
    route,
    activeModule,
    canAccess,
    goHome,
    logout,
    navigate,
    serverError,
    retryAfterServerError,
    retryKey,
  } = useApp();

  if (!isLoggedIn) {
    if (route.kind === 'unauthorized') {
      return (
        <div className="min-h-screen flex flex-col bg-slate-100">
          <UnauthorizedPage onLogin={() => navigate(LOGIN_PATH)} />
        </div>
      );
    }
    if (route.kind === 'forbidden') {
      return (
        <div className="min-h-screen flex flex-col bg-slate-100">
          <ForbiddenPage onLogin={() => navigate(LOGIN_PATH)} />
        </div>
      );
    }
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
        ) : route.kind === 'unauthorized' ? (
          <UnauthorizedPage onHome={goHome} onLogout={logout} />
        ) : route.kind === 'forbidden' ? (
          <ForbiddenPage
            modulo={route.module}
            detail={route.module ? `No posee permisos asignados para el módulo de ${route.module}.` : undefined}
            onHome={goHome}
            onLogout={logout}
          />
        ) : !canAccess(activeModule) ? (
          <ForbiddenPage
            modulo={activeModule}
            detail={`No posee permisos asignados para el módulo de ${activeModule}.`}
            onHome={goHome}
            onLogout={logout}
          />
        ) : (
          <ErrorBoundary key={`${activeModule}-${retryKey}`} onHome={goHome}>
            {activeModule === 'stock' && <StockModuleView />}
            {activeModule === 'compra' && <CompraModuleView />}
            {activeModule === 'venta' && <VentaModuleView />}
            {activeModule === 'administracion' && <AdministracionModuleView />}
          </ErrorBoundary>
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
