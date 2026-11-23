import { useCallback, useState } from 'react';
import { ChevronDown, FileDown } from 'lucide-react';
import { DataTable, FeedbackBanner, FormField, ProveedorPicker, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useApp } from '../../context/AppContext';
import { useAsyncData } from '../../hooks';
import { formatDate, formatMoney, todayIso } from '../../lib/format';
import { nombreProveedor } from '../../lib/proveedor';
import { catalogos, comprasApi, type GrupoReporteCompras, type ReporteComprasFiltros } from '../../services';
import type { ProveedorResponseDTO } from '../../types/api';

const FILAS_INICIALES = 5;

function Seccion<T>({ titulo, filas, columnas, clave }: {
  titulo: string;
  filas: T[];
  columnas: Column<T>[];
  clave: (fila: T) => number | string;
}) {
  const [abierta, setAbierta] = useState(true);
  const [limite, setLimite] = useState(FILAS_INICIALES);

  return (
    <section className={abierta ? '' : 'print:hidden'}>
      <button type="button" aria-expanded={abierta} onClick={() => setAbierta(!abierta)}
        className="mb-1.5 flex w-full items-center justify-between text-left text-xs font-bold uppercase text-slate-800">
        {titulo}
        <ChevronDown className={`size-4 text-slate-400 print:hidden ${abierta ? 'rotate-180' : ''}`} />
      </button>
      {abierta && (
        <>
          <DataTable columns={columnas} rows={filas.slice(0, limite)} rowKey={clave}
            emptyMessage="Sin compras activas con estos filtros." />
          <div className="flex justify-center gap-3 print:hidden">
            {filas.length > limite && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setLimite(limite + 10)}>
                Ver más ({filas.length - limite})
              </Button>
            )}
            {limite > FILAS_INICIALES && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setLimite(FILAS_INICIALES)}>
                Ver menos
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function columnasTotales<T extends { facturas: number; total: number }>(): Column<T>[] {
  return [
    { header: 'Facturas', align: 'right', cell: (fila) => fila.facturas },
    { header: 'Total', align: 'right', cell: (fila) => formatMoney(fila.total) },
  ];
}

function columnasGrupo(etiqueta: string): Column<GrupoReporteCompras>[] {
  return [{ header: etiqueta, cell: (fila) => fila.nombre }, ...columnasTotales<GrupoReporteCompras>()];
}

type Producto = GrupoReporteCompras & { unidades: number };
const columnasProductos: Column<Producto>[] = [
  { header: 'Producto', cell: (fila) => fila.nombre },
  { header: 'Unidades', align: 'right', cell: (fila) => fila.unidades },
  ...columnasTotales<Producto>(),
];

type Dia = { fecha: string; facturas: number; total: number };
const columnasDia: Column<Dia>[] = [
  { header: 'Fecha', cell: (fila) => formatDate(fila.fecha) },
  ...columnasTotales<Dia>(),
];

const estados = { ACTIVA: 'Activas', ANULADA: 'Anuladas' };

export function ReportesComprasPanel() {
  const { user } = useApp();
  const depositoAsignado = user.roles.includes('ADMIN') ? undefined : user.idDeposito;
  const [filtros, setFiltros] = useState<ReporteComprasFiltros>(() => {
    const hoy = todayIso();
    return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy };
  });
  const [proveedor, setProveedor] = useState<ProveedorResponseDTO | null>(null);
  const aplicar = (cambios: Partial<ReporteComprasFiltros>) => setFiltros((actual) => ({ ...actual, ...cambios }));
  const depositos = useAsyncData(catalogos.depositos, depositoAsignado === undefined);
  const rangoValido = Boolean(filtros.desde && filtros.hasta && filtros.desde <= filtros.hasta);
  const cargar = useCallback(() => comprasApi.facturas.reporte(filtros), [filtros]);
  const reporte = useAsyncData(cargar, rangoValido);
  const datos = rangoValido && !reporte.loading && !reporte.error ? reporte.data : null;
  const depositoId = datos ? datos.depositoId : depositoAsignado ?? filtros.depositoId;
  const deposito = depositoId == null ? 'Todos los depósitos'
    : (depositoId === depositoAsignado ? user.nombreDeposito : depositos.data?.find((d) => d.id === depositoId)?.nombre)
      ?? `Depósito #${depositoId}`;

  const resumen = datos?.resumen;
  const facturas = resumen ? resumen.activas + resumen.anuladas : 0;

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="grid grid-cols-2 items-end gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-3 xl:grid-cols-6 print:hidden">
        <FormField label="Desde">
          <input type="date" className={fieldClass} value={filtros.desde} max={filtros.hasta}
            onChange={(e) => aplicar({ desde: e.target.value })} />
        </FormField>
        <FormField label="Hasta">
          <input type="date" className={fieldClass} value={filtros.hasta} min={filtros.desde}
            onChange={(e) => aplicar({ hasta: e.target.value })} />
        </FormField>
        <FormField label="Estado">
          <select className={fieldClass} value={filtros.estado ?? ''}
            onChange={(e) => aplicar({ estado: (e.target.value || undefined) as ReporteComprasFiltros['estado'] })}>
            <option value="">Todas</option>
            <option value="ACTIVA">Activas</option>
            <option value="ANULADA">Anuladas</option>
          </select>
        </FormField>
        <FormField label="Proveedor">
          <ProveedorPicker value={proveedor} placeholder="Todos los proveedores" permitirInactivos
            onChange={(seleccion) => {
              setProveedor(seleccion);
              aplicar({ proveedorId: seleccion?.idProveedor });
            }} />
        </FormField>
        <FormField label="Depósito">
          {depositoAsignado !== undefined ? (
            <input className={fieldClass} value={deposito} readOnly />
          ) : (
            <select className={fieldClass} value={filtros.depositoId ?? ''}
              onChange={(e) => aplicar({ depositoId: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">Todos los depósitos</option>
              {depositos.data?.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          )}
        </FormField>
        <Button type="button" className="h-9" onClick={() => window.print()} disabled={!datos}>
          <FileDown /> Exportar a PDF
        </Button>
      </div>

      {!rangoValido && <FeedbackBanner>Ingrese un período válido.</FeedbackBanner>}
      {depositos.error && <FeedbackBanner>{depositos.error}</FeedbackBanner>}
      {reporte.error && rangoValido && <FeedbackBanner>{reporte.error}</FeedbackBanner>}
      {reporte.loading && <p role="status" className="text-xs text-slate-500 print:hidden">Calculando...</p>}
      {datos && resumen && (
        <>
          <div className="hidden print:block">
            <h2 className="text-xl font-black text-slate-900">DistriMarket — Reporte de compras</h2>
            <p className="text-xs text-slate-600">
              {formatDate(filtros.desde)} al {formatDate(filtros.hasta)} · {deposito} · {proveedor ? nombreProveedor(proveedor) : 'Todos los proveedores'} · {filtros.estado ? estados[filtros.estado] : 'Todas las facturas'}
            </p>
            <p className="text-xs text-slate-500">Generado el {formatDate(todayIso())} por {user.name}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ['Total comprado', formatMoney(resumen.totalComprado), 'IVA incluido'],
              ['Facturas activas', String(resumen.activas)],
              ['Importe promedio', formatMoney(resumen.activas ? resumen.totalComprado / resumen.activas : 0)],
              ['Facturas anuladas', String(resumen.anuladas), formatMoney(resumen.totalAnulado)],
              ['Tasa de anulación', `${facturas ? Math.round(resumen.anuladas * 100 / facturas) : 0}%`],
            ].map(([titulo, valor, nota]) => (
              <div key={titulo} className="rounded-2xl border border-slate-200 bg-white p-3">
                <dt className="text-xs font-semibold text-slate-500">{titulo}</dt>
                <dd className="mt-1 text-lg font-black text-slate-900">{valor}</dd>
                {nota && <dd className="text-xs text-slate-500">{nota}</dd>}
              </div>
            ))}
          </dl>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 print:block print:space-y-4">
            <Seccion titulo="Productos más comprados" filas={datos.productos} columnas={columnasProductos} clave={(fila) => fila.id} />
            <Seccion titulo="Compras por proveedor" filas={datos.porProveedor} columnas={columnasGrupo('Proveedor')} clave={(fila) => fila.id} />
            <Seccion titulo="Compras por medio de pago" filas={datos.porMedioPago} columnas={columnasGrupo('Medio de pago')} clave={(fila) => fila.id} />
            <Seccion titulo="Compras por día" filas={datos.porDia} columnas={columnasDia} clave={(fila) => fila.fecha} />
          </div>
        </>
      )}
    </div>
  );
}
