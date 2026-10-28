import { formatDocumento, formatPhone } from '../../lib/paraguay';
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ActionButtons, FeedbackBanner, PagedTable, type Column } from '../common';
import { Button } from '../ui/button';
import { usePagedResource, useRemove } from '../../hooks';
import { ventasApi } from '../../services';
import type { ClienteResponseDTO } from '../../types/api';
import { ClienteFormModal } from './ClienteFormModal';
import { useApp } from '../../context/AppContext';

export const ClientesPanel: React.FC = () => {
  const { isAdmin } = useApp();
  const clientes = usePagedResource<ClienteResponseDTO>(ventasApi.clientes.list);
  const baja = useRemove(clientes.reload);
  const [formOpen, setFormOpen] = useState(false);
  const [enEdicion, setEnEdicion] = useState<ClienteResponseDTO | null>(null);

  const abrirFormulario = (cliente: ClienteResponseDTO | null) => {
    setEnEdicion(cliente);
    setFormOpen(true);
  };

  const darDeBaja = (cliente: ClienteResponseDTO) =>
    baja.remove(
      { title: 'Dar de baja cliente', message: `¿Dar de baja a ${cliente.persona.nombreCompleto}? Sus facturas se conservan.` },
      () => ventasApi.clientes.remove(cliente.idCliente)
    );

  const columns: Column<ClienteResponseDTO>[] = [
    { header: 'Nombre', cell: (c) => c.persona.nombreCompleto, className: 'font-bold text-slate-900' },
    { header: 'Tipo', cell: (c) => (c.persona.tipoPersona === 'FISICA' ? 'Física' : 'Jurídica'), className: 'text-slate-600' },
    { header: 'CI / RUC', cell: (c) => formatDocumento(c.persona.ci, c.persona.ruc), className: 'text-slate-600' },
    { header: 'Teléfono', cell: (c) => formatPhone(c.persona.telefono) || '—', className: 'text-slate-600' },
    { header: 'Correo', cell: (c) => c.persona.correo ?? '—', className: 'text-slate-500 text-xs' },
    { header: 'Dirección', cell: (c) => c.persona.direccion ?? '—', className: 'text-slate-600' },
    {
      header: 'Acciones',
      align: 'center',
      // Dar de baja es solo para ADMIN (también lo exige ventas).
      cell: (c) => <ActionButtons onEdit={() => abrirFormulario(c)} onDelete={isAdmin ? () => darDeBaja(c) : undefined} />,
    },
  ];

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-4">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={clientes}
        columns={columns}
        rowKey={(c) => c.idCliente}
        label="clientes"
        searchPlaceholder="Buscar por nombre, CI, RUC, teléfono o correo..."
        filters={
          <Button variant="emerald" onClick={() => abrirFormulario(null)}>
            <Plus />
            <span>Nuevo cliente</span>
          </Button>
        }
      />

      <ClienteFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSaved={(c) => (enEdicion ? clientes.replaceItem((row) => row.idCliente === c.idCliente, c) : clientes.reload())}
        cliente={enEdicion}
      />
    </>
  );
};
