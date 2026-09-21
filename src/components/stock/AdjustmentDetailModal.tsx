import React, { useState } from 'react';
import { ModalDialog } from '../common/ModalDialog';
import { StockAdjustmentItem } from '../../types/distrimarket';
import { ModalLinePagination } from '../common/ModalLinePagination';
import { Button } from '../ui/button';

interface AdjustmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  adjustment: StockAdjustmentItem | null;
}

const PAGE_SIZE = 3;

export const AdjustmentDetailModal: React.FC<AdjustmentDetailModalProps> = ({
  isOpen,
  onClose,
  adjustment,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (!adjustment) return null;

  const detalles = adjustment.detalles || [];
  const totalPages = Math.max(1, Math.ceil(detalles.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentSlice = detalles.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Ajuste ${adjustment.id}`}
      subtitle={`Comprobante de movimiento interno: ${adjustment.motivo}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">Depósito:</span>
            <strong className="text-slate-900 font-bold">{adjustment.deposito || 'Depósito Central'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Tipo Movimiento:</span>
            <span
              className={`inline-block font-black px-2 py-0.5 rounded-md text-[11px] mt-0.5 ${
                adjustment.tipo === 'Entrada'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {adjustment.tipo}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Fecha Registro:</span>
            <strong className="text-slate-800">{adjustment.fecha}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Responsable:</span>
            <strong className="text-slate-800">{adjustment.responsable}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Líneas Afectadas:</span>
            <strong className="text-slate-800">{adjustment.productosAfectados} items</strong>
          </div>
        </div>

        {/* Breakdown table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Insumos Regularizados ({detalles.length})
            </h4>
            <span className="text-[11px] text-slate-400">Página {currentPage} de {totalPages}</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden min-h-[145px] max-h-[145px] flex flex-col justify-between">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Producto / Insumo</th>
                  <th className="py-2.5 px-3 text-center">Cantidad Ajustada</th>
                  <th className="py-2.5 px-3">Motivo Específico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentSlice.length > 0 ? (
                  currentSlice.map((d, i) => (
                    <tr key={i} className="h-[36px]">
                      <td className="py-2 px-3 font-semibold text-slate-900">{d.producto}</td>
                      <td className="py-2 px-3 text-center font-bold">
                        <span
                          className={
                            adjustment.tipo === 'Entrada' ? 'text-emerald-700' : 'text-rose-700'
                          }
                        >
                          {adjustment.tipo === 'Entrada' ? '+' : '-'} {d.cantidad}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-xs">{d.motivo}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">
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
