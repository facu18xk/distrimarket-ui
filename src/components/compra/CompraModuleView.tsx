import React, { useMemo, useState } from 'react';
import { PagedTable, StatusBadge, SubTabs, type Column, type SubTab } from '../common';
import { useAsyncData, useLocalPagedResource } from '../../hooks';
import { catalogos } from '../../services';
import { indexar } from '../../lib/catalogCache';
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

const buscarOrden = (o: OrdenCompraDTO) => `${o.estado ?? ''} ${o.observacion ?? ''}`;

/** La orden trae proveedor y empleado por id: sus nombres salen de los catálogos en caché. */
const OrdenesPanel: React.FC = () => {
  const ordenes = useLocalPagedResource(cargarOrdenes, buscarOrden);
  const proveedores = useAsyncData(catalogos.proveedores);
  const empleados = useAsyncData(catalogos.empleados);
  const proveedorPorId = useMemo(() => indexar(proveedores.data, (p) => p.idProveedor), [proveedores.data]);
  const empleadoPorId = useMemo(() => indexar(empleados.data, (e) => e.id), [empleados.data]);

  const columnas: Column<OrdenCompraDTO>[] = [
    {
      header: 'Proveedor',
      cell: (o) => {
        const p = proveedorPorId.get(o.idProveedor);
        return p ? p.nombreFantasia || p.persona.nombreCompleto : '—';
      },
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
      searchPlaceholder="Buscar por estado u observación..."
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
