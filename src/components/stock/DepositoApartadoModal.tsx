import React, { useState } from 'react';
import { Warehouse, Package, SlidersHorizontal, ArrowRightLeft, MapPin, Calendar, CheckCircle2, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/button';
import type { DepositoItem, ProductItem, StockAdjustmentItem, StockMovementItem } from '../../types';

interface DepositoApartadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposito: DepositoItem | null;
  products: ProductItem[];
  adjustments: StockAdjustmentItem[];
  movements: StockMovementItem[];
  onOpenProductModal: () => void;
  onOpenAdjustmentModal: () => void;
  onOpenTransferModal: () => void;
  onViewAdjustment: (adj: StockAdjustmentItem) => void;
  onViewTransfer: (mov: StockMovementItem) => void;
}

export const DepositoApartadoModal: React.FC<DepositoApartadoModalProps> = ({
  isOpen,
  onClose,
  deposito,
  products,
  adjustments,
  movements,
  onOpenProductModal,
  onOpenAdjustmentModal,
  onOpenTransferModal,
  onViewAdjustment,
  onViewTransfer,
}) => {
  const [activeTab, setActiveTab] = useState<'inventario' | 'ajustes' | 'transferencias'>('inventario');
  const [searchInDep, setSearchInDep] = useState('');

  if (!deposito) return null;

  // Filter entities specific to this warehouse
  const depProducts = products.filter((p) => p.deposito.toLowerCase() === deposito.nombre.toLowerCase());
  const depAdjustments = adjustments.filter(
    (a) => a.deposito && a.deposito.toLowerCase() === deposito.nombre.toLowerCase()
  );
  const depMovements = movements.filter(
    (m) =>
      m.depOrigen.toLowerCase() === deposito.nombre.toLowerCase() ||
      m.depDestino.toLowerCase() === deposito.nombre.toLowerCase()
  );

  // Filtered products within this warehouse
  const filteredProducts = depProducts.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchInDep.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchInDep.toLowerCase())
  );

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Apartado del Depósito: ${deposito.nombre}`}
      subtitle={`Gestión integral de existencias, ajustes propios y transferencias entre almacenes.`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Header Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{deposito.nombre}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{deposito.direccion}</span>
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Alta: {deposito.fechaCreacion}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-right px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Insumos</span>
              <span className="text-sm font-black text-slate-900">{depProducts.length} tipos</span>
            </div>
            <div className="text-right px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ajustes</span>
              <span className="text-sm font-black text-slate-900">{depAdjustments.length} regs</span>
            </div>
            <div className="text-right px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Movimientos</span>
              <span className="text-sm font-black text-slate-900">{depMovements.length}</span>
            </div>
          </div>
        </div>

        {/* 3 Internal Tabs for Depósito: Inventario | Ajustes | Transferencias */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('inventario')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${activeTab === 'inventario'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Package className="w-4 h-4" />
              <span>1. Inventario Propio ({depProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ajustes')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${activeTab === 'ajustes'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>2. Ajustes Propios ({depAdjustments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('transferencias')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${activeTab === 'transferencias'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>3. Transferencias ({depMovements.length})</span>
            </button>
          </div>

          {/* Quick action according to current tab */}
          <div>
            {activeTab === 'inventario' && (
              <Button onClick={onOpenProductModal} size="sm" variant="emerald">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>+ Insumo</span>
              </Button>
            )}
            {activeTab === 'ajustes' && (
              <Button onClick={onOpenAdjustmentModal} size="sm" className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                <span>+ Ajuste</span>
              </Button>
            )}
            {activeTab === 'transferencias' && (
              <Button onClick={onOpenTransferModal} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                <span>+ Transferir</span>
              </Button>
            )}
          </div>
        </div>

        {/* TAB 1 CONTENT: INVENTARIO PROPIO */}
        {activeTab === 'inventario' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder={`Buscar en ${deposito.nombre}...`}
                value={searchInDep}
                onChange={(e) => setSearchInDep(e.target.value)}
                className="w-full max-w-sm px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-slate-400"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                Existencias físicas en este almacén
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider z-10">
                    <tr>
                      <th className="py-2.5 px-3">Insumo</th>
                      <th className="py-2.5 px-3">Categoría</th>
                      <th className="py-2.5 px-3 text-right">Stock Actual</th>
                      <th className="py-2.5 px-3 text-right">Precio Venta</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No hay productos registrados en {deposito.nombre}.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-bold text-slate-900">{p.nombre}</td>
                          <td className="py-2 px-3 text-slate-500">{p.categoria}</td>
                          <td className="py-2 px-3 text-right font-black text-slate-800">
                            {p.cantidad} <span className="text-[11px] font-normal text-slate-500">{p.unidad}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-700">
                            ${p.precioVenta.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <StatusBadge status={p.estado} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 CONTENT: AJUSTES PROPIOS DEL DEPÓSITO */}
        {activeTab === 'ajustes' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Ajustes de inventario (mermas, roturas, ingresos extraordinarios) exclusivos de <strong>{deposito.nombre}</strong>.
            </p>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider z-10">
                    <tr>
                      <th className="py-2.5 px-3">ID Ajuste</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Motivo</th>
                      <th className="py-2.5 px-3 text-center">Insumos</th>
                      <th className="py-2.5 px-3">Responsable</th>
                      <th className="py-2.5 px-3 text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {depAdjustments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          No hay ajustes registrados en {deposito.nombre}.
                        </td>
                      </tr>
                    ) : (
                      depAdjustments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-bold text-slate-900">{a.id}</td>
                          <td className="py-2 px-3 text-slate-600">{a.fecha}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${a.tipo === 'Entrada'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                                }`}
                            >
                              {a.tipo === 'Entrada' ? '+ Entrada' : '- Salida'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-700">{a.motivo}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{a.productosAfectados}</td>
                          <td className="py-2 px-3 text-slate-600">{a.responsable}</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => onViewAdjustment(a)}
                              className="text-[11px] text-orange-600 hover:text-orange-700 font-bold underline"
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 CONTENT: TRANSFERENCIAS (MOVIMIENTOS ENTRE DEPÓSITOS) */}
        {activeTab === 'transferencias' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Transferencias de stock donde <strong>{deposito.nombre}</strong> participa como emisor o receptor.
            </p>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider z-10">
                    <tr>
                      <th className="py-2.5 px-3">ID Remito</th>
                      <th className="py-2.5 px-3">Dirección</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Insumos / Cantidad</th>
                      <th className="py-2.5 px-3">Dep. Origen</th>
                      <th className="py-2.5 px-3">Dep. Destino</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                      <th className="py-2.5 px-3 text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {depMovements.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          No hay transferencias registradas con {deposito.nombre}.
                        </td>
                      </tr>
                    ) : (
                      depMovements.map((m) => {
                        const isOutgoing = m.depOrigen.toLowerCase() === deposito.nombre.toLowerCase();
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 font-bold text-slate-900">{m.id}</td>
                            <td className="py-2 px-3">
                              {isOutgoing ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  <ArrowUpRight className="w-3 h-3 mr-1" />
                                  Salida (Emisor)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                  <ArrowDownLeft className="w-3 h-3 mr-1" />
                                  Entrada (Receptor)
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{m.fecha}</td>
                            <td className="py-2 px-3 text-slate-800 font-medium">
                              {m.producto} ({m.cantidad} {m.unidad})
                            </td>
                            <td className="py-2 px-3 text-slate-600">{m.depOrigen}</td>
                            <td className="py-2 px-3 text-slate-600">{m.depDestino}</td>
                            <td className="py-2 px-3 text-center">
                              <StatusBadge status={m.estado} />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => onViewTransfer(m)}
                                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold underline"
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <Button onClick={onClose} variant="outline" size="sm">
            Cerrar Apartado
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
};
