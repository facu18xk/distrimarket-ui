import React, { useState } from 'react';
import { PagedTable, StatusBadge, SubTabs, type Column, type SubTab } from '../common';
import { nombreProveedor } from '../../lib/proveedor';
import { usePagedResource, usePorId } from '../../hooks';
import { comprasApi, inventarioApi } from '../../services';
import { formatMoney } from '../../lib/format';
import type { OrdenCompraDTO } from '../../types/api';
import { FacturasCompraPanel } from './FacturasCompraPanel';
import { ProveedoresPanel } from './ProveedoresPanel';

type Tab = 'facturas' | 'proveedores' | 'ordenes';

const TABS: SubTab<Tab>[] = [
  { id: 'facturas', label: 'Facturas de compra' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'ordenes', label: 'Órdenes de compra' },
];

/**
 * La orden trae proveedor y empleado por id: se pide cada id distinto de la página una sola vez
 * (el backend lo responde desde Redis), sin cargar todos los proveedores ni empleados.
 */
const OrdenesPanel: React.FC = () => {
  const ordenes = usePagedResource(comprasApi.ordenes.list);
  const proveedorPorId = usePorId(comprasApi.proveedores.ref, ordenes.items.map((o) => o.idProveedor));
  const empleadoPorId = usePorId(inventarioApi.empleados.ref, ordenes.items.map((o) => o.idEmpleado));

  const columnas: Column<OrdenCompraDTO>[] = [
    {
      header: 'Proveedor',
      cell: (o) => nombreProveedor(proveedorPorId.get(o.idProveedor)),
      className: 'font-bold text-slate-900',
    },
    { header: 'Responsable', cell: (o) => empleadoPorId.get(o.idEmpleado)?.persona.nombreCompleto ?? '—', className: 'text-slate-600' },
    { header: 'Observación', cell: (o) => o.observacion ?? '—', className: 'text-slate-600' },
    { header: 'Total', align: 'right', cell: (o) => formatMoney(o.total), className: 'font-black text-slate-900' },
    { header: 'Estado', cell: (o) => <StatusBadge status={o.estado ?? 'PENDIENTE'} /> },
  ];

  return (
    <PagedTable
      resource={ordenes}
      columns={columnas}
      rowKey={(o) => o.id}
      label="órdenes de compra"
    />
  );
};

/** Módulo de compras: todo sale del microservicio de compras a través del gateway. */
export const CompraModuleView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('facturas');

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 max-w-7xl w-full mx-auto">
      <SubTabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'facturas' && <FacturasCompraPanel />}
      {tab === 'proveedores' && <ProveedoresPanel />}
      {tab === 'ordenes' && <OrdenesPanel />}
    </div>
  );
};
