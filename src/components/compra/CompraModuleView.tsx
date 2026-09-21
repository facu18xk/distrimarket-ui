import React, { useState, useMemo } from 'react';
import { Plus, ShoppingBag, Truck, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { CompraSubTab, CompraItem, CompraStatus } from '../../types';
import { SearchAndFilterBar, StatusBadge, ActionButtons, PaginationBar } from '../common';
import { Button } from '../ui/button';
import { CompraFormModal, CompraDetailModal, ProveedorFormModal } from './';
import { compraService } from '../../services';

export const CompraModuleView: React.FC = () => {
  const {
    compras,
    proveedores,
    compraSubTab,
    setCompraSubTab,
    theme,
  } = useApp();

  const [compraModalOpen, setCompraModalOpen] = useState(false);
  const [proveedorModalOpen, setProveedorModalOpen] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<CompraItem | null>(null);

  // Search query (Backend filtered)
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCompras = useMemo(() => {
    return compraService.getCompras(compras, { search: searchQuery, size: 9999 }).content;
  }, [compras, searchQuery]);

  const subTabs: { id: CompraSubTab; label: string }[] = [
    { id: 'compras', label: 'Compras' },
    { id: 'proveedores', label: 'Proveedores' },
    { id: 'reportes', label: 'Reportes' },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto">
      {/* Sub-Nav Bar & Right Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3 mb-6">
        <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none">
          {subTabs.map((tab) => {
            const isActive = compraSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCompraSubTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2.5">
          {compraSubTab === 'proveedores' ? (
            <Button
              onClick={() => setProveedorModalOpen(true)}
              variant="emerald"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Nuevo Proveedor</span>
            </Button>
          ) : (
            <Button
              onClick={() => setCompraModalOpen(true)}
              variant="emerald"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Nueva Compra</span>
            </Button>
          )}
        </div>
      </div>

      {/* SUB-VIEW 1: COMPRAS */}
      {compraSubTab === 'compras' && (
        <div className="flex-1 flex flex-col">
          <SearchAndFilterBar
            placeholder="Buscar compra por ID, proveedor, timbrado o estado..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            backendFilterLabel="Filtro en Backend (Query en servidor)"
          />

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">ID Compra</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Factura / Timbrado</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredCompras.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No se encontraron compras registradas con estos filtros.
                      </td>
                    </tr>
                  ) : (
                    filteredCompras.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{c.id}</td>
                        <td className="py-3.5 px-4 text-slate-600">{c.fecha}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{c.proveedor}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{c.numeroFactura}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          ${c.total.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={c.estado} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <ActionButtons
                            onView={() => setSelectedCompra(c)}
                            onEdit={() => setSelectedCompra(c)}
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
            totalPages={6}
            onPageChange={setCurrentPage}
            totalItems={filteredCompras.length}
            label="compras"
          />
        </div>
      )}

      {/* SUB-VIEW 2: PROVEEDORES */}
      {compraSubTab === 'proveedores' && (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Directorio de Proveedores</h3>
              <p className="text-xs text-slate-500">Gestión de distribuidores, CUIT y datos de contacto</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Razón Social</th>
                    <th className="py-3 px-4">RUC / CUIT</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Teléfono</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {proveedores.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.nombre}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{p.ruc}</td>
                      <td className="py-3.5 px-4 text-slate-700">{p.contactoPrincipal}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.telefono}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">{p.email}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.estado ? 'Óptimo' : 'Crítico'} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <ActionButtons
                          onView={() => alert(`Proveedor: ${p.nombre}\nDirección: ${p.direccion}\nContacto: ${p.contactoPrincipal}`)}
                          showDelete={false}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar
            currentPage={1}
            totalPages={1}
            onPageChange={() => { }}
            totalItems={proveedores.length}
            label="proveedores"
          />
        </div>
      )}

      {/* SUB-VIEW 3: REPORTES */}
      {compraSubTab === 'reportes' && (
        <div className="flex-1 flex flex-col space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Compras Totales del Mes</span>
              <p className="text-2xl font-black text-slate-900 mt-2">$8,450.00</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">+8.5% vs mes anterior</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Órdenes Pendientes</span>
              <p className="text-2xl font-black text-amber-600 mt-2">
                {compras.filter((c) => c.estado === 'Pendiente').length} facturas
              </p>
              <p className="text-xs text-slate-500 mt-1">Esperando ingreso a depósito</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Proveedor Principal</span>
              <p className="text-2xl font-black text-slate-900 mt-2">Distribuidora Estrella</p>
              <p className="text-xs text-slate-500 mt-1">45% del volumen de insumos</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CompraFormModal isOpen={compraModalOpen} onClose={() => setCompraModalOpen(false)} />
      <ProveedorFormModal isOpen={proveedorModalOpen} onClose={() => setProveedorModalOpen(false)} />
      <CompraDetailModal
        isOpen={Boolean(selectedCompra)}
        onClose={() => setSelectedCompra(null)}
        compra={selectedCompra}
      />
    </div>
  );
};
