import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { ActionButtons, DepositoBuscador, FeedbackBanner, FormActions, FormField, ModalDialog, PagedTable, ProductoPicker, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, usePagedResource, useRemove } from '../../hooks';
import { catalogos, depositosActivos, inventarioApi } from '../../services';
import type { DepositoResponseDTO, ProductoResponseDTO, StockDepositoResponseDTO } from '../../types/api';

type FiltrosExistencia = { depositoId?: number };

/** Existencias: cuántas unidades de cada producto hay en cada depósito (10 por página, filtradas por depósito en el backend). */
export const ExistenciasPanel: React.FC = () => {
  const depositos = useAsyncData(catalogos.depositos);
  const [filtroDeposito, setFiltroDeposito] = useState<DepositoResponseDTO | null>(null);
  const existencias = usePagedResource<StockDepositoResponseDTO, FiltrosExistencia>(inventarioApi.stock.list, {
    filters: filtroDeposito ? { depositoId: filtroDeposito.id } : undefined,
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
      {baja.error && <FeedbackBanner className="mb-3">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={existencias}
        columns={columns}
        rowKey={(s) => s.id}
        label="existencias"
        filters={
          <>
            <div className="w-full sm:w-64">
              <DepositoBuscador
                depositos={depositos.data ?? []}
                value={filtroDeposito}
                onChange={setFiltroDeposito}
                placeholder="Todos los depósitos (buscar...)"
              />
            </div>
            <Button variant="emerald" onClick={() => abrir(null)}>
              <Plus />
              <span>Añadir existencia</span>
            </Button>
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
  const depositos = useAsyncData(depositosActivos);
  const guardar = useAsyncAction();
  // undefined = todavía no se eligió: al corregir, se propone el de la existencia.
  const [elegido, setElegido] = useState<DepositoResponseDTO | null | undefined>(undefined);
  const [producto, setProducto] = useState<ProductoResponseDTO | null>(null);
  const [cantidad, setCantidad] = useState(String(existencia?.cantidad ?? ''));

  if (depositos.error) return <FeedbackBanner>{depositos.error}</FeedbackBanner>;
  if (!depositos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;
  const propuesto = existencia?.idDeposito;
  const deposito =
    elegido !== undefined
      ? elegido
      : (depositos.data.find((d) => d.id === propuesto) ??
        (existencia ? { id: existencia.idDeposito, nombre: existencia.nombreDeposito ?? `Depósito #${existencia.idDeposito}`, estado: true } : null));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idProducto = existencia ? existencia.idProducto : producto?.id;
    if (!idProducto || !deposito) return;
    const request = { idDeposito: deposito.id, idProducto, cantidad: Number(cantidad) };
    const ok = await guardar.run(() =>
      existencia ? inventarioApi.stock.update(existencia.id, request) : inventarioApi.stock.create(request)
    );
    if (ok) {
      onSaved();
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField label="Depósito" required>
        <DepositoBuscador required disabled={Boolean(existencia)} depositos={depositos.data} value={deposito} onChange={setElegido} />
      </FormField>
      <FormField label="Producto" required>
        {existencia ? (
          <input className={fieldClass} disabled value={existencia.nombreProducto ?? `Producto #${existencia.idProducto}`} />
        ) : (
          <ProductoPicker required mostrarPrecio={false} value={producto} onChange={setProducto} />
        )}
      </FormField>
      <FormField label="Cantidad" required>
        <input className={fieldClass} type="number" min={0} required value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
      </FormField>

      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions onCancel={onClose} submitLabel="Guardar" loading={guardar.loading} icon={<Save className="w-3.5 h-3.5" />} />
    </form>
  );
};
