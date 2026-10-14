import React, { useState } from 'react';
import { PagedTable, StatusBadge, SubTabs, type Column, type SubTab } from '../common';
import { useLocalPagedResource } from '../../hooks';
import type { DepositoResponseDTO } from '../../types/api';
import { cargarDepositos } from './catalogos';
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

const columnasDepositos: Column<DepositoResponseDTO>[] = [
  { header: 'ID', cell: (d) => d.id, className: 'text-slate-500 w-16' },
  { header: 'Depósito', cell: (d) => d.nombre, className: 'font-bold text-slate-900' },
  { header: 'Ubicación', cell: (d) => d.ubicacion ?? '—', className: 'text-slate-600' },
  { header: 'Estado', cell: (d) => <StatusBadge status={d.estado ? 'Activo' : 'Inactivo'} /> },
];

const buscarDeposito = (d: DepositoResponseDTO) => `${d.nombre} ${d.ubicacion ?? ''}`;

const DepositosPanel: React.FC = () => {
  const depositos = useLocalPagedResource(cargarDepositos, buscarDeposito);
  return (
    <PagedTable
      resource={depositos}
      columns={columnasDepositos}
      rowKey={(d) => d.id}
      label="depósitos"
      searchPlaceholder="Buscar depósito..."
    />
  );
};

/** Módulo de stock: todo sale del microservicio de inventario a través del gateway. */
export const StockModuleView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('productos');

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto">
      <SubTabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'productos' && <ProductosPanel />}
      {tab === 'existencias' && <ExistenciasPanel />}
      {tab === 'ajustes' && <AjustesPanel />}
      {tab === 'transferencias' && <TransferenciasPanel />}
      {tab === 'depositos' && <DepositosPanel />}
    </div>
  );
};
