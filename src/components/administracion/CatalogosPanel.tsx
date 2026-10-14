import { normalizeCodigo3, normalizeTimbrado, padCodigo3 } from '../../lib/paraguay';
import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { ActionButtons, FeedbackBanner, FormActions, FormField, ModalDialog, PagedTable, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, usePagedResource, useRemove } from '../../hooks';
import { ventasApi } from '../../services';
import { formatDate, todayIso } from '../../lib/format';
import type { MedioPagoDTO, TimbradoCreateDTO, TimbradoDTO } from '../../types/api';

// ---------------------------------------------------------- Medios de pago

export const MediosPagoPanel: React.FC = () => {
  const medios = usePagedResource<MedioPagoDTO>(ventasApi.mediosPago.list);
  const baja = useRemove(medios.reload);
  const accion = useAsyncAction();
  const [formOpen, setFormOpen] = useState(false);
  const [enEdicion, setEnEdicion] = useState<MedioPagoDTO | null>(null);
  const [nombre, setNombre] = useState('');

  const abrir = (medio: MedioPagoDTO | null) => {
    accion.clearError();
    setEnEdicion(medio);
    setNombre(medio?.nombre ?? '');
    setFormOpen(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const request = { nombre: nombre.trim() };
    const ok = await accion.run(() =>
      enEdicion ? ventasApi.mediosPago.update(enEdicion.idMedioPago, request) : ventasApi.mediosPago.create(request)
    );
    if (ok) {
      setFormOpen(false);
      medios.reload();
    }
  };

  const darDeBaja = (medio: MedioPagoDTO) =>
    baja.remove({ title: 'Dar de baja medio de pago', message: `¿Dar de baja el medio de pago "${medio.nombre}"?` }, () =>
      ventasApi.mediosPago.remove(medio.idMedioPago)
    );

  const columns: Column<MedioPagoDTO>[] = [
    { header: 'ID', cell: (m) => m.idMedioPago, className: 'text-slate-500 w-20' },
    { header: 'Nombre', cell: (m) => m.nombre, className: 'font-bold text-slate-900' },
    { header: 'Acciones', align: 'center', cell: (m) => <ActionButtons onEdit={() => abrir(m)} onDelete={() => darDeBaja(m)} /> },
  ];

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-4">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={medios}
        columns={columns}
        rowKey={(m) => m.idMedioPago}
        label="medios de pago"
        searchPlaceholder="Buscar medio de pago..."
        filters={
          <Button variant="emerald" onClick={() => abrir(null)}>
            <Plus />
            <span>Nuevo medio de pago</span>
          </Button>
        }
      />

      <ModalDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={enEdicion ? 'Modificar medio de pago' : 'Nuevo medio de pago'}
        maxWidth="sm"
      >
        <form onSubmit={guardar} className="space-y-4">
          <FormField label="Nombre" required>
            <input className={fieldClass} required maxLength={50} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Transferencia" autoFocus />
          </FormField>
          {accion.error && <FeedbackBanner>{accion.error}</FeedbackBanner>}
          <FormActions onCancel={() => setFormOpen(false)} submitLabel="Guardar" loading={accion.loading} icon={<Save className="w-3.5 h-3.5" />} />
        </form>
      </ModalDialog>
    </>
  );
};

// ---------------------------------------------------------------- Timbrados

const TIMBRADO_VACIO: TimbradoCreateDTO = {
  numeroTimbrado: '',
  fechaInicio: todayIso(),
  fechaVencimiento: todayIso(),
  sucursal: '001',
  puntoExpedicion: '001',
};

export const TimbradosPanel: React.FC = () => {
  const timbrados = usePagedResource<TimbradoDTO>(ventasApi.timbrados.list);
  const baja = useRemove(timbrados.reload);
  const accion = useAsyncAction();
  const [formOpen, setFormOpen] = useState(false);
  const [enEdicion, setEnEdicion] = useState<TimbradoDTO | null>(null);
  const [form, setForm] = useState<TimbradoCreateDTO>(TIMBRADO_VACIO);

  const abrir = (timbrado: TimbradoDTO | null) => {
    accion.clearError();
    setEnEdicion(timbrado);
    setForm(
      timbrado
        ? {
            numeroTimbrado: timbrado.numeroTimbrado,
            fechaInicio: timbrado.fechaInicio,
            fechaVencimiento: timbrado.fechaVencimiento,
            sucursal: timbrado.sucursal ?? '001',
            puntoExpedicion: timbrado.puntoExpedicion ?? '001',
          }
        : { ...TIMBRADO_VACIO, fechaInicio: todayIso(), fechaVencimiento: todayIso() }
    );
    setFormOpen(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sucursal y punto de expedición siempre con 3 dígitos, aunque se guarde con Enter sin salir del campo.
    const request = { ...form, sucursal: padCodigo3(form.sucursal ?? ''), puntoExpedicion: padCodigo3(form.puntoExpedicion ?? '') };
    const ok = await accion.run(() =>
      enEdicion ? ventasApi.timbrados.update(enEdicion.idTimbrado, request) : ventasApi.timbrados.create(request)
    );
    if (ok) {
      setFormOpen(false);
      timbrados.reload();
    }
  };

  const darDeBaja = (timbrado: TimbradoDTO) =>
    baja.remove({ title: 'Dar de baja timbrado', message: `¿Dar de baja el timbrado ${timbrado.numeroTimbrado}?` }, () =>
      ventasApi.timbrados.remove(timbrado.idTimbrado)
    );

  const columns: Column<TimbradoDTO>[] = [
    { header: 'Número', cell: (t) => t.numeroTimbrado, className: 'font-bold text-slate-900' },
    { header: 'Sucursal', cell: (t) => t.sucursal ?? '—', className: 'text-slate-600' },
    { header: 'Punto de expedición', cell: (t) => t.puntoExpedicion ?? '—', className: 'text-slate-600' },
    { header: 'Vigente desde', cell: (t) => formatDate(t.fechaInicio), className: 'text-slate-600' },
    { header: 'Vence', cell: (t) => formatDate(t.fechaVencimiento), className: 'text-slate-600' },
    { header: 'Acciones', align: 'center', cell: (t) => <ActionButtons onEdit={() => abrir(t)} onDelete={() => darDeBaja(t)} /> },
  ];

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-4">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={timbrados}
        columns={columns}
        rowKey={(t) => t.idTimbrado}
        label="timbrados"
        searchPlaceholder="Buscar por número, sucursal o fecha..."
        filters={
          <Button variant="emerald" onClick={() => abrir(null)}>
            <Plus />
            <span>Nuevo timbrado</span>
          </Button>
        }
      />

      <ModalDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={enEdicion ? 'Modificar timbrado' : 'Nuevo timbrado'}
        subtitle="Las facturas solo pueden emitirse dentro de la vigencia del timbrado."
        maxWidth="md"
      >
        <form onSubmit={guardar} className="space-y-4">
          <FormField label="Número de timbrado" required>
            <input className={fieldClass} required inputMode="numeric" pattern="d{8}" title="El timbrado tiene 8 dígitos" placeholder="12345678" value={form.numeroTimbrado} onChange={(e) => setForm({ ...form, numeroTimbrado: normalizeTimbrado(e.target.value) })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Sucursal" required>
              <input className={fieldClass} required inputMode="numeric" placeholder="001" value={form.sucursal} onChange={(e) => setForm({ ...form, sucursal: normalizeCodigo3(e.target.value) })} onBlur={() => setForm({ ...form, sucursal: padCodigo3(form.sucursal ?? '') })} />
            </FormField>
            <FormField label="Punto de expedición" required>
              <input className={fieldClass} required inputMode="numeric" placeholder="001" value={form.puntoExpedicion} onChange={(e) => setForm({ ...form, puntoExpedicion: normalizeCodigo3(e.target.value) })} onBlur={() => setForm({ ...form, puntoExpedicion: padCodigo3(form.puntoExpedicion ?? '') })} />
            </FormField>
            <FormField label="Vigente desde" required>
              <input className={fieldClass} type="date" required value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
            </FormField>
            <FormField label="Vence" required>
              <input className={fieldClass} type="date" required min={form.fechaInicio} value={form.fechaVencimiento} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} />
            </FormField>
          </div>
          {accion.error && <FeedbackBanner>{accion.error}</FeedbackBanner>}
          <FormActions onCancel={() => setFormOpen(false)} submitLabel="Guardar" loading={accion.loading} icon={<Save className="w-3.5 h-3.5" />} />
        </form>
      </ModalDialog>
    </>
  );
};
