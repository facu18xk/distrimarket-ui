import React, { useState } from 'react';
import { ArrowRightLeft, Building, MapPin } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import type { StockMovementItem } from '../../types/distrimarket';
import { StatusBadge } from '../common/StatusBadge';
import { ModalLinePagination } from '../common/ModalLinePagination';
import { Button } from '../ui/button';

interface TransferDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: StockMovementItem | null;
}

const PAGE_SIZE = 3;

export const TransferDetailModal: React.FC<TransferDetailModalProps> = ({
  isOpen,
  onClose,
  movement,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (!movement) return null;

  const rawDetalles =
    movement.detalles && movement.detalles.length > 0
      ? movement.detalles
      : [{ producto: movement.producto, cantidad: movement.cantidad, unidad: movement.unidad }];

  const totalPages = Math.max(1, Math.ceil(rawDetalles.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentSlice = rawDetalles.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Remito de Transferencia ${movement.id}`}
      subtitle={`Movimiento entre depósitos: ${movement.depOrigen} → ${movement.depDestino}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Origin / Destination Banner */}
        <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Origen</span>
              <strong className="text-xs sm:text-sm">{movement.depOrigen}</strong>
            </div>
          </div>

          <ArrowRightLeft className="w-5 h-5 text-emerald-400 mx-2 shrink-0" />

          <div className="flex items-center space-x-2 text-right">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Destino</span>
              <strong className="text-xs sm:text-sm">{movement.depDestino}</strong>
            </div>
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">Fecha Despacho:</span>
            <strong className="text-slate-800">{movement.fecha}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Responsable:</span>
            <strong className="text-slate-800">{movement.responsable}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Estado:</span>
            <StatusBadge status={movement.estado} />
          </div>
          <div>
            <span className="text-slate-400 block">Total Insumos:</span>
            <strong className="text-slate-800">
              {rawDetalles.length} producto(s)
            </strong>
          </div>
        </div>

        {movement.observaciones && (
          <p className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
            <span className="font-semibold text-amber-900">Nota de traslado:</span> {movement.observaciones}
          </p>
        )}

        {/* Breakdown table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Insumos Incluidos en el Remito ({rawDetalles.length})
            </h4>
            <span className="text-[11px] text-slate-400">Página {currentPage} de {totalPages}</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden min-h-[145px] max-h-[145px] flex flex-col justify-between">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Producto / Insumo</th>
                  <th className="py-2.5 px-3 text-center">Cantidad Despachada</th>
                  <th className="py-2.5 px-3 text-center">Unidad de Medida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentSlice.map((d, i) => (
                  <tr key={i} className="h-[36px]">
                    <td className="py-2 px-3 font-semibold text-slate-900">{d.producto}</td>
                    <td className="py-2 px-3 text-center font-black text-slate-900">
                      {d.cantidad}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700 text-[11px]">
                        {d.unidad}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ModalLinePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={rawDetalles.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            label="insumos"
          />
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
