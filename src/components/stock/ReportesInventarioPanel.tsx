import React, { useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, FileDown, AlertTriangle } from 'lucide-react';
import { DataTable, EmpleadoPicker, FeedbackBanner, FormField, fieldClass, type Column } from '../common';
import { Button } from '../ui/button';
import { useApp } from '../../context/AppContext';
import { useAsyncData } from '../../hooks';
import { catalogos, inventarioApi } from '../../services';
import { enTandas } from '../../lib/tandas';
import { formatDate, formatMoney, todayIso } from '../../lib/format';
import { cn } from '../../lib/utils';
import type {
    AjusteStockResponseDTO,
    EmpleadoResponseDTO,
    ProductoResponseDTO,
    StockDepositoResponseDTO,
    TransferenciaStockResponseDTO,
} from '../../types/api';

/** Límite de movimientos paginados para consolidar en el reporte */
const MAX_REGISTROS = 500;
const POR_PAGINA = 50;

interface Filtros {
    fechaDesde: string;
    fechaHasta: string;
    idDeposito: number | '';
    idEmpleado: number | '';
}

interface Grupo {
    nombre: string;
    cantidad: number;
    unidades?: number;
    total?: number;
}

interface StockCriticoItem {
    nombre: string;
    deposito: string;
    stockActual: number;
    stockMinimo: number;
}

interface ReporteInventario {
    incompleto: boolean;
    // Existencias
    totalUnidadesStock: number;
    valorizacionTotal: number;
    productosSinStock: number;
    alertasCriticas: StockCriticoItem[];
    // Ajustes de Stock
    totalAjustes: number;
    unidadesAjustadasPositivas: number;
    unidadesAjustadasNegativas: number;
    porMotivoAjuste: Grupo[];
    ajustesPorEmpleado: Grupo[];
    // Transferencias
    totalTransferencias: number;
    unidadesTransferidas: number;
    porRutaTransferencia: Grupo[];
    // Distribución de existencias
    stockPorDeposito: Grupo[];
}

const porUnidades = (a: Grupo, b: Grupo) => (b.unidades ?? 0) - (a.unidades ?? 0);
const porCantidad = (a: Grupo, b: Grupo) => b.cantidad - a.cantidad;

async function cargarReporteInventario(filtros: Filtros): Promise<ReporteInventario> {
    // 1. Obtener todas las líneas de stock para el depósito (o todos)
    const stockItems: StockDepositoResponseDTO[] = [];
    let pagStock = 1;
    let totPagStock: number;
    do {
        const res = await inventarioApi.stock.list(
            { page: pagStock, size: POR_PAGINA },
            { depositoId: filtros.idDeposito || undefined }
        );
        stockItems.push(...res.content);
        totPagStock = res.totalPages;
        pagStock += 1;
    } while (pagStock <= totPagStock && stockItems.length < MAX_REGISTROS);

    // 2. Obtener Ajustes de Stock
    const ajustes: AjusteStockResponseDTO[] = [];
    let pagAjustes = 1;
    let totPagAjustes: number;
    do {
        const res = await inventarioApi.ajustes.list(
            { page: pagAjustes, size: POR_PAGINA },
            {
                depositoId: filtros.idDeposito || undefined,
                empleadoId: filtros.idEmpleado || undefined,
            }
        );
        ajustes.push(...res.content);
        totPagAjustes = res.totalPages;
        pagAjustes += 1;
    } while (pagAjustes <= totPagAjustes && ajustes.length < MAX_REGISTROS);

    // 3. Obtener Transferencias de Stock
    const transferencias: TransferenciaStockResponseDTO[] = [];
    let pagTransf = 1;
    let totPagTransf: number;
    do {
        const res = await inventarioApi.transferencias.list(
            { page: pagTransf, size: POR_PAGINA },
            {
                depositoOrigenId: filtros.idDeposito || undefined,
                empleadoId: filtros.idEmpleado || undefined,
            }
        );
        transferencias.push(...res.content);
        totPagTransf = res.totalPages;
        pagTransf += 1;
    } while (pagTransf <= totPagTransf && transferencias.length < MAX_REGISTROS);

    // 4. Catálogo de productos para valorización y chequeo de stock mínimo
    const idsProductos = [...new Set(stockItems.map((s) => s.idProducto))];
    const productosRef = await enTandas(idsProductos, inventarioApi.productos.ref);
    const productoMap = new Map<number, ProductoResponseDTO>(
        productosRef.filter((p): p is readonly [number, ProductoResponseDTO] => p[1] !== null)
    );

    // Consolidación de existencias y valorización
    let totalUnidadesStock = 0;
    let valorizacionTotal = 0;
    let productosSinStock = 0;
    const alertasCriticas: StockCriticoItem[] = [];
    const stockPorDepositoMap = new Map<string, number>();

    for (const item of stockItems) {
        totalUnidadesStock += item.cantidad;
        const depNombre = item.nombreDeposito ?? `Depósito #${item.idDeposito}`;
        stockPorDepositoMap.set(depNombre, (stockPorDepositoMap.get(depNombre) ?? 0) + item.cantidad);

        const prod = productoMap.get(item.idProducto);
        if (prod) {
            const costo = prod.precioCosto ?? prod.precioVenta;
            valorizacionTotal += item.cantidad * costo;

            if (item.cantidad === 0) {
                productosSinStock += 1;
            }
            if (prod.stockMinimo !== undefined && item.cantidad <= prod.stockMinimo) {
                alertasCriticas.push({
                    nombre: prod.nombre,
                    deposito: depNombre,
                    stockActual: item.cantidad,
                    stockMinimo: prod.stockMinimo,
                });
            }
        }
    }

    // Consolidación de Ajustes
    let unidadesAjustadasPositivas = 0;
    let unidadesAjustadasNegativas = 0;
    const motivosMap = new Map<string, { cantidad: number; unidades: number }>();
    const empleadoAjustesMap = new Map<string, { cantidad: number; unidades: number }>();

    for (const a of ajustes) {
        const unidadesMovimiento = a.detalles.reduce((sum, d) => sum + d.cantidad, 0);
        if (a.tipoAjuste === 'POSITIVO') {
            unidadesAjustadasPositivas += unidadesMovimiento;
        } else {
            unidadesAjustadasNegativas += unidadesMovimiento;
        }

        const motivoKey = a.motivo?.trim() || 'Sin motivo';
        const mActual = motivosMap.get(motivoKey) ?? { cantidad: 0, unidades: 0 };
        motivosMap.set(motivoKey, {
            cantidad: mActual.cantidad + 1,
            unidades: mActual.unidades + unidadesMovimiento,
        });

        const empKey = a.nombreEmpleado ?? `Empleado #${a.idEmpleado}`;
        const eActual = empleadoAjustesMap.get(empKey) ?? { cantidad: 0, unidades: 0 };
        empleadoAjustesMap.set(empKey, {
            cantidad: eActual.cantidad + 1,
            unidades: eActual.unidades + unidadesMovimiento,
        });
    }

    // Consolidación de Transferencias
    let unidadesTransferidas = 0;
    const rutasMap = new Map<string, { cantidad: number; unidades: number }>();

    for (const t of transferencias) {
        const sumU = t.detalles.reduce((sum, d) => sum + d.cantidad, 0);
        unidadesTransferidas += sumU;
        const rutaKey = `${t.nombreDepositoOrigen ?? 'Origen'} ➔ ${t.nombreDepositoDestino ?? 'Destino'}`;
        const rActual = rutasMap.get(rutaKey) ?? { cantidad: 0, unidades: 0 };
        rutasMap.set(rutaKey, {
            cantidad: rActual.cantidad + 1,
            unidades: rActual.unidades + sumU,
        });
    }

    return {
        incompleto: pagStock <= totPagStock || pagAjustes <= totPagAjustes || pagTransf <= totPagTransf,
        totalUnidadesStock,
        valorizacionTotal,
        productosSinStock,
        alertasCriticas,
        totalAjustes: ajustes.length,
        unidadesAjustadasPositivas,
        unidadesAjustadasNegativas,
        totalTransferencias: transferencias.length,
        unidadesTransferidas,
        porMotivoAjuste: [...motivosMap.entries()].map(([nombre, v]) => ({ nombre, ...v })).sort(porUnidades),
        ajustesPorEmpleado: [...empleadoAjustesMap.entries()].map(([nombre, v]) => ({ nombre, ...v })).sort(porCantidad),
        porRutaTransferencia: [...rutasMap.entries()].map(([nombre, v]) => ({ nombre, ...v })).sort(porUnidades),
        stockPorDeposito: [...stockPorDepositoMap.entries()].map(([nombre, unidades]) => ({ nombre, cantidad: 1, unidades })).sort(porUnidades),
    };
}

const primerDiaDelMes = () => `${todayIso().slice(0, 8)}01`;
const idONada = (value: string): number | '' => (value === '' ? '' : Number(value));

const Indicador: React.FC<{ titulo: string; valor: string; nota?: string }> = ({ titulo, valor, nota }) => (
    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs print:shadow-none">
        <span className="text-[11px] font-semibold text-slate-500 uppercase">{titulo}</span>
        <p className="text-lg font-black text-slate-900 mt-1">{valor}</p>
        {nota && <p className="text-xs text-slate-500 mt-0.5">{nota}</p>}
    </div>
);

const INICIALES = 5;
const PASO = 10;

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
                    <DataTable columns={columns} rows={visibles} rowKey={(g) => g.nombre} emptyMessage="Sin movimientos registrados." />
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

const columnasMovimientos: Column<Grupo>[] = [
    { header: 'Descripción / Entidad', cell: (g) => g.nombre, className: 'font-bold text-slate-900' },
    { header: 'Operaciones', align: 'center', cell: (g) => g.cantidad },
    { header: 'Unidades', align: 'center', cell: (g) => g.unidades ?? 0, className: 'font-black text-slate-900' },
];

const columnasDeposito: Column<Grupo>[] = [
    { header: 'Depósito', cell: (g) => g.nombre, className: 'font-bold text-slate-900' },
    { header: 'Stock Total', align: 'center', cell: (g) => g.unidades ?? 0, className: 'font-black text-slate-900' },
];

const columnasCritico: Column<StockCriticoItem>[] = [
    { header: 'Producto', cell: (i) => i.nombre, className: 'font-bold text-slate-900' },
    { header: 'Depósito', cell: (i) => i.deposito },
    { header: 'Actual', align: 'center', cell: (i) => i.stockActual, className: 'font-black text-rose-600' },
    { header: 'Mínimo', align: 'center', cell: (i) => i.stockMinimo },
];

export const ReportesInventarioPanel: React.FC = () => {
    const { user } = useApp();
    const [filtros, setFiltros] = useState<Filtros>({
        fechaDesde: primerDiaDelMes(),
        fechaHasta: todayIso(),
        idDeposito: '',
        idEmpleado: '',
    });

    const [empleado, setEmpleado] = useState<EmpleadoResponseDTO | null>(null);
    const set = (cambios: Partial<Filtros>) => setFiltros((actual) => ({ ...actual, ...cambios }));
    const rangoValido = filtros.fechaDesde <= filtros.fechaHasta;

    const depositos = useAsyncData(catalogos.depositos);
    const cargar = useCallback(() => cargarReporteInventario(filtros), [filtros]);
    const reporte = useAsyncData(cargar, rangoValido);
    const datos = reporte.data;

    const filtro = cn(fieldClass, 'bg-white');
    const deposito = depositos.data?.find((d) => d.id === filtros.idDeposito);

    const descripcion = [
        `Período: ${formatDate(filtros.fechaDesde)} al ${formatDate(filtros.fechaHasta)}`,
        deposito ? `Depósito: ${deposito.nombre}` : 'Todos los depósitos',
        empleado ? `Responsable: ${empleado.persona.nombreCompleto}` : null,
    ].filter(Boolean);

    return (
        <div className="flex-1 flex flex-col space-y-4">
            {/* ---- Filtros (Ocultos en impresión) ---- */}
            <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-3 grid grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
                <FormField label="Desde">
                    <input
                        className={filtro}
                        type="date"
                        value={filtros.fechaDesde}
                        max={filtros.fechaHasta}
                        onChange={(e) => set({ fechaDesde: e.target.value })}
                    />
                </FormField>
                <FormField label="Hasta">
                    <input
                        className={filtro}
                        type="date"
                        value={filtros.fechaHasta}
                        min={filtros.fechaDesde}
                        onChange={(e) => set({ fechaHasta: e.target.value })}
                    />
                </FormField>
                <FormField label="Depósito">
                    <select className={filtro} value={filtros.idDeposito} onChange={(e) => set({ idDeposito: idONada(e.target.value) })}>
                        <option value="">Todos los depósitos</option>
                        {depositos.data?.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.nombre}
                            </option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Responsable">
                    <EmpleadoPicker
                        placeholder="Todos los empleados"
                        value={empleado}
                        onChange={(emp) => {
                            setEmpleado(emp);
                            set({ idEmpleado: emp?.id ?? '' });
                        }}
                    />
                </FormField>
                <Button variant="default" className="h-9" onClick={() => window.print()} disabled={!datos || reporte.loading}>
                    <FileDown className="w-4 h-4 mr-2" />
                    <span>Exportar a PDF</span>
                </Button>
            </div>

            {/* ---- Encabezado de impresión PDF ---- */}
            <div className="hidden print:block">
                <h2 className="text-xl font-black text-slate-900">DistriMarket — Reporte de Inventario</h2>
                <p className="text-xs text-slate-600 mt-1">{descripcion.join(' · ')}</p>
                <p className="text-[11px] text-slate-400">
                    Generado el {formatDate(todayIso())} por {user.name}
                </p>
            </div>

            {!rangoValido && <FeedbackBanner>La fecha "Desde" no puede ser posterior a "Hasta".</FeedbackBanner>}
            {reporte.error && <FeedbackBanner>{reporte.error}</FeedbackBanner>}
            {reporte.loading && <p className="text-xs text-slate-400 print:hidden">Procesando movimientos e inventario...</p>}
            {datos?.incompleto && (
                <FeedbackBanner variant="info">
                    Se alcanzó el límite de {MAX_REGISTROS} registros por consulta. Acote el rango de fechas para ver el consolidado exacto.
                </FeedbackBanner>
            )}

            {datos && (
                <div className={cn('space-y-4', reporte.loading && 'opacity-50')}>
                    {/* Métricas Principales */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <Indicador
                            titulo="Valorización Stock"
                            valor={formatMoney(datos.valorizacionTotal)}
                            nota={`${datos.totalUnidadesStock.toLocaleString()} unidades totales`}
                        />
                        <Indicador
                            titulo="Ajustes (+)"
                            valor={`+${datos.unidadesAjustadasPositivas.toLocaleString()}`}
                            nota="Unidades ingresadas por ajuste"
                        />
                        <Indicador
                            titulo="Ajustes (-)"
                            valor={`-${datos.unidadesAjustadasNegativas.toLocaleString()}`}
                            nota="Mermas / Salidas por ajuste"
                        />
                        <Indicador
                            titulo="Transferencias"
                            valor={String(datos.totalTransferencias)}
                            nota={`${datos.unidadesTransferidas.toLocaleString()} u. movilizadas`}
                        />
                        <Indicador
                            titulo="Alertas de Stock"
                            valor={String(datos.alertasCriticas.length)}
                            nota={`${datos.productosSinStock} productos agotados`}
                        />
                    </div>

                    {/* Tablas de análisis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Seccion titulo="Stock por Depósito" filas={datos.stockPorDeposito} columns={columnasDeposito} />
                        <Seccion titulo="Ajustes por Motivo" filas={datos.porMotivoAjuste} columns={columnasMovimientos} />
                        <Seccion titulo="Rutas de Transferencia" filas={datos.porRutaTransferencia} columns={columnasMovimientos} />
                        <Seccion titulo="Ajustes por Responsable" filas={datos.ajustesPorEmpleado} columns={columnasMovimientos} />
                    </div>

                    {/* Listado de stock crítico si existen alertas */}
                    {datos.alertasCriticas.length > 0 && (
                        <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-xs">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                                    Productos con Stock Crítico o Agotado ({datos.alertasCriticas.length})
                                </h4>
                            </div>
                            <DataTable
                                columns={columnasCritico}
                                rows={datos.alertasCriticas.slice(0, 10)}
                                rowKey={(i) => `${i.nombre}-${i.deposito}`}
                                emptyMessage="No hay productos bajo stock mínimo."
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};