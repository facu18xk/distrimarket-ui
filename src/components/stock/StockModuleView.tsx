import React, { useState, useMemo, useEffect } from 'react';
import { Plus, SlidersHorizontal, ArrowRightLeft, Warehouse, TrendingUp, AlertTriangle, MapPin, Building2, ExternalLink, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StockSubTab, ProductItem, StockAdjustmentItem, StockMovementItem, DepositoItem } from '../../types';
import { SearchAndFilterBar, StatusBadge, ActionButtons, PaginationBar } from '../common';
import { Button } from '../ui/button';
import {
  ProductFormModal,
  AdjustmentFormModal,
  TransferMovementModal,
  AdjustmentDetailModal,
  TransferDetailModal,
  DepositoApartadoModal,
} from './';
import { stockService } from '../../services';

export const StockModuleView: React.FC = () => {
  const {
    products,
    deleteProduct,
    adjustments,
    movements,
    depositos,
    stockSubTab,
    setStockSubTab,
    selectedDeposito,
    setSelectedDeposito,
    theme,
  } = useApp();

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustmentItem | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<StockMovementItem | null>(null);
  const [apartadoDeposito, setApartadoDeposito] = useState<DepositoItem | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transferFilterType, setTransferFilterType] = useState<'todos' | 'salidas' | 'entradas'>('todos');
  const [adjustmentFilterDep, setAdjustmentFilterDep] = useState<string>('todos');

  // Sync adjustmentFilterDep with selectedDeposito if it changes and is not 'todos'
  useEffect(() => {
    if (selectedDeposito && selectedDeposito !== 'todos') {
      setAdjustmentFilterDep(selectedDeposito);
    } else {
      setAdjustmentFilterDep('todos');
    }
  }, [selectedDeposito]);

  // Active sub-tab resolution (unifying 'movimientos' with 'transferencias')
  const currentTab = (stockSubTab as string) === 'movimientos' ? 'transferencias' : stockSubTab;

  // Deposit object currently selected (if any)
  const currentDepositoObj = useMemo(() => {
    if (!selectedDeposito || selectedDeposito === 'todos') return null;
    return depositos.find((d) => d.nombre.toLowerCase() === selectedDeposito.toLowerCase()) || null;
  }, [depositos, selectedDeposito]);

  // Filtered Products via Stock Service (filtered by deposit)
  const filteredProducts = useMemo(() => {
    return stockService.getProducts(products, { search: searchQuery, size: 9999 }, selectedDeposito).content;
  }, [products, searchQuery, selectedDeposito]);

  // Filtered Adjustments via Stock Service (filtered by deposit)
  const filteredAdjustments = useMemo(() => {
    return stockService.getAdjustments(adjustments, { search: searchQuery, size: 9999 }, adjustmentFilterDep).content;
  }, [adjustments, searchQuery, adjustmentFilterDep]);

  // Filtered Movements / Transfers (filtered by direction & deposit)
  const filteredMovements = useMemo(() => {
    let list = movements;
    if (selectedDeposito && selectedDeposito !== 'todos') {
      if (transferFilterType === 'salidas') {
        list = list.filter((m) => m.depOrigen.toLowerCase() === selectedDeposito.toLowerCase());
      } else if (transferFilterType === 'entradas') {
        list = list.filter((m) => m.depDestino.toLowerCase() === selectedDeposito.toLowerCase());
      } else {
        list = list.filter(
          (m) =>
            m.depOrigen.toLowerCase() === selectedDeposito.toLowerCase() ||
            m.depDestino.toLowerCase() === selectedDeposito.toLowerCase()
        );
      }
    }
    return stockService.getMovements(list, { search: searchQuery, size: 9999 }).content;
  }, [movements, searchQuery, selectedDeposito, transferFilterType]);

  const subTabs: { id: StockSubTab; label: string }[] = [
    { id: 'inventario', label: 'Inventario por Depósito' },
    { id: 'ajustes', label: 'Ajustes de Stock' },
    { id: 'transferencias', label: 'Transferencias' },
    { id: 'depositos', label: 'Depósitos' },
    { id: 'reporte', label: 'Reporte' },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto">
      {/* Sub-Nav Bar & Right Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-3 mb-5">
        {/* Sub-tabs list */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none">
          {subTabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStockSubTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <Button
            onClick={() => setAdjustmentModalOpen(true)}
            className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ajuste de Stock</span>
          </Button>

          <Button
            onClick={() => setTransferModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transferir Stock</span>
          </Button>

          <Button
            onClick={() => setProductModalOpen(true)}
            variant="emerald"
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Nuevo Producto</span>
          </Button>
        </div>
      </div>

      {/* PROMINENT DEPOSIT SELECTOR BAR - "El inventario es por cada deposito, se debe elegir cual ver" */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 mb-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Selector buttons per deposit */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Warehouse className="w-3.5 h-3.5 text-slate-400" />
              Depósito:
            </span>

            {depositos.map((dep) => {
              const isSelected = selectedDeposito.toLowerCase() === dep.nombre.toLowerCase();
              const countInDep = products.filter((p) => p.deposito.toLowerCase() === dep.nombre.toLowerCase()).length;
              return (
                <button
                  key={dep.id}
                  onClick={() => {
                    setSelectedDeposito(dep.nombre);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{dep.nombre}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-orange-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {countInDep}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => {
                setSelectedDeposito('todos');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDeposito === 'todos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              Todos los Depósitos ({products.length})
            </button>
          </div>

          {/* Contextual link to Apartado del Depósito */}
          {currentDepositoObj ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right text-xs">
                <span className="text-slate-400 block text-[10px]">Ubicación física:</span>
                <span className="font-semibold text-slate-700">{currentDepositoObj.direccion}</span>
              </div>
              <button
                onClick={() => setApartadoDeposito(currentDepositoObj)}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                title="Ver apartado detallado con inventario, ajustes y transferencias de este depósito"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Apartado Completo</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500">
              Visualizando inventario consolidado de toda la red de depósitos.
            </span>
          )}
        </div>
      </div>

      {/* SUB-VIEW 1: INVENTARIO POR DEPÓSITO */}
      {currentTab === 'inventario' && (
        <div className="flex-1 flex flex-col">
          {/* Header Info of the Active Deposit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {selectedDeposito === 'todos'
                  ? 'Inventario Consolidado (Todos los Depósitos)'
                  : `Inventario en ${selectedDeposito}`}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'insumo' : 'insumos'}
              </span>
            </div>
            {selectedDeposito !== 'todos' && (
              <span className="text-xs text-slate-500">
                Mostrando únicamente insumos físicos almacenados en <strong>{selectedDeposito}</strong>
              </span>
            )}
          </div>

          {/* Search Input */}
          <SearchAndFilterBar
            placeholder={
              selectedDeposito === 'todos'
                ? 'Buscar por insumo, categoría o depósito...'
                : `Buscar insumos en ${selectedDeposito}...`
            }
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            backendFilterLabel="Filtro en Backend (Query en servidor)"
          />

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Insumo</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Depósito</th>
                    <th className="py-3 px-4">Último Precio</th>
                    <th className="py-3 px-4">Precio Venta</th>
                    <th className="py-3 px-4">Cantidad</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <Warehouse className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">
                          {selectedDeposito === 'todos'
                            ? 'No se encontraron insumos con los filtros seleccionados.'
                            : `No hay insumos registrados en ${selectedDeposito}.`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Puedes agregar insumos con el botón superior "+ Nuevo Producto".
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.nombre}</td>
                        <td className="py-3.5 px-4 text-slate-600">{p.categoria}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 px-2 py-0.5 rounded-md bg-slate-100 text-xs">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {p.deposito}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          ${p.ultimoPrecio.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          ${p.precioVenta.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{p.cantidad}</span>{' '}
                          <span className="text-slate-500 text-xs">{p.unidad}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={p.estado} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <ActionButtons
                            onView={() => alert(`Insumo: ${p.nombre}\nStock: ${p.cantidad} ${p.unidad}\nDepósito: ${p.deposito}`)}
                            onDelete={() => deleteProduct(p.id)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filteredProducts.length / 8))}
            onPageChange={setCurrentPage}
            totalItems={filteredProducts.length}
            label="productos"
          />
        </div>
      )}

      {/* SUB-VIEW 2: AJUSTES DE STOCK (PROPIOS DE UN DEPÓSITO) */}
      {currentTab === 'ajustes' && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Ajustes de Inventario por Depósito</h3>
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-full">
                  Propio de cada depósito
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mermas, roturas, bajas y recuentos físicos asignados individualmente a un depósito
              </p>
            </div>

            {/* Filter by Deposit for Adjustments */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filtrar depósito:</span>
              <select
                value={adjustmentFilterDep}
                onChange={(e) => setAdjustmentFilterDep(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-xs focus:outline-hidden focus:border-slate-400"
              >
                <option value="todos">Todos los depósitos</option>
                {depositos.map((d) => (
                  <option key={d.id} value={d.nombre}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar for Adjustments */}
          <SearchAndFilterBar
            placeholder="Buscar ajuste por ID, motivo o responsable..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            backendFilterLabel="Filtro en Backend"
          />

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">ID Ajuste</th>
                    <th className="py-3 px-4">Depósito Afectado</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Motivo</th>
                    <th className="py-3 px-4">Insumos</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No se encontraron ajustes de stock para este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredAdjustments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{a.id}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200/60 text-xs">
                            <Building2 className="w-3.5 h-3.5 text-orange-600" />
                            {a.deposito || 'Depósito Central'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{a.fecha}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              a.tipo === 'Entrada'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {a.tipo === 'Entrada' ? '+ Entrada' : '- Salida'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">{a.motivo}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {a.productosAfectados} {a.productosAfectados === 1 ? 'insumo' : 'insumos'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{a.responsable}</td>
                        <td className="py-3.5 px-4 text-center">
                          <ActionButtons
                            onView={() => setSelectedAdjustment(a)}
                            showDelete={false}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filteredAdjustments.length / 8))}
            onPageChange={setCurrentPage}
            totalItems={filteredAdjustments.length}
            label="ajustes"
          />
        </div>
      )}

      {/* SUB-VIEW 3: TRANSFERENCIAS (MOVIMIENTOS ENTRE DEPÓSITOS UNIFICADO) */}
      {currentTab === 'transferencias' && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Transferencias entre Depósitos</h3>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-full">
                  Movimientos Internos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Traslado físico de stock entre almacenes: trazabilidad de origen y destino
              </p>
            </div>

            {/* Filter by flow direction if a deposit is active */}
            {selectedDeposito !== 'todos' && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setTransferFilterType('todos')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    transferFilterType === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({selectedDeposito})
                </button>
                <button
                  onClick={() => setTransferFilterType('salidas')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    transferFilterType === 'salidas' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3 text-amber-600" />
                  Salidas
                </button>
                <button
                  onClick={() => setTransferFilterType('entradas')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    transferFilterType === 'entradas' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-3 h-3 text-blue-600" />
                  Entradas
                </button>
              </div>
            )}
          </div>

          <SearchAndFilterBar
            placeholder="Buscar transferencia por insumo, responsable, origen o destino..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            backendFilterLabel="Filtro en Backend"
          />

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">ID Remito</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Insumos Trasladados</th>
                    <th className="py-3 px-4">Cantidad</th>
                    <th className="py-3 px-4">Dep. Origen (Emisor)</th>
                    <th className="py-3 px-4">Dep. Destino (Receptor)</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No se encontraron transferencias con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const isOriginActive = selectedDeposito && m.depOrigen.toLowerCase() === selectedDeposito.toLowerCase();
                      const isDestActive = selectedDeposito && m.depDestino.toLowerCase() === selectedDeposito.toLowerCase();

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{m.id}</td>
                          <td className="py-3.5 px-4 text-slate-600">{m.fecha}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{m.producto}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900">{m.cantidad}</span> {m.unidad}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-md ${
                                isOriginActive ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.depOrigen}
                              {isOriginActive && <ArrowUpRight className="w-3 h-3 text-amber-700" />}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-md ${
                                isDestActive ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.depDestino}
                              {isDestActive && <ArrowDownLeft className="w-3 h-3 text-blue-700" />}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">{m.responsable}</td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={m.estado} />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <ActionButtons
                              onView={() => setSelectedMovement(m)}
                              showDelete={false}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filteredMovements.length / 8))}
            onPageChange={setCurrentPage}
            totalItems={filteredMovements.length}
            label="transferencias"
          />
        </div>
      )}

      {/* SUB-VIEW 4: DEPÓSITOS (APARTADOS POR DEPÓSITO) */}
      {currentTab === 'depositos' && (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Almacenes y Depósitos Registrados</h3>
              <p className="text-xs text-slate-500">
                Selecciona un depósito para ver su inventario, ajustes y transferencias dedicadas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {depositos.map((dep) => {
              const depProds = products.filter((p) => p.deposito.toLowerCase() === dep.nombre.toLowerCase());
              const depAdjs = adjustments.filter((a) => a.deposito && a.deposito.toLowerCase() === dep.nombre.toLowerCase());
              const depTrans = movements.filter(
                (m) =>
                  m.depOrigen.toLowerCase() === dep.nombre.toLowerCase() ||
                  m.depDestino.toLowerCase() === dep.nombre.toLowerCase()
              );

              return (
                <div
                  key={dep.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                        <Warehouse className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                        Activo
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{dep.nombre}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{dep.direccion}</span>
                    </p>

                    {/* Breakdown counts */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Insumos</span>
                        <span className="text-xs font-black text-slate-800">{depProds.length}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Ajustes</span>
                        <span className="text-xs font-black text-slate-800">{depAdjs.length}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Transfer.</span>
                        <span className="text-xs font-black text-slate-800">{depTrans.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick actions for this deposit */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <Button
                      onClick={() => setApartadoDeposito(dep)}
                      variant="outline"
                      className="w-full text-xs font-bold border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      <span>Abrir Apartado del Depósito</span>
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedDeposito(dep.nombre);
                          setStockSubTab('inventario');
                        }}
                        className="text-[11px] font-bold py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-center"
                      >
                        Ver Inventario
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDeposito(dep.nombre);
                          setStockSubTab('ajustes');
                        }}
                        className="text-[11px] font-bold py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-center"
                      >
                        Ver Ajustes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: REPORTE */}
      {currentTab === 'reporte' && (
        <div className="flex-1 flex flex-col space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Valuación Total de Stock</span>
              <p className="text-2xl font-black text-slate-900 mt-2">$24,850.00</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">+12.4% vs mes anterior</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Insumos en Estado Crítico</span>
              <p className="text-2xl font-black text-rose-600 mt-2">
                {products.filter((p) => p.estado === 'Crítico').length} productos
              </p>
              <p className="text-xs text-rose-500 font-medium mt-1">Requieren orden de compra urgente</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Transferencias del Mes</span>
              <p className="text-2xl font-black text-slate-900 mt-2">142 operaciones</p>
              <p className="text-xs text-slate-500 mt-1">98% completados sin discrepancia</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Insumos Próximos a Agotarse (Punto de Reorden)</span>
            </h4>
            <div className="space-y-3">
              {products
                .filter((p) => p.estado === 'Crítico' || p.estado === 'Bajo')
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.nombre}</p>
                      <p className="text-[11px] text-slate-500">{item.deposito} • {item.categoria}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-slate-800">
                        {item.cantidad} {item.unidad}
                      </span>
                      <StatusBadge status={item.estado} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal isOpen={productModalOpen} onClose={() => setProductModalOpen(false)} />
      <AdjustmentFormModal isOpen={adjustmentModalOpen} onClose={() => setAdjustmentModalOpen(false)} />
      <TransferMovementModal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} />
      <AdjustmentDetailModal
        isOpen={Boolean(selectedAdjustment)}
        onClose={() => setSelectedAdjustment(null)}
        adjustment={selectedAdjustment}
      />
      <TransferDetailModal
        isOpen={Boolean(selectedMovement)}
        onClose={() => setSelectedMovement(null)}
        movement={selectedMovement}
      />
      <DepositoApartadoModal
        isOpen={Boolean(apartadoDeposito)}
        onClose={() => setApartadoDeposito(null)}
        deposito={apartadoDeposito}
        products={products}
        adjustments={adjustments}
        movements={movements}
        onOpenProductModal={() => {
          if (apartadoDeposito) setSelectedDeposito(apartadoDeposito.nombre);
          setProductModalOpen(true);
        }}
        onOpenAdjustmentModal={() => {
          if (apartadoDeposito) setSelectedDeposito(apartadoDeposito.nombre);
          setAdjustmentModalOpen(true);
        }}
        onOpenTransferModal={() => {
          setTransferModalOpen(true);
        }}
        onViewAdjustment={(adj) => setSelectedAdjustment(adj)}
        onViewTransfer={(mov) => setSelectedMovement(mov)}
      />
    </div>
  );
};
