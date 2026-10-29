import React, { useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, FileDown } from 'lucide-react';
import { ClienteSelector, DataTable, EmpleadoPicker, FeedbackBanner, FormField, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useApp } from '../../context/AppContext';
import { useAsyncData } from '../../hooks';
import { catalogos, inventarioApi, ventasApi, type FacturaVentaFilters } from '../../services';
import { indexar } from '../../lib/indices';
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
  /** Facturas. */
  cantidad: number;
  total: number;
  /** Solo en productos: unidades vendidas. */
  unidades?: number;
}

interface Reporte {
  incompleto: boolean;
  emitidas: number;
  totalVendido: number;
  anuladas: number;
  totalAnulado: number;
  porDia: Grupo[];
  porCliente: Grupo[];
  /** Los mismos clientes, ordenados por cuántas veces compraron. */
  porFrecuencia: Grupo[];
  productos: Grupo[];
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

  // Los productos los agrupa el backend en una consulta (las cabeceras no traen las líneas).
  // Con "Estado: Anuladas" no hay ventas que rankear: los productos son solo de facturas emitidas.
  const productosVendidos = filtros.estado === 'ANULADA' ? Promise.resolve([]) : ventasApi.facturas.productosMasVendidos({
    fechaDesde: filtros.fechaDesde,
    fechaHasta: filtros.fechaHasta,
    idCliente: filtros.idCliente || undefined,
    idEmpleado: filtros.idEmpleado || undefined,
    idDeposito: filtros.idDeposito || undefined,
  });

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
  const vendidos = await productosVendidos;
  const [vendedores, mediosPago, productos] = await Promise.all([
    enTandas(idsVendedores, inventarioApi.empleados.ref),
    catalogos.mediosPago(),
    // Nombre de cada producto distinto, una vez por id (ventas no guarda nombres de inventario).
    enTandas(vendidos.map((p) => p.idProducto), inventarioApi.productos.ref),
  ]);
  const productoPorId = new Map(productos);
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
    porFrecuencia: agrupar(emitidas, (f) => f.clienteNombre, (f) => f.totalGeneral).sort((a, b) => b.cantidad - a.cantidad || b.total - a.total),
    productos: vendidos.map((p) => ({
      nombre: productoPorId.get(p.idProducto)?.nombre ?? `Producto #${p.idProducto}`,
      cantidad: p.facturas,
      total: p.total,
      unidades: p.unidades,
    })),
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
  { header: 'Total', align: 'center', cell: (g) => formatMoney(g.total), className: 'font-black text-slate-900' },
];

/** Filas que muestra cada sección al principio, y cuántas suma "Ver más". */
const INICIALES = 5;
const PASO = 10;

/**
 * Una sección del reporte: se puede plegar (clic en el título) y muestra primero las 5 mejores
 * filas; "Ver más" suma de a 10 y "Ver menos" vuelve a las 5. El PDF sale como se ve en pantalla.
 */
/** Columnas del ranking de productos: unidades primero, que es por lo que se ordena. */
const columnasProductos: Column<Grupo>[] = [
  { header: 'Producto', cell: (g) => g.nombre, className: 'font-bold text-slate-900' },
  { header: 'Unidades', align: 'center', cell: (g) => g.unidades ?? 0, className: 'font-black text-slate-900' },
  { header: 'Facturas', align: 'center', cell: (g) => g.cantidad },
  { header: 'Total', align: 'center', cell: (g) => formatMoney(g.total) },
];

/** Clientes por frecuencia: cuántas veces compraron, primero. */
const columnasFrecuencia: Column<Grupo>[] = [
  { header: 'Cliente', cell: (g) => g.nombre, className: 'font-bold text-slate-900' },
  { header: 'Compras', align: 'center', cell: (g) => g.cantidad, className: 'font-black text-slate-900' },
  { header: 'Total', align: 'center', cell: (g) => formatMoney(g.total) },
];

const Seccion: React.FC<{ titulo: string; filas: Grupo[]; columns: Column<Grupo>[] }> = ({ titulo, filas, columns }) => {
  const [abierta, setAbierta] = useState(true);
  const [limite, setLimite] = useState(INICIALES);
  const visibles = filas.slice(0, limite);
  const restantes = filas.length - visibles.length;
  const boton = 'inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 print:hidden';

  return (
    <div className={cn('break-inside-avoid', !abierta && 'print:hidden')}>
      <button
        type="button"
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        className="w-full flex items-center justify-between mb-1.5 text-left group"
        title={abierta ? 'Plegar' : 'Desplegar'}
      >
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {titulo} <span className="font-semibold text-slate-400 normal-case">({filas.length})</span>
        </h4>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform print:hidden', abierta && 'rotate-180')} />
      </button>
      {abierta && (
        <>
          <DataTable columns={columns} rows={visibles} rowKey={(g) => g.nombre} emptyMessage="Sin ventas con estos filtros." />
          {(restantes > 0 || limite > INICIALES) && (
            <div className="flex items-center justify-center gap-4 mt-1.5">
              {restantes > 0 && (
                <button type="button" className={boton} onClick={() => setLimite((l) => l + PASO)}>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Ver más ({restantes} {restantes === 1 ? 'restante' : 'restantes'})
                </button>
              )}
              {limite > INICIALES && (
                <button type="button" className={boton} onClick={() => setLimite(INICIALES)}>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Ver menos
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

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
            <Seccion titulo="Productos más vendidos" filas={datos.productos} columns={columnasProductos} />
            <Seccion titulo="Mejores clientes (por monto)" filas={datos.porCliente} columns={columnas('Cliente')} />
            <Seccion titulo="Clientes más frecuentes (por compras)" filas={datos.porFrecuencia} columns={columnasFrecuencia} />
            <Seccion titulo="Ventas por vendedor" filas={datos.porVendedor} columns={columnas('Vendedor')} />
            <Seccion titulo="Ventas por medio de pago" filas={datos.porMedioPago} columns={columnas('Medio de pago')} />
            <Seccion titulo="Ventas por día" filas={datos.porDia} columns={columnas('Fecha', (g) => formatDate(g.nombre))} />
          </div>
        </div>
      )}
    </div>
  );
};
