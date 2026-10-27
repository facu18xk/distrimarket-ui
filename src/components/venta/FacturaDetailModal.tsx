import { formatNumeroFactura } from '../../lib/paraguay';
import React, { useCallback, useMemo } from 'react';
import { Ban, Edit3, RotateCcw, Trash2 } from 'lucide-react';
import { FeedbackBanner, ModalDialog, StatusBadge } from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, useConfirm, usePorId } from '../../hooks';
import { catalogos, inventarioApi, ventasApi } from '../../services';
import { formatDate, formatMoney } from '../../lib/format';
import type { FacturaVentaResponseDTO } from '../../types/api';
import { useApp } from '../../context/AppContext';

interface FacturaDetailModalProps {
  /** Factura a mostrar: se pide completa (con sus líneas) al abrir el detalle. */
  idFactura: number | null;
  onClose: () => void;
  /** Se llama después de anular, reemitir o dar de baja. */
  onChanged: () => void;
  onEdit: (idFactura: number) => void;
}

/** El detalle se monta solo con una factura elegida: así cada apertura pide la suya. */
export const FacturaDetailModal: React.FC<FacturaDetailModalProps> = ({ idFactura, ...props }) =>
  idFactura === null ? null : <FacturaDetalle key={idFactura} idFactura={idFactura} {...props} />;

const FacturaDetalle: React.FC<Omit<FacturaDetailModalProps, 'idFactura'> & { idFactura: number }> = ({
  idFactura,
  onClose,
  onChanged,
  onEdit,
}) => {
  const cargar = useCallback(() => ventasApi.facturas.get(idFactura), [idFactura]);
  const factura = useAsyncData(cargar);

  if (!factura.data) {
    return (
      <ModalDialog isOpen onClose={onClose} title="Factura" maxWidth="3xl">
        {factura.error ? (
          <FeedbackBanner>{factura.error}</FeedbackBanner>
        ) : (
          <p className="py-8 text-center text-xs text-slate-400">Cargando la factura...</p>
        )}
      </ModalDialog>
    );
  }
  return <FacturaContenido factura={factura.data} onClose={onClose} onChanged={onChanged} onEdit={onEdit} />;
};

interface FacturaContenidoProps extends Omit<FacturaDetailModalProps, 'idFactura'> {
  factura: FacturaVentaResponseDTO;
}

const Dato: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <span className="text-slate-400 block">{label}</span>
    <strong className="text-slate-800">{children}</strong>
  </div>
);

const FacturaContenido: React.FC<FacturaContenidoProps> = ({ factura, onClose, onChanged, onEdit }) => {
  const { isAdmin } = useApp();
  const accion = useAsyncAction();
  const confirm = useConfirm();
  // La factura trae solo ids de inventario: cada producto distinto y el vendedor se piden por id
  // (inventario los responde desde Redis). El depósito sale del catálogo de depósitos.
  const productoPorId = usePorId(inventarioApi.productos.ref, factura.detalles.map((d) => d.idProducto));
  const empleadoPorId = usePorId(inventarioApi.empleados.ref, [factura.idEmpleado]);
  const empleado = factura.idEmpleado ? empleadoPorId.get(factura.idEmpleado) : undefined;
  const depositos = useAsyncData(catalogos.depositos);
  const deposito = useMemo(() => depositos.data?.find((d) => d.id === factura.idDeposito), [depositos.data, factura.idDeposito]);

  const emitida = factura.estado === 'EMITIDA';

  const ejecutar = async (titulo: string, mensaje: string, operacion: () => Promise<unknown>, peligro = true) => {
    if (!(await confirm({ title: titulo, message: mensaje, confirmLabel: titulo, danger: peligro }))) return;
    if (await accion.run(operacion)) {
      onChanged();
      onClose();
    }
  };

  const cerrar = () => {
    accion.clearError();
    onClose();
  };

  return (
    <ModalDialog
      isOpen
      onClose={cerrar}
      title={`Factura ${formatNumeroFactura(factura.numeroFactura)}`}
      subtitle={`Timbrado ${factura.numeroTimbrado ?? '—'} · ${factura.medioPagoNombre ?? '—'}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <Dato label="Cliente">{factura.clienteNombre}</Dato>
          <Dato label="Fecha">{formatDate(factura.fechaEmision)}</Dato>
          <Dato label="Vendedor">{empleado?.persona.nombreCompleto ?? '—'}</Dato>
          <Dato label="Depósito">{deposito?.nombre ?? '—'}</Dato>
          <div>
            <span className="text-slate-400 block">Estado</span>
            <StatusBadge status={emitida ? 'Emitida' : 'Anulada'} />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3 text-center">Cantidad</th>
                <th className="py-2.5 px-3 text-right">Precio unit.</th>
                <th className="py-2.5 px-3 text-right">IVA</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {factura.detalles.map((d) => (
                <tr key={d.idDetalle}>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {productoPorId.has(d.idProducto) ? (productoPorId.get(d.idProducto)?.nombre ?? 'Producto dado de baja') : 'Cargando...'}
                  </td>
                  <td className="py-2.5 px-3 text-center">{d.cantidad}</td>
                  <td className="py-2.5 px-3 text-right">{formatMoney(d.precioUnitario)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{formatMoney(d.montoIva)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatMoney(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-end justify-end gap-6 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block">IVA incluido</span>
            <strong className="text-slate-700">{formatMoney(factura.totalIva)}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Total</span>
            <strong className="text-xl font-black text-slate-900">{formatMoney(factura.totalGeneral)}</strong>
          </div>
        </div>

        {accion.error && <FeedbackBanner>{accion.error}</FeedbackBanner>}

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {/* Dar de baja es solo para ADMIN (también lo exige ventas); el vendedor puede anular. */}
          {isAdmin ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={accion.loading}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() =>
              ejecutar(
                'Dar de baja',
                `¿Dar de baja la factura ${formatNumeroFactura(factura.numeroFactura)}? Dejará de aparecer en los listados${emitida ? ' y se devolverá el stock' : ''}.`,
                () => ventasApi.facturas.remove(factura.idFacturaVenta)
              )
            }
          >
            <Trash2 />
            <span>Dar de baja</span>
          </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {emitida ? (
              <>
                <Button variant="outline" size="sm" disabled={accion.loading} onClick={() => onEdit(factura.idFacturaVenta)}>
                  <Edit3 />
                  <span>Modificar</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={accion.loading}
                  onClick={() =>
                    ejecutar('Anular factura', `¿Anular la factura ${formatNumeroFactura(factura.numeroFactura)}? Se devolverá el stock a inventario.`, () =>
                      ventasApi.facturas.cambiarEstado(factura.idFacturaVenta, 'ANULADA')
                    )
                  }
                >
                  <Ban />
                  <span>Anular</span>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={accion.loading}
                onClick={() =>
                  ejecutar(
                    'Reemitir factura',
                    `¿Reemitir la factura ${formatNumeroFactura(factura.numeroFactura)}? Se volverá a descontar el stock.`,
                    () => ventasApi.facturas.cambiarEstado(factura.idFacturaVenta, 'EMITIDA'),
                    false
                  )
                }
              >
                <RotateCcw />
                <span>Reemitir</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </ModalDialog>
  );
};
