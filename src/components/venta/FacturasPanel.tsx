import { formatNumeroFactura } from '../../lib/paraguay';
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ActionButtons, FeedbackBanner, PagedTable, StatusBadge, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { usePagedResource, usePorId, useRemove } from '../../hooks';
import { inventarioApi, ventasApi, type FacturaVentaFilters } from '../../services';
import { formatDate, formatMoney } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { EstadoFacturaVenta, FacturaVentaResumenDTO } from '../../types/api';
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
  const facturas = usePagedResource<FacturaVentaResumenDTO, FacturaVentaFilters>(ventasApi.facturas.list, {
    filters: estado ? { estado } : undefined,
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
    { header: 'Número', cell: (f) => formatNumeroFactura(f.numeroFactura), className: 'font-bold text-slate-900' },
    { header: 'Fecha', cell: (f) => formatDate(f.fechaEmision), className: 'text-slate-600' },
    { header: 'Cliente', cell: (f) => f.clienteNombre },
    {
      header: 'Vendedor',
      cell: (f) => (f.idEmpleado ? empleadoPorId.get(f.idEmpleado)?.persona.nombreCompleto : undefined) ?? '—',
      className: 'text-slate-600',
    },
    { header: 'Total', align: 'center', cell: (f) => formatMoney(f.totalGeneral), className: 'font-black text-slate-900' },
    { header: 'Estado', cell: (f) => <StatusBadge status={f.estado === 'EMITIDA' ? 'Emitida' : 'Anulada'} /> },
    {
      header: 'Acciones',
      align: 'center',
      cell: (f) => (
        <ActionButtons
          onView={() => setIdSeleccionada(f.idFacturaVenta)}
          onEdit={f.estado === 'EMITIDA' ? () => abrirFormulario(f.idFacturaVenta) : undefined}
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
            <Button variant="emerald" onClick={() => abrirFormulario(null)}>
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
        onEdit={abrirFormulario}
      />
    </>
  );
};
