import React from 'react';
import { SubTabs } from '../common';
import { COMPRA_SUBTABS } from '../../routing/navigation';
import { useApp } from '../../context/AppContext';
import { FacturasCompraPanel } from './FacturasCompraPanel';
import { ProveedoresPanel } from './ProveedoresPanel';

/** Módulo de compras: todo sale del microservicio de compras a través del gateway. */
export const CompraModuleView: React.FC = () => {
  const { compraSubTab, setCompraSubTab } = useApp();

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 max-w-7xl w-full mx-auto">
      <SubTabs tabs={COMPRA_SUBTABS} value={compraSubTab} onChange={setCompraSubTab} />
      {compraSubTab === 'facturas' && <FacturasCompraPanel />}
      {compraSubTab === 'proveedores' && <ProveedoresPanel />}
    </div>
  );
};
