import React, { useState, useMemo } from 'react';
import { Plus, Tag, Gift, Percent } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PromocionItem, PromocionStatus } from '../../types';
import { SearchAndFilterBar, StatusBadge, ActionButtons, PaginationBar } from '../common';
import { Button } from '../ui/button';
import { PromocionFormModal } from './';
import { promocionService } from '../../services';

export const PromocionModuleView: React.FC = () => {
  const { promociones, theme } = useApp();
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  // Search query (Backend-driven)
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPromos = useMemo(() => {
    return promocionService.getPromociones(promociones, { search: searchQuery, size: 9999 }).content;
  }, [promociones, searchQuery]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto">
      {/* Sub-Nav Bar & Right Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3 mb-6">
        <div className="flex items-center space-x-1 sm:space-x-4">
          <button className="py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 text-white shadow-xs">
            Promociones Activas
          </button>
        </div>

        <Button
          onClick={() => setPromoModalOpen(true)}
          variant="emerald"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Nueva Promoción</span>
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <SearchAndFilterBar
          placeholder="Buscar promoción por nombre, tipo o estado..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          backendFilterLabel="Filtro en Backend (Query en servidor)"
        />

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Promoción / Campaña</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Beneficio</th>
                  <th className="py-3 px-4">Vigencia</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredPromos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se encontraron promociones con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredPromos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{p.nombre}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          {p.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600">{p.descuentoValor}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {p.fechaInicio} al {p.fechaFin}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.estado} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <ActionButtons
                          onView={() => alert(`Promoción: ${p.nombre}\nBeneficio: ${p.descuentoValor}\nFechas: ${p.fechaInicio} a ${p.fechaFin}`)}
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
          totalPages={2}
          onPageChange={setCurrentPage}
          totalItems={filteredPromos.length}
          label="promociones"
        />
      </div>

      <PromocionFormModal isOpen={promoModalOpen} onClose={() => setPromoModalOpen(false)} />
    </div>
  );
};
