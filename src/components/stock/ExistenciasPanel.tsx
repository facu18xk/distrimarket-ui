import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { ActionButtons, FeedbackBanner, FormActions, FormField, ModalDialog, PagedTable, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, useLocalPagedResource, useRemove } from '../../hooks';
import { inventarioApi } from '../../services';
import { preferredId, rememberId } from '../../lib/preferences';
import type { StockDepositoResponseDTO } from '../../types/api';
import { cargarCatalogosStock, cargarExistencias } from './catalogos';

const textoDeBusqueda = (s: StockDepositoResponseDTO) => `${s.nombreProducto ?? ''} ${s.nombreDeposito ?? ''}`;

/** Existencias: cuántas unidades de cada producto hay en cada depósito. */
export const ExistenciasPanel: React.FC = () => {
  const existencias = useLocalPagedResource(cargarExistencias, textoDeBusqueda);
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
    {
      header: 'Acciones',
      align: 'center',
      cell: (s) => (
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
  ];

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-4">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={existencias}
        columns={columns}
        rowKey={(s) => s.id}
        label="existencias"
        searchPlaceholder="Buscar por producto o depósito..."
        filters={
          <Button variant="emerald" onClick={() => abrir(null)}>
            <Plus />
            <span>Añadir existencia</span>
          </Button>
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
        <ExistenciaForm existencia={enEdicion} onClose={() => setFormOpen(false)} onSaved={existencias.reload} />
      </ModalDialog>
    </>
  );
};

interface ExistenciaFormProps {
  existencia: StockDepositoResponseDTO | null;
  onClose: () => void;
  onSaved: () => void;
}

const ExistenciaForm: React.FC<ExistenciaFormProps> = ({ existencia, onClose, onSaved }) => {
  const catalogos = useAsyncData(cargarCatalogosStock);
  const guardar = useAsyncAction();
  const [idDeposito, setIdDeposito] = useState<number | ''>(existencia?.idDeposito ?? '');
  const [idProducto, setIdProducto] = useState<number | ''>(existencia?.idProducto ?? '');
  const [cantidad, setCantidad] = useState(String(existencia?.cantidad ?? ''));

  if (catalogos.error) return <FeedbackBanner>{catalogos.error}</FeedbackBanner>;
  if (!catalogos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;
  const { depositos, productos } = catalogos.data;
  const deposito = idDeposito !== '' ? idDeposito : preferredId('deposito', depositos.map((d) => d.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const request = { idDeposito: Number(deposito), idProducto: Number(idProducto), cantidad: Number(cantidad) };
    const ok = await guardar.run(() =>
      existencia ? inventarioApi.stock.update(existencia.id, request) : inventarioApi.stock.create(request)
    );
    if (ok) {
      rememberId('deposito', deposito);
      onSaved();
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Depósito" required>
        <select className={fieldClass} required disabled={Boolean(existencia)} value={deposito} onChange={(e) => setIdDeposito(Number(e.target.value))}>
          {depositos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Producto" required>
        <select
          className={fieldClass}
          required
          disabled={Boolean(existencia)}
          value={idProducto}
          onChange={(e) => setIdProducto(e.target.value === '' ? '' : Number(e.target.value))}
        >
          <option value="">Seleccionar producto...</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Cantidad" required>
        <input className={fieldClass} type="number" min={0} required value={cantidad} onChange={(e) => setCantidad(e.target.value)} autoFocus />
      </FormField>

      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions onCancel={onClose} submitLabel="Guardar" loading={guardar.loading} icon={<Save className="w-3.5 h-3.5" />} />
    </form>
  );
};
