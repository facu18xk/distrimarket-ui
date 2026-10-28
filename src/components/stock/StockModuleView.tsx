import React, { useState } from 'react';
import { SubTabs, type SubTab } from '../common';
import { DepositosPanel } from './DepositosPanel';
import { ExistenciasPanel } from './ExistenciasPanel';
import { AjustesPanel, TransferenciasPanel } from './MovimientosPanel';
import { ProductosPanel } from './ProductosPanel';

type Tab = 'productos' | 'existencias' | 'ajustes' | 'transferencias' | 'depositos';

const TABS: SubTab<Tab>[] = [
  { id: 'productos', label: 'Productos' },
  { id: 'existencias', label: 'Existencias' },
  { id: 'ajustes', label: 'Ajustes' },
  { id: 'transferencias', label: 'Transferencias' },
  { id: 'depositos', label: 'Depósitos' },
];


/** Módulo de stock: todo sale del microservicio de inventario a través del gateway. */
export const StockModuleView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('productos');

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 max-w-7xl w-full mx-auto">
      <SubTabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'productos' && <ProductosPanel />}
      {tab === 'existencias' && <ExistenciasPanel />}
      {tab === 'ajustes' && <AjustesPanel />}
      {tab === 'transferencias' && <TransferenciasPanel />}
      {tab === 'depositos' && <DepositosPanel />}
    </div>
  );
};
