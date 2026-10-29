import React, { useState } from 'react';
import { Ban, Plus, Receipt, UserPlus } from 'lucide-react';
import {
  ActionButtons,
  FeedbackBanner,
  FormActions,
  FormField,
  LineItemsEditor,
  ModalDialog,
  DepositoBuscador,
  PagedTable,
  ProveedorPicker,
  StatusBadge,
  fieldClass,
  type Column,
} from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, useConfirm, useDepositoAsignado, usePagedResource, useRemove } from '../../hooks';
import { comprasApi } from '../../services';
import { formatDate, formatMoney, todayIso } from '../../lib/format';
import { newLineItem, type LineItem } from '../../lib/lineItems';
import { NUMERO_FACTURA_PATTERN, formatNumeroFactura, maskNumeroFactura, normalizeTimbrado, padNumeroFactura } from '../../lib/paraguay';
import type { CondicionCompra, DepositoResponseDTO, FacturaCompraResponseDTO, ProductoResponseDTO, ProveedorResponseDTO } from '../../types/api';
import { cargarCatalogosCompra } from './catalogos';
import { nombreProveedor } from '../../lib/proveedor';
import { ProveedorFormModal } from './ProveedoresPanel';
import { ProductoFormModal } from '../stock';

const anulada = (f: FacturaCompraResponseDTO) => f.estado?.toUpperCase().startsWith('ANULAD');

export const FacturasCompraPanel: React.FC = () => {
  const facturas = usePagedResource(comprasApi.facturas.list);
  const baja = useRemove(facturas.reload);
  const anular = useAsyncAction();
  const confirm = useConfirm();
  const [formOpen, setFormOpen] = useState(false);
  const [detalle, setDetalle] = useState<FacturaCompraResponseDTO | null>(null);

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
    { header: 'Número', cell: (f) => (f.numeroFactura ? formatNumeroFactura(f.numeroFactura) : '—'), className: 'font-bold text-slate-900' },
    { header: 'Fecha', cell: (f) => formatDate(f.fechaEmision), className: 'text-slate-600' },
    { header: 'Proveedor', cell: (f) => nombreProveedor(f.proveedor) },
    { header: 'Condición', cell: (f) => (f.condicionCompra === 'CREDITO' ? 'Crédito' : 'Contado'), className: 'text-slate-600' },
    { header: 'Total', align: 'center', cell: (f) => formatMoney(f.totalGeneral), className: 'font-black text-slate-900' },
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
              className="h-6 w-6 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
              title="Anular"
            >
              <Ban />
            </Button>
          )}
          <ActionButtons
            onView={() => setDetalle(f)}
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
      {error && <FeedbackBanner className="mb-3">{error}</FeedbackBanner>}

      <PagedTable
        resource={facturas}
        columns={columns}
        rowKey={(f) => f.idFacturaCompra}
        label="facturas de compra"
        searchPlaceholder="Buscar por número, timbrado o proveedor..."
        onRowClick={setDetalle}
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
        maxWidth="6xl"
        className="h-[88vh] max-h-[92vh]"
      >
        <FacturaCompraForm onClose={() => setFormOpen(false)} onSaved={facturas.reload} />
      </ModalDialog>

      <DetalleFacturaCompra factura={detalle} onClose={() => setDetalle(null)} />
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
  const [proveedor, setProveedor] = useState<ProveedorResponseDTO | null>(null);
  // El comprador compra siempre para su depósito asignado (el backend también lo impone).
  const asignado = useDepositoAsignado();
  const [depositoElegido, setDeposito] = useState<DepositoResponseDTO | null>(null);
  const deposito = asignado ?? depositoElegido;
  const [idMedioPago, setIdMedioPago] = useState<number | ''>('');
  const [condicion, setCondicion] = useState<CondicionCompra>('CONTADO');
  const [lineas, setLineas] = useState<LineItem[]>([newLineItem()]);
  const [altaProveedor, setAltaProveedor] = useState(false);
  const [altaProductoParaLinea, setAltaProductoParaLinea] = useState<number | null>(null);

  const handleProductoCreado = (nuevo: ProductoResponseDTO) => {
    if (altaProductoParaLinea !== null) {
      setLineas((actuales) =>
        actuales.map((l) => (l.key === altaProductoParaLinea ? { ...l, producto: nuevo } : l))
      );
    }
    setAltaProductoParaLinea(null);
  };

  if (catalogos.error) return <FeedbackBanner>{catalogos.error}</FeedbackBanner>;
  if (!catalogos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;
  const { depositos, mediosPago } = catalogos.data;

  const numeroCompleto = padNumeroFactura(numeroFactura);
  const errorNumero = numeroFactura && !NUMERO_FACTURA_PATTERN.test(numeroCompleto) ? 'El número debe tener el formato 001-001-0000001.' : null;
  const errorTimbrado = timbrado && timbrado.length !== 8 ? 'El timbrado tiene 8 dígitos.' : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errorNumero || errorTimbrado || !proveedor || !deposito) return;
    const ok = await guardar.run(() =>
      comprasApi.facturas.create({
        numeroFactura: numeroCompleto,
        fechaEmision,
        timbrado,
        idProveedor: proveedor.idProveedor,
        idDeposito: deposito.id,
        idMedioPago: Number(idMedioPago),
        condicionCompra: condicion,
        detalles: lineas.filter((l) => l.producto).map((l) => ({ idProducto: l.producto!.id, cantidad: l.cantidad, precioUnitario: l.precioUnitario })),
      })
    );
    if (ok) {
      onSaved();
      onClose();
    }
  };

  const errorDeCampo = (mensaje: string | null) => mensaje && <p className="text-[11px] text-rose-600 mt-1">{mensaje}</p>;
  const idONada = (value: string): number | '' => (value === '' ? '' : Number(value));

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <FormField label="Proveedor" required className="sm:col-span-2">
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <ProveedorPicker required value={proveedor} onChange={setProveedor} />
              </div>
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
          <FormField label="Depósito de ingreso" required hint="Aquí se suma el stock.">
            <DepositoBuscador required={!asignado} disabled={Boolean(asignado)} depositos={depositos} value={deposito} onChange={setDeposito} />
          </FormField>
        </div>

        <LineItemsEditor
          lines={lineas}
          onChange={setLineas}
          price="manual"
          onCrearProducto={(key) => setAltaProductoParaLinea(key)}
          // La compra entra a un depósito: se elige antes de cargar productos (no se controla stock).
          deposito={{ idDeposito: deposito?.id ?? null, verificarStock: false }}
        />

        {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

        <FormActions onCancel={onClose} submitLabel="Registrar compra" loading={guardar.loading} icon={<Receipt className="w-3.5 h-3.5" />} />
      </form>

      {/* Fuera del <form> de la factura: guardar el proveedor o producto no debe enviar la factura. */}
      <ProveedorFormModal
        isOpen={altaProveedor}
        onClose={() => setAltaProveedor(false)}
        onSaved={(nuevo) => setProveedor(nuevo)}
      />

      <ProductoFormModal
        isOpen={altaProductoParaLinea !== null}
        onClose={() => setAltaProductoParaLinea(null)}
        onSaved={handleProductoCreado}
        permitirStockInicial={false}
      />
    </>
  );
};

/** Detalle de la factura de compra: el listado ya trae cabecera y líneas, así que no se vuelve a pedir. */
const DetalleFacturaCompra: React.FC<{ factura: FacturaCompraResponseDTO | null; onClose: () => void }> = ({ factura, onClose }) => (
  <ModalDialog
    isOpen={factura !== null}
    onClose={onClose}
    title={factura ? `Factura de compra ${factura.numeroFactura ? formatNumeroFactura(factura.numeroFactura) : ''}` : ''}
    subtitle={factura ? `Timbrado ${factura.timbrado} · ${factura.condicionCompra === 'CREDITO' ? 'Crédito' : 'Contado'}` : undefined}
    maxWidth="3xl"
  >
    {factura && (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          {(
            [
              ['Proveedor', nombreProveedor(factura.proveedor)],
              ['Fecha', formatDate(factura.fechaEmision)],
              ['Depósito', factura.deposito?.nombre ?? '—'],
              ['Medio de pago', factura.medioPago?.nombre ?? '—'],
            ] as const
          ).map(([etiqueta, valor]) => (
            <div key={etiqueta} className="min-w-0">
              <span className="block text-slate-400">{etiqueta}</span>
              <strong className="block text-slate-800 truncate">{valor}</strong>
            </div>
          ))}
        </div>
        <div className="border border-slate-200 rounded-xl">
          <table className="w-full table-fixed text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2 px-3">Producto</th>
                <th className="py-2 px-2 w-16 text-center">Cant.</th>
                <th className="py-2 px-2 w-28 text-right">Costo unit.</th>
                <th className="hidden sm:table-cell py-2 px-2 w-28 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {factura.detalles.map((d) => (
                <tr key={d.idDetalle}>
                  <td className="py-1.5 px-3 font-semibold text-slate-800 truncate">{d.nombreProducto}</td>
                  <td className="py-1.5 px-2 text-center">{d.cantidad}</td>
                  <td className="py-1.5 px-2 text-right">{formatMoney(d.precioUnitario)}</td>
                  <td className="hidden sm:table-cell py-1.5 px-2 text-right font-bold text-slate-900">{formatMoney(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-6">
          <div className="text-right">
            <span className="block text-slate-400">IVA incluido</span>
            <strong className="text-slate-700">{formatMoney(factura.totalIva)}</strong>
          </div>
          <div className="text-right">
            <span className="block text-slate-400">Total</span>
            <strong className="text-base font-black text-slate-900">{formatMoney(factura.totalGeneral)}</strong>
          </div>
        </div>
      </div>
    )}
  </ModalDialog>
);
