import React, { useState } from 'react';
import { ArrowLeftRight, Plus, SlidersHorizontal } from 'lucide-react';
import {
  ActionButtons,
  FeedbackBanner,
  FormActions,
  FormField,
  LineItemsEditor,
  ModalDialog,
  DepositoBuscador,
  EmpleadoPicker,
  PagedTable,
  StatusBadge,
  fieldClass,
  type Column,
} from '../common';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, useDepositoAsignado, useEmpleadoPorDefecto, usePagedResource } from '../../hooks';
import { useApp } from '../../context/AppContext';
import { catalogos, depositosActivos, inventarioApi } from '../../services';
import { lineasADetalle, newLineItem, type LineItem } from '../../lib/lineItems';
import type { AjusteStockResponseDTO, DepositoResponseDTO, TipoAjuste, TransferenciaStockResponseDTO } from '../../types/api';

type Movimiento = 'ajuste' | 'transferencia';

const resumen = (detalles: { nombreProducto: string; cantidad: number }[]) =>
  detalles.map((d) => `${d.nombreProducto} ×${d.cantidad}`).join(', ');

const columnasAjustes: Column<AjusteStockResponseDTO>[] = [
  { header: 'N.º', cell: (a) => a.id, className: 'text-slate-500 w-16' },
  { header: 'Depósito', cell: (a) => a.nombreDeposito, className: 'font-bold text-slate-900' },
  {
    header: 'Tipo',
    cell: (a) => <Badge variant={a.tipoAjuste === 'POSITIVO' ? 'success' : 'warning'}>{a.tipoAjuste === 'POSITIVO' ? 'Entrada' : 'Salida'}</Badge>,
  },
  { header: 'Motivo', cell: (a) => a.motivo, className: 'text-slate-600' },
  { header: 'Productos', cell: (a) => resumen(a.detalles), className: 'text-slate-600 text-xs' },
  { header: 'Responsable', cell: (a) => a.nombreEmpleado, className: 'text-slate-600' },
];

const columnasTransferencias: Column<TransferenciaStockResponseDTO>[] = [
  { header: 'N.º', cell: (t) => t.id, className: 'text-slate-500 w-16' },
  { header: 'Origen', cell: (t) => t.nombreDepositoOrigen, className: 'font-bold text-slate-900' },
  { header: 'Destino', cell: (t) => t.nombreDepositoDestino, className: 'font-bold text-slate-900' },
  { header: 'Productos', cell: (t) => resumen(t.detalles), className: 'text-slate-600 text-xs' },
  { header: 'Responsable', cell: (t) => t.nombreEmpleado, className: 'text-slate-600' },
  { header: 'Estado', cell: (t) => <StatusBadge status={t.estado === 'COMPLETADO' ? 'Completado' : t.estado} /> },
];

/** Columna "Ver": abre el detalle con lo que ya trae la fila (no se vuelve a pedir). */
function columnaVer<T>(ver: (fila: T) => void): Column<T> {
  return { header: 'Acciones', align: 'center', cell: (fila) => <ActionButtons onView={() => ver(fila)} /> };
}

/** Detalle de un ajuste o una transferencia: cabecera y productos, desde la fila del listado. */
const DetalleMovimiento: React.FC<{
  movimiento: { detalles: { nombreProducto: string; cantidad: number }[] } | null;
  titulo: string;
  datos: [string, React.ReactNode][];
  onClose: () => void;
}> = ({ movimiento, titulo, datos, onClose }) => (
  <ModalDialog isOpen={movimiento !== null} onClose={onClose} title={titulo} maxWidth="lg">
    {movimiento && (
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="min-w-0">
              <span className="block text-slate-400">{etiqueta}</span>
              <strong className="block text-slate-800 truncate">{valor}</strong>
            </div>
          ))}
        </div>
        <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-2 px-3">Producto</th>
              <th className="py-2 px-3 w-24 text-right">Cantidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movimiento.detalles.map((d, i) => (
              <tr key={i}>
                <td className="py-1.5 px-3 font-semibold text-slate-800">{d.nombreProducto}</td>
                <td className="py-1.5 px-3 text-right">{d.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </ModalDialog>
);

type FiltroAjustes = { depositoId?: number };
type FiltroTransferencias = { depositoOrigenId?: number };

/** Filtro por depósito: el mismo buscador de los formularios, sobre el catálogo de depósitos. */
const FiltroDeposito: React.FC<{ value: DepositoResponseDTO | null; onChange: (deposito: DepositoResponseDTO | null) => void; depositos: DepositoResponseDTO[] | null; titulo: string; disabled?: boolean }> = ({
  value,
  onChange,
  depositos,
  titulo,
  disabled,
}) => (
  <div className="w-full sm:w-64">
    <DepositoBuscador depositos={depositos ?? []} value={value} onChange={onChange} disabled={disabled} placeholder={`${titulo}: todos (buscar...)`} />
  </div>
);

/** Ajustes: entradas y salidas de un depósito que no son compras ni ventas (merma, conteo, vencimiento). */
export const AjustesPanel: React.FC = () => {
  const asignado = useDepositoAsignado();
  const depositos = useAsyncData(catalogos.depositos);
  const [filtroElegido, setFiltro] = useState<DepositoResponseDTO | null>(null);
  // El depositero ve solo los ajustes de su depósito.
  const filtro = asignado ?? filtroElegido;
  const [detalle, setDetalle] = useState<AjusteStockResponseDTO | null>(null);
  const ajustes = usePagedResource<AjusteStockResponseDTO, FiltroAjustes>(inventarioApi.ajustes.list, {
    filters: filtro ? { depositoId: filtro.id } : undefined,
    sort: 'fechaCreacion,desc',
  });
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <PagedTable
        resource={ajustes}
        columns={[...columnasAjustes, columnaVer(setDetalle)]}
        rowKey={(a) => a.id}
        label="ajustes"
        searchPlaceholder="Buscar por depósito, motivo o responsable..."
        onRowClick={setDetalle}
        filters={
          <>
            <FiltroDeposito value={filtro} onChange={setFiltro} depositos={depositos.data} titulo="Depósito" disabled={Boolean(asignado)} />
            <Button variant="emerald" onClick={() => setFormOpen(true)}>
              <Plus />
              <span>Nuevo ajuste</span>
            </Button>
          </>
        }
      />
      <MovimientoFormModal tipo="ajuste" isOpen={formOpen} onClose={() => setFormOpen(false)} onSaved={ajustes.reload} />
      <DetalleMovimiento
        movimiento={detalle}
        titulo={detalle ? `Ajuste N.º ${detalle.id}` : ''}
        datos={detalle ? [['Depósito', detalle.nombreDeposito], ['Tipo', detalle.tipoAjuste === 'POSITIVO' ? 'Entrada' : 'Salida'], ['Motivo', detalle.motivo], ['Responsable', detalle.nombreEmpleado]] : []}
        onClose={() => setDetalle(null)}
      />
    </>
  );
};

/** Transferencias: mueven stock de un depósito a otro. */
export const TransferenciasPanel: React.FC = () => {
  // Transferir entre depósitos es solo de ADMIN; el depositero las consulta.
  const { isAdmin } = useApp();
  const [detalle, setDetalle] = useState<TransferenciaStockResponseDTO | null>(null);
  const depositos = useAsyncData(catalogos.depositos);
  const [origen, setOrigen] = useState<DepositoResponseDTO | null>(null);
  const transferencias = usePagedResource<TransferenciaStockResponseDTO, FiltroTransferencias>(inventarioApi.transferencias.list, {
    filters: origen ? { depositoOrigenId: origen.id } : undefined,
    sort: 'fechaCreacion,desc',
  });
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <PagedTable
        resource={transferencias}
        columns={[...columnasTransferencias, columnaVer(setDetalle)]}
        rowKey={(t) => t.id}
        label="transferencias"
        searchPlaceholder="Buscar por depósito o responsable..."
        onRowClick={setDetalle}
        filters={
          <>
            <FiltroDeposito value={origen} onChange={setOrigen} depositos={depositos.data} titulo="Origen" />
            {isAdmin && (
              <Button variant="emerald" onClick={() => setFormOpen(true)}>
                <Plus />
                <span>Nueva transferencia</span>
              </Button>
            )}
          </>
        }
      />
      <MovimientoFormModal tipo="transferencia" isOpen={formOpen} onClose={() => setFormOpen(false)} onSaved={transferencias.reload} />
      <DetalleMovimiento
        movimiento={detalle}
        titulo={detalle ? `Transferencia N.º ${detalle.id}` : ''}
        datos={detalle ? [['Origen', detalle.nombreDepositoOrigen], ['Destino', detalle.nombreDepositoDestino], ['Observación', detalle.observacion ?? '—'], ['Responsable', detalle.nombreEmpleado]] : []}
        onClose={() => setDetalle(null)}
      />
    </>
  );
};

interface MovimientoFormProps {
  tipo: Movimiento;
  onClose: () => void;
  onSaved: () => void;
}

const TEXTOS = {
  ajuste: {
    titulo: 'Nuevo ajuste de stock',
    subtitulo: 'Queda registrado y no se puede editar ni borrar después.',
    boton: 'Registrar ajuste',
  },
  transferencia: {
    titulo: 'Nueva transferencia',
    subtitulo: 'Descuenta del depósito de origen y suma en el de destino. No se puede deshacer.',
    boton: 'Transferir',
  },
} as const;

const MovimientoFormModal: React.FC<MovimientoFormProps & { isOpen: boolean }> = ({ isOpen, ...props }) => (
  <ModalDialog isOpen={isOpen} onClose={props.onClose} title={TEXTOS[props.tipo].titulo} subtitle={TEXTOS[props.tipo].subtitulo} maxWidth="4xl">
    <MovimientoForm {...props} />
  </ModalDialog>
);

/**
 * Formulario cabecera-detalle común a ajustes y transferencias: cambia la
 * cabecera (un depósito y un tipo, o dos depósitos) y el detalle es el mismo.
 * Depósitos: catálogo chico pedido al backend. Responsable y productos: selectores paginados.
 */
const MovimientoForm: React.FC<MovimientoFormProps> = ({ tipo, onClose, onSaved }) => {
  const depositos = useAsyncData(depositosActivos);
  const guardar = useAsyncAction();
  // El depositero ajusta siempre su depósito asignado (el backend también lo impone).
  const asignado = useDepositoAsignado();
  const [depositoElegido, setDeposito] = useState<DepositoResponseDTO | null>(null);
  const deposito = tipo === 'ajuste' && asignado ? asignado : depositoElegido;
  const [destino, setDestino] = useState<DepositoResponseDTO | null>(null);
  const [empleado, setEmpleado] = useEmpleadoPorDefecto();
  const [tipoAjuste, setTipoAjuste] = useState<TipoAjuste>('NEGATIVO');
  const [texto, setTexto] = useState('');
  const [lineas, setLineas] = useState<LineItem[]>([newLineItem()]);

  if (depositos.error) return <FeedbackBanner>{depositos.error}</FeedbackBanner>;
  if (!depositos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;
  const lista = depositos.data;

  const mismoDeposito = tipo === 'transferencia' && destino !== null && deposito !== null && destino.id === deposito.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismoDeposito || !empleado || !deposito) return;
    const detalles = lineasADetalle(lineas);
    const ok = await guardar.run(() =>
      tipo === 'ajuste'
        ? inventarioApi.ajustes.create({ idDeposito: deposito.id, idEmpleado: empleado.id, motivo: texto.trim(), tipoAjuste, detalles })
        : inventarioApi.transferencias.create({
          idDepositoOrigen: deposito.id,
          idDepositoDestino: destino!.id,
          idEmpleado: empleado.id,
          observacion: texto.trim() || undefined,
          detalles,
        })
    );
    if (ok) {
      onSaved();
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <FormField label={tipo === 'ajuste' ? 'Depósito' : 'Depósito de origen'} required>
          <DepositoBuscador required={!asignado} disabled={tipo === 'ajuste' && Boolean(asignado)} depositos={lista} value={deposito} onChange={setDeposito} />
        </FormField>

        {tipo === 'ajuste' ? (
          <FormField label="Tipo de ajuste" required>
            <select className={fieldClass} value={tipoAjuste} onChange={(e) => setTipoAjuste(e.target.value as TipoAjuste)}>
              <option value="NEGATIVO">Salida (resta stock)</option>
              <option value="POSITIVO">Entrada (suma stock)</option>
            </select>
          </FormField>
        ) : (
          <FormField label="Depósito de destino" required>
            <DepositoBuscador required depositos={lista} value={destino} onChange={setDestino} excluir={deposito ? [deposito.id] : []} />
          </FormField>
        )}

        <FormField label="Responsable" required>
          <EmpleadoPicker required value={empleado} onChange={setEmpleado} />
        </FormField>

        <FormField label={tipo === 'ajuste' ? 'Motivo' : 'Observación'} required={tipo === 'ajuste'}>
          <input
            className={fieldClass}
            required={tipo === 'ajuste'}
            maxLength={255}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={tipo === 'ajuste' ? 'Ej.: Merma, conteo físico, vencimiento' : 'Opcional'}
          />
        </FormField>
      </div>

      {mismoDeposito && <FeedbackBanner>El depósito de origen y el de destino no pueden ser el mismo.</FeedbackBanner>}

      <LineItemsEditor
        lines={lineas}
        onChange={setLineas}
        price="sin"
        // Lo que sale del depósito (transferencia o ajuste de salida) se controla contra su stock.
        deposito={{ idDeposito: deposito?.id ?? null, verificarStock: tipo === 'transferencia' || tipoAjuste === 'NEGATIVO' }}
      />

      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions
        onCancel={onClose}
        submitLabel={TEXTOS[tipo].boton}
        loading={guardar.loading}
        disabled={mismoDeposito}
        icon={tipo === 'ajuste' ? <SlidersHorizontal className="w-3.5 h-3.5" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
      />
    </form>
  );
};
