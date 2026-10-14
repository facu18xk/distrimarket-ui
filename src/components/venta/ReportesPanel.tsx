import React, { useCallback, useState } from 'react';
import { FileDown } from 'lucide-react';
import { DataTable, FeedbackBanner, FormField, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useApp } from '../../context/AppContext';
import { useAsyncData } from '../../hooks';
import { inventarioApi, ventasApi, type FacturaVentaFilters } from '../../services';
import { formatDate, formatMoney, todayIso } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { EstadoFacturaVenta, FacturaVentaResponseDTO } from '../../types/api';

/** Tope de facturas que suma el reporte; si el período tiene más, se avisa. */
const MAX_FACTURAS = 500;
const POR_PAGINA = 100;

interface Filtros {
  fechaDesde: string;
  fechaHasta: string;
  estado: EstadoFacturaVenta | '';
  idCliente: number | '';
  idEmpleado: number | '';
  idDeposito: number | '';
}

interface Grupo {
  nombre: string;
  cantidad: number;
  total: number;
}

interface Reporte {
  incompleto: boolean;
  emitidas: number;
  totalVendido: number;
  totalIva: number;
  anuladas: number;
  totalAnulado: number;
  porDia: Grupo[];
  porProducto: Grupo[];
  porCliente: Grupo[];
  porVendedor: Grupo[];
  porMedioPago: Grupo[];
}

/** Suma facturas (o unidades) y montos bajo un mismo nombre. */
function agrupar<T>(items: T[], nombre: (item: T) => string, cantidad: (item: T) => number, total: (item: T) => number): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const item of items) {
    const clave = nombre(item);
    const grupo = grupos.get(clave) ?? { nombre: clave, cantidad: 0, total: 0 };
    grupos.set(clave, { nombre: clave, cantidad: grupo.cantidad + cantidad(item), total: grupo.total + total(item) });
  }
  return [...grupos.values()];
}

const porTotal = (a: Grupo, b: Grupo) => b.total - a.total;

/** El backend filtra por fecha, estado, cliente, vendedor y depósito; aquí solo se agrupa. */
async function cargarReporte(filtros: Filtros): Promise<Reporte> {
  const consulta: FacturaVentaFilters = {
    fechaDesde: filtros.fechaDesde,
    fechaHasta: filtros.fechaHasta,
    estado: filtros.estado || undefined,
    idCliente: filtros.idCliente || undefined,
    idEmpleado: filtros.idEmpleado || undefined,
    idDeposito: filtros.idDeposito || undefined,
  };

  const facturas: FacturaVentaResponseDTO[] = [];
  let pagina = 1;
  let totalPaginas: number;
  do {
    const resultado = await ventasApi.facturas.list({ page: pagina, size: POR_PAGINA }, consulta);
    facturas.push(...resultado.content);
    totalPaginas = resultado.totalPages;
    pagina += 1;
  } while (pagina <= totalPaginas && facturas.length < MAX_FACTURAS);

  // Los montos y rankings son de lo efectivamente vendido; lo anulado se informa aparte.
  const emitidas = facturas.filter((f) => f.estado === 'EMITIDA');
  const anuladas = facturas.filter((f) => f.estado === 'ANULADA');
  const lineas = emitidas.flatMap((f) => f.detalles);

  return {
    incompleto: pagina <= totalPaginas,
    emitidas: emitidas.length,
    totalVendido: emitidas.reduce((suma, f) => suma + f.totalGeneral, 0),
    totalIva: emitidas.reduce((suma, f) => suma + f.totalIva, 0),
    anuladas: anuladas.length,
    totalAnulado: anuladas.reduce((suma, f) => suma + f.totalGeneral, 0),
    porDia: agrupar(emitidas, (f) => f.fechaEmision, () => 1, (f) => f.totalGeneral).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    porProducto: agrupar(lineas, (d) => d.nombreProducto ?? `Producto #${d.idProducto}`, (d) => d.cantidad, (d) => d.subtotal),
    porCliente: agrupar(emitidas, (f) => f.cliente.persona.nombreCompleto, () => 1, (f) => f.totalGeneral).sort(porTotal),
    porVendedor: agrupar(emitidas, (f) => f.empleado?.persona?.nombreCompleto ?? `Empleado #${f.empleado?.id ?? '—'}`, () => 1, (f) => f.totalGeneral).sort(porTotal),
    porMedioPago: agrupar(emitidas, (f) => f.medioPago?.nombre ?? '—', () => 1, (f) => f.totalGeneral).sort(porTotal),
  };
}

async function cargarOpciones() {
  const [clientes, empleados, depositos] = await Promise.all([
    ventasApi.clientes.all(),
    inventarioApi.empleados.all(),
    inventarioApi.depositos.all(),
  ]);
  return { clientes, empleados, depositos };
}

const primerDiaDelMes = () => `${todayIso().slice(0, 8)}01`;

const Indicador: React.FC<{ titulo: string; valor: string; nota?: string }> = ({ titulo, valor, nota }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:shadow-none">
    <span className="text-[11px] font-semibold text-slate-500 uppercase">{titulo}</span>
    <p className="text-xl font-black text-slate-900 mt-1.5">{valor}</p>
    {nota && <p className="text-xs text-slate-500 mt-1">{nota}</p>}
  </div>
);

/** Columnas de un ranking: nombre, cantidad (facturas o unidades) y total. */
const columnas = (nombre: string, cantidad: string, mostrarNombre: (g: Grupo) => string = (g) => g.nombre): Column<Grupo>[] => [
  { header: nombre, cell: mostrarNombre, className: 'font-bold text-slate-900' },
  { header: cantidad, align: 'center', cell: (g) => g.cantidad },
  { header: 'Total', align: 'right', cell: (g) => formatMoney(g.total), className: 'font-black text-slate-900' },
];

const Seccion: React.FC<{ titulo: string; filas: Grupo[]; columns: Column<Grupo>[] }> = ({ titulo, filas, columns }) => (
  <div className="break-inside-avoid">
    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">{titulo}</h4>
    <DataTable columns={columns} rows={filas} rowKey={(g) => g.nombre} emptyMessage="Sin ventas con estos filtros." />
  </div>
);

const idONada = (value: string): number | '' => (value === '' ? '' : Number(value));

/**
 * Reporte de ventas: totales, anulaciones, ventas por día y rankings de
 * productos, clientes, vendedores y medios de pago, con filtros.
 * "Exportar a PDF" usa la impresión del navegador (Guardar como PDF).
 */
export const ReportesPanel: React.FC = () => {
  const { user } = useApp();
  const [filtros, setFiltros] = useState<Filtros>({
    fechaDesde: primerDiaDelMes(),
    fechaHasta: todayIso(),
    estado: '',
    idCliente: '',
    idEmpleado: '',
    idDeposito: '',
  });
  const [top, setTop] = useState(10);
  const [ordenProductos, setOrdenProductos] = useState<'total' | 'cantidad'>('total');
  const set = (cambios: Partial<Filtros>) => setFiltros((actual) => ({ ...actual, ...cambios }));
  const rangoValido = filtros.fechaDesde <= filtros.fechaHasta;

  const opciones = useAsyncData(cargarOpciones);
  const cargar = useCallback(() => cargarReporte(filtros), [filtros]);
  const reporte = useAsyncData(cargar, rangoValido);
  const datos = reporte.data;

  const filtro = cn(fieldClass, 'bg-white');

  const productos = datos
    ? [...datos.porProducto].sort((a, b) => (ordenProductos === 'total' ? b.total - a.total : b.cantidad - a.cantidad)).slice(0, top)
    : [];

  // Lo que se filtró, en palabras, para el encabezado del PDF.
  const cliente = opciones.data?.clientes.find((c) => c.idCliente === filtros.idCliente);
  const vendedor = opciones.data?.empleados.find((e) => e.id === filtros.idEmpleado);
  const deposito = opciones.data?.depositos.find((d) => d.id === filtros.idDeposito);
  const descripcion = [
    `Período: ${formatDate(filtros.fechaDesde)} al ${formatDate(filtros.fechaHasta)}`,
    filtros.estado ? `Estado: ${filtros.estado === 'EMITIDA' ? 'Emitidas' : 'Anuladas'}` : null,
    cliente ? `Cliente: ${cliente.persona.nombreCompleto}` : null,
    vendedor ? `Vendedor: ${vendedor.persona.nombreCompleto}` : null,
    deposito ? `Depósito: ${deposito.nombre}` : null,
  ].filter(Boolean);

  return (
    <div className="flex-1 flex flex-col space-y-5">
      {/* ---- Filtros (no salen en el PDF) ---- */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
        <FormField label="Desde">
          <input className={filtro} type="date" value={filtros.fechaDesde} max={filtros.fechaHasta} onChange={(e) => set({ fechaDesde: e.target.value })} />
        </FormField>
        <FormField label="Hasta">
          <input className={filtro} type="date" value={filtros.fechaHasta} min={filtros.fechaDesde} onChange={(e) => set({ fechaHasta: e.target.value })} />
        </FormField>
        <FormField label="Estado">
          <select className={filtro} value={filtros.estado} onChange={(e) => set({ estado: e.target.value as EstadoFacturaVenta | '' })}>
            <option value="">Todas</option>
            <option value="EMITIDA">Emitidas</option>
            <option value="ANULADA">Anuladas</option>
          </select>
        </FormField>
        <FormField label="Cliente">
          <select className={filtro} value={filtros.idCliente} onChange={(e) => set({ idCliente: idONada(e.target.value) })}>
            <option value="">Todos</option>
            {opciones.data?.clientes.map((c) => (
              <option key={c.idCliente} value={c.idCliente}>
                {c.persona.nombreCompleto}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Vendedor">
          <select className={filtro} value={filtros.idEmpleado} onChange={(e) => set({ idEmpleado: idONada(e.target.value) })}>
            <option value="">Todos</option>
            {opciones.data?.empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.persona.nombreCompleto}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Depósito">
          <select className={filtro} value={filtros.idDeposito} onChange={(e) => set({ idDeposito: idONada(e.target.value) })}>
            <option value="">Todos</option>
            {opciones.data?.depositos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </FormField>
        <Button variant="default" className="h-9" onClick={() => window.print()} disabled={!datos || reporte.loading}>
          <FileDown />
          <span>Exportar a PDF</span>
        </Button>
      </div>

      {/* ---- Encabezado que solo sale en el PDF ---- */}
      <div className="hidden print:block">
        <h2 className="text-xl font-black text-slate-900">DistriMarket — Reporte de ventas</h2>
        <p className="text-xs text-slate-600 mt-1">{descripcion.join(' · ')}</p>
        <p className="text-[11px] text-slate-400">
          Generado el {formatDate(todayIso())} por {user.name}
        </p>
      </div>

      {!rangoValido && <FeedbackBanner>La fecha "Desde" no puede ser posterior a "Hasta".</FeedbackBanner>}
      {reporte.error && <FeedbackBanner>{reporte.error}</FeedbackBanner>}
      {reporte.loading && <p className="text-xs text-slate-400 print:hidden">Calculando...</p>}
      {datos?.incompleto && (
        <FeedbackBanner variant="info">
          El período tiene más de {MAX_FACTURAS} facturas; el reporte muestra solo las primeras. Acote las fechas para verlo completo.
        </FeedbackBanner>
      )}

      {datos && (
        <div className={cn('space-y-6', reporte.loading && 'opacity-50')}>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Indicador titulo="Total vendido" valor={formatMoney(datos.totalVendido)} nota={`IVA incluido: ${formatMoney(datos.totalIva)}`} />
            <Indicador titulo="Facturas emitidas" valor={String(datos.emitidas)} />
            <Indicador titulo="Ticket promedio" valor={formatMoney(datos.emitidas ? datos.totalVendido / datos.emitidas : 0)} />
            <Indicador titulo="Facturas anuladas" valor={String(datos.anuladas)} nota={`Por ${formatMoney(datos.totalAnulado)}`} />
            <Indicador
              titulo="Tasa de anulación"
              valor={`${datos.emitidas + datos.anuladas ? Math.round((datos.anuladas * 100) / (datos.emitidas + datos.anuladas)) : 0}%`}
              nota="Sobre el total de facturas"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="break-inside-avoid">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Productos más vendidos</h4>
                <div className="flex items-center gap-2 print:hidden">
                  <select className={cn(filtro, 'w-auto py-1 text-xs')} value={ordenProductos} onChange={(e) => setOrdenProductos(e.target.value as 'total' | 'cantidad')}>
                    <option value="total">Por monto</option>
                    <option value="cantidad">Por unidades</option>
                  </select>
                  <select className={cn(filtro, 'w-auto py-1 text-xs')} value={top} onChange={(e) => setTop(Number(e.target.value))}>
                    <option value={5}>Top 5</option>
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                  </select>
                </div>
              </div>
              <DataTable columns={columnas('Producto', 'Unidades')} rows={productos} rowKey={(g) => g.nombre} emptyMessage="Sin ventas con estos filtros." />
            </div>

            <Seccion titulo="Mejores clientes" filas={datos.porCliente.slice(0, top)} columns={columnas('Cliente', 'Facturas')} />
            <Seccion titulo="Ventas por vendedor" filas={datos.porVendedor} columns={columnas('Vendedor', 'Facturas')} />
            <Seccion titulo="Ventas por medio de pago" filas={datos.porMedioPago} columns={columnas('Medio de pago', 'Facturas')} />
          </div>

          <Seccion titulo="Ventas por día" filas={datos.porDia} columns={columnas('Fecha', 'Facturas', (g) => formatDate(g.nombre))} />
        </div>
      )}
    </div>
  );
};
