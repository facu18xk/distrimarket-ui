import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { ActionButtons, DepositoBuscador, FeedbackBanner, FormActions, FormField, ModalDialog, PagedTable, StatusBadge, fieldClass, type Column } from '../common';
import { useAsyncAction, useAsyncData, usePagedResource } from '../../hooks';
import { depositosActivos, inventarioApi } from '../../services';
import { formatDate } from '../../lib/format';
import { formatDocumento } from '../../lib/paraguay';
import type { DepositoResponseDTO, EmpleadoRequestDTO, EmpleadoResponseDTO } from '../../types/api';

/**
 * Empleados (inventario): el administrador asigna a cada uno el depósito donde trabaja. Ese depósito
 * viaja en el token: vendedor, comprador y depositero operan siempre sobre él, sin elegirlo.
 */
export const EmpleadosPanel: React.FC = () => {
  const empleados = usePagedResource(inventarioApi.empleados.list);
  const [enEdicion, setEnEdicion] = useState<EmpleadoResponseDTO | null>(null);

  const columns: Column<EmpleadoResponseDTO>[] = [
    { header: 'Empleado', cell: (e) => e.persona.nombreCompleto, className: 'font-bold text-slate-900' },
    { header: 'CI', cell: (e) => formatDocumento(e.persona.ci, e.persona.ruc), className: 'text-slate-600' },
    { header: 'Cargo', cell: (e) => e.cargo, className: 'text-slate-600' },
    { header: 'Depósito', cell: (e) => e.nombreDeposito ?? <span className="text-slate-400">Sin asignar (elige en cada operación)</span> },
    { header: 'Ingreso', cell: (e) => formatDate(e.fechaIngreso), className: 'text-slate-500 text-xs' },
    { header: 'Estado', cell: (e) => <StatusBadge status={e.estado ? 'Activo' : 'Inactivo'} /> },
    { header: 'Acciones', align: 'center', cell: (e) => <ActionButtons onEdit={() => setEnEdicion(e)} /> },
  ];

  return (
    <>
      <PagedTable
        resource={empleados}
        columns={columns}
        rowKey={(e) => e.id}
        label="empleados"
        searchPlaceholder="Buscar por nombre, CI o cargo..."
        onRowClick={setEnEdicion}
      />
      <ModalDialog
        isOpen={enEdicion !== null}
        onClose={() => setEnEdicion(null)}
        title={enEdicion ? enEdicion.persona.nombreCompleto : ''}
        subtitle="El depósito asignado se aplica al próximo inicio de sesión del empleado."
        maxWidth="md"
      >
        {enEdicion && (
          <EmpleadoForm
            empleado={enEdicion}
            onClose={() => setEnEdicion(null)}
            // La fila se reemplaza con la respuesta del PUT (no se vuelve a pedir la página).
            onSaved={(e) => empleados.replaceItem((row) => row.id === e.id, e)}
          />
        )}
      </ModalDialog>
    </>
  );
};

/** Cargo, depósito y estado. El resto de los datos sale de la fila: el PUT exige el empleado completo. */
const EmpleadoForm: React.FC<{ empleado: EmpleadoResponseDTO; onClose: () => void; onSaved: (e: EmpleadoResponseDTO) => void }> = ({
  empleado,
  onClose,
  onSaved,
}) => {
  const depositos = useAsyncData(depositosActivos);
  const guardar = useAsyncAction();
  const [cargo, setCargo] = useState(empleado.cargo);
  const [estado, setEstado] = useState(empleado.estado);
  const [deposito, setDeposito] = useState<DepositoResponseDTO | null>(
    empleado.idDeposito ? { id: empleado.idDeposito, nombre: empleado.nombreDeposito ?? `Depósito #${empleado.idDeposito}`, estado: true } : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { persona } = empleado;
    const request: EmpleadoRequestDTO = {
      cargo: cargo.trim(),
      fechaIngreso: empleado.fechaIngreso,
      estado,
      idDeposito: deposito?.id,
      persona: {
        tipoPersona: persona.tipoPersona,
        nombreCompleto: persona.nombreCompleto,
        ci: persona.ci ?? undefined,
        ruc: persona.ruc ?? undefined,
        telefono: persona.telefono ?? undefined,
        correo: persona.correo ?? undefined,
        direccion: persona.direccion ?? undefined,
      },
    };
    let guardado: EmpleadoResponseDTO | null = null;
    const ok = await guardar.run(async () => {
      guardado = await inventarioApi.empleados.update(empleado.id, request);
    });
    if (ok && guardado) {
      onSaved(guardado);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Cargo" required>
        <input className={fieldClass} required maxLength={60} value={cargo} onChange={(e) => setCargo(e.target.value)} />
      </FormField>
      <FormField label="Depósito asignado" hint="Vacío: el empleado elige el depósito en cada operación.">
        {depositos.error ? (
          <FeedbackBanner>{depositos.error}</FeedbackBanner>
        ) : (
          <DepositoBuscador depositos={depositos.data ?? []} value={deposito} onChange={setDeposito} />
        )}
      </FormField>
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input type="checkbox" checked={estado} onChange={(e) => setEstado(e.target.checked)} />
        Empleado activo
      </label>
      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}
      <FormActions onCancel={onClose} submitLabel="Guardar" loading={guardar.loading} icon={<Save className="w-3.5 h-3.5" />} />
    </form>
  );
};
