import React, { useCallback, useMemo, useState } from 'react';
import { PackagePlus, Plus, Save, Trash2 } from 'lucide-react';
import {
  ActionButtons,
  DepositoBuscador,
  FeedbackBanner,
  FormActions,
  FormField,
  ModalDialog,
  PagedTable,
  StatusBadge,
  fieldClass,
  type Column,
} from '../common';
import { Button } from '../ui/button';
import { useAsyncAction, useAsyncData, useDepositoAsignado, usePagedResource, useRemove } from '../../hooks';
import { useApp } from '../../context/AppContext';
import { catalogos, depositosActivos, errorMessage, inventarioApi } from '../../services';
import { indexar } from '../../lib/indices';
import { formatMoney } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { DepositoResponseDTO, ProductoRequestDTO, ProductoResponseDTO } from '../../types/api';

/** Categorías y marcas: catálogos chicos pedidos al backend (filtros, nombres y formulario). */
async function cargarClasificaciones() {
  const [categorias, marcas] = await Promise.all([catalogos.categorias(), catalogos.marcas()]);
  return { categorias, marcas };
}

type FiltrosProducto = { categoriaId?: number; marcaId?: number };

/** Productos de a 10 por página: búsqueda por nombre o código de barras, y filtros por categoría y marca. */
export const ProductosPanel: React.FC = () => {
  const { hasRole } = useApp();
  const puedeEditar = hasRole('ADMIN') || hasRole('DEPOSITERO');
  const clasificaciones = useAsyncData(cargarClasificaciones);
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [marcaId, setMarcaId] = useState<number | ''>('');
  const filtros: FiltrosProducto | undefined =
    categoriaId === '' && marcaId === '' ? undefined : { categoriaId: categoriaId || undefined, marcaId: marcaId || undefined };
  const productos = usePagedResource<ProductoResponseDTO, FiltrosProducto>(inventarioApi.productos.list, { filters: filtros });
  const baja = useRemove(productos.reload);
  const [formOpen, setFormOpen] = useState(false);
  const [enEdicion, setEnEdicion] = useState<ProductoResponseDTO | null>(null);

  const categoriaPorId = useMemo(() => indexar(clasificaciones.data?.categorias, (c) => c.id), [clasificaciones.data]);
  const marcaPorId = useMemo(() => indexar(clasificaciones.data?.marcas, (m) => m.id), [clasificaciones.data]);

  const abrir = (producto: ProductoResponseDTO | null) => {
    setEnEdicion(producto);
    setFormOpen(true);
  };

  const columns: Column<ProductoResponseDTO>[] = [
    { header: 'Producto', cell: (p) => p.nombre, className: 'font-bold text-slate-900' },
    { header: 'Categoría', cell: (p) => categoriaPorId.get(p.idCategoria)?.nombre ?? '—', className: 'text-slate-600' },
    { header: 'Marca', cell: (p) => marcaPorId.get(p.idMarca)?.nombre ?? '—', className: 'text-slate-600' },
    { header: 'Código de barras', cell: (p) => p.codigoBarra ?? '—', className: 'text-slate-500 text-xs' },
    { header: 'Precio de venta', align: 'right', cell: (p) => formatMoney(p.precioVenta), className: 'font-black text-slate-900' },
    { header: 'IVA', align: 'center', cell: (p) => `${p.porcentajeIva}%`, className: 'text-slate-600' },
    { header: 'Estado', cell: (p) => <StatusBadge status={p.estado ? 'Activo' : 'Inactivo'} /> },
    ...(puedeEditar
      ? [
          {
            header: 'Acciones',
            align: 'center' as const,
            cell: (p: ProductoResponseDTO) => (
              <ActionButtons
                onEdit={() => abrir(p)}
                onDelete={() =>
                  baja.remove(
                    { title: 'Dar de baja producto', message: `¿Dar de baja "${p.nombre}"? Dejará de poder venderse y comprarse.` },
                    () => inventarioApi.productos.remove(p.id)
                  )
                }
              />
            ),
          },
        ]
      : []),
  ];

  const filtro = 'w-auto bg-white h-9';

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-3">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={productos}
        columns={columns}
        rowKey={(p) => p.id}
        label="productos"
        searchPlaceholder="Buscar por nombre o código de barras..."
        emptyMessage="No hay productos con la búsqueda o los filtros elegidos."
        filters={
          <>
            <select className={cn(fieldClass, filtro)} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value === '' ? '' : Number(e.target.value))} title="Filtrar por categoría">
              <option value="">Todas las categorías</option>
              {clasificaciones.data?.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select className={cn(fieldClass, filtro)} value={marcaId} onChange={(e) => setMarcaId(e.target.value === '' ? '' : Number(e.target.value))} title="Filtrar por marca">
              <option value="">Todas las marcas</option>
              {clasificaciones.data?.marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            {puedeEditar && (
              <Button variant="emerald" onClick={() => abrir(null)}>
                <Plus />
                <span>Nuevo producto</span>
              </Button>
            )}
          </>
        }
      />

      <ModalDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={enEdicion ? `Modificar "${enEdicion.nombre}"` : 'Nuevo producto'}
        subtitle={enEdicion ? 'Para cambiar el stock use Existencias o un ajuste.' : 'Puede cargar desde aquí la cantidad inicial en cada depósito.'}
        maxWidth={enEdicion ? 'xl' : '4xl'}
      >
        <ProductoForm
          producto={enEdicion}
          clasificaciones={clasificaciones.data}
          onClose={() => setFormOpen(false)}
          onCreated={productos.reload}
          // Al modificar, la fila se reemplaza con lo que devolvió el backend (sin volver a pedir la página).
          onUpdated={(p) => productos.replaceItem((row) => row.id === p.id, p)}
        />
      </ModalDialog>
    </>
  );
};

/** Campos del formulario a partir de la fila (al modificar no se vuelve a pedir el producto). */
const desdeProducto = (p: ProductoResponseDTO | null) => ({
  nombre: p?.nombre ?? '',
  codigoBarra: p?.codigoBarra ?? '',
  descripcion: p?.descripcion ?? '',
  precioCosto: p?.precioCosto != null ? String(p.precioCosto) : '',
  precioVenta: p ? String(p.precioVenta) : '',
  porcentajeIva: p ? String(Number(p.porcentajeIva)) : '10',
  stockMinimo: p?.stockMinimo != null ? String(p.stockMinimo) : '0',
  idCategoria: p ? String(p.idCategoria) : '',
  idMarca: p ? String(p.idMarca) : '',
});

/** Una fila de la existencia inicial: un depósito y su cantidad. */
interface FilaExistencia {
  key: number;
  deposito: DepositoResponseDTO | null;
  cantidad: string;
}

let siguienteFila = 1;
const nuevaFila = (deposito: DepositoResponseDTO | null = null): FilaExistencia => ({ key: siguienteFila++, deposito, cantidad: '' });

interface ProductoFormProps {
  producto: ProductoResponseDTO | null;
  /** Categorías y marcas que la pantalla ya tiene: el formulario no las vuelve a pedir. */
  clasificaciones: Awaited<ReturnType<typeof cargarClasificaciones>> | null;
  onClose: () => void;
  onCreated: () => void;
  onUpdated: (producto: ProductoResponseDTO) => void;
}

/**
 * Alta o modificación de producto. En el alta se puede cargar la existencia inicial: el backend no
 * tiene un único endpoint para ambas cosas, así que se hace en pasos (primero el producto y después
 * una existencia por depósito). Si alguna existencia falla, el producto ya creado se conserva y el
 * botón pasa a reintentar solo las que faltan. Quien tiene un depósito asignado (depositero) solo
 * carga existencia en el suyo.
 */
const ProductoForm: React.FC<ProductoFormProps> = ({ producto, clasificaciones, onClose, onCreated, onUpdated }) => {
  const editando = Boolean(producto);
  const asignado = useDepositoAsignado();
  // Los depósitos solo hacen falta para el alta de un ADMIN (el depositero usa el suyo; al modificar no se usan).
  const necesitaDepositos = !editando && !asignado;
  const cargar = useCallback(async () => {
    const [conocidas, depositos] = await Promise.all([
      clasificaciones ?? cargarClasificaciones(),
      necesitaDepositos ? depositosActivos() : Promise.resolve([]),
    ]);
    return { ...conocidas, depositos };
    // Las clasificaciones de la pantalla se toman una vez al abrir el formulario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [necesitaDepositos]);
  const datos = useAsyncData(cargar);
  const guardar = useAsyncAction();
  const [form, setForm] = useState(() => desdeProducto(producto));
  const [filas, setFilas] = useState<FilaExistencia[]>(() => (asignado ? [nuevaFila(asignado)] : []));
  // Producto ya creado en un intento anterior (cuando falló alguna existencia).
  const [creado, setCreado] = useState<ProductoResponseDTO | null>(null);
  // Depósitos cuya existencia ya quedó guardada.
  const [cargados, setCargados] = useState<number[]>([]);
  const [fallas, setFallas] = useState<string[]>([]);
  const set = (cambios: Partial<ReturnType<typeof desdeProducto>>) => setForm((actual) => ({ ...actual, ...cambios }));

  const precioMenorAlCosto = form.precioCosto !== '' && form.precioVenta !== '' && Number(form.precioVenta) < Number(form.precioCosto);

  const cambiarFila = (key: number, cambios: Partial<FilaExistencia>) =>
    setFilas((actuales) => actuales.map((f) => (f.key === key ? { ...f, ...cambios } : f)));
  const quitarFila = (key: number) => setFilas((actuales) => actuales.filter((f) => f.key !== key));
  const elegidos = filas.flatMap((f) => (f.deposito ? [f.deposito.id] : []));

  const request = (): ProductoRequestDTO => ({
    nombre: form.nombre.trim(),
    codigoBarra: form.codigoBarra.trim() || undefined,
    descripcion: form.descripcion.trim() || undefined,
    precioCosto: Number(form.precioCosto),
    precioVenta: Number(form.precioVenta),
    porcentajeIva: Number(form.porcentajeIva),
    stockMinimo: Number(form.stockMinimo),
    idCategoria: Number(form.idCategoria),
    idMarca: Number(form.idMarca),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (producto) {
      let actualizado: ProductoResponseDTO | null = null;
      const ok = await guardar.run(async () => {
        actualizado = await inventarioApi.productos.update(producto.id, request());
      });
      if (ok && actualizado) {
        onUpdated(actualizado);
        onClose();
      }
      return;
    }

    // Filas con depósito y cantidad que todavía no se guardaron.
    const pendientes = filas.filter((f) => f.deposito && Number(f.cantidad) > 0 && !cargados.includes(f.deposito.id));
    const errores: string[] = [];
    const ok = await guardar.run(async () => {
      // 1. El producto (solo la primera vez; en un reintento ya existe).
      let nuevo = creado;
      if (!nuevo) {
        nuevo = await inventarioApi.productos.create(request());
        setCreado(nuevo);
      }
      // 2. Una existencia por depósito; se siguen intentando las demás aunque alguna falle.
      for (const { deposito, cantidad } of pendientes) {
        if (!deposito) continue;
        try {
          await inventarioApi.stock.create({ idProducto: nuevo.id, idDeposito: deposito.id, cantidad: Number(cantidad) });
          setCargados((actuales) => [...actuales, deposito.id]);
        } catch (error) {
          errores.push(`${deposito.nombre}: ${errorMessage(error)}`);
        }
      }
    });
    if (!ok) return; // No se pudo crear el producto: el error queda en el formulario.

    setFallas(errores);
    onCreated();
    if (errores.length === 0) onClose();
  };

  if (datos.error) return <FeedbackBanner>{datos.error}</FeedbackBanner>;
  if (!datos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;
  const { categorias, marcas, depositos } = datos.data;
  const bloqueado = Boolean(creado);

  const campos = (
    <fieldset disabled={bloqueado} className="space-y-3 min-w-0">
      <FormField label="Nombre" required>
        <input className={fieldClass} required maxLength={150} value={form.nombre} onChange={(e) => set({ nombre: e.target.value })} autoFocus />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Categoría" required>
          <select className={fieldClass} required value={form.idCategoria} onChange={(e) => set({ idCategoria: e.target.value })}>
            <option value="">Seleccionar...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Marca" required>
          <select className={fieldClass} required value={form.idMarca} onChange={(e) => set({ idMarca: e.target.value })}>
            <option value="">Seleccionar...</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Costo (Gs.)" required>
          <input className={fieldClass} type="number" min={0} required value={form.precioCosto} onChange={(e) => set({ precioCosto: e.target.value })} />
        </FormField>
        <FormField label="Venta (Gs.)" required>
          <input className={fieldClass} type="number" min={0} required value={form.precioVenta} onChange={(e) => set({ precioVenta: e.target.value })} />
        </FormField>
        <FormField label="IVA" required>
          <select className={fieldClass} value={form.porcentajeIva} onChange={(e) => set({ porcentajeIva: e.target.value })}>
            <option value="10">10%</option>
            <option value="5">5%</option>
            <option value="0">Exento</option>
          </select>
        </FormField>
      </div>

      {precioMenorAlCosto && <FeedbackBanner variant="info">El precio de venta es menor que el de costo.</FeedbackBanner>}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Código de barras">
          <input className={fieldClass} inputMode="numeric" maxLength={20} value={form.codigoBarra} onChange={(e) => set({ codigoBarra: e.target.value.replace(/\D/g, '') })} />
        </FormField>
        <FormField label="Stock mínimo" required hint="A partir de esta cantidad conviene reponer.">
          <input className={fieldClass} type="number" min={0} required value={form.stockMinimo} onChange={(e) => set({ stockMinimo: e.target.value })} />
        </FormField>
      </div>

      <FormField label="Descripción">
        <input className={fieldClass} maxLength={255} value={form.descripcion} onChange={(e) => set({ descripcion: e.target.value })} />
      </FormField>
    </fieldset>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {editando ? (
        campos
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {campos}

          {/* Existencia inicial: filas que se agregan como las líneas de una factura (opcional). */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Existencia inicial</h4>
              {!asignado && (
                <Button type="button" variant="outline" size="sm" onClick={() => setFilas((actuales) => [...actuales, nuevaFila()])} disabled={depositos.length === 0}>
                  <Plus />
                  <span>Agregar depósito</span>
                </Button>
              )}
            </div>

            {filas.length === 0 ? (
              <p className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl px-3 py-2">
                {depositos.length === 0 ? 'No hay depósitos activos.' : 'Sin existencia inicial: el producto se crea sin stock. Use "Agregar depósito" para cargarla.'}
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl">
                <table className="w-full table-fixed text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Depósito</th>
                      <th className="py-2 px-2 w-24 text-center">Cantidad</th>
                      <th className="py-2 px-1 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filas.map((fila) => {
                      const listo = fila.deposito !== null && cargados.includes(fila.deposito.id);
                      return (
                        <tr key={fila.key}>
                          <td className="py-1.5 px-2">
                            <DepositoBuscador
                              required={!asignado}
                              disabled={listo || Boolean(asignado)}
                              depositos={depositos}
                              value={fila.deposito}
                              onChange={(deposito) => cambiarFila(fila.key, { deposito })}
                              excluir={elegidos.filter((id) => id !== fila.deposito?.id)}
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            {listo ? (
                              <span className="block text-center text-emerald-700 font-semibold">Cargado: {fila.cantidad}</span>
                            ) : (
                              <input
                                className={cn(fieldClass, 'text-center px-1')}
                                type="number"
                                min={asignado ? 0 : 1}
                                required={!asignado}
                                placeholder="0"
                                value={fila.cantidad}
                                onChange={(e) => cambiarFila(fila.key, { cantidad: e.target.value })}
                              />
                            )}
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            {!listo && !asignado && (
                              <button type="button" onClick={() => quitarFila(fila.key)} className="text-slate-400 hover:text-rose-600" title="Quitar depósito">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {asignado && <p className="text-[11px] text-slate-500 mt-1">Su usuario carga stock solo en su depósito asignado.</p>}
          </div>
        </div>
      )}

      {creado && fallas.length > 0 && (
        <FeedbackBanner>
          El producto "{creado.nombre}" se creó, pero no se pudo cargar la existencia en: {fallas.join('; ')}. Puede corregir esas filas y reintentar.
        </FeedbackBanner>
      )}
      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions
        onCancel={onClose}
        submitLabel={editando ? 'Guardar cambios' : creado ? 'Reintentar existencias' : 'Crear producto'}
        loading={guardar.loading}
        icon={editando ? <Save className="w-3.5 h-3.5" /> : <PackagePlus className="w-3.5 h-3.5" />}
      />
    </form>
  );
};
