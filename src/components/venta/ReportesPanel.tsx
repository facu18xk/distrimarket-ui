import React, { useCallback, useState } from 'react';
import { FileDown } from 'lucide-react';
import { ClienteSelector, DataTable, EmpleadoPicker, FeedbackBanner, FormField, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useApp } from '../../context/AppContext';
import { useAsyncData } from '../../hooks';
import { catalogos, inventarioApi, ventasApi, type FacturaVentaFilters } from '../../services';
import { indexar } from '../../lib/catalogCache';
import { enTandas } from '../../lib/tandas';
import { formatDate, formatMoney, todayIso } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { ClienteResponseDTO, EmpleadoResponseDTO, EstadoFacturaVenta, FacturaVentaResumenDTO } from '../../types/api';

/** Tope de facturas que suma el reporte; si el período tiene más, se avisa. */
const MAX_FACTURAS = 500;
/** Cabeceras por pedido: el reporte las recorre de a páginas, nunca todas de una vez. */
const POR_PAGINA = 50;

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
  anuladas: number;
  totalAnulado: number;
  porDia: Grupo[];
  porCliente: Grupo[];
  porVendedor: Grupo[];
  porMedioPago: Grupo[];
}

/** Suma facturas y montos bajo un mismo nombre. */
function agrupar<T>(items: T[], nombre: (item: T) => string, total: (item: T) => number): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const item of items) {
    const clave = nombre(item);
    const grupo = grupos.get(clave) ?? { nombre: clave, cantidad: 0, total: 0 };
    grupos.set(clave, { nombre: clave, cantidad: grupo.cantidad + 1, total: grupo.total + total(item) });
  }
  return [...grupos.values()];
}

const porTotal = (a: Grupo, b: Grupo) => b.total - a.total;

/**
 * El backend filtra por fecha, estado, cliente, vendedor y depósito y devuelve cabeceras, que
 * aquí se agrupan. Solo se usan cabeceras: no se pide cada factura por separado. El nombre de
 * cada vendedor distinto se pide una vez por id; los medios de pago salen del catálogo chico.
 */
async function cargarReporte(filtros: Filtros): Promise<Reporte> {
  const consulta: FacturaVentaFilters = {
    fechaDesde: filtros.fechaDesde,
    fechaHasta: filtros.fechaHasta,
    estado: filtros.estado || undefined,
    idCliente: filtros.idCliente || undefined,
    idEmpleado: filtros.idEmpleado || undefined,
    idDeposito: filtros.idDeposito || undefined,
  };

  const facturas: FacturaVentaResumenDTO[] = [];
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

  const idsVendedores = [...new Set(emitidas.map((f) => f.idEmpleado).filter((id): id is number => Boolean(id)))];
  const [vendedores, mediosPago] = await Promise.all([
    enTandas(idsVendedores, inventarioApi.empleados.ref),
    catalogos.mediosPago(),
  ]);
  const vendedorPorId = new Map(vendedores.filter((par): par is readonly [number, EmpleadoResponseDTO] => par[1] !== null));
  const medioPagoPorId = indexar(mediosPago, (m) => m.idMedioPago);

  return {
    incompleto: pagina <= totalPaginas,
    emitidas: emitidas.length,
    totalVendido: emitidas.reduce((suma, f) => suma + f.totalGeneral, 0),
    anuladas: anuladas.length,
    totalAnulado: anuladas.reduce((suma, f) => suma + f.totalGeneral, 0),
    porDia: agrupar(emitidas, (f) => f.fechaEmision, (f) => f.totalGeneral).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    porCliente: agrupar(emitidas, (f) => f.clienteNombre, (f) => f.totalGeneral).sort(porTotal),
    porVendedor: agrupar(
      emitidas,
      (f) => (f.idEmpleado ? vendedorPorId.get(f.idEmpleado)?.persona.nombreCompleto : undefined) ?? 'Sin vendedor',
      (f) => f.totalGeneral
    ).sort(porTotal),
    porMedioPago: agrupar(
      emitidas,
      (f) => (f.idMedioPago ? medioPagoPorId.get(f.idMedioPago)?.nombre : undefined) ?? '—',
      (f) => f.totalGeneral
    ).sort(porTotal),
  };
}

const primerDiaDelMes = () => `${todayIso().slice(0, 8)}01`;

const Indicador: React.FC<{ titulo: string; valor: string; nota?: string }> = ({ titulo, valor, nota }) => (
  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs print:shadow-none">
    <span className="text-[11px] font-semibold text-slate-500 uppercase">{titulo}</span>
    <p className="text-lg font-black text-slate-900 mt-1">{valor}</p>
    {nota && <p className="text-xs text-slate-500 mt-0.5">{nota}</p>}
  </div>
);

/** Columnas de un ranking: nombre, facturas y total. */
const columnas = (nombre: string, mostrarNombre: (g: Grupo) => string = (g) => g.nombre): Column<Grupo>[] => [
  { header: nombre, cell: mostrarNombre, className: 'font-bold text-slate-900' },
  { header: 'Facturas', align: 'center', cell: (g) => g.cantidad },
  { header: 'Total', align: 'right', cell: (g) => formatMoney(g.total), className: 'font-black text-slate-900' },
];

const Seccion: React.FC<{ titulo: string; filas: Grupo[]; columns: Column<Grupo>[] }> = ({ titulo, filas, columns }) => (
  <div className="break-inside-avoid">
    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">{titulo}</h4>
    <DataTable columns={columns} rows={filas} rowKey={(g) => g.nombre} emptyMessage="Sin ventas con estos filtros." />
  </div>
);

const idONada = (value: string): number | '' => (value === '' ? '' : Number(value));

/**
 * Reporte de ventas: totales, anulaciones, ventas por día y rankings de clientes, vendedores y
 * medios de pago, con filtros. "Exportar a PDF" usa la impresión del navegador (Guardar como PDF).
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
  // Cliente y vendedor elegidos (para mostrarlos en el selector y en el encabezado del PDF).
  const [cliente, setCliente] = useState<ClienteResponseDTO | null>(null);
  const [vendedor, setVendedor] = useState<EmpleadoResponseDTO | null>(null);
  const [top, setTop] = useState(10);
  const set = (cambios: Partial<Filtros>) => setFiltros((actual) => ({ ...actual, ...cambios }));
  const rangoValido = filtros.fechaDesde <= filtros.fechaHasta;

  const depositos = useAsyncData(catalogos.depositos);
  const cargar = useCallback(() => cargarReporte(filtros), [filtros]);
  const reporte = useAsyncData(cargar, rangoValido);
  const datos = reporte.data;

  const filtro = cn(fieldClass, 'bg-white');

  // Lo que se filtró, en palabras, para el encabezado del PDF.
  const deposito = depositos.data?.find((d) => d.id === filtros.idDeposito);
  const descripcion = [
    `Período: ${formatDate(filtros.fechaDesde)} al ${formatDate(filtros.fechaHasta)}`,
    filtros.estado ? `Estado: ${filtros.estado === 'EMITIDA' ? 'Emitidas' : 'Anuladas'}` : null,
    cliente ? `Cliente: ${cliente.persona.nombreCompleto}` : null,
    vendedor ? `Vendedor: ${vendedor.persona.nombreCompleto}` : null,
    deposito ? `Depósito: ${deposito.nombre}` : null,
  ].filter(Boolean);

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* ---- Filtros (no salen en el PDF) ---- */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 items-end">
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
          <ClienteSelector
            value={cliente}
            onChange={(c) => {
              setCliente(c);
              set({ idCliente: c?.idCliente ?? '' });
            }}
          />
        </FormField>
        <FormField label="Vendedor">
          <EmpleadoPicker
            placeholder="Todos"
            value={vendedor}
            onChange={(v) => {
              setVendedor(v);
              set({ idEmpleado: v?.id ?? '' });
            }}
          />
        </FormField>
        <FormField label="Depósito">
          <select className={filtro} value={filtros.idDeposito} onChange={(e) => set({ idDeposito: idONada(e.target.value) })}>
            <option value="">Todos</option>
            {depositos.data?.map((d) => (
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
        <div className={cn('space-y-4', reporte.loading && 'opacity-50')}>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Indicador titulo="Total vendido" valor={formatMoney(datos.totalVendido)} nota="IVA incluido" />
            <Indicador titulo="Facturas emitidas" valor={String(datos.emitidas)} />
            <Indicador titulo="Ticket promedio" valor={formatMoney(datos.emitidas ? datos.totalVendido / datos.emitidas : 0)} />
            <Indicador titulo="Facturas anuladas" valor={String(datos.anuladas)} nota={`Por ${formatMoney(datos.totalAnulado)}`} />
            <Indicador
              titulo="Tasa de anulación"
              valor={`${datos.emitidas + datos.anuladas ? Math.round((datos.anuladas * 100) / (datos.emitidas + datos.anuladas)) : 0}%`}
              nota="Sobre el total de facturas"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="break-inside-avoid">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mejores clientes</h4>
                <select className={cn(filtro, 'w-auto py-1 text-xs print:hidden')} value={top} onChange={(e) => setTop(Number(e.target.value))}>
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                </select>
              </div>
              <DataTable columns={columnas('Cliente')} rows={datos.porCliente.slice(0, top)} rowKey={(g) => g.nombre} emptyMessage="Sin ventas con estos filtros." />
            </div>
            <Seccion titulo="Ventas por vendedor" filas={datos.porVendedor} columns={columnas('Vendedor')} />
            <Seccion titulo="Ventas por medio de pago" filas={datos.porMedioPago} columns={columnas('Medio de pago')} />
            <Seccion titulo="Ventas por día" filas={datos.porDia} columns={columnas('Fecha', (g) => formatDate(g.nombre))} />
          </div>
        </div>
      )}
    </div>
  );
};
