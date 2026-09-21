import React, { useState } from 'react';
import { ModalDialog } from '../common/ModalDialog';
import type { CompraItem } from '../../types/distrimarket';
import { StatusBadge } from '../common/StatusBadge';
import { ModalLinePagination } from '../common/ModalLinePagination';
import { Button } from '../ui/button';

interface CompraDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  compra: CompraItem | null;
}

const PAGE_SIZE = 3;

export const CompraDetailModal: React.FC<CompraDetailModalProps> = ({ isOpen, onClose, compra }) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (!compra) return null;

  const detalles = compra.detalles || [];
  const totalPages = Math.max(1, Math.ceil(detalles.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentSlice = detalles.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Compra ${compra.id}`}
      subtitle={`Comprobante: ${compra.numeroFactura}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">Proveedor:</span>
            <strong className="text-slate-800">{compra.proveedor}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Fecha:</span>
            <strong className="text-slate-800">{compra.fecha}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Responsable:</span>
            <strong className="text-slate-800">{compra.responsable}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Estado:</span>
            <StatusBadge status={compra.estado} />
          </div>
        </div>

        {/* Observation */}
        {compra.observaciones && (
          <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
            <span className="font-semibold text-amber-900">Nota:</span> {compra.observaciones}
          </p>
        )}

        {/* Lines */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Líneas de Factura ({detalles.length})
            </h4>
            <span className="text-[11px] text-slate-400">Página {currentPage} de {totalPages}</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden min-h-[145px] max-h-[145px] flex flex-col justify-between">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3 text-center">Cantidad</th>
                  <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentSlice.length > 0 ? (
                  currentSlice.map((d, i) => (
                    <tr key={i} className="h-[36px]">
                      <td className="py-2 px-3 font-semibold">{d.producto}</td>
                      <td className="py-2 px-3 text-center">{d.cantidad}</td>
                      <td className="py-2 px-3 text-right">${d.costoUnitario.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        ${d.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      Sin desglose de líneas cargado en este registro histórico.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <ModalLinePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={detalles.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            label="líneas"
          />
        </div>

        {/* Total Summary */}
        <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl">
          <span className="text-xs font-semibold uppercase tracking-wider">Monto Total Facturado:</span>
          <span className="text-lg font-black">${compra.total.toFixed(2)}</span>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cerrar Detalle
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
};
