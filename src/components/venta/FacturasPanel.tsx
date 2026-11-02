import { formatNumeroFactura } from '../../lib/paraguay';
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  ActionButtons,
  ClienteSelector,
  DepositoBuscador,
  EmpleadoPicker,
  FeedbackBanner,
  PagedTable,
  StatusBadge,
  fieldClass,
  type Column,
} from '../common';
import { Button } from '../ui/button';
import { useAsyncData, usePagedResource, usePorId, useRemove } from '../../hooks';
import { catalogos, inventarioApi, ventasApi, type FacturaVentaFilters } from '../../services';
import { formatDate, formatMoney } from '../../lib/format';
import { cn } from '../../lib/utils';
import type {
  ClienteResponseDTO,
  DepositoResponseDTO,
  EmpleadoResponseDTO,
  EstadoFacturaVenta,
  FacturaVentaResumenDTO,
} from '../../types/api';
import { FacturaDetailModal } from './FacturaDetailModal';
import { FacturaFormModal } from './FacturaFormModal';
import { useApp } from '../../context/AppContext';

/**
 * Listado de facturas: el backend devuelve solo cabeceras (cliente con nombre, vendedor por id).
 * El nombre del vendedor se pide por id, una sola vez por cada vendedor distinto de la página
 * (el backend lo responde desde Redis); no se carga la lista entera de empleados.
 * La factura completa, con sus líneas, se pide recién al abrirla.
 */
export const FacturasPanel: React.FC = () => {
  const { isAdmin } = useApp();
  const [estado, setEstado] = useState<EstadoFacturaVenta | ''>('');
  const [cliente, setCliente] = useState<ClienteResponseDTO | null>(null);
  const [empleado, setEmpleado] = useState<EmpleadoResponseDTO | null>(null);
  const [deposito, setDeposito] = useState<DepositoResponseDTO | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const depositos = useAsyncData(catalogos.depositos);
  const filtros: FacturaVentaFilters | undefined =
    estado || cliente || empleado || deposito || fechaDesde || fechaHasta
      ? {
          estado: estado || undefined,
          idCliente: cliente?.idCliente,
          idEmpleado: empleado?.id,
          idDeposito: deposito?.id,
          fechaDesde: fechaDesde || undefined,
          fechaHasta: fechaHasta || undefined,
        }
      : undefined;
  const facturas = usePagedResource<FacturaVentaResumenDTO, FacturaVentaFilters>(ventasApi.facturas.list, {
    filters: filtros,
    sort: 'id,desc',
  });
  const empleadoPorId = usePorId(inventarioApi.empleados.ref, facturas.items.map((f) => f.idEmpleado));

  const baja = useRemove(facturas.reload);
  const [formOpen, setFormOpen] = useState(false);
  const [idEnEdicion, setIdEnEdicion] = useState<number | null>(null);
  const [idSeleccionada, setIdSeleccionada] = useState<number | null>(null);

  const abrirFormulario = (idFactura: number | null) => {
    setIdSeleccionada(null);
    setIdEnEdicion(idFactura);
    setFormOpen(true);
  };

  const columns: Column<FacturaVentaResumenDTO>[] = [
    { header: 'Número', sortKey: 'numeroFactura', cell: (f) => formatNumeroFactura(f.numeroFactura), className: 'font-bold text-slate-900' },
    { header: 'Fecha', sortKey: 'fechaEmision', cell: (f) => formatDate(f.fechaEmision), className: 'text-slate-600' },
    { header: 'Cliente', cell: (f) => f.clienteNombre },
    {
      header: 'Vendedor',
      cell: (f) => (f.idEmpleado ? empleadoPorId.get(f.idEmpleado)?.persona.nombreCompleto : undefined) ?? '—',
      className: 'text-slate-600',
    },
    { header: 'Total', sortKey: 'totalGeneral', align: 'center', cell: (f) => formatMoney(f.totalGeneral), className: 'font-black text-slate-900' },
    { header: 'Estado', sortKey: 'estado', cell: (f) => <StatusBadge status={f.estado === 'EMITIDA' ? 'Emitida' : 'Anulada'} /> },
    {
      header: 'Acciones',
      align: 'center',
      cell: (f) => (
        <ActionButtons
          onView={() => setIdSeleccionada(f.idFacturaVenta)}
          // Una factura emitida no se modifica: se anula y se emite una nueva (pedido de la cátedra).
          // Dar de baja es solo para ADMIN (también lo exige ventas); el vendedor puede anular.
          onDelete={
            isAdmin
              ? () =>
                  baja.remove(
                    {
                      title: 'Dar de baja factura',
                      message: `¿Dar de baja la factura ${formatNumeroFactura(f.numeroFactura)}? Dejará de aparecer en los listados${f.estado === 'EMITIDA' ? ' y se devolverá el stock' : ''}.`,
                    },
                    () => ventasApi.facturas.remove(f.idFacturaVenta)
                  )
              : undefined
          }
        />
      ),
    },
  ];

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-3">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={facturas}
        columns={columns}
        rowKey={(f) => f.idFacturaVenta}
        label="facturas"
        searchPlaceholder="Buscar por número, cliente o fecha..."
        emptyMessage="No se encontraron facturas con los filtros seleccionados."
        onRowClick={(f) => setIdSeleccionada(f.idFacturaVenta)}
        filters={
          <>
            <div className="w-full sm:w-56">
              <ClienteSelector value={cliente} onChange={setCliente} placeholder="Todos los clientes" />
            </div>
            <div className="w-full sm:w-56">
              <EmpleadoPicker value={empleado} onChange={setEmpleado} placeholder="Todos los vendedores" />
            </div>
            <div className="w-full sm:w-56">
              <DepositoBuscador
                depositos={depositos.data ?? []}
                value={deposito}
                onChange={setDeposito}
                placeholder="Todos los depósitos (buscar...)"
              />
            </div>
            <input
              className={cn(fieldClass, 'w-auto bg-white h-9')}
              type="date"
              value={fechaDesde}
              max={fechaHasta || undefined}
              onChange={(e) => setFechaDesde(e.target.value)}
              title="Fecha de emisión desde"
              aria-label="Fecha de emisión desde"
            />
            <input
              className={cn(fieldClass, 'w-auto bg-white h-9')}
              type="date"
              value={fechaHasta}
              min={fechaDesde || undefined}
              onChange={(e) => setFechaHasta(e.target.value)}
              title="Fecha de emisión hasta"
              aria-label="Fecha de emisión hasta"
            />
            <select
              className={cn(fieldClass, 'w-auto bg-white h-9')}
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoFacturaVenta | '')}
              title="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              <option value="EMITIDA">Emitidas</option>
              <option value="ANULADA">Anuladas</option>
            </select>
            <Button variant="primario" onClick={() => abrirFormulario(null)}>
              <Plus />
              <span>Nueva factura</span>
            </Button>
          </>
        }
      />

      <FacturaFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={facturas.reload}
        idFactura={idEnEdicion}
      />
      <FacturaDetailModal
        idFactura={idSeleccionada}
        onClose={() => setIdSeleccionada(null)}
        onChanged={facturas.reload}
      />
    </>
  );
};
