import { formatNumeroFactura } from '../../lib/paraguay';
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ActionButtons, FeedbackBanner, PagedTable, StatusBadge, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { usePagedResource, useRemove } from '../../hooks';
import { ventasApi, type FacturaVentaFilters } from '../../services';
import { formatDate, formatMoney } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { EstadoFacturaVenta, FacturaVentaResponseDTO } from '../../types/api';
import { FacturaDetailModal } from './FacturaDetailModal';
import { FacturaFormModal } from './FacturaFormModal';
import { useApp } from '../../context/AppContext';

export const FacturasPanel: React.FC = () => {
  const { isAdmin } = useApp();
  const [estado, setEstado] = useState<EstadoFacturaVenta | ''>('');
  const facturas = usePagedResource<FacturaVentaResponseDTO, FacturaVentaFilters>(ventasApi.facturas.list, {
    filters: estado ? { estado } : undefined,
    sort: 'id,desc',
  });

  const baja = useRemove(facturas.reload);
  const [formOpen, setFormOpen] = useState(false);
  const [enEdicion, setEnEdicion] = useState<FacturaVentaResponseDTO | null>(null);
  const [seleccionada, setSeleccionada] = useState<FacturaVentaResponseDTO | null>(null);

  const abrirFormulario = (factura: FacturaVentaResponseDTO | null) => {
    setSeleccionada(null);
    setEnEdicion(factura);
    setFormOpen(true);
  };

  const columns: Column<FacturaVentaResponseDTO>[] = [
    { header: 'Número', cell: (f) => formatNumeroFactura(f.numeroFactura), className: 'font-bold text-slate-900' },
    { header: 'Fecha', cell: (f) => formatDate(f.fechaEmision), className: 'text-slate-600' },
    { header: 'Cliente', cell: (f) => f.cliente.persona.nombreCompleto },
    { header: 'Vendedor', cell: (f) => f.empleado?.persona?.nombreCompleto ?? '—', className: 'text-slate-600' },
    { header: 'Total', align: 'right', cell: (f) => formatMoney(f.totalGeneral), className: 'font-black text-slate-900' },
    { header: 'Estado', cell: (f) => <StatusBadge status={f.estado === 'EMITIDA' ? 'Emitida' : 'Anulada'} /> },
    {
      header: 'Acciones',
      align: 'center',
      cell: (f) => (
        <ActionButtons
          onView={() => setSeleccionada(f)}
          onEdit={f.estado === 'EMITIDA' ? () => abrirFormulario(f) : undefined}
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
      {baja.error && <FeedbackBanner className="mb-4">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={facturas}
        columns={columns}
        rowKey={(f) => f.idFacturaVenta}
        label="facturas"
        searchPlaceholder="Buscar por número, cliente o fecha..."
        emptyMessage="No se encontraron facturas con los filtros seleccionados."
        onRowClick={setSeleccionada}
        filters={
          <>
            <select
              className={cn(fieldClass, 'w-auto bg-white h-10')}
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
        factura={enEdicion}
      />
      <FacturaDetailModal
        factura={seleccionada}
        onClose={() => setSeleccionada(null)}
        onChanged={facturas.reload}
        onEdit={abrirFormulario}
      />
    </>
  );
};
