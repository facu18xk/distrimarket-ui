import { formatNumeroFactura } from '../../lib/paraguay';
import React from 'react';
import { Ban, Edit3, RotateCcw, Trash2 } from 'lucide-react';
import { FeedbackBanner, ModalDialog, StatusBadge } from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, useConfirm } from '../../hooks';
import { ventasApi } from '../../services';
import { formatDate, formatMoney } from '../../lib/format';
import type { FacturaVentaResponseDTO } from '../../types/api';
import { useApp } from '../../context/AppContext';

interface FacturaDetailModalProps {
  factura: FacturaVentaResponseDTO | null;
  onClose: () => void;
  /** Se llama después de anular, reemitir o dar de baja. */
  onChanged: () => void;
  onEdit: (factura: FacturaVentaResponseDTO) => void;
}

const Dato: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <span className="text-slate-400 block">{label}</span>
    <strong className="text-slate-800">{children}</strong>
  </div>
);

export const FacturaDetailModal: React.FC<FacturaDetailModalProps> = ({ factura, onClose, onChanged, onEdit }) => {
  const { isAdmin } = useApp();
  const accion = useAsyncAction();
  const confirm = useConfirm();

  if (!factura) return null;

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
      subtitle={`Timbrado ${factura.timbrado?.numeroTimbrado ?? '—'} · ${factura.medioPago?.nombre ?? '—'}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <Dato label="Cliente">{factura.cliente.persona.nombreCompleto}</Dato>
          <Dato label="Fecha">{formatDate(factura.fechaEmision)}</Dato>
          <Dato label="Vendedor">{factura.empleado?.persona?.nombreCompleto ?? `#${factura.empleado?.id ?? '—'}`}</Dato>
          <Dato label="Depósito">{factura.deposito?.nombre ?? `#${factura.deposito?.id ?? '—'}`}</Dato>
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
                    {d.nombreProducto ?? `Producto #${d.idProducto} (dado de baja)`}
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
                <Button variant="outline" size="sm" disabled={accion.loading} onClick={() => onEdit(factura)}>
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
