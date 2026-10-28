import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { ActionButtons, FeedbackBanner, FormActions, FormField, ModalDialog, PagedTable, StatusBadge, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, usePagedResource, useRemove } from '../../hooks';
import { useApp } from '../../context/AppContext';
import { inventarioApi } from '../../services';
import type { DepositoResponseDTO } from '../../types/api';

export const DepositosPanel: React.FC = () => {
  const { isAdmin } = useApp();
  const depositos = usePagedResource(inventarioApi.depositos.list);
  const baja = useRemove(depositos.reload);
  const [formOpen, setFormOpen] = useState(false);
  const [enEdicion, setEnEdicion] = useState<DepositoResponseDTO | null>(null);

  const abrir = (deposito: DepositoResponseDTO | null) => {
    setEnEdicion(deposito);
    setFormOpen(true);
  };

  const columns: Column<DepositoResponseDTO>[] = [
    { header: 'Depósito', cell: (d) => d.nombre, className: 'font-bold text-slate-900' },
    { header: 'Ubicación', cell: (d) => d.ubicacion ?? '—', className: 'text-slate-600' },
    { header: 'Estado', cell: (d) => <StatusBadge status={d.estado ? 'Activo' : 'Inactivo'} /> },
    ...(isAdmin
      ? [
        {
          header: 'Acciones',
          align: 'center' as const,
          cell: (d: DepositoResponseDTO) => (
            <ActionButtons
              onEdit={() => abrir(d)}
              onDelete={() =>
                baja.remove(
                  { title: 'Dar de baja depósito', message: `¿Dar de baja "${d.nombre}"? Debe quedar sin stock para poder darlo de baja.` },
                  () => inventarioApi.depositos.remove(d.id)
                )
              }
            />
          ),
        },
      ]
      : []),
  ];

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-3">{baja.error}</FeedbackBanner>}
      <PagedTable
        resource={depositos}
        columns={columns}
        rowKey={(d) => d.id}
        label="depósitos"
        searchPlaceholder="Buscar por nombre o ubicación..."
        filters={
          isAdmin && (
            <Button variant="emerald" onClick={() => abrir(null)}>
              <Plus />
              <span>Nuevo depósito</span>
            </Button>
          )
        }
      />
      <ModalDialog isOpen={formOpen} onClose={() => setFormOpen(false)} title={enEdicion ? `Modificar "${enEdicion.nombre}"` : 'Nuevo depósito'} maxWidth="md">
        <DepositoForm
          deposito={enEdicion}
          onClose={() => setFormOpen(false)}
          onCreated={depositos.reload}
          onUpdated={(d) => depositos.replaceItem((row) => row.id === d.id, d)}
        />
      </ModalDialog>
    </>
  );
};

/** Alta o modificación: al modificar, los datos salen de la fila (no se vuelve a pedir el depósito). */
const DepositoForm: React.FC<{
  deposito: DepositoResponseDTO | null;
  onClose: () => void;
  onCreated: () => void;
  onUpdated: (deposito: DepositoResponseDTO) => void;
}> = ({ deposito, onClose, onCreated, onUpdated }) => {
  const guardar = useAsyncAction();
  const [nombre, setNombre] = useState(deposito?.nombre ?? '');
  const [ubicacion, setUbicacion] = useState(deposito?.ubicacion ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const request = { nombre: nombre.trim(), ubicacion: ubicacion.trim() || undefined, estado: deposito?.estado ?? true };
    let guardado: DepositoResponseDTO | null = null;
    const ok = await guardar.run(async () => {
      guardado = deposito ? await inventarioApi.depositos.update(deposito.id, request) : await inventarioApi.depositos.create(request);
    });
    if (!ok || !guardado) return;
    if (deposito) onUpdated(guardado);
    else onCreated();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Nombre" required>
        <input className={fieldClass} required maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
      </FormField>
      <FormField label="Ubicación">
        <input className={fieldClass} maxLength={150} value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
      </FormField>
      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}
      <FormActions onCancel={onClose} submitLabel="Guardar" loading={guardar.loading} icon={<Save className="w-3.5 h-3.5" />} />
    </form>
  );
};
