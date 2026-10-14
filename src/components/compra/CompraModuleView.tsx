import React, { useState } from 'react';
import { PagedTable, StatusBadge, SubTabs, type Column, type SubTab } from '../common';
import { useLocalPagedResource } from '../../hooks';
import { formatMoney } from '../../lib/format';
import type { OrdenCompraDTO } from '../../types/api';
import { cargarOrdenes } from './catalogos';
import { FacturasCompraPanel } from './FacturasCompraPanel';
import { ProveedoresPanel } from './ProveedoresPanel';

type Tab = 'facturas' | 'proveedores' | 'ordenes';

const TABS: SubTab<Tab>[] = [
  { id: 'facturas', label: 'Facturas de compra' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'ordenes', label: 'Órdenes de compra' },
];

const columnasOrdenes: Column<OrdenCompraDTO>[] = [
  { header: 'Orden', cell: (o) => `#${o.id}`, className: 'font-bold text-slate-900' },
  { header: 'Proveedor', cell: (o) => `#${o.idProveedor}`, className: 'text-slate-600' },
  { header: 'Observación', cell: (o) => o.observacion ?? '—', className: 'text-slate-600' },
  { header: 'Total', align: 'right', cell: (o) => formatMoney(o.total), className: 'font-black text-slate-900' },
  { header: 'Estado', cell: (o) => <StatusBadge status={o.estado ?? 'PENDIENTE'} /> },
];

const buscarOrden = (o: OrdenCompraDTO) => `${o.id} ${o.estado ?? ''} ${o.observacion ?? ''}`;

const OrdenesPanel: React.FC = () => {
  const ordenes = useLocalPagedResource(cargarOrdenes, buscarOrden);
  return (
    <PagedTable
      resource={ordenes}
      columns={columnasOrdenes}
      rowKey={(o) => o.id}
      label="órdenes de compra"
      searchPlaceholder="Buscar por número, estado u observación..."
    />
  );
};

/** Módulo de compras: todo sale del microservicio de compras a través del gateway. */
export const CompraModuleView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('facturas');

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto">
      <SubTabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'facturas' && <FacturasCompraPanel />}
      {tab === 'proveedores' && <ProveedoresPanel />}
      {tab === 'ordenes' && <OrdenesPanel />}
    </div>
  );
};
