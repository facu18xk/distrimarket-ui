import React, { useState } from 'react';
import { ArrowLeftRight, Plus, SlidersHorizontal } from 'lucide-react';
import {
  FeedbackBanner,
  FormActions,
  FormField,
  LineItemsEditor,
  ModalDialog,
  PagedTable,
  StatusBadge,
  fieldClass,
  type Column,
} from '../common';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, useLocalPagedResource } from '../../hooks';
import { inventarioApi } from '../../services';
import { newLineItem, type LineItem } from '../../lib/lineItems';
import { empleadoPorDefecto, preferredId, rememberId } from '../../lib/preferences';
import { useApp } from '../../context/AppContext';
import type { AjusteStockResponseDTO, TipoAjuste, TransferenciaStockResponseDTO } from '../../types/api';
import { cargarAjustes, cargarCatalogosStock, cargarTransferencias } from './catalogos';

type Movimiento = 'ajuste' | 'transferencia';

/** "Leche x2, Queso x1" para mostrar el detalle en una celda. */
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

const buscarAjuste = (a: AjusteStockResponseDTO) => `${a.nombreDeposito} ${a.motivo} ${a.nombreEmpleado} ${resumen(a.detalles)}`;
const buscarTransferencia = (t: TransferenciaStockResponseDTO) =>
  `${t.nombreDepositoOrigen} ${t.nombreDepositoDestino} ${t.nombreEmpleado} ${t.observacion ?? ''} ${resumen(t.detalles)}`;

/** Ajustes: entradas y salidas de un depósito que no son compras ni ventas (merma, conteo, vencimiento). */
export const AjustesPanel: React.FC = () => {
  const ajustes = useLocalPagedResource(cargarAjustes, buscarAjuste);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <PagedTable
        resource={ajustes}
        columns={columnasAjustes}
        rowKey={(a) => a.id}
        label="ajustes"
        searchPlaceholder="Buscar por depósito, motivo, producto o responsable..."
        filters={
          <Button variant="emerald" onClick={() => setFormOpen(true)}>
            <Plus />
            <span>Nuevo ajuste</span>
          </Button>
        }
      />
      <MovimientoFormModal tipo="ajuste" isOpen={formOpen} onClose={() => setFormOpen(false)} onSaved={ajustes.reload} />
    </>
  );
};

/** Transferencias: mueven stock de un depósito a otro. */
export const TransferenciasPanel: React.FC = () => {
  const transferencias = useLocalPagedResource(cargarTransferencias, buscarTransferencia);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <PagedTable
        resource={transferencias}
        columns={columnasTransferencias}
        rowKey={(t) => t.id}
        label="transferencias"
        searchPlaceholder="Buscar por depósito, producto o responsable..."
        filters={
          <Button variant="emerald" onClick={() => setFormOpen(true)}>
            <Plus />
            <span>Nueva transferencia</span>
          </Button>
        }
      />
      <MovimientoFormModal tipo="transferencia" isOpen={formOpen} onClose={() => setFormOpen(false)} onSaved={transferencias.reload} />
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
  <ModalDialog isOpen={isOpen} onClose={props.onClose} title={TEXTOS[props.tipo].titulo} subtitle={TEXTOS[props.tipo].subtitulo} maxWidth="2xl">
    <MovimientoForm {...props} />
  </ModalDialog>
);

/**
 * Formulario cabecera-detalle común a ajustes y transferencias: cambia la
 * cabecera (un depósito y un tipo, o dos depósitos) y el detalle es el mismo.
 */
const MovimientoForm: React.FC<MovimientoFormProps> = ({ tipo, onClose, onSaved }) => {
  const { user } = useApp();
  const catalogos = useAsyncData(cargarCatalogosStock);
  const guardar = useAsyncAction();
  const [idDeposito, setIdDeposito] = useState<number | ''>('');
  const [idDestino, setIdDestino] = useState<number | ''>('');
  const [idEmpleado, setIdEmpleado] = useState<number | ''>('');
  const [tipoAjuste, setTipoAjuste] = useState<TipoAjuste>('NEGATIVO');
  const [texto, setTexto] = useState('');
  const [lineas, setLineas] = useState<LineItem[]>([newLineItem()]);

  if (catalogos.error) return <FeedbackBanner>{catalogos.error}</FeedbackBanner>;
  if (!catalogos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;
  const { depositos, empleados, productos } = catalogos.data;

  const deposito = idDeposito !== '' ? idDeposito : preferredId('deposito', depositos.map((d) => d.id));
  const empleado = idEmpleado !== '' ? idEmpleado : empleadoPorDefecto(user.idEmpleado, empleados.map((e) => e.id));
  const mismoDeposito = tipo === 'transferencia' && idDestino !== '' && idDestino === deposito;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismoDeposito) return;
    const detalles = lineas.map((l) => ({ idProducto: Number(l.idProducto), cantidad: l.cantidad }));
    const ok = await guardar.run(() =>
      tipo === 'ajuste'
        ? inventarioApi.ajustes.create({ idDeposito: Number(deposito), idEmpleado: Number(empleado), motivo: texto.trim(), tipoAjuste, detalles })
        : inventarioApi.transferencias.create({
            idDepositoOrigen: Number(deposito),
            idDepositoDestino: Number(idDestino),
            idEmpleado: Number(empleado),
            observacion: texto.trim() || undefined,
            detalles,
          })
    );
    if (ok) {
      rememberId('deposito', deposito);
      rememberId('empleado', empleado);
      onSaved();
      onClose();
    }
  };

  const selectorDeposito = (valor: number | '', onChange: (id: number | '') => void, conVacio: boolean) => (
    <select className={fieldClass} required value={valor} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}>
      {conVacio && <option value="">Seleccionar...</option>}
      {depositos.map((d) => (
        <option key={d.id} value={d.id}>
          {d.nombre}
        </option>
      ))}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={tipo === 'ajuste' ? 'Depósito' : 'Depósito de origen'} required>
          {selectorDeposito(deposito, setIdDeposito, false)}
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
            {selectorDeposito(idDestino, setIdDestino, true)}
          </FormField>
        )}

        <FormField label="Responsable" required>
          <select className={fieldClass} required value={empleado} onChange={(e) => setIdEmpleado(Number(e.target.value))}>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.persona.nombreCompleto} ({emp.cargo})
              </option>
            ))}
          </select>
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

      <LineItemsEditor lines={lineas} onChange={setLineas} productos={productos} price="sin" />

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
