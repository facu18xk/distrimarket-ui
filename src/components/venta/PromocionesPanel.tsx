import React, { useCallback, useState } from 'react';
import { Megaphone, Plus, Save, Send, Users, X } from 'lucide-react';
import { ActionButtons, FeedbackBanner, FormActions, FormField, ModalDialog, PagedTable, ProductoPicker, StatusBadge, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, useConfirm, usePagedResource, usePorId, useRemove } from '../../hooks';
import { useApp } from '../../context/AppContext';
import { inventarioApi, ventasApi } from '../../services';
import { formatDate } from '../../lib/format';
import type { ProductoResponseDTO, PromocionRequestDTO, PromocionResponseDTO } from '../../types/api';

const estado = (p: PromocionResponseDTO) => (p.enviado ? 'Enviada' : p.fechaEnvio ? 'Programada' : 'Pendiente');
const vigencia = (p: PromocionResponseDTO) =>
  p.fechaInicio || p.fechaFin ? `${p.fechaInicio ? formatDate(p.fechaInicio) : '…'} al ${p.fechaFin ? formatDate(p.fechaFin) : '…'}` : '—';

/**
 * Promociones por producto. Un job de ventas las envía por correo a los clientes que compraron esos
 * productos; acá se crean, se ve a cuántos clientes llegarían y se programa el envío. El vendedor
 * las consulta; crearlas, modificarlas y enviarlas es de ADMIN.
 */
export const PromocionesPanel: React.FC = () => {
  const { isAdmin } = useApp();
  const promociones = usePagedResource(ventasApi.promociones.list, { sort: 'id,desc' });
  const baja = useRemove(promociones.reload);
  const [formOpen, setFormOpen] = useState(false);
  const [enEdicion, setEnEdicion] = useState<PromocionResponseDTO | null>(null);
  const [detalle, setDetalle] = useState<PromocionResponseDTO | null>(null);

  const abrir = (p: PromocionResponseDTO | null) => {
    setEnEdicion(p);
    setFormOpen(true);
  };

  const columns: Column<PromocionResponseDTO>[] = [
    { header: 'Promoción', cell: (p) => p.titulo, className: 'font-bold text-slate-900' },
    { header: 'Descuento', align: 'center', cell: (p) => (p.porcentajeDescuento != null ? `${Number(p.porcentajeDescuento)}%` : '—') },
    { header: 'Vigencia', cell: vigencia, className: 'text-slate-600' },
    { header: 'Productos', align: 'center', cell: (p) => p.idsProducto.length },
    { header: 'Correos', align: 'center', cell: (p) => p.correosEnviados ?? 0, className: 'text-slate-600' },
    { header: 'Estado', cell: (p) => <StatusBadge status={estado(p)} /> },
    {
      header: 'Acciones',
      align: 'center',
      cell: (p) => (
        <ActionButtons
          onView={() => setDetalle(p)}
          onEdit={isAdmin && !p.enviado ? () => abrir(p) : undefined}
          onDelete={
            isAdmin
              ? () => baja.remove({ title: 'Dar de baja promoción', message: `¿Dar de baja "${p.titulo}"? No se enviará.` }, () => ventasApi.promociones.remove(p.id))
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
        resource={promociones}
        columns={columns}
        rowKey={(p) => p.id}
        label="promociones"
        searchPlaceholder="Buscar por título..."
        onRowClick={setDetalle}
        filters={
          isAdmin && (
            <Button variant="emerald" onClick={() => abrir(null)}>
              <Plus />
              <span>Nueva promoción</span>
            </Button>
          )
        }
      />

      <ModalDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={enEdicion ? `Modificar "${enEdicion.titulo}"` : 'Nueva promoción'}
        subtitle="Se envía por correo a los clientes que compraron alguno de los productos."
        maxWidth="3xl"
      >
        <PromocionForm
          promocion={enEdicion}
          onClose={() => setFormOpen(false)}
          onSaved={(p) => (enEdicion ? promociones.replaceItem((row) => row.id === p.id, p) : promociones.reload())}
        />
      </ModalDialog>

      {detalle && (
        <DetallePromocion
          promocion={detalle}
          puedeEnviar={isAdmin}
          onClose={() => setDetalle(null)}
          onEnviada={(p) => {
            promociones.replaceItem((row) => row.id === p.id, p);
            setDetalle(p);
          }}
        />
      )}
    </>
  );
};

/** Detalle con la vista previa de destinatarios (se pide al abrirlo) y el botón para enviar. */
const DetallePromocion: React.FC<{
  promocion: PromocionResponseDTO;
  puedeEnviar: boolean;
  onClose: () => void;
  onEnviada: (p: PromocionResponseDTO) => void;
}> = ({ promocion, puedeEnviar, onClose, onEnviada }) => {
  const cargar = useCallback(() => ventasApi.promociones.destinatarios(promocion.id), [promocion.id]);
  const destinatarios = useAsyncData(cargar);
  const productos = usePorId(inventarioApi.productos.ref, promocion.idsProducto);
  const enviar = useAsyncAction();
  const confirm = useConfirm();

  const enviarAhora = async () => {
    const ok = await confirm({
      title: 'Enviar promoción',
      message: `¿Enviar "${promocion.titulo}" a ${destinatarios.data?.clientes ?? 'los'} cliente(s)? El envío lo hace un proceso automático en los próximos minutos.`,
      confirmLabel: 'Enviar',
    });
    if (!ok) return;
    let actualizada: PromocionResponseDTO | null = null;
    if (await enviar.run(async () => (actualizada = await ventasApi.promociones.enviarAhora(promocion.id))) && actualizada) onEnviada(actualizada);
  };

  return (
    <ModalDialog isOpen onClose={onClose} title={promocion.titulo} subtitle={`Estado: ${estado(promocion)}`} maxWidth="2xl">
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          {(
            [
              ['Descuento', promocion.porcentajeDescuento != null ? `${Number(promocion.porcentajeDescuento)}%` : '—'],
              ['Vigencia', vigencia(promocion)],
              ['Compras de los últimos', `${promocion.diasHistorial} días`],
              ['Correos enviados', String(promocion.correosEnviados ?? 0)],
            ] as const
          ).map(([etiqueta, valor]) => (
            <div key={etiqueta} className="min-w-0">
              <span className="block text-slate-400">{etiqueta}</span>
              <strong className="block text-slate-800 truncate">{valor}</strong>
            </div>
          ))}
        </div>
        <p className="whitespace-pre-line text-slate-700 border border-slate-200 rounded-xl p-3">{promocion.mensaje}</p>
        <div>
          <span className="block text-slate-400 mb-1">Productos</span>
          <div className="flex flex-wrap gap-1.5">
            {promocion.idsProducto.map((id) => (
              <span key={id} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                {productos.get(id)?.nombre ?? '…'}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Users className="w-3.5 h-3.5" />
            {destinatarios.loading ? 'Calculando destinatarios...' : `${destinatarios.data?.clientes ?? 0} cliente(s) con correo compraron estos productos`}
          </span>
          {puedeEnviar && !promocion.enviado && (
            <Button size="sm" onClick={enviarAhora} disabled={enviar.loading}>
              <Send />
              <span>Enviar ahora</span>
            </Button>
          )}
        </div>
        {enviar.error && <FeedbackBanner>{enviar.error}</FeedbackBanner>}
      </div>
    </ModalDialog>
  );
};

/** Fecha y hora local para un input datetime-local ("2026-10-27T15:30"). */
const aInputFechaHora = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

const PromocionForm: React.FC<{ promocion: PromocionResponseDTO | null; onClose: () => void; onSaved: (p: PromocionResponseDTO) => void }> = ({
  promocion,
  onClose,
  onSaved,
}) => {
  const guardar = useAsyncAction();
  const [titulo, setTitulo] = useState(promocion?.titulo ?? '');
  const [mensaje, setMensaje] = useState(promocion?.mensaje ?? '');
  const [descuento, setDescuento] = useState(promocion?.porcentajeDescuento != null ? String(promocion.porcentajeDescuento) : '');
  const [fechaInicio, setFechaInicio] = useState(promocion?.fechaInicio ?? '');
  const [fechaFin, setFechaFin] = useState(promocion?.fechaFin ?? '');
  const [dias, setDias] = useState(String(promocion?.diasHistorial ?? 180));
  const [fechaEnvio, setFechaEnvio] = useState(aInputFechaHora(promocion?.fechaEnvio));
  const [ids, setIds] = useState<number[]>(promocion?.idsProducto ?? []);
  // Nombres de los productos ya elegidos (al modificar se piden por id; los nuevos vienen del selector).
  const conocidos = usePorId(inventarioApi.productos.ref, ids);
  const [agregados, setAgregados] = useState<Record<number, string>>({});
  const [selector, setSelector] = useState<ProductoResponseDTO | null>(null);

  const agregar = (p: ProductoResponseDTO | null) => {
    setSelector(null);
    if (!p || ids.includes(p.id)) return;
    setIds((actuales) => [...actuales, p.id]);
    setAgregados((actuales) => ({ ...actuales, [p.id]: p.nombre }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ids.length === 0) return;
    const request: PromocionRequestDTO = {
      titulo: titulo.trim(),
      mensaje: mensaje.trim(),
      porcentajeDescuento: descuento === '' ? undefined : Number(descuento),
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
      diasHistorial: Number(dias),
      fechaEnvio: fechaEnvio ? new Date(fechaEnvio).toISOString() : undefined,
      idsProducto: ids,
    };
    let guardada: PromocionResponseDTO | null = null;
    const ok = await guardar.run(async () => {
      guardada = promocion ? await ventasApi.promociones.update(promocion.id, request) : await ventasApi.promociones.create(request);
    });
    if (ok && guardada) {
      onSaved(guardada);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-3 min-w-0">
          <FormField label="Título (asunto del correo)" required>
            <input className={fieldClass} required minLength={3} maxLength={120} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />
          </FormField>
          <FormField label="Mensaje" required hint="Cada cliente lo recibe con su nombre al inicio.">
            <textarea className={`${fieldClass} min-h-28`} required minLength={5} maxLength={4000} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Descuento %">
              <input className={fieldClass} type="number" min={0} max={100} step="0.5" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
            </FormField>
            <FormField label="Desde">
              <input className={fieldClass} type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </FormField>
            <FormField label="Hasta">
              <input className={fieldClass} type="date" min={fechaInicio || undefined} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="space-y-3 min-w-0">
          <FormField label="Productos en promoción" required>
            <ProductoPicker value={selector} onChange={agregar} placeholder="Agregar producto..." />
          </FormField>
          <div className="flex flex-wrap gap-1.5 min-h-8">
            {ids.length === 0 && <span className="text-xs text-slate-400">Agregue al menos un producto.</span>}
            {ids.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-xs text-slate-700">
                {agregados[id] ?? conocidos.get(id)?.nombre ?? '…'}
                <button type="button" onClick={() => setIds((actuales) => actuales.filter((x) => x !== id))} className="text-slate-400 hover:text-rose-600" title="Quitar">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Compras de los últimos (días)" required>
              <input className={fieldClass} type="number" min={1} max={730} required value={dias} onChange={(e) => setDias(e.target.value)} />
            </FormField>
            <FormField label="Enviar el" hint="Vacío: queda pendiente.">
              <input className={fieldClass} type="datetime-local" value={fechaEnvio} onChange={(e) => setFechaEnvio(e.target.value)} />
            </FormField>
          </div>
        </div>
      </div>

      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}
      <FormActions
        onCancel={onClose}
        submitLabel={promocion ? 'Guardar cambios' : 'Crear promoción'}
        loading={guardar.loading}
        disabled={ids.length === 0}
        icon={promocion ? <Save className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
      />
    </form>
  );
};
