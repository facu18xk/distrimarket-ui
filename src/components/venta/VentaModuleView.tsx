import React from 'react';
import { useApp } from '../../context/AppContext';
import { SubTabs } from '../common';
import { VENTA_SUBTABS } from '../../routing/navigation';
import { ClientesPanel } from './ClientesPanel';
import { FacturasPanel } from './FacturasPanel';
import { PromocionesPanel } from './PromocionesPanel';
import { ReportesPanel } from './ReportesPanel';

/** Módulo de ventas: todo sale del microservicio de ventas a través del gateway. */
export const VentaModuleView: React.FC = () => {
  const { ventaSubTab, setVentaSubTab } = useApp();

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 max-w-7xl w-full mx-auto">
      <SubTabs tabs={VENTA_SUBTABS} value={ventaSubTab} onChange={setVentaSubTab} />

      {ventaSubTab === 'facturas' && <FacturasPanel />}
      {ventaSubTab === 'clientes' && <ClientesPanel />}
      {ventaSubTab === 'promociones' && <PromocionesPanel />}
      {ventaSubTab === 'reportes' && <ReportesPanel />}
    </div>
  );
};
