import React from 'react';
import { useApp } from '../../context/AppContext';
import { ForbiddenPage, SubTabs } from '../common';
import { ADMIN_SUBTABS } from '../../routing/navigation';
import { MediosPagoPanel, TimbradosPanel } from './CatalogosPanel';
import { UsuariosPanel } from './UsuariosPanel';
import { EmpleadosPanel } from './EmpleadosPanel';
import { SoportePanel } from './SoportePanel';

/**
 * Administración: lo que configura el administrador para que el resto opere.
 * Es una división de la interfaz, no del backend: timbrados y medios de pago
 * se guardan en el microservicio de ventas, igual que antes.
 * Aquí se agregan las próximas configuraciones (de compras, inventario, etc.).
 */
export const AdministracionModuleView: React.FC = () => {
  const { adminSubTab, setAdminSubTab, isAdmin, goHome, logout } = useApp();

  // La pestaña no aparece para otros roles; esto cubre el acceso directo.
  if (!isAdmin) {
    return (
      <ForbiddenPage
        modulo="Administración"
        detail="Solo los usuarios con rol de Administrador pueden acceder a esta sección."
        onHome={goHome}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 max-w-7xl w-full mx-auto">
      <SubTabs tabs={ADMIN_SUBTABS} value={adminSubTab} onChange={setAdminSubTab} />

      {adminSubTab === 'usuarios' && <UsuariosPanel />}
      {adminSubTab === 'empleados' && <EmpleadosPanel />}
      {adminSubTab === 'timbrados' && <TimbradosPanel />}
      {adminSubTab === 'mediosPago' && <MediosPagoPanel />}
      {adminSubTab === 'soporte' && <SoportePanel />}
    </div>
  );
};
