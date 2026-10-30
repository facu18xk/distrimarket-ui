import React from 'react';
import { SubTabs } from '../common';
import { DepositosPanel } from './DepositosPanel';
import { STOCK_SUBTABS } from '../../routing/navigation';
import { useApp } from '../../context/AppContext';
import { ExistenciasPanel } from './ExistenciasPanel';
import { AjustesPanel, TransferenciasPanel } from './MovimientosPanel';
import { ProductosPanel } from './ProductosPanel';
import {ReportesInventarioPanel} from "./ReportesInventarioPanel.tsx";

/** Módulo de stock: todo sale del microservicio de inventario a través del gateway. */
export const StockModuleView: React.FC = () => {
  const { stockSubTab, setStockSubTab } = useApp();

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 max-w-7xl w-full mx-auto">
      <SubTabs tabs={STOCK_SUBTABS} value={stockSubTab} onChange={setStockSubTab} />
      {stockSubTab === 'productos' && <ProductosPanel />}
      {stockSubTab === 'existencias' && <ExistenciasPanel />}
      {stockSubTab === 'ajustes' && <AjustesPanel />}
      {stockSubTab === 'transferencias' && <TransferenciasPanel />}
      {stockSubTab === 'depositos' && <DepositosPanel />}
      {stockSubTab === 'reportes' && <ReportesInventarioPanel />}
    </div>
  );
};
