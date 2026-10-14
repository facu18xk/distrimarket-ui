import React, { useState } from 'react';
import { Ban, Plus, Receipt, UserPlus } from 'lucide-react';
import {
  ActionButtons,
  FeedbackBanner,
  FormActions,
  FormField,
  LineItemsEditor,
  ModalDialog,
  PagedTable,
  StatusBadge,
  fieldClass,
  type Column,
} from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, useConfirm, useLocalPagedResource, useRemove } from '../../hooks';
import { comprasApi } from '../../services';
import { formatDate, formatMoney, todayIso } from '../../lib/format';
import { newLineItem, type LineItem } from '../../lib/lineItems';
import { NUMERO_FACTURA_PATTERN, formatNumeroFactura, maskNumeroFactura, normalizeTimbrado, padNumeroFactura } from '../../lib/paraguay';
import { preferredId, rememberId } from '../../lib/preferences';
import type { CondicionCompra, FacturaCompraResponseDTO, ProveedorResponseDTO } from '../../types/api';
import { cargarCatalogosCompra, cargarFacturasCompra } from './catalogos';
import { ProveedorFormModal } from './ProveedoresPanel';

const nombreProveedor = (p?: ProveedorResponseDTO) => p?.nombreFantasia || p?.persona.nombreCompleto || '—';
const anulada = (f: FacturaCompraResponseDTO) => f.estado?.toUpperCase().startsWith('ANULAD');

const textoDeBusqueda = (f: FacturaCompraResponseDTO) =>
  `${f.numeroFactura ?? ''} ${formatNumeroFactura(f.numeroFactura)} ${nombreProveedor(f.proveedor)} ${f.timbrado} ${f.estado} ${f.condicionCompra}`;

export const FacturasCompraPanel: React.FC = () => {
  const facturas = useLocalPagedResource(cargarFacturasCompra, textoDeBusqueda);
  const baja = useRemove(facturas.reload);
  const anular = useAsyncAction();
  const confirm = useConfirm();
  const [formOpen, setFormOpen] = useState(false);

  const anularFactura = async (f: FacturaCompraResponseDTO) => {
    const aceptado = await confirm({
      title: 'Anular factura de compra',
      message: `¿Anular la factura ${formatNumeroFactura(f.numeroFactura)} de ${nombreProveedor(f.proveedor)}?`,
      confirmLabel: 'Anular',
      danger: true,
    });
    if (aceptado && (await anular.run(() => comprasApi.facturas.anular(f.idFacturaCompra)))) facturas.reload();
  };

  const columns: Column<FacturaCompraResponseDTO>[] = [
    { header: 'Número', cell: (f) => (f.numeroFactura ? formatNumeroFactura(f.numeroFactura) : `#${f.idFacturaCompra}`), className: 'font-bold text-slate-900' },
    { header: 'Fecha', cell: (f) => formatDate(f.fechaEmision), className: 'text-slate-600' },
    { header: 'Proveedor', cell: (f) => nombreProveedor(f.proveedor) },
    { header: 'Condición', cell: (f) => (f.condicionCompra === 'CREDITO' ? 'Crédito' : 'Contado'), className: 'text-slate-600' },
    { header: 'Total', align: 'right', cell: (f) => formatMoney(f.totalGeneral), className: 'font-black text-slate-900' },
    { header: 'Estado', cell: (f) => <StatusBadge status={anulada(f) ? 'Anulada' : 'Activa'} /> },
    {
      header: 'Acciones',
      align: 'center',
      cell: (f) => (
        <div className="flex items-center justify-center gap-1">
          {!anulada(f) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => anularFactura(f)}
              className="h-7 w-7 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
              title="Anular"
            >
              <Ban />
            </Button>
          )}
          <ActionButtons
            onDelete={() =>
              baja.remove(
                { title: 'Dar de baja factura de compra', message: `¿Dar de baja la factura ${formatNumeroFactura(f.numeroFactura)}? Dejará de aparecer en los listados.` },
                () => comprasApi.facturas.remove(f.idFacturaCompra)
              )
            }
          />
        </div>
      ),
    },
  ];

  const error = baja.error ?? anular.error;

  return (
    <>
      {error && <FeedbackBanner className="mb-4">{error}</FeedbackBanner>}

      <PagedTable
        resource={facturas}
        columns={columns}
        rowKey={(f) => f.idFacturaCompra}
        label="facturas de compra"
        searchPlaceholder="Buscar por número, proveedor o timbrado..."
        filters={
          <Button variant="emerald" onClick={() => setFormOpen(true)}>
            <Plus />
            <span>Nueva factura de compra</span>
          </Button>
        }
      />

      <ModalDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Registrar factura de compra"
        subtitle="Se cargan los datos tal como figuran en la factura del proveedor."
        maxWidth="2xl"
      >
        <FacturaCompraForm onClose={() => setFormOpen(false)} onSaved={facturas.reload} />
      </ModalDialog>
    </>
  );
};

/**
 * Formulario cabecera-detalle de la compra. Comparte el detalle con la factura
 * de venta; aquí el precio lo escribe el usuario porque es el costo de esta compra.
 */
const FacturaCompraForm: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const catalogos = useAsyncData(cargarCatalogosCompra);
  const guardar = useAsyncAction();
  const [numeroFactura, setNumeroFactura] = useState('');
  const [timbrado, setTimbrado] = useState('');
  const [fechaEmision, setFechaEmision] = useState(todayIso());
  const [idProveedor, setIdProveedor] = useState<number | ''>('');
  const [idDeposito, setIdDeposito] = useState<number | ''>('');
  const [idMedioPago, setIdMedioPago] = useState<number | ''>('');
  const [condicion, setCondicion] = useState<CondicionCompra>('CONTADO');
  const [lineas, setLineas] = useState<LineItem[]>([newLineItem()]);
  const [altaProveedor, setAltaProveedor] = useState(false);
  // Proveedores registrados desde este formulario, que todavía no están en el catálogo cargado.
  const [nuevos, setNuevos] = useState<ProveedorResponseDTO[]>([]);

  if (catalogos.error) return <FeedbackBanner>{catalogos.error}</FeedbackBanner>;
  if (!catalogos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;
  const { depositos, mediosPago, productos } = catalogos.data;
  const proveedores = [...nuevos, ...catalogos.data.proveedores];

  const deposito = idDeposito !== '' ? idDeposito : preferredId('deposito', depositos.map((d) => d.id));
  const numeroCompleto = padNumeroFactura(numeroFactura);
  const errorNumero = numeroFactura && !NUMERO_FACTURA_PATTERN.test(numeroCompleto) ? 'El número debe tener el formato 001-001-0000001.' : null;
  const errorTimbrado = timbrado && timbrado.length !== 8 ? 'El timbrado tiene 8 dígitos.' : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errorNumero || errorTimbrado) return;
    const ok = await guardar.run(() =>
      comprasApi.facturas.create({
        numeroFactura: numeroCompleto,
        fechaEmision,
        timbrado,
        idProveedor: Number(idProveedor),
        idDeposito: Number(deposito),
        idMedioPago: Number(idMedioPago),
        condicionCompra: condicion,
        detalles: lineas.map((l) => ({ idProducto: Number(l.idProducto), cantidad: l.cantidad, precioUnitario: l.precioUnitario })),
      })
    );
    if (ok) {
      rememberId('deposito', deposito);
      onSaved();
      onClose();
    }
  };

  const errorDeCampo = (mensaje: string | null) => mensaje && <p className="text-[11px] text-rose-600 mt-1">{mensaje}</p>;
  const idONada = (value: string): number | '' => (value === '' ? '' : Number(value));

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Proveedor" required className="sm:col-span-2">
            <div className="flex gap-2">
              <select className={fieldClass} required value={idProveedor} onChange={(e) => setIdProveedor(idONada(e.target.value))}>
                <option value="">Seleccionar...</option>
                {proveedores.map((p) => (
                  <option key={p.idProveedor} value={p.idProveedor}>
                    {nombreProveedor(p)}
                    {p.persona.ruc ? ` (${p.persona.ruc})` : ''}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" className="shrink-0" onClick={() => setAltaProveedor(true)} title="Registrar proveedor nuevo">
                <UserPlus />
                <span>Nuevo</span>
              </Button>
            </div>
          </FormField>
          <FormField label="Fecha de emisión" required>
            <input className={fieldClass} type="date" required max={todayIso()} value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} />
          </FormField>

          <FormField label="Número de factura" required>
            <input
              className={fieldClass}
              required
              inputMode="numeric"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(maskNumeroFactura(e.target.value))}
              onBlur={() => setNumeroFactura(padNumeroFactura(numeroFactura))}
              placeholder="001-001-0000001"
            />
            {errorDeCampo(errorNumero)}
          </FormField>
          <FormField label="Timbrado del proveedor" required>
            <input
              className={fieldClass}
              required
              inputMode="numeric"
              value={timbrado}
              onChange={(e) => setTimbrado(normalizeTimbrado(e.target.value))}
              placeholder="12345678"
            />
            {errorDeCampo(errorTimbrado)}
          </FormField>
          <FormField label="Condición" required>
            <select className={fieldClass} value={condicion} onChange={(e) => setCondicion(e.target.value as CondicionCompra)}>
              <option value="CONTADO">Contado</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </FormField>

          <FormField label="Medio de pago" required>
            <select className={fieldClass} required value={idMedioPago} onChange={(e) => setIdMedioPago(idONada(e.target.value))}>
              <option value="">Seleccionar...</option>
              {mediosPago.map((m) => (
                <option key={m.idMedioPago} value={m.idMedioPago}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Depósito de ingreso" required hint="Aquí se suma el stock." className="sm:col-span-2">
            <select className={fieldClass} required value={deposito} onChange={(e) => setIdDeposito(Number(e.target.value))}>
              {depositos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <LineItemsEditor lines={lineas} onChange={setLineas} productos={productos} price="manual" />

        {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

        <FormActions onCancel={onClose} submitLabel="Registrar compra" loading={guardar.loading} icon={<Receipt className="w-3.5 h-3.5" />} />
      </form>

      {/* Fuera del <form> de la factura: guardar el proveedor no debe enviar la factura. */}
      <ProveedorFormModal
        isOpen={altaProveedor}
        onClose={() => setAltaProveedor(false)}
        onSaved={(proveedor) => {
          setNuevos((actuales) => [proveedor, ...actuales]);
          setIdProveedor(proveedor.idProveedor);
        }}
      />
    </>
  );
};
