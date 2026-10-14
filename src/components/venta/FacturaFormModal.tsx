import { NUMERO_FACTURA_PATTERN, formatNumeroFactura, maskNumeroFactura, padNumeroFactura, prefijoFactura } from '../../lib/paraguay';
import type { ClienteResponseDTO } from '../../types/api';
import { ClienteFormModal } from './ClienteFormModal';
import { ClientePicker } from './ClientePicker';
import React, { useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import { FeedbackBanner, FormActions, FormField, LineItemsEditor, ModalDialog, fieldClass } from '../common';
import { newLineItem, type LineItem } from '../../lib/lineItems';
import { preferredId, rememberId } from '../../lib/preferences';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData } from '../../hooks';
import { inventarioApi, ventasApi } from '../../services';
import { todayIso } from '../../lib/format';
import type { FacturaVentaRequestDTO, FacturaVentaResponseDTO } from '../../types/api';

interface FacturaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama cuando el backend confirmó el guardado. */
  onSaved: () => void;
  /** Con factura = modificar; sin factura = emitir una nueva. */
  factura?: FacturaVentaResponseDTO | null;
}

/** Lo que el formulario necesita de ventas e inventario para llenar sus selectores. El cliente se busca aparte. */
async function cargarCatalogos() {
  const [mediosPago, timbrados, empleados, depositos, productos] = await Promise.all([
    ventasApi.mediosPago.all(),
    ventasApi.timbrados.all(),
    inventarioApi.empleados.all({ estado: true }),
    inventarioApi.depositos.all(),
    inventarioApi.productos.all(),
  ]);
  return { mediosPago, timbrados, empleados, depositos, productos };
}

const idONada = (value: string): number | '' => (value === '' ? '' : Number(value));

/**
 * Formulario cabecera-detalle de la factura: la cabecera identifica la venta y
 * el detalle crece con una fila por producto. Precio, IVA y stock los resuelve
 * el backend; aquí el total es solo una vista previa.
 */
export const FacturaFormModal: React.FC<FacturaFormModalProps> = ({ isOpen, onClose, onSaved, factura }) => (
  <ModalDialog
    isOpen={isOpen}
    onClose={onClose}
    title={factura ? `Modificar factura ${formatNumeroFactura(factura.numeroFactura)}` : 'Emitir factura de venta'}
    subtitle="El precio, el IVA y el stock se toman de inventario al guardar."
    maxWidth="2xl"
  >
    {/* El contenido se monta cada vez que se abre: datos de la factura a modificar, o formulario en blanco. */}
    <FacturaForm onClose={onClose} onSaved={onSaved} factura={factura} />
  </ModalDialog>
);

const FacturaForm: React.FC<Omit<FacturaFormModalProps, 'isOpen'>> = ({ onClose, onSaved, factura }) => {
  const editando = Boolean(factura);
  const catalogos = useAsyncData(cargarCatalogos);
  const guardar = useAsyncAction();

  const [numeroFactura, setNumeroFactura] = useState(factura ? formatNumeroFactura(factura.numeroFactura) : '');
  const [fechaEmision, setFechaEmision] = useState(factura?.fechaEmision ?? todayIso());
  const [cliente, setCliente] = useState<ClienteResponseDTO | null>(factura?.cliente ?? null);
  // Texto con el que se abre el alta de cliente; null = cerrada.
  const [altaCliente, setAltaCliente] = useState<string | null>(null);
  const [idEmpleado, setIdEmpleado] = useState<number | ''>(factura?.empleado?.id ?? '');
  const [idDeposito, setIdDeposito] = useState<number | ''>(factura?.deposito?.id ?? '');
  const [idMedioPago, setIdMedioPago] = useState<number | ''>(factura?.medioPago?.idMedioPago ?? '');
  const [idTimbrado, setIdTimbrado] = useState<number | ''>(factura?.timbrado?.idTimbrado ?? '');
  const [lineas, setLineas] = useState<LineItem[]>(() =>
    factura && factura.detalles.length > 0
      ? factura.detalles.map((d) => newLineItem({ idProducto: d.idProducto, cantidad: d.cantidad }))
      : [newLineItem()]
  );

  const productos = useMemo(() => catalogos.data?.productos ?? [], [catalogos.data]);
  const timbrado = catalogos.data?.timbrados.find((t) => t.idTimbrado === idTimbrado);

  // Número de factura: establecimiento-punto-número, con el prefijo que impone el timbrado.
  // Una factura ya guardada con otro formato puede modificarse mientras no se le cambie el número.
  const prefijo = timbrado ? prefijoFactura(timbrado.sucursal, timbrado.puntoExpedicion) : null;
  const exigirFormato = !factura || numeroFactura !== formatNumeroFactura(factura.numeroFactura);
  const numeroCompleto = padNumeroFactura(numeroFactura);
  const numeroValido = NUMERO_FACTURA_PATTERN.test(numeroCompleto);
  const errorNumero = !exigirFormato || !numeroFactura
    ? null
    : !numeroValido
      ? 'El número debe tener el formato 001-001-0000001.'
      : prefijo && !numeroCompleto.startsWith(prefijo)
        ? `Con este timbrado el número debe empezar con ${prefijo}`
        : null;

  const elegirTimbrado = (id: number | '') => {
    setIdTimbrado(id);
    const elegido = catalogos.data?.timbrados.find((t) => t.idTimbrado === id);
    if (!elegido || !exigirFormato) return;
    // Se conserva lo ya escrito del número y se corrige solo el prefijo.
    const secuencia = maskNumeroFactura(numeroFactura).split('-')[2] ?? '';
    setNumeroFactura(prefijoFactura(elegido.sucursal, elegido.puntoExpedicion) + secuencia);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errorNumero || !cliente) return;
    const request: FacturaVentaRequestDTO = {
      numeroFactura: numeroValido ? padNumeroFactura(numeroFactura) : numeroFactura.trim(),
      fechaEmision,
      idCliente: cliente?.idCliente ?? 0,
      idEmpleado: Number(empleadoElegido),
      idDeposito: Number(depositoElegido),
      idMedioPago: Number(idMedioPago),
      idTimbrado: Number(idTimbrado),
      detalles: lineas.map((l) => ({ idProducto: Number(l.idProducto), cantidad: l.cantidad })),
    };
    const ok = await guardar.run(() =>
      factura ? ventasApi.facturas.update(factura.idFacturaVenta, request) : ventasApi.facturas.create(request)
    );
    if (ok) {
      rememberId('empleado', empleadoElegido);
      rememberId('deposito', depositoElegido);
      onSaved();
      onClose();
    }
  };

  const datos = catalogos.data;

  // Vendedor y depósito se proponen ya elegidos (los últimos usados) para cargar más rápido.
  const empleadoElegido = idEmpleado !== '' || !datos ? idEmpleado : preferredId('empleado', datos.empleados.map((e) => e.id));
  const depositoElegido =
    idDeposito !== '' || !datos ? idDeposito : preferredId('deposito', datos.depositos.filter((d) => d.estado).map((d) => d.id));

  return (
    <>
      {catalogos.error ? (
        <div className="space-y-3">
          <FeedbackBanner>{catalogos.error}</FeedbackBanner>
          <Button variant="outline" size="sm" onClick={catalogos.reload}>
            Reintentar
          </Button>
        </div>
      ) : !datos ? (
        <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ---- Cabecera ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Timbrado" required>
              <select className={fieldClass} required value={idTimbrado} onChange={(e) => elegirTimbrado(idONada(e.target.value))}>
                <option value="">Seleccionar...</option>
                {datos.timbrados.map((t) => (
                  <option key={t.idTimbrado} value={t.idTimbrado}>
                    {t.numeroTimbrado} ({t.sucursal}-{t.puntoExpedicion})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Número de factura" required>
              <input
                className={fieldClass}
                required
                maxLength={50}
                inputMode="numeric"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(maskNumeroFactura(e.target.value))}
                onBlur={() => exigirFormato && setNumeroFactura(padNumeroFactura(numeroFactura))}
                placeholder={`${prefijo ?? '001-001-'}0000001`}
              />
              {errorNumero && <p className="text-[11px] text-rose-600 mt-1">{errorNumero}</p>}
            </FormField>
            <FormField label="Fecha de emisión" required>
              <input
                className={fieldClass}
                type="date"
                required
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
              />
            </FormField>

            <FormField label="Cliente" required>
              <ClientePicker value={cliente} onChange={setCliente} onCreate={setAltaCliente} />
            </FormField>
            <FormField label="Vendedor" required>
              <select className={fieldClass} required value={empleadoElegido} onChange={(e) => setIdEmpleado(idONada(e.target.value))}>
                <option value="">Seleccionar...</option>
                {datos.empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.persona.nombreCompleto} ({emp.cargo})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Medio de pago" required>
              <select className={fieldClass} required value={idMedioPago} onChange={(e) => setIdMedioPago(idONada(e.target.value))}>
                <option value="">Seleccionar...</option>
                {datos.mediosPago.map((m) => (
                  <option key={m.idMedioPago} value={m.idMedioPago}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Depósito de salida" required hint="De aquí se descuenta el stock." className="sm:col-span-3">
              <select className={fieldClass} required value={depositoElegido} onChange={(e) => setIdDeposito(idONada(e.target.value))}>
                <option value="">Seleccionar...</option>
                {datos.depositos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* ---- Detalle ---- */}
          <LineItemsEditor lines={lineas} onChange={setLineas} productos={productos} price="catalogo" />

          {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

          <FormActions
            onCancel={onClose}
            submitLabel={editando ? 'Guardar cambios' : 'Emitir factura'}
            loading={guardar.loading}
            icon={<Receipt className="w-3.5 h-3.5" />}
          />
        </form>
      )}

      {/* Fuera del <form> de la factura: guardar el cliente no debe enviar la factura. */}
      <ClienteFormModal
        isOpen={altaCliente !== null}
        onClose={() => setAltaCliente(null)}
        onSaved={setCliente}
        textoInicial={altaCliente ?? ''}
      />
    </>
  );
};
