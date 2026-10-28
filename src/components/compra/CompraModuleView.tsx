import React, { useState } from 'react';
import { ActionButtons, ModalDialog, PagedTable, StatusBadge, SubTabs, type Column, type SubTab } from '../common';
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
  const [detalle, setDetalle] = useState<OrdenCompraDTO | null>(null);

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
    { header: 'Acciones', align: 'center', cell: (o) => <ActionButtons onView={() => setDetalle(o)} /> },
  ];

  return (
    <>
      <PagedTable
        resource={ordenes}
        columns={columnas}
        rowKey={(o) => o.id}
        label="órdenes de compra"
        searchPlaceholder="Buscar por proveedor u observación..."
        onRowClick={setDetalle}
      />
      {detalle && (
        <DetalleOrden
          orden={detalle}
          proveedor={nombreProveedor(proveedorPorId.get(detalle.idProveedor))}
          responsable={empleadoPorId.get(detalle.idEmpleado)?.persona.nombreCompleto ?? '—'}
          onClose={() => setDetalle(null)}
        />
      )}
    </>
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

/** Detalle de una orden: líneas que ya vienen en la fila; el nombre de cada producto se pide por id. */
const DetalleOrden: React.FC<{ orden: OrdenCompraDTO; proveedor: string; responsable: string; onClose: () => void }> = ({ orden, proveedor, responsable, onClose }) => {
  const detalles = orden.detalles ?? [];
  const productos = usePorId(inventarioApi.productos.ref, detalles.map((d) => d.idProducto));
  return (
    <ModalDialog isOpen onClose={onClose} title={`Orden de compra N.º ${orden.id}`} subtitle={`Estado: ${orden.estado ?? 'PENDIENTE'}`} maxWidth="2xl">
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          {(
            [
              ['Proveedor', proveedor],
              ['Responsable', responsable],
              ['Observación', orden.observacion ?? '—'],
            ] as const
          ).map(([etiqueta, valor]) => (
            <div key={etiqueta} className="min-w-0">
              <span className="block text-slate-400">{etiqueta}</span>
              <strong className="block text-slate-800 truncate">{valor}</strong>
            </div>
          ))}
        </div>
        <div className="border border-slate-200 rounded-xl">
          <table className="w-full table-fixed text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2 px-3">Producto</th>
                <th className="py-2 px-2 w-16 text-center">Cant.</th>
                <th className="py-2 px-2 w-24 text-right">Precio</th>
                <th className="py-2 px-2 w-24 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detalles.map((d) => (
                <tr key={d.id}>
                  <td className="py-1.5 px-3 font-semibold text-slate-800 truncate">{productos.get(d.idProducto)?.nombre ?? '…'}</td>
                  <td className="py-1.5 px-2 text-center">{d.cantidad}</td>
                  <td className="py-1.5 px-2 text-right">{formatMoney(d.precioUnitario)}</td>
                  <td className="py-1.5 px-2 text-right font-bold text-slate-900">{formatMoney(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-right">
          <span className="block text-slate-400">Total</span>
          <strong className="text-base font-black text-slate-900">{formatMoney(orden.total)}</strong>
        </div>
      </div>
    </ModalDialog>
  );
};
