import React, { useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import {
  ActionButtons,
  FeedbackBanner,
  FormActions,
  FormField,
  ModalDialog,
  PagedTable,
  PersonaFields,
  StatusBadge,
  fieldClass,
  type Column,
} from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, usePagedResource, useRemove } from '../../hooks';
import { comprasApi } from '../../services';
import { formatDocumento, formatPhone } from '../../lib/paraguay';
import { PERSONA_VACIA, hasPersonaErrors, personaARequest, personaDesdeDto, personaErrors, type PersonaForm } from '../../lib/persona';
import type { ProveedorResponseDTO } from '../../types/api';

export const ProveedoresPanel: React.FC = () => {
  const proveedores = usePagedResource(comprasApi.proveedores.list);
  const baja = useRemove(proveedores.reload);
  const [formOpen, setFormOpen] = useState(false);
  const [enEdicion, setEnEdicion] = useState<ProveedorResponseDTO | null>(null);

  const abrir = (proveedor: ProveedorResponseDTO | null) => {
    setEnEdicion(proveedor);
    setFormOpen(true);
  };

  const columns: Column<ProveedorResponseDTO>[] = [
    { header: 'Proveedor', cell: (p) => p.nombreFantasia || p.persona.nombreCompleto, className: 'font-bold text-slate-900' },
    { header: 'Razón social', cell: (p) => p.persona.nombreCompleto, className: 'text-slate-600' },
    { header: 'CI / RUC', cell: (p) => formatDocumento(p.persona.ci, p.persona.ruc), className: 'text-slate-600' },
    { header: 'Teléfono', cell: (p) => formatPhone(p.persona.telefono) || '—', className: 'text-slate-600' },
    { header: 'Correo', cell: (p) => p.persona.correo ?? '—', className: 'text-slate-500 text-xs' },
    { header: 'Estado', cell: (p) => <StatusBadge status={p.estado ? 'Activo' : 'Inactivo'} /> },
    {
      header: 'Acciones',
      align: 'center',
      cell: (p) => (
        <ActionButtons
          onEdit={() => abrir(p)}
          onDelete={() =>
            baja.remove(
              { title: 'Dar de baja proveedor', message: `¿Dar de baja a ${p.nombreFantasia || p.persona.nombreCompleto}? Sus facturas se conservan.` },
              () => comprasApi.proveedores.remove(p.idProveedor)
            )
          }
        />
      ),
    },
  ];

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-3">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={proveedores}
        columns={columns}
        rowKey={(p) => p.idProveedor}
        label="proveedores"
        filters={
          <Button variant="emerald" onClick={() => abrir(null)}>
            <Plus />
            <span>Nuevo proveedor</span>
          </Button>
        }
      />

      <ProveedorFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSaved={proveedores.reload} proveedor={enEdicion} />
    </>
  );
};

interface ProveedorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (proveedor: ProveedorResponseDTO) => void;
  proveedor?: ProveedorResponseDTO | null;
}

export const ProveedorFormModal: React.FC<ProveedorFormModalProps> = ({ isOpen, onClose, onSaved, proveedor }) => (
  <ModalDialog
    isOpen={isOpen}
    onClose={onClose}
    title={proveedor ? 'Modificar proveedor' : 'Registrar proveedor'}
    subtitle="Una persona física necesita cédula; una jurídica, RUC."
    maxWidth="md"
  >
    <ProveedorForm onClose={onClose} onSaved={onSaved} proveedor={proveedor} />
  </ModalDialog>
);

/** Un proveedor suele ser una empresa: por defecto, persona jurídica. */
const PROVEEDOR_NUEVO: PersonaForm = { ...PERSONA_VACIA, tipoPersona: 'JURIDICA' };

const ProveedorForm: React.FC<Omit<ProveedorFormModalProps, 'isOpen'>> = ({ onClose, onSaved, proveedor }) => {
  const guardar = useAsyncAction();
  const [nombreFantasia, setNombreFantasia] = useState(proveedor?.nombreFantasia ?? '');
  const [persona, setPersona] = useState<PersonaForm>(() => (proveedor ? personaDesdeDto(proveedor.persona) : PROVEEDOR_NUEVO));
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const errores = personaErrors(persona, proveedor ? (proveedor.persona.ruc ?? '') : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentoEnviar(true);
    if (hasPersonaErrors(errores)) return;

    const request = { nombreFantasia: nombreFantasia.trim() || undefined, persona: personaARequest(persona) };
    let guardado: ProveedorResponseDTO | undefined;
    const ok = await guardar.run(async () => {
      guardado = proveedor
        ? await comprasApi.proveedores.update(proveedor.idProveedor, request)
        : await comprasApi.proveedores.create(request);
    });
    if (ok && guardado) {
      onSaved(guardado);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre de fantasía" hint="Como se lo conoce comercialmente. Opcional.">
        <input className={fieldClass} maxLength={150} value={nombreFantasia} onChange={(e) => setNombreFantasia(e.target.value)} />
      </FormField>

      <PersonaFields value={persona} onChange={setPersona} errors={errores} showAllErrors={intentoEnviar} />

      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions
        onCancel={onClose}
        submitLabel={proveedor ? 'Guardar cambios' : 'Registrar proveedor'}
        loading={guardar.loading}
        icon={<Truck className="w-3.5 h-3.5" />}
      />
    </form>
  );
};
