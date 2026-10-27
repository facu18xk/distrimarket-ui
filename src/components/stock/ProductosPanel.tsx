import React, { useMemo, useState } from 'react';
import { PackagePlus, Plus, Trash2 } from 'lucide-react';
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
import { useAsyncAction, useAsyncData, usePagedResource, useRemove } from '../../hooks';
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

/**
 * Productos de a una página (10) pedida al backend. Inventario no busca por texto, así que en
 * lugar de buscador se filtra por categoría y marca (filtros que sí resuelve el backend).
 */
export const ProductosPanel: React.FC = () => {
  const clasificaciones = useAsyncData(cargarClasificaciones);
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [marcaId, setMarcaId] = useState<number | ''>('');
  const filtros: FiltrosProducto | undefined =
    categoriaId === '' && marcaId === '' ? undefined : { categoriaId: categoriaId || undefined, marcaId: marcaId || undefined };
  const productos = usePagedResource<ProductoResponseDTO, FiltrosProducto>(inventarioApi.productos.list, { filters: filtros });
  const baja = useRemove(productos.reload);
  const [formOpen, setFormOpen] = useState(false);

  const categoriaPorId = useMemo(() => indexar(clasificaciones.data?.categorias, (c) => c.id), [clasificaciones.data]);
  const marcaPorId = useMemo(() => indexar(clasificaciones.data?.marcas, (m) => m.id), [clasificaciones.data]);

  const columns: Column<ProductoResponseDTO>[] = [
    { header: 'Producto', cell: (p) => p.nombre, className: 'font-bold text-slate-900' },
    { header: 'Categoría', cell: (p) => categoriaPorId.get(p.idCategoria)?.nombre ?? '—', className: 'text-slate-600' },
    { header: 'Marca', cell: (p) => marcaPorId.get(p.idMarca)?.nombre ?? '—', className: 'text-slate-600' },
    { header: 'Código de barras', cell: (p) => p.codigoBarra ?? '—', className: 'text-slate-500 text-xs' },
    { header: 'Precio de venta', align: 'right', cell: (p) => formatMoney(p.precioVenta), className: 'font-black text-slate-900' },
    { header: 'IVA', align: 'center', cell: (p) => `${p.porcentajeIva}%`, className: 'text-slate-600' },
    { header: 'Estado', cell: (p) => <StatusBadge status={p.estado ? 'Activo' : 'Inactivo'} /> },
    {
      header: 'Acciones',
      align: 'center',
      cell: (p) => (
        <ActionButtons
          onDelete={() =>
            baja.remove(
              { title: 'Dar de baja producto', message: `¿Dar de baja "${p.nombre}"? Dejará de poder venderse y comprarse.` },
              () => inventarioApi.productos.remove(p.id)
            )
          }
        />
      ),
    },
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
        emptyMessage="No hay productos con los filtros seleccionados."
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
            <Button variant="emerald" onClick={() => setFormOpen(true)}>
              <Plus />
              <span>Nuevo producto</span>
            </Button>
          </>
        }
      />

      <ModalDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nuevo producto"
        subtitle="Puede cargar desde aquí la cantidad inicial en cada depósito."
        maxWidth="4xl"
      >
        <ProductoForm onClose={() => setFormOpen(false)} onSaved={productos.reload} />
      </ModalDialog>
    </>
  );
};

const VACIO = { nombre: '', codigoBarra: '', descripcion: '', precioCosto: '', precioVenta: '', porcentajeIva: '10', stockMinimo: '0', idCategoria: '', idMarca: '' };

/** Una fila de la existencia inicial: un depósito y su cantidad. */
interface FilaExistencia {
  key: number;
  deposito: DepositoResponseDTO | null;
  cantidad: string;
}

let siguienteFila = 1;
const nuevaFila = (): FilaExistencia => ({ key: siguienteFila++, deposito: null, cantidad: '' });

async function cargarFormulario() {
  const [clasificaciones, depositos] = await Promise.all([cargarClasificaciones(), depositosActivos()]);
  return { ...clasificaciones, depositos };
}

/**
 * Alta de producto con su existencia inicial. El backend no tiene un único endpoint para ambas
 * cosas, así que se hace en pasos: primero el producto y después una existencia por cada depósito
 * agregado (como las líneas de una factura: se agrega una fila, se busca el depósito y se pone la cantidad). Si alguna existencia falla, el producto ya creado se conserva y el botón pasa a
 * reintentar solo las existencias que faltan (no se duplica el producto).
 */
const ProductoForm: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const datos = useAsyncData(cargarFormulario);
  const guardar = useAsyncAction();
  const [form, setForm] = useState(VACIO);
  const [filas, setFilas] = useState<FilaExistencia[]>([]);
  // Producto ya creado en un intento anterior (cuando falló alguna existencia).
  const [creado, setCreado] = useState<ProductoResponseDTO | null>(null);
  // Depósitos cuya existencia ya quedó guardada.
  const [cargados, setCargados] = useState<number[]>([]);
  const [fallas, setFallas] = useState<string[]>([]);
  const set = (cambios: Partial<typeof VACIO>) => setForm((actual) => ({ ...actual, ...cambios }));

  const precioMenorAlCosto = form.precioCosto !== '' && form.precioVenta !== '' && Number(form.precioVenta) < Number(form.precioCosto);

  const cambiarFila = (key: number, cambios: Partial<FilaExistencia>) =>
    setFilas((actuales) => actuales.map((f) => (f.key === key ? { ...f, ...cambios } : f)));
  const quitarFila = (key: number) => setFilas((actuales) => actuales.filter((f) => f.key !== key));
  const elegidos = filas.flatMap((f) => (f.deposito ? [f.deposito.id] : []));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datos.data) return;
    const request: ProductoRequestDTO = {
      nombre: form.nombre.trim(),
      codigoBarra: form.codigoBarra.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
      precioCosto: Number(form.precioCosto),
      precioVenta: Number(form.precioVenta),
      porcentajeIva: Number(form.porcentajeIva),
      stockMinimo: Number(form.stockMinimo),
      idCategoria: Number(form.idCategoria),
      idMarca: Number(form.idMarca),
    };
    // Filas con depósito y cantidad que todavía no se guardaron.
    const pendientes = filas.filter((f) => f.deposito && Number(f.cantidad) > 0 && !cargados.includes(f.deposito.id));
    const errores: string[] = [];

    const ok = await guardar.run(async () => {
      // 1. El producto (solo la primera vez; en un reintento ya existe).
      let producto = creado;
      if (!producto) {
        producto = await inventarioApi.productos.create(request);
        setCreado(producto);
      }
      // 2. Una existencia por depósito; se siguen intentando las demás aunque alguna falle.
      for (const { deposito, cantidad } of pendientes) {
        if (!deposito) continue;
        try {
          await inventarioApi.stock.create({ idProducto: producto.id, idDeposito: deposito.id, cantidad: Number(cantidad) });
          setCargados((actuales) => [...actuales, deposito.id]);
        } catch (error) {
          errores.push(`${deposito.nombre}: ${errorMessage(error)}`);
        }
      }
    });
    if (!ok) return; // No se pudo crear el producto: el error queda en el formulario.

    setFallas(errores);
    onSaved();
    if (errores.length === 0) onClose();
  };

  if (datos.error) return <FeedbackBanner>{datos.error}</FeedbackBanner>;
  if (!datos.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;
  const { categorias, marcas, depositos } = datos.data;
  const bloqueado = Boolean(creado);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <fieldset disabled={bloqueado} className="space-y-3">
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
          <FormField label="Precio de costo (Gs.)" required>
            <input className={fieldClass} type="number" min={0} required value={form.precioCosto} onChange={(e) => set({ precioCosto: e.target.value })} />
          </FormField>
          <FormField label="Precio de venta (Gs.)" required>
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
          <FormField label="Stock mínimo" required hint="Cantidad a partir de la cual conviene reponer.">
            <input className={fieldClass} type="number" min={0} required value={form.stockMinimo} onChange={(e) => set({ stockMinimo: e.target.value })} />
          </FormField>
        </div>

        <FormField label="Descripción">
          <input className={fieldClass} maxLength={255} value={form.descripcion} onChange={(e) => set({ descripcion: e.target.value })} />
        </FormField>
      </fieldset>

      {/* Existencia inicial: filas que se agregan como las líneas de una factura (opcional). */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Existencia inicial ({filas.length})</h4>
          <Button type="button" variant="outline" size="sm" onClick={() => setFilas((actuales) => [...actuales, nuevaFila()])} disabled={depositos.length === 0}>
            <Plus />
            <span>Agregar depósito</span>
          </Button>
        </div>

        {filas.length === 0 ? (
          <p className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl px-3 py-2">
            {depositos.length === 0 ? 'No hay depósitos activos.' : 'Sin existencia inicial: el producto se crea sin stock. Use "Agregar depósito" para cargarla.'}
          </p>
        ) : (
          <div className="border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Depósito</th>
                  <th className="py-2 px-3 w-28 text-center">Cantidad</th>
                  <th className="py-2 px-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((fila) => {
                  const listo = fila.deposito !== null && cargados.includes(fila.deposito.id);
                  return (
                    <tr key={fila.key}>
                      <td className="py-1.5 px-2 min-w-48">
                        <DepositoBuscador
                          required
                          disabled={listo}
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
                            className={cn(fieldClass, 'text-center')}
                            type="number"
                            min={1}
                            required
                            value={fila.cantidad}
                            onChange={(e) => cambiarFila(fila.key, { cantidad: e.target.value })}
                          />
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        {!listo && (
                          <button
                            type="button"
                            onClick={() => quitarFila(fila.key)}
                            className="text-slate-400 hover:text-rose-600"
                            title="Quitar depósito"
                          >
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
        </div>
      </div>

      {creado && fallas.length > 0 && (
        <FeedbackBanner>
          El producto "{creado.nombre}" se creó, pero no se pudo cargar la existencia en: {fallas.join('; ')}. Puede corregir esas filas y reintentar.
        </FeedbackBanner>
      )}
      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions
        onCancel={onClose}
        submitLabel={creado ? 'Reintentar existencias' : 'Crear producto'}
        loading={guardar.loading}
        icon={<PackagePlus className="w-3.5 h-3.5" />}
      />
    </form>
  );
};
