import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { FeedbackBanner, ModalDialog, PagedTable, StatusBadge, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, usePagedResource } from '../../hooks';
import { ventasApi } from '../../services';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { ContactoMensajeResponseDTO } from '../../types/api';

type Filtro = { atendido?: boolean };

/**
 * Bandeja de soporte: los mensajes que llegan del formulario de contacto (también desde el login).
 * Un job de ventas los reenvía al correo de soporte; acá se ve si el correo salió y se marcan como atendidos.
 */
export const SoportePanel: React.FC = () => {
  const [verAtendidos, setVerAtendidos] = useState<'' | 'no' | 'si'>('no');
  const mensajes = usePagedResource<ContactoMensajeResponseDTO, Filtro>(ventasApi.soporte.mensajes, {
    filters: verAtendidos === '' ? undefined : { atendido: verAtendidos === 'si' },
  });
  const [abierto, setAbierto] = useState<ContactoMensajeResponseDTO | null>(null);
  const atender = useAsyncAction();

  const marcarAtendido = async (m: ContactoMensajeResponseDTO) => {
    let actualizado: ContactoMensajeResponseDTO | null = null;
    if (await atender.run(async () => (actualizado = await ventasApi.soporte.marcarAtendido(m.id))) && actualizado) {
      mensajes.replaceItem((row) => row.id === m.id, actualizado);
      setAbierto(null);
    }
  };

  const columns: Column<ContactoMensajeResponseDTO>[] = [
    { header: 'Fecha', cell: (m) => formatDate(m.fechaEnvio), className: 'text-slate-500 text-xs' },
    { header: 'De', cell: (m) => `${m.nombre} <${m.correo}>`, className: 'font-semibold text-slate-900' },
    { header: 'Asunto', cell: (m) => m.asunto },
    {
      header: 'Correo a soporte',
      cell: (m) => (m.correoEnviado ? <StatusBadge status="Enviado" /> : m.errorCorreo ? <span className="text-rose-600 text-xs">Error, reintentando</span> : <span className="text-slate-400 text-xs">En cola</span>),
    },
    { header: 'Estado', cell: (m) => <StatusBadge status={m.atendido ? 'Atendido' : 'Pendiente'} /> },
  ];

  return (
    <>
      <PagedTable
        resource={mensajes}
        columns={columns}
        rowKey={(m) => m.id}
        label="mensajes"
        onRowClick={setAbierto}
        filters={
          <select className={cn(fieldClass, 'w-auto bg-white h-9')} value={verAtendidos} onChange={(e) => setVerAtendidos(e.target.value as '' | 'no' | 'si')}>
            <option value="no">Pendientes</option>
            <option value="si">Atendidos</option>
            <option value="">Todos</option>
          </select>
        }
      />
      <ModalDialog isOpen={abierto !== null} onClose={() => setAbierto(null)} title={abierto?.asunto ?? ''} subtitle={abierto ? `${abierto.nombre} <${abierto.correo}> · ${formatDate(abierto.fechaEnvio)}` : undefined} maxWidth="lg">
        {abierto && (
          <div className="space-y-3 text-xs">
            <p className="whitespace-pre-line text-slate-700 border border-slate-200 rounded-xl p-3">{abierto.mensaje}</p>
            {abierto.errorCorreo && <FeedbackBanner>Último error al reenviarlo por correo: {abierto.errorCorreo}</FeedbackBanner>}
            {atender.error && <FeedbackBanner>{atender.error}</FeedbackBanner>}
            <div className="flex justify-end gap-2">
              <a className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" href={`mailto:${abierto.correo}?subject=${encodeURIComponent('Re: ' + abierto.asunto)}`}>
                Responder por correo
              </a>
              {!abierto.atendido && (
                <Button size="sm" onClick={() => marcarAtendido(abierto)} disabled={atender.loading}>
                  <CheckCircle2 />
                  <span>Marcar atendido</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </ModalDialog>
    </>
  );
};
