import React, { useState, useMemo } from 'react';
import { Plus, Receipt, Users, DollarSign, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { VentaSubTab, VentaItem } from '../../types';
import { SearchAndFilterBar, StatusBadge, ActionButtons, PaginationBar } from '../common';
import { Button } from '../ui/button';
import { VentaFormModal, VentaDetailModal, ClienteFormModal } from './';
import { ventaService } from '../../services';

export const VentaModuleView: React.FC = () => {
  const {
    ventas,
    clientes,
    ventaSubTab,
    setVentaSubTab,
    theme,
  } = useApp();

  const [ventaModalOpen, setVentaModalOpen] = useState(false);
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<VentaItem | null>(null);

  // Filters & search (Backend-driven)
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredVentas = useMemo(() => {
    return ventaService.getVentas(ventas, { search: searchQuery, size: 9999 }).content;
  }, [ventas, searchQuery]);

  const subTabs: { id: VentaSubTab; label: string }[] = [
    { id: 'ventas', label: 'Ventas' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'reportes', label: 'Reportes' },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto">
      {/* Sub-Nav Bar & Right Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3 mb-6">
        <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none">
          {subTabs.map((tab) => {
            const isActive = ventaSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setVentaSubTab(tab.id);
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
          {ventaSubTab === 'clientes' ? (
            <Button
              onClick={() => setClienteModalOpen(true)}
              variant="emerald"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Nuevo Cliente</span>
            </Button>
          ) : (
            <Button
              onClick={() => setVentaModalOpen(true)}
              variant="emerald"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Nueva Venta</span>
            </Button>
          )}
        </div>
      </div>

      {/* SUB-VIEW 1: VENTAS */}
      {ventaSubTab === 'ventas' && (
        <div className="flex-1 flex flex-col">
          <SearchAndFilterBar
            placeholder="Buscar venta por ID, cliente, mesa o estado..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            backendFilterLabel="Filtro en Backend (Query en servidor)"
          />

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">ID Venta</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Cliente / Referencia</th>
                    <th className="py-3 px-4">Canal</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredVentas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No se encontraron comprobantes de venta con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredVentas.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{v.id}</td>
                        <td className="py-3.5 px-4 text-slate-600">{v.fecha}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800">{v.cliente}</span>
                          <span className="text-xs text-slate-400 block">{v.referencia}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                            {v.tipoVenta}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          ${v.total.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={v.estado} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <ActionButtons
                            onView={() => setSelectedVenta(v)}
                            onEdit={() => setSelectedVenta(v)}
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
            totalPages={8}
            onPageChange={setCurrentPage}
            totalItems={filteredVentas.length}
            label="ventas"
          />
        </div>
      )}

      {/* SUB-VIEW 2: CLIENTES */}
      {ventaSubTab === 'clientes' && (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Directorio de Clientes y Fidelización</h3>
              <p className="text-xs text-slate-500">Historial de consumo y segmentos de clientes</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Nombre y Apellido</th>
                    <th className="py-3 px-4">Teléfono</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Dirección</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Total Consumido</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {clientes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.nombre}</td>
                      <td className="py-3.5 px-4 text-slate-600">{c.telefono}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">{c.email}</td>
                      <td className="py-3.5 px-4 text-slate-600">{c.direccion}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.tipo} />
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ${c.totalCompras.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <ActionButtons
                          onView={() => alert(`Cliente: ${c.nombre}\nTel: ${c.telefono}\nCompras: $${c.totalCompras}`)}
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
            totalItems={clientes.length}
            label="clientes"
          />
        </div>
      )}

      {/* SUB-VIEW 3: REPORTES */}
      {ventaSubTab === 'reportes' && (
        <div className="flex-1 flex flex-col space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Facturación Total del Mes</span>
              <p className="text-2xl font-black text-slate-900 mt-2">$14,230.00</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">+16.8% vs mes anterior</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Ticket Promedio</span>
              <p className="text-2xl font-black text-slate-900 mt-2">$42.50</p>
              <p className="text-xs text-slate-500 mt-1">335 transacciones registradas</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Canal Más Rentable</span>
              <p className="text-2xl font-black text-slate-900 mt-2">Salón / Mesa (64%)</p>
              <p className="text-xs text-slate-500 mt-1">Delivery representa el 36%</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <VentaFormModal isOpen={ventaModalOpen} onClose={() => setVentaModalOpen(false)} />
      <ClienteFormModal isOpen={clienteModalOpen} onClose={() => setClienteModalOpen(false)} />
      <VentaDetailModal
        isOpen={Boolean(selectedVenta)}
        onClose={() => setSelectedVenta(null)}
        venta={selectedVenta}
      />
    </div>
  );
};
