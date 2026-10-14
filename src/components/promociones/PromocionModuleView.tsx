import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DataTable, FeedbackBanner, PaginationBar, SearchAndFilterBar, StatusBadge, type Column } from '../common';
import { Button } from '../ui/button';
import { formatDate } from '../../lib/format';
import { promocionService } from '../../services';
import type { PromocionItem } from '../../types';
import { PromocionFormModal } from './PromocionFormModal';

const PAGE_SIZE = 10;

const columns: Column<PromocionItem>[] = [
  { header: 'Promoción', cell: (p) => p.nombre, className: 'font-bold text-slate-900' },
  {
    header: 'Tipo',
    cell: (p) => <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">{p.tipo}</span>,
  },
  { header: 'Beneficio', cell: (p) => p.descuentoValor, className: 'font-black text-emerald-600' },
  { header: 'Vigencia', cell: (p) => `${formatDate(p.fechaInicio)} al ${formatDate(p.fechaFin)}`, className: 'text-slate-500 text-xs' },
  { header: 'Estado', cell: (p) => <StatusBadge status={p.estado} /> },
];

/**
 * Promociones todavía no tiene microservicio: los datos viven en memoria y la
 * búsqueda y la paginación se resuelven aquí. Cuando exista el servicio, esta
 * pantalla pasa a usePagedResource + PagedTable como el resto de los módulos.
 */
export const PromocionModuleView: React.FC = () => {
  const { promociones } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Una búsqueda nueva siempre empieza en la primera página.
  const buscar = (texto: string) => {
    setSearch(texto);
    setPage(1);
  };

  const resultado = useMemo(
    () => promocionService.getPromociones(promociones, { search, page, size: PAGE_SIZE }),
    [promociones, search, page]
  );

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto">
      <FeedbackBanner variant="info" className="mb-4">
        Las promociones todavía no se guardan en el servidor: se pierden al recargar la página.
      </FeedbackBanner>

      <SearchAndFilterBar placeholder="Buscar promoción por nombre o tipo..." searchValue={search} onSearchChange={buscar}>
        <Button variant="emerald" onClick={() => setModalOpen(true)}>
          <Plus />
          <span>Nueva promoción</span>
        </Button>
      </SearchAndFilterBar>

      <DataTable columns={columns} rows={resultado.content} rowKey={(p) => p.id} emptyMessage="No se encontraron promociones." />

      <PaginationBar
        currentPage={resultado.pageable.page}
        totalPages={resultado.pageable.totalPages}
        onPageChange={setPage}
        totalItems={resultado.pageable.totalElements}
        label="promociones"
      />

      <PromocionFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
