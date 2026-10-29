import { NUMERO_FACTURA_PATTERN, formatNumeroFactura, maskNumeroFactura, padNumeroFactura, prefijoFactura } from '../../lib/paraguay';
import type { ClienteResponseDTO, DepositoResponseDTO } from '../../types/api';
import { ClienteFormModal } from './ClienteFormModal';
import { ClientePicker } from './ClientePicker';
import React, { useCallback, useState } from 'react';
import { Receipt } from 'lucide-react';
import { DepositoBuscador, EmpleadoPicker, FeedbackBanner, FormActions, FormField, LineItemsEditor, ModalDialog, fieldClass } from '../common';
import { lineasADetalle, lineasDesdeDetalle, newLineItem, type LineItem } from '../../lib/lineItems';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, useDepositoAsignado, useEmpleadoPorDefecto } from '../../hooks';
import { catalogos, depositosActivos, inventarioApi, ventasApi } from '../../services';
import { todayIso } from '../../lib/format';
import type { FacturaVentaRequestDTO, FacturaVentaResponseDTO } from '../../types/api';

interface FacturaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama cuando el backend confirmó el guardado. */
  onSaved: () => void;
  /** Con id = modificar esa factura (se pide completa); sin id = emitir una nueva. */
  idFactura?: number | null;
}

/**
 * Catálogos chicos del formulario (pedidos al backend): medios de pago, timbrados y depósitos.
 * Vendedor y productos se eligen con selectores paginados, sin cargar listas enteras.
 */
async function cargarCatalogos() {
  const [mediosPago, timbrados, depositos] = await Promise.all([catalogos.mediosPago(), catalogos.timbrados(), depositosActivos()]);
  return { mediosPago, timbrados, depositos };
}

const idONada = (value: string): number | '' => (value === '' ? '' : Number(value));

/** Unidades por producto que la factura ya descontó: al modificarla, vuelven a estar disponibles para ella. */
function reservadoDeFactura(factura: FacturaVentaResponseDTO): Record<number, number> {
  const reservado: Record<number, number> = {};
  if (factura.estado?.toUpperCase() !== 'EMITIDA') return reservado;
  for (const d of factura.detalles ?? []) reservado[d.idProducto] = (reservado[d.idProducto] ?? 0) + d.cantidad;
  return reservado;
}

/** La factura trae el cliente plano (id, nombre y documento): alcanza para mostrarlo en el selector. */
function clienteDeFactura(factura: FacturaVentaResponseDTO): ClienteResponseDTO {
  const documento = factura.clienteDocumento ?? '';
  const esRuc = documento.includes('-');
  return {
    idCliente: factura.idCliente,
    estado: true,
    persona: {
      id: 0,
      tipoPersona: 'FISICA',
      nombreCompleto: factura.clienteNombre,
      ci: esRuc ? undefined : documento,
      ruc: esRuc ? documento : undefined,
    },
  };
}

/**
 * Formulario cabecera-detalle de la factura: la cabecera identifica la venta y
 * el detalle crece con una fila por producto. Precio, IVA y stock los resuelve
 * el backend; aquí el total es solo una vista previa. Se guarda en un solo pedido.
 */
export const FacturaFormModal: React.FC<FacturaFormModalProps> = ({ isOpen, onClose, onSaved, idFactura }) => (
  <ModalDialog
    isOpen={isOpen}
    onClose={onClose}
    title={idFactura ? 'Modificar factura' : 'Emitir factura de venta'}
    subtitle="El stock se verifica al cargar cada producto; el precio y el IVA se toman de inventario al guardar."
    maxWidth="6xl"
    className="h-[88vh] max-h-[92vh]"
  >
    {/* El contenido se monta cada vez que se abre: datos de la factura a modificar, o formulario en blanco. */}
    {idFactura ? (
      <FacturaAEditar idFactura={idFactura} onClose={onClose} onSaved={onSaved} />
    ) : (
      <FacturaForm onClose={onClose} onSaved={onSaved} factura={null} />
    )}
  </ModalDialog>
);

/**
 * Para modificar, primero se pide la factura completa (con sus líneas) y después cada producto
 * distinto por id, para mostrar nombre y precio en el detalle.
 */
const FacturaAEditar: React.FC<{ idFactura: number; onClose: () => void; onSaved: () => void }> = ({ idFactura, ...props }) => {
  const cargar = useCallback(async () => {
    const factura = await ventasApi.facturas.get(idFactura);
    const lineas = await lineasDesdeDetalle(factura.detalles, inventarioApi.productos.ref);
    return { factura, lineas };
  }, [idFactura]);
  const datos = useAsyncData(cargar);
  if (datos.error) return <FeedbackBanner>{datos.error}</FeedbackBanner>;
  if (!datos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando la factura...</p>;
  return <FacturaForm {...props} factura={datos.data.factura} lineasIniciales={datos.data.lineas} />;
};

const FacturaForm: React.FC<{ onClose: () => void; onSaved: () => void; factura: FacturaVentaResponseDTO | null; lineasIniciales?: LineItem[] }> = ({
  onClose,
  onSaved,
  factura,
  lineasIniciales,
}) => {
  const editando = Boolean(factura);
  const catalogos = useAsyncData(cargarCatalogos);
  const guardar = useAsyncAction();

  const [numeroFactura, setNumeroFactura] = useState(factura ? formatNumeroFactura(factura.numeroFactura) : '');
  const [fechaEmision, setFechaEmision] = useState(factura?.fechaEmision ?? todayIso());
  const [cliente, setCliente] = useState<ClienteResponseDTO | null>(factura ? clienteDeFactura(factura) : null);
  // Texto con el que se abre el alta de cliente; null = cerrada.
  const [altaCliente, setAltaCliente] = useState<string | null>(null);
  // Vendedor: el de la factura o el usuario que inició sesión (si es empleado).
  const [empleado, setEmpleado] = useEmpleadoPorDefecto(factura?.idEmpleado);
  // undefined = todavía no se eligió: al modificar, se propone el depósito de la factura.
  const [depositoElegido, setDeposito] = useState<DepositoResponseDTO | null | undefined>(undefined);
  const asignado = useDepositoAsignado();
  const [idMedioPago, setIdMedioPago] = useState<number | ''>(factura?.idMedioPago ?? '');
  const [idTimbrado, setIdTimbrado] = useState<number | ''>(factura?.idTimbrado ?? '');
  const [lineas, setLineas] = useState<LineItem[]>(() => (lineasIniciales && lineasIniciales.length > 0 ? lineasIniciales : [newLineItem()]));

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
    if (errorNumero || !cliente || !empleado || !deposito) return;
    const request: FacturaVentaRequestDTO = {
      numeroFactura: numeroValido ? padNumeroFactura(numeroFactura) : numeroFactura.trim(),
      fechaEmision,
      idCliente: cliente?.idCliente ?? 0,
      idEmpleado: empleado.id,
      idDeposito: deposito.id,
      idMedioPago: Number(idMedioPago),
      idTimbrado: Number(idTimbrado),
      detalles: lineasADetalle(lineas),
    };
    const ok = await guardar.run(() =>
      factura ? ventasApi.facturas.update(factura.idFacturaVenta, request) : ventasApi.facturas.create(request)
    );
    if (ok) {
      onSaved();
      onClose();
    }
  };

  const datos = catalogos.data;

  // El vendedor vende siempre desde su depósito asignado (el backend también lo impone).
  const deposito =
    asignado ??
    (depositoElegido !== undefined ? depositoElegido : (datos?.depositos.find((d) => d.id === factura?.idDeposito) ?? null));

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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ---- Cabecera ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <EmpleadoPicker required value={empleado} onChange={setEmpleado} />
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

            <FormField label="Depósito de salida" required hint="De aquí se descuenta el stock." className="sm:col-span-2">
              <DepositoBuscador required={!asignado} disabled={Boolean(asignado)} depositos={datos.depositos} value={deposito} onChange={setDeposito} />
            </FormField>
          </div>

          {/* ---- Detalle ---- */}
          <LineItemsEditor
            lines={lineas}
            onChange={setLineas}
            price="catalogo"
            deposito={{ idDeposito: deposito?.id ?? null, verificarStock: true, reservado: factura && deposito?.id === factura.idDeposito ? reservadoDeFactura(factura) : undefined }}
          />

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
