import React, { useState } from 'react';
import { PackagePlus, Plus } from 'lucide-react';
import {
  ActionButtons,
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
import { useAsyncAction, useAsyncData, useLocalPagedResource, useRemove } from '../../hooks';
import { catalogos, inventarioApi } from '../../services';
import { formatMoney } from '../../lib/format';
import type { ProductoRequestDTO, ProductoResponseDTO } from '../../types/api';
import { cargarProductos } from './catalogos';

const textoDeBusqueda = (p: ProductoResponseDTO) => `${p.nombre} ${p.codigoBarra ?? ''}`;

async function cargarClasificaciones() {
  const [categorias, marcas] = await Promise.all([catalogos.categorias(), catalogos.marcas()]);
  return { categorias, marcas };
}

export const ProductosPanel: React.FC = () => {
  const productos = useLocalPagedResource(cargarProductos, textoDeBusqueda);
  const baja = useRemove(productos.reload);
  const [formOpen, setFormOpen] = useState(false);

  const columns: Column<ProductoResponseDTO>[] = [
    { header: 'Producto', cell: (p) => p.nombre, className: 'font-bold text-slate-900' },
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

  return (
    <>
      {baja.error && <FeedbackBanner className="mb-4">{baja.error}</FeedbackBanner>}

      <PagedTable
        resource={productos}
        columns={columns}
        rowKey={(p) => p.id}
        label="productos"
        searchPlaceholder="Buscar por nombre o código de barras..."
        filters={
          <Button variant="emerald" onClick={() => setFormOpen(true)}>
            <Plus />
            <span>Nuevo producto</span>
          </Button>
        }
      />

      <ModalDialog isOpen={formOpen} onClose={() => setFormOpen(false)} title="Nuevo producto" maxWidth="lg">
        <ProductoForm onClose={() => setFormOpen(false)} onSaved={productos.reload} />
      </ModalDialog>
    </>
  );
};

const VACIO = { nombre: '', codigoBarra: '', descripcion: '', precioCosto: '', precioVenta: '', porcentajeIva: '10', stockMinimo: '0', idCategoria: '', idMarca: '' };

const ProductoForm: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const clasificaciones = useAsyncData(cargarClasificaciones);
  const guardar = useAsyncAction();
  const [form, setForm] = useState(VACIO);
  const set = (cambios: Partial<typeof VACIO>) => setForm((actual) => ({ ...actual, ...cambios }));

  const precioMenorAlCosto = form.precioCosto !== '' && form.precioVenta !== '' && Number(form.precioVenta) < Number(form.precioCosto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (await guardar.run(() => inventarioApi.productos.create(request))) {
      onSaved();
      onClose();
    }
  };

  if (clasificaciones.error) return <FeedbackBanner>{clasificaciones.error}</FeedbackBanner>;
  if (!clasificaciones.data) return <p className="py-8 text-center text-xs text-slate-400">Cargando datos del formulario...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre" required>
        <input className={fieldClass} required maxLength={150} value={form.nombre} onChange={(e) => set({ nombre: e.target.value })} autoFocus />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Categoría" required>
          <select className={fieldClass} required value={form.idCategoria} onChange={(e) => set({ idCategoria: e.target.value })}>
            <option value="">Seleccionar...</option>
            {clasificaciones.data.categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Marca" required>
          <select className={fieldClass} required value={form.idMarca} onChange={(e) => set({ idMarca: e.target.value })}>
            <option value="">Seleccionar...</option>
            {clasificaciones.data.marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
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

      {guardar.error && <FeedbackBanner>{guardar.error}</FeedbackBanner>}

      <FormActions onCancel={onClose} submitLabel="Crear producto" loading={guardar.loading} icon={<PackagePlus className="w-3.5 h-3.5" />} />
    </form>
  );
};
