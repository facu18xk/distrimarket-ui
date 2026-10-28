import React, { useCallback, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { ActionButtons, DepositoBuscador, FeedbackBanner, FormActions, FormField, ModalDialog, PagedTable, ProductoPicker, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, useDepositoAsignado, usePagedResource, useRemove } from '../../hooks';
import { useApp } from '../../context/AppContext';
import { catalogos, depositosActivos, inventarioApi } from '../../services';
import type { DepositoResponseDTO, ProductoResponseDTO, StockDepositoResponseDTO } from '../../types/api';

type FiltrosExistencia = { depositoId?: number };

/**
 * Existencias: cuántas unidades de cada producto hay en cada depósito (10 por página). Se busca por
 * producto o depósito; quien tiene un depósito asignado (depositero) ve y opera solo el suyo.
 */
export const ExistenciasPanel: React.FC = () => {
  const { hasRole } = useApp();
  const puedeEditar = hasRole('ADMIN') || hasRole('DEPOSITERO');
  const asignado = useDepositoAsignado();
  // Con depósito asignado no hace falta el catálogo de depósitos (el filtro queda fijo).
  const cargarDepositos = useCallback(() => (asignado ? Promise.resolve([]) : catalogos.depositos()), [asignado]);
  const depositos = useAsyncData(cargarDepositos);
  const [filtroDeposito, setFiltroDeposito] = useState<DepositoResponseDTO | null>(null);
  const deposito = asignado ?? filtroDeposito;
  const existencias = usePagedResource<StockDepositoResponseDTO, FiltrosExistencia>(inventarioApi.stock.list, {
    filters: deposito ? { depositoId: deposito.id } : undefined,
  });
  const baja = useRemove(existencias.reload);
  const [formOpen, setFormOpen] = useState(false);
  const [enEdicion, setEnEdicion] = useState<StockDepositoResponseDTO | null>(null);

  const abrir = (existencia: StockDepositoResponseDTO | null) => {
    setEnEdicion(existencia);
    setFormOpen(true);
  };

  const columns: Column<StockDepositoResponseDTO>[] = [
    { header: 'Producto', cell: (s) => s.nombreProducto ?? '—', className: 'font-bold text-slate-900' },
    { header: 'Depósito', cell: (s) => s.nombreDeposito ?? '—', className: 'text-slate-600' },
    { header: 'Cantidad', align: 'right', cell: (s) => s.cantidad, className: 'font-black text-slate-900' },
    ...(puedeEditar
      ? [
          {
            header: 'Acciones',
            align: 'center' as const,
            cell: (s: StockDepositoResponseDTO) => (
              <ActionButtons
                onEdit={() => abrir(s)}
                onDelete={() =>
                  baja.remove(
                    {
                      title: 'Quitar existencia',
                      message: `¿Quitar el registro de "${s.nombreProducto}" en ${s.nombreDeposito}? Se pierde la cantidad cargada (${s.cantidad}).`,
                      confirmLabel: 'Quitar',
                    },
                    () => inventarioApi.stock.remove(s.id)
                  )
                }
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-3">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={existencias}
        columns={columns}
        rowKey={(s) => s.id}
        label="existencias"
        searchPlaceholder="Buscar por producto o depósito..."
        filters={
          <>
            <div className="w-full sm:w-64">
              <DepositoBuscador
                depositos={depositos.data ?? []}
                value={deposito}
                onChange={setFiltroDeposito}
                disabled={Boolean(asignado)}
                placeholder="Todos los depósitos (buscar...)"
              />
            </div>
            {puedeEditar && (
              <Button variant="emerald" onClick={() => abrir(null)}>
                <Plus />
                <span>Añadir existencia</span>
              </Button>
            )}
          </>
        }
      />

      <ModalDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={enEdicion ? 'Corregir cantidad' : 'Añadir existencia'}
        subtitle={
          enEdicion
            ? 'Para sumar o restar dejando registro, use un ajuste de stock.'
            : 'Carga inicial de un producto en un depósito donde todavía no tiene stock.'
        }
        maxWidth="md"
      >
        {enEdicion ? (
          <CorregirCantidad
            existencia={enEdicion}
            onClose={() => setFormOpen(false)}
            // La fila se reemplaza con la respuesta del PUT: no se vuelve a pedir la página.
            onSaved={(s) => existencias.replaceItem((row) => row.id === s.id, s)}
          />
        ) : (
          <NuevaExistencia onClose={() => setFormOpen(false)} onSaved={existencias.reload} />
        )}
      </ModalDialog>
    </>
  );
};

/**
 * Corregir la cantidad: la fila ya trae producto y depósito, así que no se pide nada antes de
 * guardar (solo el PUT).
 */
const CorregirCantidad: React.FC<{ existencia: StockDepositoResponseDTO; onClose: () => void; onSaved: (s: StockDepositoResponseDTO) => void }> = ({
  existencia,
  onClose,
  onSaved,
}) => {
  const guardar = useAsyncAction();
  const [cantidad, setCantidad] = useState(String(existencia.cantidad));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let actualizada: StockDepositoResponseDTO | null = null;
    const ok = await guardar.run(async () => {
      actualizada = await inventarioApi.stock.update(existencia.id, {
        idDeposito: existencia.idDeposito,
        idProducto: existencia.idProducto,
        cantidad: Number(cantidad),
      });
    });
    if (ok && actualizada) {
      onSaved(actualizada);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="min-w-0">
          <span className="block text-slate-500">Producto</span>
          <strong className="block text-slate-900 truncate">{existencia.nombreProducto ?? `Producto #${existencia.idProducto}`}</strong>
        </div>
        <div className="min-w-0">
          <span className="block text-slate-500">Depósito</span>
          <strong className="block text-slate-900 truncate">{existencia.nombreDeposito ?? `Depósito #${existencia.idDeposito}`}</strong>
        </div>
      </div>
      <FormField label="Cantidad" required>
        <input className={fieldClass} type="number" min={0} required value={cantidad} onChange={(e) => setCantidad(e.target.value)} autoFocus />
      </FormField>

      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions onCancel={onClose} submitLabel="Guardar" loading={guardar.loading} icon={<Save className="w-3.5 h-3.5" />} />
    </form>
  );
};

/** Alta de existencia: depósito (el asignado, o se busca) y producto (selector paginado). */
const NuevaExistencia: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const asignado = useDepositoAsignado();
  const cargar = useCallback(() => (asignado ? Promise.resolve([]) : depositosActivos()), [asignado]);
  const depositos = useAsyncData(cargar);
  const guardar = useAsyncAction();
  const [elegido, setElegido] = useState<DepositoResponseDTO | null>(null);
  const [producto, setProducto] = useState<ProductoResponseDTO | null>(null);
  const [cantidad, setCantidad] = useState('');
  const deposito = asignado ?? elegido;

  if (depositos.error) return <FeedbackBanner>{depositos.error}</FeedbackBanner>;
  if (!depositos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto || !deposito) return;
    const ok = await guardar.run(() => inventarioApi.stock.create({ idDeposito: deposito.id, idProducto: producto.id, cantidad: Number(cantidad) }));
    if (ok) {
      onSaved();
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Depósito" required hint={asignado ? 'Su depósito asignado.' : undefined}>
        <DepositoBuscador required={!asignado} disabled={Boolean(asignado)} depositos={depositos.data} value={deposito} onChange={setElegido} />
      </FormField>
      <FormField label="Producto" required>
        <ProductoPicker required mostrarPrecio={false} value={producto} onChange={setProducto} />
      </FormField>
      <FormField label="Cantidad" required>
        <input className={fieldClass} type="number" min={0} required value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
      </FormField>

      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions onCancel={onClose} submitLabel="Guardar" loading={guardar.loading} icon={<Save className="w-3.5 h-3.5" />} />
    </form>
  );
};
